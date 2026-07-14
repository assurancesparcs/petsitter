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
import {
  choisirCandidature,
  declarerGardeTerminee,
  laisserAvis,
  choisirRemplacant,
  demanderRemboursement,
} from "./actions";

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
  creee_couverte:
    "Demande déposée — couverte par votre Pass 3 mois : aucun Pass à régler pour cette demande, aucune carte à enregistrer. Les pet sitters compatibles peuvent maintenant candidater.",
  carte:
    "Carte enregistrée — 0 € débité. Vous ne serez prélevé que lorsque vous choisirez votre pet sitter.",
  debloquee:
    "Mise en relation débloquée : les coordonnées de votre pet sitter sont affichées ci-dessous.",
  annulee: "Demande annulée.",
  terminee:
    "Garde déclarée terminée. Vous pouvez maintenant laisser un avis vérifié à votre pet sitter.",
  avis: "Merci — votre avis est publié sur la fiche de votre pet sitter.",
  remplacant:
    "Remplaçant confirmé. Ses coordonnées sont affichées ci-dessous — aucun nouveau paiement.",
  rembourse:
    "Remboursement de la mise en relation en cours. Vous n'avez aucune démarche à faire.",
  cloturee_couverte:
    "Demande clôturée. Elle était couverte par votre Pass 3 mois : rien n'avait été débité, il n'y a donc rien à rembourser — et votre Pass reste actif.",
};

const MESSAGES_ERREUR: Record<string, string> = {
  paiement:
    "Le débit n'a pas abouti (validation bancaire exigée ou carte expirée). Rien n'est perdu : mettez à jour votre carte ci-dessous, puis choisissez à nouveau.",
  fermee: "Cette demande n'est plus ouverte au paiement.",
  expiree: "La fenêtre de réponse de cette demande est expirée — vous n'avez jamais été débité.",
  introuvable: "Demande ou candidature introuvable.",
  remplacement_clos: "Ce remplacement n'est plus en cours.",
  indisponible: "Paiement momentanément indisponible, réessayez dans un instant.",
  trop_tot: "La garde ne peut être déclarée terminée qu'après sa date de fin.",
  note: "Indiquez une note de 1 à 5 étoiles.",
  deja_avis: "Vous avez déjà laissé un avis pour cette garde.",
  avis_impossible:
    "Avis impossible : la garde doit être déclarée terminée pour laisser un avis.",
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
  const detail = one(sp.detail);

  const db = getPrisma();
  const stripe = getStripe();
  const demandes = db
    ? await db.careRequest.findMany({
        where: { ownerId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: {
          payment: true,
          mission: { include: { review: true } },
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
          {detail || MESSAGES_ERREUR[erreur] || "Une erreur est survenue."}
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

          // Demande COUVERTE par le Pass 3 mois : rien à régler, rien à
          // enregistrer — choisir un pet sitter débloque sans débit.
          const couverte = d.payment?.packLabel === "pass_trimestre";
          const carteEnregistree = d.payment?.status === "SETUP_COMPLETED";
          const renonciationOk =
            !!d.payment?.withdrawalWaiverAt && !!d.payment?.immediateExecutionRequestedAt;
          // Choisir = payer : possible si la demande est ouverte (ou à refaire
          // après échec de débit) ET que l'empreinte + la renonciation sont là.
          // Couverte : possible dès qu'elle est ouverte (aucun débit, la
          // renonciation a été recueillie à l'achat du Pass).
          const peutChoisir =
            (ouverte || d.status === "PAYMENT_REQUIRED") &&
            (couverte || (!!stripe && carteEnregistree && renonciationOk));
          const doitEnregistrerCarte =
            !couverte &&
            (ouverte || d.status === "PAYMENT_REQUIRED") &&
            !!stripe &&
            (!carteEnregistree || !renonciationOk);

          // Pet sitter confirmé (coordonnées révélées UNIQUEMENT post-capture).
          const debloquee = ["UNLOCKED", "CONFIRMED", "COMPLETED"].includes(d.status);
          const confirmee = debloquee
            ? d.applications.find((a) => a.sitterProfileId === d.mission?.confirmedSitterId)
            : undefined;
          // Déclarer la garde terminée : seulement après la date de fin réelle.
          const peutDeclarer =
            ["UNLOCKED", "CONFIRMED"].includes(d.status) && d.endDate <= now;

          // Plan B : le sitter confirmé a annulé (REPLACEMENT_IN_PROGRESS). Les
          // remplaçants candidats = les autres candidatures (hors sitter annulé,
          // toujours pointé par mission.confirmedSitterId tant qu'aucun choix).
          const remplacants =
            d.status === "REPLACEMENT_IN_PROGRESS"
              ? d.applications.filter(
                  (a) => a.sitterProfileId !== d.mission?.confirmedSitterId,
                )
              : [];

          return (
            <div key={d.id} className="rounded-[20px] border border-line bg-surface p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-lg font-bold text-ink">
                  {serviceLabel(d.service)} · {speciesLabel(d.species)}
                  {d.animalCount > 1 ? ` ×${d.animalCount}` : ""}
                </h2>
                <span className="flex flex-wrap items-center gap-2">
                  {couverte && (
                    <span className="rounded-full border border-forest-border bg-forest-tint px-3 py-1 text-xs font-bold text-forest-text">
                      Couverte par votre Pass 3 mois
                    </span>
                  )}
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${TONE_CLASS[st.tone]}`}
                  >
                    {st.label}
                  </span>
                </span>
              </div>
              <p className="mt-1 font-mono text-sm text-body">
                {dateFr(d.startDate)} → {dateFr(d.endDate)} ·{" "}
                {d.communeName ?? d.communeCode} ({d.radiusKm} km)
              </p>

              {(d.applications.length > 0 || debloquee) && (
                <Link
                  href={`/compte/messages/${d.id}`}
                  className="mt-2 inline-block text-sm font-semibold text-primary underline-offset-2 hover:underline"
                >
                  Ouvrir la messagerie →
                </Link>
              )}

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
                        {couverte ? (
                          <>
                            Mise en relation{" "}
                            <strong>couverte par votre Pass 3 mois</strong> —
                            0&nbsp;€ débité pour cette demande ·{" "}
                          </>
                        ) : (
                          <>
                            Vous avez réglé{" "}
                            <strong className="font-mono">{centsLabel(d.payment.amountCents)}</strong>{" "}
                            à {BRAND} pour la mise en relation ·{" "}
                          </>
                        )}
                        Le tarif de la garde (
                        <strong className="font-mono">{centsLabel(confirmee.priceCents)}</strong>{" "}
                        — proposé par {confirmee.sitterProfile.user.firstName ?? "votre pet sitter"})
                        lui revient à <strong className="font-mono">100&nbsp;%</strong>, payé en
                        direct.
                      </p>
                    </div>
                  )}

                  {/* Déclarer la garde terminée — possible après la date de fin */}
                  {peutDeclarer && (
                    <div className="rounded-[16px] border border-line bg-cream p-5">
                      <p className="font-display font-bold text-ink">
                        La garde est-elle terminée ?
                      </p>
                      <p className="mt-1 text-sm text-body">
                        Déclarez la garde terminée pour laisser un avis vérifié à{" "}
                        {displayName(
                          confirmee.sitterProfile.user.firstName,
                          confirmee.sitterProfile.user.lastName,
                        )}
                        .
                      </p>
                      <form action={declarerGardeTerminee} className="mt-3">
                        <input type="hidden" name="requestId" value={d.id} />
                        <button className="rounded-[12px] bg-primary px-5 py-2.5 text-sm font-bold text-surface hover:bg-primary-dark">
                          Déclarer la garde terminée
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Garde terminée : formulaire d'avis (un seul par garde) */}
                  {d.status === "COMPLETED" && !d.mission?.review && (
                    <div className="rounded-[16px] border border-line bg-surface p-5">
                      <p className="font-display font-bold text-ink">
                        Laisser un avis vérifié
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Votre avis porte sur votre garde du{" "}
                        {dateFr(d.endDate)} (date de l&apos;expérience). Il sera
                        publié daté sur la fiche, sans coordonnées.
                      </p>
                      <form action={laisserAvis} className="mt-3 space-y-3">
                        <input type="hidden" name="requestId" value={d.id} />
                        <label className="flex flex-col gap-1.5">
                          <span className="kicker">Note (obligatoire)</span>
                          <select
                            name="rating"
                            required
                            defaultValue=""
                            className="w-full rounded-[12px] border border-line bg-cream px-4 py-2.5 text-ink focus:border-primary focus:outline-none"
                          >
                            <option value="" disabled>
                              Choisir une note…
                            </option>
                            <option value="5">★★★★★ — Excellent</option>
                            <option value="4">★★★★ — Très bien</option>
                            <option value="3">★★★ — Correct</option>
                            <option value="2">★★ — Décevant</option>
                            <option value="1">★ — Mauvais</option>
                          </select>
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="kicker">
                            Votre avis (optionnel, sans coordonnées)
                          </span>
                          <textarea
                            name="body"
                            rows={4}
                            maxLength={1500}
                            placeholder="Comment s'est passée la garde ?"
                            className="w-full rounded-[12px] border border-line bg-cream px-4 py-2.5 text-ink placeholder:text-faint focus:border-primary focus:outline-none"
                          />
                        </label>
                        <button className="rounded-[12px] bg-primary px-5 py-2.5 text-sm font-bold text-surface hover:bg-primary-dark">
                          Publier mon avis
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Avis déjà déposé */}
                  {d.status === "COMPLETED" && d.mission?.review && (
                    <div className="rounded-[16px] border border-forest-border bg-forest-tint p-5">
                      <p className="font-semibold text-forest-text">
                        ✓ Avis publié —{" "}
                        <span aria-hidden>
                          {"★".repeat(d.mission.review.rating)}
                        </span>
                        <span className="sr-only">
                          note {d.mission.review.rating} sur 5
                        </span>
                      </p>
                      {d.mission.review.body && (
                        <p className="mt-2 whitespace-pre-line text-sm text-body">
                          {d.mission.review.body}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Plan B — le pet sitter confirmé a dû annuler */}
              {d.status === "REPLACEMENT_IN_PROGRESS" && (
                <div className="mt-4 space-y-3 border-t border-line-2 pt-4">
                  <div className="rounded-[16px] border-2 border-primary bg-surface p-4">
                    <p className="font-display font-bold text-primary-dark">
                      Votre pet sitter a dû annuler
                    </p>
                    <p className="mt-1 text-sm text-body">
                      Vous ne perdez rien.{" "}
                      {remplacants.length > 0 ? (
                        <>
                          Choisissez un remplaçant parmi les autres candidats
                          ci-dessous — <strong className="text-ink">sans nouveau
                          paiement</strong> — ou faites-vous rembourser la mise en
                          relation. À vous de décider.
                        </>
                      ) : (
                        <>
                          Aucun autre candidat n&apos;est disponible sur cette
                          demande. Vous pouvez vous faire rembourser la mise en
                          relation ci-dessous.
                        </>
                      )}
                    </p>
                  </div>

                  {remplacants.map((a) => (
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
                        <form action={choisirRemplacant}>
                          <input type="hidden" name="requestId" value={d.id} />
                          <input type="hidden" name="applicationId" value={a.id} />
                          <button
                            type="submit"
                            className="rounded-[12px] bg-primary px-4 py-2 text-sm font-bold text-surface hover:bg-primary-dark"
                          >
                            Choisir comme remplaçant
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}

                  <form
                    action={demanderRemboursement}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-line bg-surface px-4 py-3"
                  >
                    <input type="hidden" name="requestId" value={d.id} />
                    {couverte ? (
                      <p className="text-sm text-body">
                        Vous préférez arrêter là ? La demande est clôturée —
                        elle était couverte par votre Pass 3 mois, rien
                        n&apos;avait été débité pour elle.
                      </p>
                    ) : (
                      <p className="text-sm text-body">
                        Vous préférez être remboursé ? La mise en relation
                        {d.payment ? (
                          <>
                            {" "}(
                            <strong className="font-mono">
                              {centsLabel(d.payment.amountCents)}
                            </strong>
                            )
                          </>
                        ) : null}{" "}
                        vous est rendue, sans démarche.
                      </p>
                    )}
                    <button className="rounded-[12px] border border-line px-4 py-2 text-sm font-bold text-body hover:border-primary hover:text-primary">
                      {couverte ? "Clôturer cette demande" : "Me faire rembourser (0 arnaque)"}
                    </button>
                  </form>
                </div>
              )}

              {/* Garde annulée par le pet sitter — remboursement honnête */}
              {d.status === "CANCELLED_BY_SITTER_POST_CONFIRMATION" && (
                <div className="mt-4 border-t border-line-2 pt-4">
                  <div className="rounded-[16px] border border-line bg-surface-2 p-5">
                    <p className="font-display font-bold text-ink">
                      Garde annulée par le pet sitter
                    </p>
                    {couverte ? (
                      <p className="mt-1 text-sm text-body">
                        Le pet sitter a dû annuler. Cette demande était couverte
                        par votre Pass 3 mois : rien n&apos;avait été débité
                        pour elle, il n&apos;y a donc rien à rembourser.
                      </p>
                    ) : d.payment?.status === "REFUNDED" ? (
                      <p className="mt-1 text-sm text-body">
                        Le pet sitter a dû annuler et aucun remplaçant n&apos;a été
                        retenu. La mise en relation
                        {d.payment ? (
                          <>
                            {" "}(
                            <strong className="font-mono">
                              {centsLabel(d.payment.amountCents)}
                            </strong>
                            )
                          </>
                        ) : null}{" "}
                        vous est remboursée — aucune démarche de votre part. Le
                        remboursement apparaît sous quelques jours selon votre
                        banque.
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-body">
                        Cette garde a été annulée par le pet sitter.
                      </p>
                    )}
                  </div>
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
                              )}
                              {couverte
                                ? " — couvert par votre Pass"
                                : ` — régler ${centsLabel(d.payment.amountCents)}`}
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  ))}
                  {peutChoisir && d.payment && couverte && (
                    <p className="rounded-[12px] bg-forest-tint px-4 py-3 text-sm text-forest-text">
                      Cette demande est couverte par votre Pass 3 mois : choisir
                      votre pet sitter débloque la mise en relation immédiatement,{" "}
                      <strong>sans aucun débit</strong> — la garde se règle en
                      direct avec le pet sitter, à 100 % pour lui.
                    </p>
                  )}
                  {peutChoisir && d.payment && !couverte && (
                    <p className="rounded-[12px] bg-primary-tint px-4 py-3 text-sm text-primary-deep">
                      Choisir, c&apos;est payer : votre carte est débitée de{" "}
                      <strong className="font-mono">{centsLabel(d.payment.amountCents)}</strong>{" "}
                      (mise en relation) à ce moment-là seulement — la garde se
                      règle en direct avec le pet sitter, à 100 % pour lui.
                    </p>
                  )}
                  {!stripe && !couverte && (
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
