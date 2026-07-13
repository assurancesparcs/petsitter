import "server-only";
import Stripe from "stripe";

/**
 * Client Stripe centralisé — même philosophie que getPrisma() : instanciation
 * PARESSEUSE et retour null tant que STRIPE_SECRET_KEY n'est pas configurée,
 * pour que `next build` et le site passent sans aucune clé (mode dégradé :
 * le parcours de dépôt fonctionne, le paiement est simplement annoncé
 * « très prochainement »).
 *
 * Variables d'environnement (Vercel → Settings → Environment Variables) :
 *  - STRIPE_SECRET_KEY                    (serveur — sk_test_… en mode test)
 *  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY   (client — pk_test_… en mode test)
 *  - STRIPE_WEBHOOK_SECRET                (serveur — whsec_…, endpoint /api/webhooks/stripe)
 *
 * ⚠️ Jamais de clé dans le code ni dans le dépôt : elles se collent
 * directement dans Vercel (cf. .env.example).
 */
const globalForStripe = globalThis as unknown as { stripe?: Stripe };

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return (globalForStripe.stripe ??= new Stripe(key, {
    // Pas d'apiVersion explicite : le SDK épingle celle avec laquelle il a été
    // publié (2026-06-24.dahlia pour stripe@22) — comportement stable et typé.
    appInfo: { name: "AlloPetsitter" },
  }));
}
