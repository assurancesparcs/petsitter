import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { PRICING } from "@/lib/pricing";
import { pauseAbonnement, reprendreAbonnement } from "./actions";

export const metadata: Metadata = {
  title: "Mon abonnement",
  robots: { index: false },
};

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const dateFr = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

const MESSAGES_OK: Record<string, string> = {
  pause: "Abonnement mis en pause : aucun prélèvement tant qu'il est en pause. Vous le reprenez quand vous voulez.",
  reprise: "Abonnement repris. Un rappel vous parviendra 3 jours avant chaque prélèvement.",
};

const MESSAGES_ERREUR: Record<string, string> = {
  indisponible: "Service momentanément indisponible, réessayez.",
};

export default async function Abonnement({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "OWNER") redirect("/compte");

  const sp = await searchParams;
  const ok = one(sp.ok);
  const erreur = one(sp.erreur);

  const db = getPrisma();
  const stripeActif = Boolean(getStripe());

  const subscription =
    db && session.user.id
      ? await db.subscription.findFirst({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
        })
      : null;

  // État réel dérivé des colonnes (source de vérité), indépendant de `status`.
  // Une pause dure JUSQU'À une reprise explicite (qui seule resynchronise le
  // prélèvement) : on ne « réactive » jamais automatiquement à une date, sinon
  // l'écran annoncerait un prélèvement qui ne repartirait pas côté paiement.
  const etat = subscription
    ? subscription.cancelledAt
      ? "cancelled"
      : subscription.pausedUntil
        ? "paused"
        : "active"
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <p className="kicker">Espace propriétaire</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
        Mon abonnement
      </h1>

      {ok && MESSAGES_OK[ok] && (
        <p className="mt-4 rounded-[12px] border border-forest-border bg-forest-tint px-4 py-3 text-sm font-semibold text-forest-text">
          {MESSAGES_OK[ok]}
        </p>
      )}
      {erreur && (
        <p className="mt-4 rounded-[12px] border border-primary-border bg-primary-tint px-4 py-3 text-sm font-semibold text-primary-deep">
          {MESSAGES_ERREUR[erreur] ?? "Une erreur est survenue."}
        </p>
      )}

      {/* L'offre — montant depuis PRICING, jamais en dur */}
      <section className="mt-6 rounded-[20px] border border-line bg-surface p-6 shadow-panel">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-ink">
            {PRICING.abonnement.label}
          </h2>
          <p className="font-mono text-2xl font-bold text-ink">
            {PRICING.abonnement.price}
            <span className="ml-1 text-sm font-normal text-muted">
              {PRICING.abonnement.unit}
            </span>
          </p>
        </div>
        <p className="mt-2 text-sm text-body">{PRICING.abonnement.detail}</p>
      </section>

      {/* CAS 1 — aucun abonnement : présentation honnête « bientôt disponible » */}
      {!subscription && (
        <section className="mt-5 rounded-[20px] border border-line bg-surface p-6">
          <span className="inline-block rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-bold text-muted">
            Bientôt disponible
          </span>
          <p className="mt-3 text-sm text-body">
            {stripeActif ? (
              <>
                La souscription ouvre très prochainement. Vous n&apos;avez rien à
                faire pour l&apos;instant : déposez vos demandes de garde, la
                récurrence est déjà disponible dans le formulaire de dépôt.
              </>
            ) : (
              <>
                L&apos;abonnement n&apos;est pas encore ouvert à la souscription :
                aucun moyen de paiement n&apos;est demandé et aucun prélèvement
                n&apos;est possible aujourd&apos;hui. Vous pouvez déjà déposer des
                demandes récurrentes gratuitement.
              </>
            )}
          </p>
          <Link
            href="/demande"
            className="mt-4 inline-block rounded-[14px] bg-primary px-5 py-2.5 text-sm font-bold text-surface hover:bg-primary-dark"
          >
            Déposer une demande de garde →
          </Link>
        </section>
      )}

      {/* CAS 2 — un abonnement existe : état réel + contrôles honnêtes */}
      {subscription && (
        <section className="mt-5 rounded-[20px] border border-line bg-surface p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-ink">
              Votre abonnement
            </h2>
            {etat === "active" && (
              <span className="rounded-full border border-forest-border bg-forest-tint px-3 py-1 text-xs font-bold text-forest-text">
                Actif
              </span>
            )}
            {etat === "paused" && (
              <span className="rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-bold text-muted">
                En pause
              </span>
            )}
            {etat === "cancelled" && (
              <span className="rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-bold text-muted">
                Résilié
              </span>
            )}
          </div>

          {etat === "paused" && (
            <p className="mt-2 text-sm text-body">
              En pause — aucun prélèvement. Vous reprenez quand vous le
              souhaitez, d&apos;un clic, et le rappel avant prélèvement
              réapparaît à ce moment-là.
            </p>
          )}
          {etat === "cancelled" && subscription.cancelledAt && (
            <p className="mt-2 text-sm text-body">
              Résilié le{" "}
              <strong className="text-ink">{dateFr(subscription.cancelledAt)}</strong>.
              Aucun prélèvement ne sera effectué.
            </p>
          )}

          {/* Rappel J-3 avant chaque prélèvement — transparence §9. Affiché
              UNIQUEMENT quand l'abonnement est actif : en pause, il n'y a pas de
              prélèvement à venir, l'annoncer serait trompeur. */}
          {etat === "active" && (
            <p className="mt-3 rounded-[12px] bg-primary-tint px-4 py-3 text-sm text-primary-deep">
              {subscription.nextChargeReminderAt ? (
                <>
                  Prochain rappel avant prélèvement :{" "}
                  <strong className="font-mono">
                    {dateFr(subscription.nextChargeReminderAt)}
                  </strong>{" "}
                  (rappel envoyé 3 jours avant chaque prélèvement).
                </>
              ) : (
                <>Un rappel vous est envoyé 3 jours avant chaque prélèvement.</>
              )}
            </p>
          )}

          {/* Contrôles honnêtes selon l'état */}
          <div className="mt-5 flex flex-wrap gap-3">
            {etat === "active" && (
              <form action={pauseAbonnement}>
                <button
                  type="submit"
                  className="rounded-[14px] border border-line px-5 py-2.5 text-sm font-semibold text-body transition-colors hover:border-primary hover:text-primary"
                >
                  Mettre en pause
                </button>
              </form>
            )}
            {etat === "paused" && (
              <form action={reprendreAbonnement}>
                <button
                  type="submit"
                  className="rounded-[14px] bg-primary px-5 py-2.5 text-sm font-bold text-surface hover:bg-primary-dark"
                >
                  Reprendre mon abonnement
                </button>
              </form>
            )}
            {etat !== "cancelled" && (
              <Link
                href="/resilier"
                className="rounded-[14px] border border-line px-5 py-2.5 text-sm font-semibold text-muted transition-colors hover:border-primary hover:text-primary"
              >
                Résilier (3 clics)
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Garanties anti-dark-pattern — toujours affichées */}
      <section className="mt-5 rounded-[20px] border border-forest-border bg-forest-tint p-6">
        <p className="kicker text-forest-text">Nos engagements</p>
        <ul className="mt-4 grid gap-3 text-sm text-body sm:grid-cols-2">
          <li className="flex gap-3">
            <span aria-hidden className="font-mono font-bold text-success">✓</span>
            <span>Pause possible à tout moment, sans résilier</span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="font-mono font-bold text-success">✓</span>
            <span>Rappel 3 jours avant chaque prélèvement</span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="font-mono font-bold text-success">✓</span>
            <span>Résiliation en 3 clics, effet immédiat</span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="font-mono font-bold text-success">✓</span>
            <span>Sans engagement — aucune case pré-cochée</span>
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
