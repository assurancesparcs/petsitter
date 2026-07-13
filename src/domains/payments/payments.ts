import "server-only";
import type { PrismaClient, Payment } from "@prisma/client";
import type Stripe from "stripe";

/**
 * Cœur paiement (PLAN §3.1, Q14) — helpers serveur partagés entre le dépôt,
 * la page d'empreinte carte, le choix du pet sitter et le webhook.
 *
 * Architecture : SetupIntent au dépôt (empreinte carte, 0 € débité), puis
 * PaymentIntent OFF-SESSION au choix d'un pet sitter par le propriétaire.
 * On n'encaisse QUE la mise en relation (Pass) — l'argent de la garde ne
 * transite jamais par nous (pas de Connect).
 */

/** Statuts d'un SetupIntent encore utilisable pour saisir/confirmer une carte. */
const SETUP_INTENT_REUSABLE = new Set([
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
]);

export function isSetupIntentReusable(si: Stripe.SetupIntent): boolean {
  return SETUP_INTENT_REUSABLE.has(si.status);
}

/**
 * Client Stripe du propriétaire : créé au premier besoin, réutilisé ensuite
 * (User.stripeCustomerId, unique). Clé d'idempotence dérivée de l'utilisateur :
 * un retry réseau ne crée jamais deux clients.
 */
export async function ensureStripeCustomer(
  db: PrismaClient,
  stripe: Stripe,
  userId: string,
): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true, firstName: true },
  });
  if (!user) throw new Error("Utilisateur introuvable.");
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create(
    {
      email: user.email,
      name: user.firstName ?? undefined,
      metadata: { userId },
    },
    { idempotencyKey: `customer-${userId}` },
  );
  await db.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

/**
 * Synchronisation paresseuse d'une empreinte en attente : si le SetupIntent a
 * abouti côté Stripe (retour de confirmation) mais que le webhook n'est pas
 * encore passé (ou pas encore configuré), on aligne la base à l'affichage.
 * Idempotent (updateMany conditionnel) — sans effet si déjà SETUP_COMPLETED.
 */
export async function syncSetupIntentStatus(
  db: PrismaClient,
  stripe: Stripe,
  payment: Pick<Payment, "id" | "status" | "stripeSetupIntentId" | "careRequestId">,
): Promise<"SETUP_PENDING" | "SETUP_COMPLETED"> {
  if (payment.status !== "SETUP_PENDING" || !payment.stripeSetupIntentId) {
    return payment.status === "SETUP_PENDING" ? "SETUP_PENDING" : "SETUP_COMPLETED";
  }
  try {
    const si = await stripe.setupIntents.retrieve(payment.stripeSetupIntentId);
    if (si.status !== "succeeded") return "SETUP_PENDING";
    const updated = await db.payment.updateMany({
      where: { id: payment.id, status: "SETUP_PENDING" },
      data: { status: "SETUP_COMPLETED" },
    });
    if (updated.count === 1) {
      await db.requestEvent.create({
        data: { careRequestId: payment.careRequestId, type: "setup_completed" },
      });
    }
    return "SETUP_COMPLETED";
  } catch {
    // Réseau/Stripe indisponible : on retombe sur le statut en base.
    return "SETUP_PENDING";
  }
}
