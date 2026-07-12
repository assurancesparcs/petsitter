"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { signIn } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getRateLimiter } from "@/lib/ratelimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL = 254; // RFC 5321

/**
 * Action serveur : demande d'un lien de connexion par e-mail.
 *
 * Sécurité (auditée) :
 *  - e-mail normalisé (trim + minuscules) et validé AVANT tout traitement ;
 *  - rate-limiting Upstash 5 requêtes / 10 min / IP (même limiteur que la
 *    waitlist, clé dédiée `signin:`) — repli passant si Upstash absent ;
 *  - destination post-connexion FIGÉE (/compte) : aucun callbackUrl fourni
 *    par le client → pas d'open redirect ;
 *  - messages d'erreur identiques que l'e-mail existe ou non en base (le
 *    flux « lien magique » crée le compte à la première connexion, donc la
 *    réponse ne révèle jamais l'existence d'un compte).
 */
export async function demanderLienConnexion(formData: FormData): Promise<void> {
  const brut = formData.get("email");
  const email = typeof brut === "string" ? brut.trim().toLowerCase() : "";

  if (!email || email.length > MAX_EMAIL || !EMAIL_RE.test(email)) {
    redirect("/connexion?error=EmailInvalide");
  }

  // Rate-limiting par IP (audit sécurité §1).
  const rl = getRateLimiter();
  if (rl) {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      "anon";
    const { success } = await rl.limit(`signin:${ip}`);
    if (!success) {
      redirect("/connexion?error=TropDeTentatives");
    }
  }

  // Sans base configurée, la connexion n'est pas encore ouverte.
  if (!getPrisma()) {
    redirect("/connexion?error=Indisponible");
  }

  // En production sans clé d'envoi : message dédié, et surtout AUCUNE
  // génération de lien (le lien ne doit jamais finir dans les logs de prod).
  if (process.env.NODE_ENV === "production" && !process.env.RESEND_API_KEY) {
    redirect("/connexion?error=EnvoiDesactive");
  }

  try {
    await signIn("email", { email, redirectTo: "/compte" });
  } catch (error) {
    if (error instanceof AuthError) {
      // Message générique : ne révèle ni l'existence d'un compte ni le détail
      // technique (celui-ci reste dans les logs serveur via Auth.js).
      redirect("/connexion?error=EchecEnvoi");
    }
    // Succès = redirection Next (NEXT_REDIRECT) vers /connexion/verifier.
    throw error;
  }
}
