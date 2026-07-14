import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { PRICING } from "@/lib/pricing";
import { capturePassPurchase, findActivePass } from "@/domains/payments/pass";
import { acheterPass3Mois } from "./actions";

export const metadata: Metadata = {
  title: "Pass 3 mois",
  robots: { index: false },
};

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Ancré Europe/Paris : le runtime Vercel est en UTC — sans fuseau explicite,
// une échéance juste après minuit s'afficherait au jour précédent.
const dateFrLong = (d: Date) =>
  d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });

const ERREURS: Record<string, string> = {
  indisponible: "Paiement momentanément indisponible — rien n'a été débité, réessayez dans un instant.",
  deja_actif: "Votre Pass 3 mois est déjà actif : aucun nouvel achat n'est nécessaire (et rien n'a été débité).",
  renonciation: "Pour un accès immédiat au Pass, la case d'exécution immédiate doit être cochée — c'est elle qui autorise le démarrage avant la fin du délai de rétractation.",
  paiement: "Le paiement n'a pas abouti — aucun Pass n'est actif. Vous pouvez réessayer quand vous le souhaitez.",
};

/**
 * Pass 3 mois — achat UNIQUE prépayé (décision n° 13, DECISIONS.md).
 * Ce n'est PAS un produit récurrent : payé une fois, valable 3 mois, aucune
 * reconduction (ni tacite ni automatique), aucun prélèvement ultérieur, rien
 * à résilier. Un renouvellement serait un NOUVEL achat, explicite.
 *
 * Trois états, tous honnêtes :
 *  - Stripe dormant → « bientôt disponible » (comportement historique) ;
 *  - Pass ACTIF → « actif jusqu'au [date] » (même en mode dormant : un Pass
 *    acheté reste couvrant) ;
 *  - Stripe configuré, pas de Pass → l'offre + case de renonciation L221-18
 *    (JAMAIS pré-cochée) + bouton d'achat. Aucune urgence artificielle.
 *
 * Retour de paiement (?retour=1&achat=…) : le statut du PaymentIntent est
 * relu CÔTÉ SERVEUR et la capture (pending → captured) se fait ici — le
 * webhook n'est qu'un rattrapage.
 */
export default async function PassTroisMois({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "OWNER") redirect("/compte");
  const userId = session.user.id;

  const sp = await searchParams;
  const erreur = one(sp.erreur);
  const retour = one(sp.retour) === "1";
  const achatId = one(sp.achat);

  const db = getPrisma();
  const stripe = getStripe();
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const achatOuvert = !!db && !!stripe && !!publishableKey;

  // ── Retour de paiement : vérification SERVEUR du PaymentIntent, capture
  // idempotente (updateMany conditionnel pending → captured, un seul gagnant —
  // le webhook utilise exactement le même verrou).
  let retourEtat: "ok" | "attente" | "echec" | null = null;
  if (retour && achatId && db) {
    const purchase = await db.passPurchase.findFirst({
      where: { id: achatId, userId }, // scopé session — jamais l'achat d'autrui
    });
    if (purchase) {
      if (purchase.status === "captured") {
        retourEtat = "ok"; // déjà capturé (webhook passé avant, ou page rechargée)
      } else if (purchase.status === "failed") {
        retourEtat = "echec";
      } else if (purchase.status === "pending" && purchase.stripePaymentIntentId && stripe) {
        try {
          const pi = await stripe.paymentIntents.retrieve(purchase.stripePaymentIntentId);
          if (pi.status === "succeeded") {
            await capturePassPurchase(db, purchase.id);
            retourEtat = "ok";
          } else if (pi.status === "processing") {
            // La banque valide encore : le webhook capturera — état honnête.
            retourEtat = "attente";
          } else {
            // Confirmation non aboutie (3-D Secure refusé, carte déclinée…).
            // ORDRE CRITIQUE (audit F1) : on ANNULE d'abord le PaymentIntent
            // chez Stripe, et on ne solde la ligne en échec QUE si l'annulation
            // a réellement abouti. Si elle échoue parce que le débit a fini par
            // passer (course : 3-D Secure validé dans un autre onglet entre la
            // relecture et l'annulation), on RE-LIT le PI : succeeded → capture.
            // Jamais de ligne « échouée » avec un débit réel derrière.
            let solde = pi.status === "canceled";
            if (!solde) {
              try {
                await stripe.paymentIntents.cancel(pi.id);
                solde = true;
              } catch {
                const relu = await stripe.paymentIntents
                  .retrieve(pi.id)
                  .catch(() => null);
                if (relu?.status === "succeeded") {
                  await capturePassPurchase(db, purchase.id);
                  retourEtat = "ok";
                } else if (relu?.status === "canceled") {
                  solde = true;
                }
                // Sinon : état indéterminé → la ligne RESTE pending, le
                // webhook (ou un rechargement) tranchera.
              }
            }
            if (retourEtat !== "ok") {
              if (solde) {
                await db.passPurchase.updateMany({
                  where: { id: purchase.id, status: "pending" },
                  data: { status: "failed" },
                });
                retourEtat = "echec";
              } else {
                retourEtat = "attente";
              }
            }
          }
        } catch {
          // Stripe injoignable : on ne conclut rien — le webhook rattrapera.
          retourEtat = "attente";
        }
      }
    }
  }

  // Pass actif : capturé ET fenêtre de couverture non échue (indépendant de
  // Stripe — recalculé APRÈS l'éventuelle capture du retour ci-dessus).
  const passActif = db ? await findActivePass(db, userId) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <p className="kicker">Espace propriétaire</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
        {PRICING.passTrimestre.label}
      </h1>

      {retourEtat === "ok" && (
        <p className="mt-4 rounded-[12px] border border-forest-border bg-forest-tint px-4 py-3 text-sm font-semibold text-forest-text">
          Paiement confirmé — votre {PRICING.passTrimestre.label} est actif.
          Payé une fois : aucune reconduction, aucun prélèvement ultérieur.
        </p>
      )}
      {retourEtat === "attente" && (
        <p className="mt-4 rounded-[12px] border border-line bg-surface-2 px-4 py-3 text-sm font-semibold text-body">
          Paiement en cours de validation par votre banque. Votre Pass
          s&apos;activera automatiquement dès la confirmation — rechargez cette
          page dans un instant.
        </p>
      )}
      {retourEtat === "echec" && (
        <p className="mt-4 rounded-[12px] border border-primary-border bg-primary-tint px-4 py-3 text-sm font-semibold text-primary-deep">
          {ERREURS.paiement}
        </p>
      )}
      {erreur && ERREURS[erreur] && retourEtat === null && (
        <p className="mt-4 rounded-[12px] border border-primary-border bg-primary-tint px-4 py-3 text-sm font-semibold text-primary-deep">
          {ERREURS[erreur]}
        </p>
      )}

      {/* L'offre — montant depuis PRICING, jamais en dur */}
      <section className="mt-6 rounded-[20px] border border-line bg-surface p-6 shadow-panel">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-ink">
            {PRICING.passTrimestre.label}
          </h2>
          <p className="font-mono text-2xl font-bold text-ink">
            {PRICING.passTrimestre.price}
            <span className="ml-1 text-sm font-normal text-muted">
              {PRICING.passTrimestre.unit}
            </span>
          </p>
        </div>
        <p className="mt-2 text-sm text-body">{PRICING.passTrimestre.detail}</p>
      </section>

      {/* ── PASS ACTIF — couverture en cours, rien à régler ── */}
      {passActif && (
        <section className="mt-5 rounded-[20px] border border-forest-border bg-forest-tint p-6">
          <span className="inline-block rounded-full border border-forest-border bg-surface px-3 py-1 text-xs font-bold text-forest-text">
            Pass actif jusqu&apos;au {dateFrLong(passActif.expiresAt)}
          </span>
          <p className="mt-3 text-sm text-body">
            Toute demande déposée <strong>pendant que le Pass est actif</strong>{" "}
            est couverte : aucun Pass ponctuel ne vous est facturé, ni au dépôt
            ni au choix de votre pet sitter — la mise en relation se débloque
            directement. (Les demandes déposées <em>avant</em> l&apos;activation
            du Pass conservent, elles, le Pass prévu à leur dépôt.) À
            l&apos;échéance, le Pass s&apos;arrête tout seul : aucun prélèvement
            ultérieur, rien à résilier. Le renouveler, si vous le souhaitez, sera
            un nouvel achat explicite de votre part.
          </p>
          <Link
            href="/demande"
            className="mt-4 inline-block rounded-[14px] bg-primary px-5 py-2.5 text-sm font-bold text-surface hover:bg-primary-dark"
          >
            Déposer une demande de garde →
          </Link>
        </section>
      )}

      {/* ── ACHAT OUVERT — offre + renonciation L221-18 + bouton ── */}
      {!passActif && achatOuvert && retourEtat !== "attente" && (
        <section className="mt-5 rounded-[20px] border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-bold text-ink">
            Acheter mon {PRICING.passTrimestre.label}
          </h2>
          <p className="mt-2 text-sm text-body">
            Payé <strong className="text-ink">une seule fois</strong> — aucune
            reconduction. Utile à partir de 2 mises en relation sur 3 mois ; en
            dessous, un Pass ponctuel vous coûte moins cher — on préfère vous le
            dire. La couverture démarre au paiement et s&apos;arrête toute
            seule 3 mois plus tard.
          </p>

          <form action={acheterPass3Mois} className="mt-5">
            {/* Case OBLIGATOIRE, JAMAIS pré-cochée — rétractation L221-18.
                Validée et horodatée CÔTÉ SERVEUR par acheterPass3Mois. */}
            <label className="flex items-start gap-3 text-sm leading-relaxed text-body">
              <input
                type="checkbox"
                name="renonciation"
                required
                className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-primary)]"
              />
              <span>
                Je demande l&apos;exécution immédiate du{" "}
                {PRICING.passTrimestre.label} et je reconnais perdre mon droit
                de rétractation une fois celui-ci exécuté.
              </span>
            </label>
            <button
              type="submit"
              className="mt-5 w-full rounded-[14px] bg-primary px-6 py-3.5 font-bold text-surface hover:bg-primary-dark"
            >
              Acheter le {PRICING.passTrimestre.label} —{" "}
              {PRICING.passTrimestre.price}, une fois
            </button>
          </form>
          <p className="mt-3 text-center text-xs text-faint">
            Règlement à l&apos;étape suivante (carte, via Stripe) · aucune
            reconduction · rien à résilier
          </p>
        </section>
      )}

      {/* ── ACHAT NON OUVERT (mode dormant) — état honnête ── */}
      {!passActif && !achatOuvert && (
        <section className="mt-5 rounded-[20px] border border-line bg-surface p-6">
          <span className="inline-block rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-bold text-muted">
            Bientôt disponible
          </span>
          <p className="mt-3 text-sm text-body">
            L&apos;achat du {PRICING.passTrimestre.label} n&apos;est pas encore
            ouvert : aucun moyen de paiement ne vous est demandé et aucun débit
            n&apos;est possible aujourd&apos;hui. En attendant, déposez vos
            demandes de garde normalement — le Pass ponctuel est déduit du
            service choisi, et la récurrence est déjà disponible dans le
            formulaire de dépôt.
          </p>
          <Link
            href="/demande"
            className="mt-4 inline-block rounded-[14px] bg-primary px-5 py-2.5 text-sm font-bold text-surface hover:bg-primary-dark"
          >
            Déposer une demande de garde →
          </Link>
        </section>
      )}

      {/* Les règles, honnêtes — toujours affichées */}
      <section className="mt-5 rounded-[20px] border border-forest-border bg-forest-tint p-6">
        <p className="kicker text-forest-text">Comment il fonctionne</p>
        <ul className="mt-4 grid gap-3 text-sm text-body">
          <li className="flex gap-3">
            <span aria-hidden className="font-mono font-bold text-success">✓</span>
            <span>
              <strong className="text-ink">Payé une seule fois.</strong> Aucune
              reconduction, ni tacite ni automatique : à l&apos;échéance des
              3 mois, il s&apos;arrête tout seul. Aucun prélèvement ultérieur,
              rien à résilier.
            </span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="font-mono font-bold text-success">✓</span>
            <span>
              <strong className="text-ink">
                Mises en relation illimitées pendant 3 mois
              </strong>{" "}
              — autant de demandes que vous voulez, sans Pass ponctuel à régler.
            </span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="font-mono font-bold text-success">✓</span>
            <span>
              <strong className="text-ink">
                Utile à partir de 2 mises en relation.
              </strong>{" "}
              En dessous, un Pass ponctuel vous coûte moins cher — on préfère
              vous le dire.
            </span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="font-mono font-bold text-success">✓</span>
            <span>
              <strong className="text-ink">
                Le renouveler sera toujours VOTRE geste
              </strong>{" "}
              — un nouvel achat explicite, jamais un débit décidé pour vous.
            </span>
          </li>
        </ul>
      </section>

      <Link
        href="/compte"
        className="mt-8 inline-block text-sm text-muted underline-offset-2 hover:text-primary hover:underline"
      >
        ← Retour à mon compte
      </Link>
    </div>
  );
}
