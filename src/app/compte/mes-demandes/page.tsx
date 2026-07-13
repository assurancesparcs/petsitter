import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { BRAND } from "@/lib/brand";
import { centsLabel } from "@/lib/pricing";
import { syncSetupIntentStatus } from "@/domains/payments/payments";
import { serviceLabel, speciesLabel } from "@/domains/marketplace/catalog";
import { displayName, priceLabel } from "@/domains/marketplace/sitters";
import { annulerDemande } from "@/app/demande/actions";
import { choisirCandidature } from "./actions";

export const metadata: Metadata = {
  title: "Mes demandes de garde",
  robots: { index: false },
};

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const dateFr = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const STATUS_LABEL: Record<string, { label: string; tone: "open" | "action" | "done" | "closed" }> = {
  OPEN: { label: "En attente de candidatures", tone: "open" },
  ACCEPTED: { label: "Paiement en cours", tone: "action" },
  UNLOCKED: { label: "Mise en relation débloquée", tone: "done" },
  CONFIRMED: { label: "Garde confirmée", tone: "done" },
  COMPLETED: { label: "Garde terminée", tone: "done" },
  PAYMENT_REQUIRED: { label: "Action requise — paiement à finaliser", tone: "action" },
  EXPIRED: { label: "Expirée — vous n'avez jamais été débité", tone: "closed" },
  CANCELLED_BY_OWNER: { label: "Annulée par vous", tone: "closed" },
  CANCELLED_BY_SITTER_PRE_CONFIRMATION: { label: "Annulée par le pet sitter", tone: "closed" },
  CANCELLED_BY_SITTER_POST_CONFIRMATION: { label: "Annulée par le pet sitter", tone: "closed" },
  REPLACEMENT_IN_PROGRESS: { label: "Remplacement en cours", tone: "action" },
};

const TONE_CLASS: Record<string, string> = {
  open: "border border-forest-border bg-forest-tint text-forest-text",
  action: "border border-primary-border bg-primary-tint text-primary-deep",
  done: "border border-forest-border bg-forest-tint text-forest-text",
  closed: "border border-line bg-surface-2 text-muted",
};

const MESSAGES_OK: Record<string, string> = {
  creee:
    "Demande déposée — 0 € débité. Les pet sitters compatibles peuvent maintenant candidater ; leurs propositions apparaîtront ici.",
  carte:
    "Carte enregistrée — 0 € débité. Vous ne serez prélevé que lorsque vous choisirez votre pet sitter.",
  debloquee:
    "Mise en relation débloquée : les coordonnées de votre pet sitter sont affichées ci-dessous.",
  annulee: "Demande annulée.",
};

const MESSAGES_ERREUR: Record<string, string> = {
  paiement:
    "Le débit n'a pas abouti (validation bancaire exigée ou carte expirée). Rien n'est perdu : mettez à jour votre carte ci-dessous, puis choisissez à nouveau.",
  fermee: "Cette demande n'est plus ouverte au paiement.",
  expiree: "La fenêtre de réponse de cette demande est expirée — vous n'avez jamais été débité.",
  introuvable: "Demande ou candidature introuvable.",
  indisponible: "Paiement momentanément indisponible, réessayez dans un instant.",
};

export default async function MesDemandes({
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
  const stripe = getStripe();
  const demandes = db
    ? await db.careRequest.findMany({
        where: { ownerId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: {
          payment: true,
          mission: true,
          applications: {
            orderBy: { priceCents: "asc" },
            include: {
              sitterProfile: {
                include: {
                  user: { select: { firstName: true, lastName: true, email: true } },
                },
              },
            },
          },
        },
        take: 20,
      })
    : [];

  // Synchronisation paresseuse des empreintes en attente (retour de Stripe
  // avant le passage du webhook) — idempotent, borné aux demandes affichées.
  if (db && stripe) {
    for (const d of demandes) {
      if (d.payment?.status === "SETUP_PENDING" && d.payment.stripeSetupIntentId) {
        const statut = await syncSetupIntentStatus(db, stripe, d.payment);
        if (statut === "SETUP_COMPLETED") d.payment.status = "SETUP_COMPLETED";
      }
    }
  }

  const now = new Date();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Espace propriétaire</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
            Mes demandes
          </h1>
        </div>
        <Link
          href="/demande"
          className="rounded-[14px] bg-primary px-5 py-2.5 text-sm font-bold text-surface hover:bg-primary-dark"
        >
          + Nouvelle demande
        </Link>
      </div>

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

      {demandes.length === 0 && (
        <div className="mt-8 rounded-[20px] border border-dashed border-line bg-surface p-8 text-center">
          <p className="font-semibold text-ink">Aucune demande pour le moment</p>
          <p className="mt-1 text-sm text-muted">
            Décrivez votre besoin : les pet sitters autour de vous candidateront
            avec leur tarif — sans débit tant que vous n&apos;avez pas choisi.
          </p>
        </div>
      )}

      <div className="mt-6 space-y-5">
        {demandes.map((d) => {
          // Expiration paresseuse à l'affichage : OPEN hors fenêtre = expirée.
          const expiree = d.status === "OPEN" && d.responseDeadline <= now;
          const ouverte = d.status === "OPEN" && !expiree;
          const st = expiree
            ? STATUS_LABEL.EXPIRED
            : STATUS_LABEL[d.status] ?? { label: "Clôturée", tone: "closed" as const };

          const carteEnregistree = d.payment?.status === "SETUP_COMPLETED";
          const renonciationOk =
            !!d.payment?.withdrawalWaiverAt && !!d.payment?.immediateExecutionRequestedAt;
          // Choisir = payer : possible si la demande est ouverte (ou à refaire
          // après échec de débit) ET que l'empreinte + la renonciation sont là.
          const peutChoisir =
            (ouverte || d.status === "PAYMENT_REQUIRED") &&
            !!stripe &&
            carteEnregistree &&
            renonciationOk;
          const doitEnregistrerCarte =
            (ouverte || d.status === "PAYMENT_REQUIRED") &&
            !!stripe &&
            (!carteEnregistree || !renonciationOk);

          // Pet sitter confirmé (coordonnées révélées UNIQUEMENT post-capture).
          const debloquee = ["UNLOCKED", "CONFIRMED", "COMPLETED"].includes(d.status);
          const confirmee = debloquee
            ? d.applications.find((a) => a.sitterProfileId === d.mission?.confirmedSitterId)
            : undefined;

          return (
            <div key={d.id} className="rounded-[20px] border border-line bg-surface p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-lg font-bold text-ink">
                  {serviceLabel(d.service)} · {speciesLabel(d.species)}
                  {d.animalCount > 1 ? ` ×${d.animalCount}` : ""}
                </h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${TONE_CLASS[st.tone]}`}
                >
                  {st.label}
                </span>
              </div>
              <p className="mt-1 font-mono text-sm text-body">
                {dateFr(d.startDate)} → {dateFr(d.endDate)} ·{" "}
                {d.communeName ?? d.communeCode} ({d.radiusKm} km)
              </p>

              {/* Échec de débit : parcours de PREMIER plan, pas une impasse */}
              {d.status === "PAYMENT_REQUIRED" && (
                <div className="mt-4 rounded-[16px] border-2 border-primary bg-surface p-4">
                  <p className="font-display font-bold text-primary-dark">
                    Une confirmation de votre carte est nécessaire
                  </p>
                  <p className="mt-1 text-sm text-body">
                    Votre banque demande une validation (3-D Secure) ou votre
                    carte a expiré. <strong className="text-ink">Rien n&apos;est perdu :</strong>{" "}
                    mettez à jour votre carte puis choisissez à nouveau votre
                    pet sitter ci-dessous. Aucun débit n&apos;a eu lieu.
                  </p>
                  <Link
                    href={`/demande/paiement/${d.id}`}
                    className="mt-3 inline-block rounded-[12px] bg-primary px-5 py-2.5 text-sm font-bold text-surface hover:bg-primary-dark"
                  >
                    Mettre à jour ma carte
                  </Link>
                </div>
              )}

              {/* Empreinte carte à poser (0 € débité) pour pouvoir choisir */}
              {doitEnregistrerCarte && d.status !== "PAYMENT_REQUIRED" && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-line bg-cream px-4 py-3">
                  <p className="text-sm text-body">
                    <strong className="text-ink">Enregistrez votre carte (0 € débité)</strong>{" "}
                    pour pouvoir choisir un pet sitter dès qu&apos;une
                    candidature vous plaît.
                  </p>
                  <Link
                    href={`/demande/paiement/${d.id}`}
                    className="rounded-[12px] bg-primary px-4 py-2 text-sm font-bold text-surface hover:bg-primary-dark"
                  >
                    Enregistrer ma carte
                  </Link>
                </div>
              )}

              {/* Mise en relation débloquée : coordonnées + reçu de transparence */}
              {debloquee && confirmee && (
                <div className="mt-4 space-y-3 border-t border-line-2 pt-4">
                  <div className="rounded-[16px] border border-forest-border bg-forest-tint p-5">
                    <p className="kicker text-forest-text">Votre pet sitter confirmé</p>
                    <p className="mt-2 font-display text-xl font-bold text-ink">
                      {[confirmee.sitterProfile.user.firstName, confirmee.sitterProfile.user.lastName]
                        .filter(Boolean)
                        .join(" ") ||
                        displayName(
                          confirmee.sitterProfile.user.firstName,
                          confirmee.sitterProfile.user.lastName,
                        )}
                    </p>
                    <p className="mt-1 text-sm text-body">
                      E-mail :{" "}
                      <a
                        href={`mailto:${confirmee.sitterProfile.user.email}`}
                        className="font-mono font-bold text-forest-text underline underline-offset-2"
                      >
                        {confirmee.sitterProfile.user.email}
                      </a>
                    </p>
                    <p className="mt-3 text-sm text-body">
                      Organisez une <strong className="text-ink">rencontre préalable gratuite</strong>{" "}
                      avant la garde : c&apos;est le standard {BRAND} — on se
                      voit, on se parle, puis on confirme.
                    </p>
                  </div>

                  {/* REÇU DE TRANSPARENCE */}
                  {d.payment && (
                    <div className="rounded-[16px] bg-forest p-5">
                      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-on-forest">
                        Reçu — le détail, sans surprise
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-surface">
                        Vous avez réglé{" "}
                        <strong className="font-mono">{centsLabel(d.payment.amountCents)}</strong>{" "}
                        à {BRAND} pour la mise en relation ·{" "}
                        Le tarif de la garde (
                        <strong className="font-mono">{centsLabel(confirmee.priceCents)}</strong>{" "}
                        — proposé par {confirmee.sitterProfile.user.firstName ?? "votre pet sitter"})
                        lui revient à <strong className="font-mono">100&nbsp;%</strong>, payé en
                        direct.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Candidatures reçues */}
              {!debloquee && d.applications.length > 0 && (ouverte || d.status === "PAYMENT_REQUIRED") && (
                <div className="mt-4 space-y-3 border-t border-line-2 pt-4">
                  <p className="kicker">
                    {d.applications.length} candidature
                    {d.applications.length > 1 ? "s" : ""} — chacune est une
                    acceptation ferme
                  </p>
                  {d.applications.map((a) => (
                    <div
                      key={a.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-line bg-cream px-4 py-3"
                    >
                      <div>
                        <Link
                          href={`/petsitter/${a.sitterProfile.id}`}
                          className="font-semibold text-ink underline-offset-2 hover:text-primary hover:underline"
                        >
                          {displayName(
                            a.sitterProfile.user.firstName,
                            a.sitterProfile.user.lastName,
                          )}
                        </Link>
                        {a.shortPitch && (
                          <p className="mt-0.5 text-sm text-muted">{a.shortPitch}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-right">
                          <p className="font-mono font-bold text-ink">
                            {priceLabel(a.priceCents, "per_day").replace("/ jour", "")}
                          </p>
                          <p className="font-mono text-xs font-bold text-success">
                            il reçoit 100 %
                          </p>
                        </div>
                        {peutChoisir && d.payment && (
                          <form action={choisirCandidature}>
                            <input type="hidden" name="requestId" value={d.id} />
                            <input type="hidden" name="applicationId" value={a.id} />
                            <button
                              type="submit"
                              className="rounded-[12px] bg-primary px-4 py-2 text-sm font-bold text-surface hover:bg-primary-dark"
                            >
                              Choisir{" "}
                              {displayName(
                                a.sitterProfile.user.firstName,
                                a.sitterProfile.user.lastName,
                              )}{" "}
                              — régler {centsLabel(d.payment.amountCents)}
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  ))}
                  {peutChoisir && d.payment && (
                    <p className="rounded-[12px] bg-primary-tint px-4 py-3 text-sm text-primary-deep">
                      Choisir, c&apos;est payer : votre carte est débitée de{" "}
                      <strong className="font-mono">{centsLabel(d.payment.amountCents)}</strong>{" "}
                      (mise en relation) à ce moment-là seulement — la garde se
                      règle en direct avec le pet sitter, à 100 % pour lui.
                    </p>
                  )}
                  {!stripe && (
                    <p className="rounded-[12px] bg-primary-tint px-4 py-3 text-sm text-primary-deep">
                      <strong>Bientôt :</strong> choisissez votre pet sitter et
                      réglez la mise en relation — c&apos;est à ce moment-là
                      seulement que le débit aura lieu. Ouverture du paiement très
                      prochainement.
                    </p>
                  )}
                </div>
              )}

              {ouverte && d.applications.length === 0 && (
                <p className="mt-4 border-t border-line-2 pt-4 text-sm text-muted">
                  En attente de candidatures — fenêtre ouverte jusqu&apos;au{" "}
                  {dateFr(d.responseDeadline)}. Si personne n&apos;accepte,
                  la demande expire et vous n&apos;êtes jamais débité.
                </p>
              )}

              {ouverte && (
                <form action={annulerDemande} className="mt-4">
                  <input type="hidden" name="id" value={d.id} />
                  <button className="text-sm text-muted underline-offset-2 hover:text-primary hover:underline">
                    Annuler cette demande
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
