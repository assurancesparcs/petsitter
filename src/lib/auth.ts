import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { EmailConfig } from "next-auth/providers/email";
import type { Role } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { getRateLimiter, clientIp } from "@/lib/ratelimit";
import { BRAND, DOMAIN } from "@/lib/brand";

/**
 * Authentification Auth.js v5 — connexion par lien magique e-mail uniquement
 * (pas de mot de passe : rien à stocker, rien à faire fuiter).
 *
 * Choix structurants :
 *  - sessions en BASE (stratégie `database`, défaut avec l'adaptateur Prisma) ;
 *  - provider e-mail personnalisé : envoi via l'API HTTP Resend (pas de
 *    nodemailer, pas de SMTP) ;
 *  - configuration PARESSEUSE (`NextAuth(() => config)`) : rien n'est
 *    instancié au chargement du module, donc `next build` passe sans
 *    DATABASE_URL, sans RESEND_API_KEY et sans AUTH_SECRET.
 *
 * Variables d'environnement (voir .env.example) : AUTH_SECRET (obligatoire en
 * prod), AUTH_URL / AUTH_TRUST_HOST, RESEND_API_KEY, EMAIL_FROM.
 */

// ─── Typage de session : exposer id + rôle côté serveur et client ───
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role | null;
    } & DefaultSession["user"];
  }
}

const EMAIL_MAX = 254; // RFC 5321
const LIEN_VALIDITE_H = 24;

/** Normalisation systématique de l'e-mail (audit sécurité) : trim + minuscules. */
export function normaliserEmail(identifier: string): string {
  const email = identifier.trim().toLowerCase();
  // Refuse les identifiants multiples ("a@x.fr,b@y.fr") que certains clients concatènent.
  const [local, domain] = email.split("@");
  if (!local || !domain || domain.includes(",") || email.length > EMAIL_MAX) {
    throw new Error("Adresse e-mail invalide.");
  }
  return `${local}@${domain}`;
}

/** Échappement HTML minimal pour les valeurs injectées dans l'e-mail. */
function echapperHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Gabarit HTML de l'e-mail de connexion — sobre, en français, styles inline
 * (obligatoires en e-mail ; les valeurs reprennent les tokens de globals.css).
 */
function corpsHtml(url: string): string {
  const lien = echapperHtml(url);
  return `
  <div style="margin:0;padding:24px;background:#faf7f2;color:#1f2a2e;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e5ded2;border-radius:16px;padding:32px;">
      <p style="margin:0;font-size:20px;font-weight:700;color:#16575a;">${BRAND}</p>
      <h1 style="margin:16px 0 0;font-size:18px;">Votre lien de connexion</h1>
      <p style="margin:12px 0 0;font-size:14px;line-height:1.6;">
        Cliquez sur le bouton ci-dessous pour vous connecter à votre compte ${BRAND}.
        Ce lien est valable ${LIEN_VALIDITE_H}&nbsp;h et ne peut être utilisé qu'une seule fois.
      </p>
      <p style="margin:24px 0;text-align:center;">
        <a href="${lien}" style="display:inline-block;background:#16575a;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 28px;border-radius:9999px;">
          Se connecter
        </a>
      </p>
      <p style="margin:0;font-size:12px;line-height:1.6;color:#1f2a2e;opacity:.7;">
        Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet
        e-mail : personne ne pourra se connecter sans ce lien.
      </p>
    </div>
  </div>`.trim();
}

/** Version texte brut (accessibilité + clients e-mail sans HTML). */
function corpsTexte(url: string): string {
  return [
    `Connexion à ${BRAND}`,
    "",
    `Ouvrez ce lien pour vous connecter (valable ${LIEN_VALIDITE_H} h, usage unique) :`,
    url,
    "",
    "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
  ].join("\n");
}

/**
 * Envoi du lien magique via l'API HTTP Resend.
 *
 * Sans RESEND_API_KEY :
 *  - hors production : le lien est écrit dans les logs SERVEUR uniquement
 *    (pratique en local, jamais exposé au navigateur) ;
 *  - en production : on refuse proprement — le lien n'est JAMAIS loggué en
 *    production (l'action serveur affiche un message dédié à l'utilisateur).
 */
async function envoyerLienConnexion(params: {
  identifier: string;
  url: string;
  provider: EmailConfig;
  request?: Request;
}): Promise<void> {
  const { identifier, url, provider, request } = params;

  // Rate-limiting placé ICI (et non dans la seule server action) : c'est le
  // chemin commun au formulaire ET à l'endpoint natif /api/auth/signin/email.
  // Cadencé par e-mail cible (protège la victime d'un bombardement multi-IP)
  // ET par IP. Repli passant si Upstash n'est pas configuré (audit sécurité §4).
  const rl = getRateLimiter();
  if (rl) {
    const ip = request ? clientIp(request) : "anon";
    const [parEmail, parIp] = await Promise.all([
      rl.limit(`sendmail:email:${identifier}`),
      rl.limit(`sendmail:ip:${ip}`),
    ]);
    if (!parEmail.success || !parIp.success) {
      throw new Error("TROP_DE_DEMANDES");
    }
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[auth][dev] RESEND_API_KEY absente — lien de connexion pour ${identifier} : ${url}`,
      );
      return;
    }
    // Production sans clé : erreur SANS l'URL (aucune fuite du lien en logs).
    throw new Error("ENVOI_EMAIL_DESACTIVE");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: provider.from,
      to: identifier,
      subject: `Votre lien de connexion ${BRAND}`,
      html: corpsHtml(url),
      text: corpsTexte(url),
    }),
  });

  if (!res.ok) {
    // Ne jamais inclure l'URL de connexion dans le message d'erreur.
    throw new Error(`Échec de l'envoi de l'e-mail de connexion (HTTP ${res.status}).`);
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const prisma = getPrisma();

  const providerEmail: EmailConfig = {
    id: "email",
    type: "email",
    name: "E-mail",
    from: process.env.EMAIL_FROM ?? `${BRAND} <connexion@${DOMAIN}>`,
    maxAge: LIEN_VALIDITE_H * 60 * 60, // lien valable 24 h
    normalizeIdentifier: normaliserEmail,
    sendVerificationRequest: envoyerLienConnexion,
    options: {},
  };

  return {
    // Sans DATABASE_URL, pas d'adaptateur : le module se charge et le build
    // passe ; toute tentative de connexion échoue proprement côté action
    // serveur (vérification explicite avant signIn).
    adapter: prisma ? PrismaAdapter(prisma) : undefined,
    providers: [providerEmail],
    pages: {
      signIn: "/connexion",
      verifyRequest: "/connexion/verifier",
      error: "/connexion", // le code arrive en ?error=…, traduit sur la page
    },
    // Derrière le proxy Vercel : l'hôte de la requête fait foi
    // (équivaut à AUTH_TRUST_HOST=true).
    trustHost: true,
    callbacks: {
      // Sessions en base : `user` vient de la table User → id et rôle à jour.
      session({ session, user }) {
        session.user.id = user.id;
        session.user.role = (user as typeof user & { role?: Role | null }).role ?? null;
        return session;
      },
      // Anti open-redirect : uniquement des chemins internes au site.
      redirect({ url, baseUrl }) {
        if (url.startsWith("/")) return `${baseUrl}${url}`;
        try {
          if (new URL(url).origin === baseUrl) return url;
        } catch {
          /* URL invalide → retour à l'accueil */
        }
        return baseUrl;
      },
    },
  };
});
