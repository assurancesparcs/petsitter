"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import type { PrismaClient } from "@prisma/client";

/**
 * Abonnement (19 €/mois, sans engagement) — machine à états côté serveur.
 *
 * Anti-dark-pattern (PLAN §9, décret n° 2023-182) :
 *  - PAUSE offerte comme alternative non piégeuse à la résiliation ;
 *  - résiliation ≤ 3 clics, jamais plus longue que l'inscription ;
 *  - rappel J-3 avant CHAQUE prélèvement (`nextChargeReminderAt`) ;
 *  - chaque action est bornée à l'abonnement de la session (IDOR-safe) et
 *    idempotente (updateMany conditionnel), sans jamais lever sur le cas passant.
 *
 * Mode Stripe DORMANT : `getStripe()` renvoie null tant qu'aucune clé n'est
 * configurée — aucune facturation réelle n'est initiée ici. Quand Stripe est
 * présent, on tente une synchronisation « best-effort » sans en dépendre.
 */

async function requireOwner(): Promise<{ userId: string; db: PrismaClient }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "OWNER") redirect("/compte");
  const db = getPrisma();
  if (!db) redirect("/compte/abonnement?erreur=indisponible");
  return { userId: session.user.id, db };
}

/**
 * Synchronisation Stripe « best-effort » : gardée, jamais bloquante. En mode
 * dormant `getStripe()` est null → on ne fait rien. Un identifiant qui n'est pas
 * un vrai `sub_…` (placeholder) est ignoré : aucune requête réseau inutile.
 */
async function syncStripeBestEffort(
  stripeSubscriptionId: string,
  action: "pause" | "resume" | "cancel",
): Promise<void> {
  const stripe = getStripe();
  if (!stripe) return;
  if (!stripeSubscriptionId.startsWith("sub_")) return;
  try {
    if (action === "cancel") {
      await stripe.subscriptions.cancel(stripeSubscriptionId);
    } else if (action === "pause") {
      await stripe.subscriptions.update(stripeSubscriptionId, {
        pause_collection: { behavior: "void" },
      });
    } else {
      await stripe.subscriptions.update(stripeSubscriptionId, {
        pause_collection: null,
      });
    }
  } catch (e) {
    // On ne loggue que le type d'erreur — jamais de donnée sensible.
    console.error("[abonnement] Sync Stripe best-effort échouée :", (e as Error).name);
  }
}

/** Met l'abonnement en PAUSE (suspend le prélèvement) sans le résilier. */
export async function pauseAbonnement(): Promise<void> {
  const { userId, db } = await requireOwner();
  // Borné au propriétaire de la session ET à un abonnement non résilié.
  const sub = await db.subscription.findFirst({
    where: { userId, cancelledAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (sub) {
    // `pausedUntil` sert de MARQUEUR de pause (date de mise en pause) : la pause
    // dure jusqu'à une reprise EXPLICITE — pas de reprise automatique à une date
    // (qui, non resynchronisée côté paiement, annoncerait un prélèvement fantôme).
    await db.subscription.updateMany({
      where: { id: sub.id, userId, cancelledAt: null },
      data: { pausedUntil: new Date(), status: "paused" },
    });
    await syncStripeBestEffort(sub.stripeSubscriptionId, "pause");
  }
  redirect("/compte/abonnement?ok=pause");
}

/** REPREND l'abonnement mis en pause (efface `pausedUntil`). */
export async function reprendreAbonnement(): Promise<void> {
  const { userId, db } = await requireOwner();
  const sub = await db.subscription.findFirst({
    where: { userId, cancelledAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (sub) {
    await db.subscription.updateMany({
      where: { id: sub.id, userId, cancelledAt: null },
      data: { pausedUntil: null, status: "active" },
    });
    await syncStripeBestEffort(sub.stripeSubscriptionId, "resume");
  }
  redirect("/compte/abonnement?ok=reprise");
}

/** RÉSILIE l'abonnement (pose `cancelledAt`). Effet immédiat, 3 clics. */
export async function resilierAbonnement(): Promise<void> {
  const { userId, db } = await requireOwner();
  const sub = await db.subscription.findFirst({
    where: { userId, cancelledAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (sub) {
    await db.subscription.updateMany({
      where: { id: sub.id, userId, cancelledAt: null },
      data: { cancelledAt: new Date(), pausedUntil: null, status: "cancelled" },
    });
    await syncStripeBestEffort(sub.stripeSubscriptionId, "cancel");
  }
  // Dernière étape du parcours 3 clics : écran de confirmation honnête.
  redirect("/resilier?etape=fait");
}
