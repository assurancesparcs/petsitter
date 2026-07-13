"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getRateLimiter } from "@/lib/ratelimit";
import { maskContacts } from "@/domains/fraud/filter";
import { chargerConversation } from "@/domains/messaging/access";

/**
 * Envoi d'un message dans une conversation (Règle 8). Toute la logique de
 * sécurité est CÔTÉ SERVEUR :
 *  1. session requise ;
 *  2. contrôle d'accès strict (propriétaire de la demande OU pet sitter
 *     candidat/confirmé) via chargerConversation — un tiers est renvoyé ;
 *  3. bornage 1..2000 caractères ;
 *  4. anti-abus : limite légère par IP (repli passant sans Upstash) ;
 *  5. AVANT déblocage : caviardage serveur (maskContacts) stocké en maskedBody,
 *     journalisation d'une tentative si un motif est trouvé. Le brut est
 *     conservé (pour l'après-déblocage) mais n'est jamais renvoyé au client
 *     tant que la demande n'est pas débloquée.
 */
export async function envoyerMessage(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  const careRequestId = String(formData.get("careRequestId") ?? "").trim();
  if (!careRequestId) redirect("/compte/messages");

  const db = getPrisma();
  if (!db) redirect(`/compte/messages/${careRequestId}?erreur=indisponible`);

  // Contrôle d'accès STRICT : sans droit sur la conversation, on ne révèle
  // même pas son existence (retour à la liste).
  const conv = await chargerConversation(db, session.user.id, careRequestId);
  if (!conv) redirect("/compte/messages");

  // Bornage longueur (anti-abus). Pas de pièces jointes : texte seul.
  const brut = String(formData.get("message") ?? "").trim();
  if (brut.length < 1 || brut.length > 2000) {
    redirect(`/compte/messages/${careRequestId}?erreur=longueur`);
  }

  // Anti-abus : limite légère par IP. Repli passant si Upstash absent.
  const rl = getRateLimiter();
  if (rl) {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      "anon";
    const { success } = await rl.limit(`message:ip:${ip}`);
    if (!success) redirect(`/compte/messages/${careRequestId}?erreur=trop`);
  }

  if (conv.unlocked) {
    // Débloqué : échange libre, aucun masquage.
    await db.structuredMessage.create({
      data: {
        careRequestId,
        senderId: session.user.id,
        body: brut,
        hadMaskedContent: false,
        filterStatus: "delivered",
      },
    });
  } else {
    // Règle 8 : caviardage serveur. On stocke le brut ET la version masquée ;
    // seule la version masquée sera renvoyée au client avant déblocage.
    const { masked, hadMatch } = maskContacts(brut);
    await db.structuredMessage.create({
      data: {
        careRequestId,
        senderId: session.user.id,
        body: brut,
        maskedBody: masked,
        hadMaskedContent: hadMatch,
        filterStatus: hadMatch ? "masked" : "delivered",
      },
    });
    if (hadMatch) {
      // Journalisation douce d'une tentative de partage de coordonnées.
      await db.contentFilterHit.create({
        data: { userId: session.user.id, field: "message", pattern: "regex" },
      });
    }
  }

  redirect(`/compte/messages/${careRequestId}?ok=envoye`);
}
