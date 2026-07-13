import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { centsLabel, passFromDates, passLabelFromKey } from "@/lib/pricing";
import { ensureStripeCustomer, isSetupIntentReusable } from "@/domains/payments/payments";
import { serviceLabel, speciesLabel } from "@/domains/marketplace/catalog";
import { SetupCarteForm } from "./SetupCarteForm";

export const metadata: Metadata = {
  title: "Enregistrer ma carte — 0 € débité",
  robots: { index: false },
};

const dateFr = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

/**
 * Écran d'empreinte carte (maquette « Écran Dépôt ») : SetupIntent usage
 * off_session — 0 € débité aujourd'hui, débit UNIQUEMENT quand le propriétaire
 * choisit un pet sitter. Accessible au seul propriétaire de la demande, tant
 * qu'elle est OPEN (empreinte initiale) ou PAYMENT_REQUIRED (nouvelle carte
 * après un débit refusé : 3-D Secure exigé, carte expirée…).
 */
export default async function PaiementDemande({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "OWNER") redirect("/compte");

  const { id } = await params;
  const db = getPrisma();
  if (!db) redirect("/compte/mes-demandes");

  const request = await db.careRequest.findFirst({
    where: {
      id,
      ownerId: session.user.id,
      status: { in: ["OPEN", "PAYMENT_REQUIRED"] },
    },
    include: { payment: true },
  });
  if (!request) redirect("/compte/mes-demandes");

  const stripe = getStripe();
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!stripe || !publishableKey) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10 sm:py-14">
        <p className="kicker">Empreinte carte</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em]">
          Le paiement ouvre très prochainement
        </h1>
        <p className="mt-3 text-muted">
          Votre demande est bien déposée — 0 € débité. Vous pourrez enregistrer
          votre carte ici dès l&apos;ouverture du paiement.
        </p>
        <Link
          href="/compte/mes-demandes"
          className="mt-6 inline-block rounded-[14px] bg-primary px-5 py-2.5 text-sm font-bold text-surface hover:bg-primary-dark"
        >
          Retour à mes demandes
        </Link>
      </div>
    );
  }

  // Ligne Payment : créée au dépôt ; recréée ici si la demande date d'avant
  // la configuration de Stripe. Montant/pack TOUJOURS recalculés serveur.
  let payment = request.payment;
  if (!payment) {
    const pass = passFromDates(request.startDate, request.endDate);
    const customerId = await ensureStripeCustomer(db, stripe, session.user.id);
    payment = await db.payment.create({
      data: {
        careRequestId: request.id,
        stripeCustomerId: customerId,
        amountCents: pass.cents,
        packLabel: pass.key,
        status: "SETUP_PENDING",
      },
    });
  }

  // Cet écran ne concerne que l'empreinte : un paiement déjà capturé ou en
  // cours de débit n'a rien à faire ici.
  if (["CHARGE_PENDING", "CAPTURED", "REFUNDED", "CANCELED"].includes(payment.status)) {
    redirect("/compte/mes-demandes");
  }

  // SetupIntent : réutilisé s'il est encore confirmable, recréé sinon
  // (notamment après un débit refusé : il faut une NOUVELLE empreinte).
  let clientSecret: string | null = null;
  let dejaEnregistree = false;
  if (payment.stripeSetupIntentId) {
    try {
      const si = await stripe.setupIntents.retrieve(payment.stripeSetupIntentId);
      if (si.status === "succeeded") {
        if (request.status === "OPEN") dejaEnregistree = true;
        // PAYMENT_REQUIRED : on repart sur un nouveau SetupIntent ci-dessous.
      } else if (isSetupIntentReusable(si)) {
        clientSecret = si.client_secret;
      }
    } catch {
      // Introuvable côté Stripe (clé changée, mode test purgé…) → on recrée.
    }
  }

  if (dejaEnregistree) {
    // Empreinte déjà posée : on aligne la base si besoin puis retour à la liste.
    await db.payment.updateMany({
      where: { id: payment.id, status: "SETUP_PENDING" },
      data: { status: "SETUP_COMPLETED" },
    });
    redirect("/compte/mes-demandes?ok=carte");
  }

  if (!clientSecret) {
    const si = await stripe.setupIntents.create({
      customer: payment.stripeCustomerId,
      usage: "off_session", // débit ultérieur SANS le client présent (Q14)
      payment_method_types: ["card"],
      metadata: { careRequestId: request.id, paymentId: payment.id },
    });
    await db.payment.update({
      where: { id: payment.id },
      data: { stripeSetupIntentId: si.id, status: "SETUP_PENDING" },
    });
    clientSecret = si.client_secret;
  }
  if (!clientSecret) redirect("/compte/mes-demandes?erreur=paiement");

  const passLabel = passLabelFromKey(payment.packLabel);
  const montant = centsLabel(payment.amountCents);

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:py-14">
      <p className="kicker">
        {request.status === "PAYMENT_REQUIRED"
          ? "Mettre à jour ma carte"
          : "Dernière étape — empreinte carte"}
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
        {request.status === "PAYMENT_REQUIRED"
          ? "Enregistrez une nouvelle carte"
          : "Enregistrez votre carte"}
      </h1>

      {/* HERO 0 € — martelé, pas en petites lignes (maquette Écran Dépôt) */}
      <div className="mt-6 rounded-[20px] bg-forest p-6 text-center">
        <p className="font-mono text-5xl font-bold text-surface">0 €</p>
        <p className="mt-2 font-display text-lg font-bold text-surface">
          débité aujourd&apos;hui.
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-on-forest">
          Empreinte carte seulement. Vous serez prélevé{" "}
          <strong className="text-surface">
            uniquement quand vous choisirez votre pet sitter
          </strong>{" "}
          — même si vous déposez des mois à l&apos;avance.
        </p>
      </div>

      {request.status === "PAYMENT_REQUIRED" && (
        <p className="mt-4 rounded-[12px] border border-primary-border bg-primary-tint px-4 py-3 text-sm text-primary-deep">
          Le débit précédent n&apos;a pas abouti (validation bancaire exigée ou
          carte expirée). Rien n&apos;est perdu : enregistrez une nouvelle
          carte, puis choisissez à nouveau votre pet sitter depuis{" "}
          <Link href="/compte/mes-demandes" className="font-bold underline underline-offset-2">
            Mes demandes
          </Link>
          .
        </p>
      )}

      {/* RÉCAP de la demande */}
      <div className="mt-6 rounded-[20px] border border-line bg-surface p-6">
        <p className="kicker">Votre demande</p>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Service</dt>
            <dd className="font-semibold text-ink">
              {serviceLabel(request.service)} · {speciesLabel(request.species)}
              {request.animalCount > 1 ? ` ×${request.animalCount}` : ""}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Dates</dt>
            <dd className="font-mono font-semibold text-ink">
              {dateFr(request.startDate)} → {dateFr(request.endDate)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Secteur</dt>
            <dd className="font-semibold text-ink">
              {request.communeName ?? request.communeCode} ({request.radiusKm} km)
            </dd>
          </div>
        </dl>
      </div>

      {/* TRANSPARENCE — payé seulement au choix du pet sitter */}
      <div className="mt-4 rounded-[16px] border border-forest-border bg-forest-tint p-5">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-forest-text">
          À régler seulement quand vous choisirez — jamais avant
        </p>
        <div className="mt-2 flex justify-between text-sm text-forest-text">
          <span>Le pet sitter reçoit son tarif (100 %), payé en direct</span>
          <span className="font-mono font-bold">commission 0 €</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-dashed border-forest-border pt-2 text-sm text-forest-text">
          <span>Mise en relation · {passLabel}</span>
          <span className="font-mono font-bold">{montant}</span>
        </div>
      </div>

      <div className="mt-6">
        <SetupCarteForm
          requestId={request.id}
          clientSecret={clientSecret}
          publishableKey={publishableKey}
          amountLabel={montant}
          testMode={publishableKey.startsWith("pk_test_")}
        />
      </div>
    </div>
  );
}
