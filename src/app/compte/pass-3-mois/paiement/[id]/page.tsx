import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { centsLabel, PRICING } from "@/lib/pricing";
import { capturePassPurchase, findActivePass } from "@/domains/payments/pass";
import { PassPaiementForm } from "./PassPaiementForm";

export const metadata: Metadata = {
  title: "Régler mon Pass 3 mois",
  robots: { index: false },
};

/**
 * Écran de paiement du Pass 3 mois — PaymentIntent ON-SESSION (débit immédiat,
 * miroir de l'écran d'empreinte /demande/paiement/[id] mais avec un vrai
 * débit). Accessible au SEUL acheteur de la ligne (userId de session), tant
 * qu'elle est pending. Le statut qui fait foi est TOUJOURS relu côté serveur :
 * un PaymentIntent déjà réussi capture ici même (idempotent) puis redirige.
 */
export default async function PaiementPass({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "OWNER") redirect("/compte");

  const { id } = await params;
  const db = getPrisma();
  if (!db) redirect("/compte/pass-3-mois");

  const stripe = getStripe();
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  // Mode dormant : retour à la page du Pass (qui affiche « bientôt disponible »).
  if (!stripe || !publishableKey) redirect("/compte/pass-3-mois");

  // STRICTEMENT scopé à l'acheteur de la session — jamais l'achat d'un autre.
  const purchase = await db.passPurchase.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!purchase) redirect("/compte/pass-3-mois");
  if (purchase.status === "captured") redirect("/compte/pass-3-mois");
  if (purchase.status !== "pending" || !purchase.stripePaymentIntentId) {
    redirect("/compte/pass-3-mois?erreur=paiement");
  }

  // Un Pass est DÉJÀ actif (autre achat capturé entre-temps — course parallèle,
  // audit F2) : on ne présente pas un second formulaire de paiement. La ligne
  // pending reste telle quelle ; si son débit avait malgré tout abouti, la
  // capture EMPILE la couverture (capturePassPurchase) — aucun euro perdu.
  const dejaActif = await findActivePass(db, session.user.id);
  if (dejaActif) redirect("/compte/pass-3-mois?erreur=deja_actif");

  // Statut relu chez Stripe : déjà payé → capture (verrou partagé, idempotent) ;
  // en cours → la page du Pass affiche l'attente ; inutilisable → soldé failed.
  // Le retrieve est ISOLÉ dans son try/catch : une erreur transitoire (réseau)
  // ne doit JAMAIS solder en failed une ligne dont le débit a peut-être abouti
  // — seul un PaymentIntent réellement INEXISTANT (resource_missing : clé
  // changée, mode test purgé) autorise le failed.
  let pi: Awaited<ReturnType<typeof stripe.paymentIntents.retrieve>> | null = null;
  try {
    pi = await stripe.paymentIntents.retrieve(purchase.stripePaymentIntentId);
  } catch (err) {
    if ((err as { code?: string })?.code === "resource_missing") {
      await db.passPurchase.updateMany({
        where: { id: purchase.id, status: "pending" },
        data: { status: "failed" },
      });
      redirect("/compte/pass-3-mois?erreur=paiement");
    }
    // Stripe momentanément injoignable : on ne conclut rien (la ligne reste
    // pending, le webhook rattrapera un éventuel débit abouti).
    redirect("/compte/pass-3-mois?erreur=indisponible");
  }

  if (pi.status === "succeeded") {
    // Déjà payé (webhook pas encore passé) : capture via le verrou partagé.
    await capturePassPurchase(db, purchase.id);
    redirect(`/compte/pass-3-mois?retour=1&achat=${purchase.id}`);
  }
  if (pi.status === "processing") {
    redirect(`/compte/pass-3-mois?retour=1&achat=${purchase.id}`);
  }
  if (
    pi.status !== "requires_payment_method" &&
    pi.status !== "requires_confirmation" &&
    pi.status !== "requires_action"
  ) {
    // canceled… : ligne soldée, un nouvel essai repartira de zéro.
    await db.passPurchase.updateMany({
      where: { id: purchase.id, status: "pending" },
      data: { status: "failed" },
    });
    redirect("/compte/pass-3-mois?erreur=paiement");
  }
  const clientSecret = pi.client_secret;
  if (!clientSecret) redirect("/compte/pass-3-mois?erreur=paiement");

  const montant = centsLabel(purchase.amountCents);

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:py-14">
      <p className="kicker">Dernière étape — règlement</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
        Réglez votre {PRICING.passTrimestre.label}
      </h1>

      {/* RÉCAP honnête — montant depuis la ligne d'achat (figé serveur) */}
      <div className="mt-6 rounded-[20px] border border-forest-border bg-forest-tint p-5">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-forest-text">
          Ce que vous réglez — une fois, aucune reconduction
        </p>
        <div className="mt-2 flex justify-between text-sm text-forest-text">
          <span>
            {PRICING.passTrimestre.label} — {PRICING.passTrimestre.detail}
          </span>
          <span className="font-mono font-bold">{montant}</span>
        </div>
        <p className="mt-2 text-xs text-forest-text">
          La couverture de 3 mois démarre au paiement. À l&apos;échéance, elle
          s&apos;arrête toute seule : aucun prélèvement ultérieur, rien à
          résilier.
        </p>
      </div>

      <div className="mt-6">
        <PassPaiementForm
          purchaseId={purchase.id}
          clientSecret={clientSecret}
          publishableKey={publishableKey}
          amountLabel={montant}
          testMode={publishableKey.startsWith("pk_test_")}
        />
      </div>

      <Link
        href="/compte/pass-3-mois"
        className="mt-6 inline-block text-sm text-muted underline-offset-2 hover:text-primary hover:underline"
      >
        ← Retour (rien n&apos;est débité tant que vous ne réglez pas)
      </Link>
    </div>
  );
}
