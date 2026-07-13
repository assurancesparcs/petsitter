import "server-only";
import type { PrismaClient } from "@prisma/client";
import { getStripe } from "@/lib/stripe";
import { notify } from "@/domains/notifications/notify";
import { centsLabel } from "@/lib/pricing";

/**
 * Remboursement proactif de la mise en relation — LE seul cas de remboursement
 * (annulation du pet sitter APRÈS confirmation). La plateforme l'initie
 * d'elle-même : aucun parcours d'obstacle, aucune case à cocher, aucun délai
 * inventé. Le tarif de la garde n'a jamais transité par nous ; seul le montant
 * de la mise en relation (figé en base au dépôt) est remboursé.
 *
 * Source de vérité = la BASE. Verrou d'idempotence : SEUL un Payment CAPTURED
 * bascule en REFUNDED, une seule fois (updateMany conditionnel → un gagnant).
 * Un double appel (double-clic, Plan B et demande de remboursement quasi
 * simultanés) ne rembourse jamais deux fois. Le remboursement Stripe est un
 * effet best-effort qui NE bloque jamais la transition : en mode dormant (aucune
 * clé) ou sans PaymentIntent réel, la seule bascule en base fait foi.
 *
 * Transition : Payment CAPTURED → REFUNDED,
 *   CareRequest REPLACEMENT_IN_PROGRESS → CANCELLED_BY_SITTER_POST_CONFIRMATION,
 *   RequestEvent "refunded".
 */
export type RefundResult =
  | "refunded" // le verrou a gagné : base remboursée + owner notifié
  | "already" // déjà remboursé (idempotent, aucun double débit inverse)
  | "no_payment"; // aucun paiement capturé à rembourser

export async function rembourserMiseEnRelation(
  db: PrismaClient,
  careRequestId: string,
  reason: string,
): Promise<RefundResult> {
  const request = await db.careRequest.findUnique({
    where: { id: careRequestId },
    select: {
      ownerId: true,
      payment: {
        select: { id: true, status: true, amountCents: true, stripePaymentIntentId: true },
      },
    },
  });
  if (!request?.payment) return "no_payment";
  const payment = request.payment;

  // Verrou d'idempotence + transition atomique. Le VERROU est la DEMANDE qui
  // quitte REPLACEMENT_IN_PROGRESS (un seul gagnant), PAS le paiement : si une
  // autre issue a déjà résolu la demande (un remplaçant choisi → UNLOCKED), ce
  // updateMany matche 0 → on n'engage AUCUN remboursement, ni en base ni chez
  // Stripe. Impossible dès lors de rembourser ET de garder un remplaçant actif.
  const gagne = await db.$transaction(async (tx) => {
    const verrou = await tx.careRequest.updateMany({
      where: { id: careRequestId, status: "REPLACEMENT_IN_PROGRESS" },
      data: { status: "CANCELLED_BY_SITTER_POST_CONFIRMATION" },
    });
    if (verrou.count !== 1) return false;
    // La demande était bien à rembourser → on bascule le paiement capturé
    // (garde-fou `status: CAPTURED` : on ne « rembourse » jamais autre chose).
    await tx.payment.updateMany({
      where: { careRequestId, status: "CAPTURED" },
      data: { status: "REFUNDED" },
    });
    await tx.requestEvent.create({
      data: {
        careRequestId,
        type: "refunded",
        payload: { reason, amountCents: payment.amountCents },
      },
    });
    return true;
  });

  if (!gagne) return "already";

  // Remboursement Stripe BEST-EFFORT : uniquement si une clé est configurée ET
  // si un vrai PaymentIntent (pi_…) a été capturé. En mode dormant, ou sans PI
  // réel, la base (REFUNDED) reste la seule source de vérité — jamais bloquant,
  // jamais de donnée de carte en logs (nom de l'erreur seulement).
  const stripe = getStripe();
  if (stripe && payment.stripePaymentIntentId?.startsWith("pi_")) {
    try {
      await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId });
    } catch (err) {
      console.error(
        `[refund] remboursement Stripe non abouti (${(err as Error)?.name ?? "Error"}) — payment ${payment.id}`,
      );
    }
  }

  // Effet de bord isolé : notifier l'owner avec le montant réel. `notify` ne lève
  // jamais et n'altère ni la transition ni un éventuel redirect appelant.
  await notify(db, {
    userId: request.ownerId,
    type: "refund",
    title: "Remboursement de la mise en relation en cours",
    body: `Votre pet sitter a dû annuler. Le remboursement de la mise en relation (${centsLabel(payment.amountCents)}) est en cours — aucune démarche de votre part.`,
    careRequestId,
  });

  return "refunded";
}
