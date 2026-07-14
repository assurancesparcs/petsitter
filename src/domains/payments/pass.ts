import "server-only";
import type { PassPurchase, PrismaClient } from "@prisma/client";
import { notify } from "@/domains/notifications/notify";

/**
 * Pass 3 mois (décision n° 13, DECISIONS.md) — achat UNIQUE prépayé, 59 €,
 * AUCUNE reconduction : une fenêtre de couverture de 3 mois civils pendant
 * laquelle les mises en relation du propriétaire sont couvertes (aucun Pass
 * ponctuel facturé au dépôt ni au choix d'un pet sitter).
 *
 * Machine à états PassPurchase : pending → captured (un seul gagnant,
 * updateMany conditionnel) / pending → failed. La transition de premier plan
 * se fait au RETOUR de paiement (source de vérité = la base) ; le webhook
 * `payment_intent.succeeded` sert de rattrapage, via le MÊME verrou.
 *
 * La renonciation au droit de rétractation (L221-18, exécution immédiate) est
 * recueillie et horodatée CÔTÉ SERVEUR à l'achat du Pass — les demandes
 * couvertes ne la redemandent donc jamais.
 */

/** Clé de pack d'un Payment COUVERT par le Pass 3 mois (Payment.packLabel). */
export const PASS_TRIMESTRE_PACK_KEY = "pass_trimestre";

/**
 * Valeur sentinelle de Payment.stripeCustomerId pour une demande couverte
 * lorsqu'aucun client Stripe n'existe (champ requis, mais AUCUN débit : rien
 * ne transite par Stripe pour une demande couverte).
 */
export const PASS_COVERAGE_CUSTOMER = "pass_trimestre_couverture";

/**
 * Fin de couverture = exactement +3 mois CIVILS. Cas limite du débordement de
 * fin de mois (ex. 30 novembre + 3 mois → « 30 février », qui n'existe pas) :
 * JavaScript normaliserait au 1ᵉʳ/2 mars ; on RAMÈNE au dernier jour du mois
 * visé (28 ou 29 février) — la couverture ne dure jamais PLUS de 3 mois.
 */
export function addThreeMonths(from: Date): Date {
  const d = new Date(from.getTime());
  const targetMonth = d.getMonth() + 3;
  d.setMonth(targetMonth);
  if (d.getMonth() !== targetMonth % 12) d.setDate(0); // dernier jour du mois visé
  return d;
}

/**
 * Pass ACTIF du propriétaire : réellement facturé (captured) ET fenêtre de
 * couverture non échue. Toujours appelé avec l'userId de SESSION (IDOR-safe).
 * Indépendant de Stripe : un Pass acheté reste couvrant même en mode dormant.
 */
export async function findActivePass(
  db: PrismaClient,
  userId: string,
): Promise<PassPurchase | null> {
  return db.passPurchase.findFirst({
    where: { userId, status: "captured", expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: "desc" },
  });
}

/**
 * Transition → captured — LE verrou unique, partagé entre le retour de
 * paiement et le webhook de rattrapage : updateMany conditionnel (un seul
 * gagnant, idempotent — un événement rejoué ne change rien).
 *
 * ⚠️ PRÉ-CONDITION D'APPEL : chaque appelant a VÉRIFIÉ côté serveur que le
 * PaymentIntent est réellement `succeeded` (retour : PI relu à l'API ; webhook :
 * événement signé `payment_intent.succeeded`). C'est pourquoi le verrou accepte
 * aussi une ligne `failed` : si une course (double onglet 3DS) a marqué la ligne
 * en échec ALORS QUE le débit a finalement abouti, le webhook la RÉPARE en la
 * capturant — le client n'est jamais débité sans Pass (audit F1).
 *
 * ANTI-CHEVAUCHEMENT (audit F2) : la fin de couverture est calculée depuis la
 * fin du Pass actif existant s'il y en a un (max(maintenant, fin actuelle)
 * + 3 mois). Un second achat — normalement bloqué à l'achat, mais possible en
 * course parallèle — PROLONGE donc la couverture au lieu de la chevaucher :
 * aucun euro payé n'est perdu.
 */
export async function capturePassPurchase(
  db: PrismaClient,
  passPurchaseId: string,
): Promise<boolean> {
  const purchase = await db.passPurchase.findUnique({
    where: { id: passPurchaseId },
    select: { userId: true },
  });
  if (!purchase) return false;

  const now = new Date();
  // Empilement : si un Pass est déjà actif, la nouvelle fenêtre démarre à sa fin.
  const actif = await findActivePass(db, purchase.userId);
  const base = actif && actif.expiresAt > now ? actif.expiresAt : now;
  const expiresAt = addThreeMonths(base);

  const updated = await db.passPurchase.updateMany({
    where: { id: passPurchaseId, status: { in: ["pending", "failed"] } },
    data: { status: "captured", capturedAt: now, expiresAt },
  });
  if (updated.count !== 1) return false;

  // notify ne lève jamais : l'échec d'une notification ne casse pas la capture.
  await notify(db, {
    userId: purchase.userId,
    type: "unlocked",
    title: "Pass 3 mois actif",
    body: `Vos mises en relation sont couvertes jusqu'au ${expiresAt.toLocaleDateString(
      "fr-FR",
      { day: "2-digit", month: "long", year: "numeric", timeZone: "Europe/Paris" },
    )}. Payé une fois — aucune reconduction, rien à résilier.`,
  });
  return true;
}
