import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { distanceKm } from "@/domains/geo/communes";
import { serviceLabel, speciesLabel } from "@/domains/marketplace/catalog";
import { CONSTRAINT_LABELS } from "@/domains/marketplace/constraints";
import {
  candidater,
  declarerGardeTermineeSitter,
  signalerAvis,
  annulerGardeSitter,
} from "./actions";

export const metadata: Metadata = {
  title: "Demandes près de chez vous",
  robots: { index: false },
};

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const ERREURS: Record<string, string> = {
  tarif: "Indiquez un tarif valide (en euros).",
  fermee: "Cette demande n'est plus ouverte.",
  deja: "Vous avez déjà candidaté à cette demande.",
  indisponible: "Service momentanément indisponible.",
  introuvable: "Mission introuvable.",
  trop_tot: "La garde ne peut être déclarée terminée qu'après sa date de fin.",
  annulation_impossible: "Cette garde ne peut plus être annulée.",
  annulation_trop_tard:
    "Cette garde a déjà commencé (ou est terminée) : elle ne peut plus être annulée.",
  filtre: "",
};

const OKS: Record<string, string> = {
  envoyee: "Candidature envoyée — le propriétaire voit votre tarif et votre message.",
  terminee: "Garde déclarée terminée. Le propriétaire peut désormais laisser un avis vérifié.",
  signale:
    "Avis signalé — il sera revu par un humain. Un avis n'est jamais supprimé automatiquement.",
  annulee_planb:
    "Annulation enregistrée. Le propriétaire peut choisir un remplaçant parmi les autres candidats, ou être remboursé de la mise en relation.",
  annulee_remboursee:
    "Annulation enregistrée. Aucun autre candidat n'était disponible : le propriétaire est remboursé de la mise en relation.",
};

const dateFr = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export default async function DemandesSitter({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "SITTER") redirect("/compte");

  const sp = await searchParams;
  const ok = one(sp.ok);
  const erreur = one(sp.erreur);
  const detail = one(sp.detail);

  const db = getPrisma();
  const profile = db
    ? await db.sitterProfile.findUnique({
        where: { userId: session.user.id },
        include: { services: true, applications: { select: { careRequestId: true } } },
      })
    : null;

  // Missions confirmées : le propriétaire a choisi CE pet sitter et réglé la
  // mise en relation → ses coordonnées sont révélées (et seulement là).
  const missions =
    db && profile
      ? await db.mission.findMany({
          where: {
            confirmedSitterId: profile.id,
            careRequest: { status: { in: ["UNLOCKED", "CONFIRMED", "COMPLETED"] } },
          },
          orderBy: { careRequest: { startDate: "asc" } },
          include: {
            review: true,
            careRequest: {
              include: {
                owner: { select: { firstName: true, lastName: true, email: true } },
                applications: {
                  where: { sitterProfileId: profile.id },
                  select: { priceCents: true },
                },
              },
            },
          },
          take: 20,
        })
      : [];

  // Demandes ouvertes, dans les délais, compatibles service×espèce, à portée.
  let demandes: Array<{
    id: string;
    service: string;
    species: string;
    startDate: Date;
    endDate: Date;
    communeName: string | null;
    animalCount: number;
    constraints: string[];
    distanceKm: number;
    dejaCandidat: boolean;
  }> = [];

  if (db && profile?.lat != null && profile.lng != null) {
    const pairs = profile.services.map((s) => ({
      service: s.service,
      species: s.species,
    }));
    if (pairs.length) {
      const rows = await db.careRequest.findMany({
        where: {
          status: "OPEN",
          responseDeadline: { gt: new Date() },
          OR: pairs,
          lat: { not: null },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      const applied = new Set(profile.applications.map((a) => a.careRequestId));
      demandes = rows
        .map((r) => {
          const d = distanceKm(profile.lat!, profile.lng!, r.lat!, r.lng!);
          return d <= profile.radiusKm + r.radiusKm
            ? {
                id: r.id,
                service: r.service,
                species: r.species,
                startDate: r.startDate,
                endDate: r.endDate,
                communeName: r.communeName,
                animalCount: r.animalCount,
                constraints: (r.constraints as string[]) ?? [],
                distanceKm: Math.round(d * 10) / 10,
                dejaCandidat: applied.has(r.id),
              }
            : null;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <p className="kicker">Espace pet sitter</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
        Demandes près de chez vous
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        Candidater, c&apos;est accepter fermement la mission à votre tarif. Le
        propriétaire choisit ensuite — et vous êtes payé en direct, à 100 %.
      </p>

      {ok && (
        <p className="mt-4 rounded-[12px] border border-forest-border bg-forest-tint px-4 py-3 text-sm font-semibold text-forest-text">
          {OKS[ok] ?? "C'est fait."}
        </p>
      )}
      {erreur && (
        <p className="mt-4 rounded-[12px] border border-primary-border bg-primary-tint px-4 py-3 text-sm font-semibold text-primary-deep">
          {detail || ERREURS[erreur] || "Une erreur est survenue."}
        </p>
      )}

      {/* Missions confirmées — coordonnées du propriétaire révélées post-paiement */}
      {missions.length > 0 && (
        <div className="mt-6 space-y-4">
          <p className="kicker">
            Mission{missions.length > 1 ? "s" : ""} confirmée
            {missions.length > 1 ? "s" : ""}
          </p>
          {missions.map((m) => {
            const r = m.careRequest;
            const tarif = r.applications[0]?.priceCents;
            const now = new Date();
            const peutDeclarer =
              ["UNLOCKED", "CONFIRMED"].includes(r.status) && r.endDate <= now;
            // Annulation post-confirmation possible seulement sur une garde
            // confirmée ENCORE à venir (endDate future) — jamais une garde en
            // cours ou terminée.
            const peutAnnuler =
              ["UNLOCKED", "CONFIRMED"].includes(r.status) && r.endDate > now;
            return (
              <div
                key={m.id}
                className="rounded-[20px] border border-forest-border bg-forest-tint p-6"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-lg font-bold text-ink">
                    {serviceLabel(r.service)} · {speciesLabel(r.species)}
                    {r.animalCount > 1 ? ` ×${r.animalCount}` : ""}
                  </h2>
                  <span className="rounded-full border border-forest-border bg-surface px-3 py-1 text-xs font-bold text-forest-text">
                    {r.status === "COMPLETED"
                      ? "✓ Garde terminée"
                      : "✓ Le propriétaire vous a choisi"}
                  </span>
                </div>
                <p className="mt-1 font-mono text-sm text-body">
                  {dateFr(r.startDate)} → {dateFr(r.endDate)} ·{" "}
                  {r.communeName ?? r.communeCode}
                </p>
                <div className="mt-4 rounded-[14px] border border-forest-border bg-surface p-4">
                  <p className="font-semibold text-ink">
                    {[r.owner.firstName, r.owner.lastName].filter(Boolean).join(" ") ||
                      "Propriétaire"}
                  </p>
                  <p className="mt-0.5 text-sm text-body">
                    E-mail :{" "}
                    <a
                      href={`mailto:${r.owner.email}`}
                      className="font-mono font-bold text-forest-text underline underline-offset-2"
                    >
                      {r.owner.email}
                    </a>
                  </p>
                </div>
                <p className="mt-3 text-sm text-body">
                  {tarif != null && (
                    <>
                      Votre tarif accepté :{" "}
                      <strong className="font-mono">
                        {(tarif / 100).toLocaleString("fr-FR", {
                          minimumFractionDigits: tarif % 100 === 0 ? 0 : 2,
                        })}{" "}
                        €
                      </strong>{" "}
                      — payé en direct par le propriétaire, 100 % pour vous.{" "}
                    </>
                  )}
                  Proposez une rencontre préalable gratuite avant la garde.
                </p>
                <Link
                  href={`/compte/messages/${r.id}`}
                  className="mt-3 inline-block text-sm font-semibold text-forest-text underline-offset-2 hover:underline"
                >
                  Ouvrir la messagerie →
                </Link>

                {/* Déclarer la garde terminée — après la date de fin */}
                {peutDeclarer && (
                  <form action={declarerGardeTermineeSitter} className="mt-4">
                    <input type="hidden" name="requestId" value={r.id} />
                    <button className="rounded-[12px] border border-forest-border bg-surface px-4 py-2 text-sm font-bold text-forest-text hover:bg-forest-tint">
                      Déclarer la garde terminée
                    </button>
                  </form>
                )}

                {/* Annuler cette garde (post-confirmation) — honnête, sans
                    culpabilisation : on explique clairement ce que ça déclenche. */}
                {peutAnnuler && (
                  <details className="mt-4 rounded-[14px] border border-line bg-surface p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-muted underline-offset-2 hover:text-primary hover:underline">
                      Je dois annuler cette garde
                    </summary>
                    <div className="mt-3 space-y-3">
                      <p className="text-sm text-body">
                        Un imprévu arrive. En annulant, la demande repasse en
                        recherche : le propriétaire pourra choisir un autre
                        candidat si d&apos;autres pet sitters s&apos;étaient
                        proposés, ou être remboursé de la mise en relation. S&apos;il
                        n&apos;y a aucun autre candidat, le remboursement est
                        déclenché tout de suite.
                      </p>
                      <p className="text-xs text-muted">
                        À faire seulement si vous ne pouvez vraiment pas assurer la
                        garde. Prévenir le propriétaire via la messagerie reste la
                        bonne pratique.
                      </p>
                      <form action={annulerGardeSitter}>
                        <input type="hidden" name="requestId" value={r.id} />
                        <button className="rounded-[12px] border border-line px-4 py-2 text-sm font-bold text-body hover:border-primary hover:text-primary">
                          Confirmer l&apos;annulation de cette garde
                        </button>
                      </form>
                    </div>
                  </details>
                )}

                {/* Avis reçu — signalement (jamais de suppression automatique) */}
                {m.review && (
                  <div className="mt-4 rounded-[14px] border border-forest-border bg-surface p-4">
                    <p className="text-sm font-semibold text-ink">
                      Avis reçu :{" "}
                      <span aria-hidden>{"★".repeat(m.review.rating)}</span>
                      <span className="sr-only">
                        note {m.review.rating} sur 5
                      </span>
                    </p>
                    {m.review.body && (
                      <p className="mt-2 whitespace-pre-line text-sm text-body">
                        {m.review.body}
                      </p>
                    )}
                    {m.review.reportedAt ? (
                      <p className="mt-3 text-xs font-semibold text-muted">
                        ✓ Signalé — en cours de revue humaine. L&apos;avis reste
                        affiché tant qu&apos;aucune modération motivée n&apos;a
                        eu lieu.
                      </p>
                    ) : (
                      <form action={signalerAvis} className="mt-3">
                        <input type="hidden" name="reviewId" value={m.review.id} />
                        <button className="text-xs font-semibold text-muted underline-offset-2 hover:text-primary hover:underline">
                          Signaler cet avis comme douteux
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!profile?.publishedAt && (
        <div className="mt-6 rounded-[20px] border border-line bg-surface p-6">
          <p className="font-semibold text-ink">Publiez d&apos;abord votre profil</p>
          <p className="mt-1 text-sm text-muted">
            Les demandes compatibles s&apos;affichent une fois votre profil
            complété et publié.
          </p>
          <Link
            href="/compte/profil"
            className="mt-4 inline-block rounded-[14px] bg-primary px-5 py-2.5 text-sm font-bold text-surface hover:bg-primary-dark"
          >
            Compléter mon profil
          </Link>
        </div>
      )}

      {profile?.publishedAt && demandes.length === 0 && (
        <div className="mt-6 rounded-[20px] border border-dashed border-line bg-surface p-6 text-center">
          <p className="font-semibold text-ink">
            Aucune demande dans votre zone pour le moment
          </p>
          <p className="mt-1 text-sm text-muted">
            Vous serez alerté ici dès qu&apos;une demande compatible avec vos
            services apparaît autour de vous.
          </p>
        </div>
      )}

      <div className="mt-6 space-y-5">
        {demandes.map((d) => (
          <div key={d.id} className="rounded-[20px] border border-line bg-surface p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-ink">
                {serviceLabel(d.service)} · {speciesLabel(d.species)}
                {d.animalCount > 1 ? ` ×${d.animalCount}` : ""}
              </h2>
              <span className="kicker">
                {d.communeName ?? "À proximité"} ·{" "}
                <span className="font-mono">{d.distanceKm} km</span>
              </span>
            </div>
            <p className="mt-1 font-mono text-sm text-body">
              {dateFr(d.startDate)} → {dateFr(d.endDate)}
            </p>
            {d.constraints.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {d.constraints.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-line px-3 py-1 text-xs text-muted"
                  >
                    {CONSTRAINT_LABELS[c] ?? c}
                  </span>
                ))}
              </div>
            )}

            {d.dejaCandidat ? (
              <div className="mt-4 space-y-2">
                <p className="rounded-[12px] bg-forest-tint px-4 py-2.5 text-sm font-semibold text-forest-text">
                  ✓ Vous avez candidaté — le propriétaire a votre proposition.
                </p>
                <Link
                  href={`/compte/messages/${d.id}`}
                  className="inline-block text-sm font-semibold text-primary underline-offset-2 hover:underline"
                >
                  Écrire au propriétaire →
                </Link>
              </div>
            ) : (
              <form
                action={candidater}
                className="mt-4 grid gap-3 border-t border-line-2 pt-4 sm:grid-cols-[140px_1fr_auto]"
              >
                <input type="hidden" name="requestId" value={d.id} />
                <label className="flex flex-col gap-1.5">
                  <span className="kicker">Votre tarif (€)</span>
                  <input
                    name="price"
                    required
                    inputMode="decimal"
                    pattern="[0-9]+([.,][0-9]{1,2})?"
                    placeholder="25"
                    className="rounded-[12px] border border-line bg-cream px-4 py-2.5 font-mono text-ink placeholder:text-faint focus:border-primary focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="kicker">Message court (optionnel, sans coordonnées)</span>
                  <input
                    name="pitch"
                    maxLength={300}
                    placeholder="Votre approche en une phrase"
                    className="rounded-[12px] border border-line bg-cream px-4 py-2.5 text-ink placeholder:text-faint focus:border-primary focus:outline-none"
                  />
                </label>
                <button
                  type="submit"
                  className="self-end rounded-[14px] bg-primary px-5 py-2.5 text-sm font-bold text-surface hover:bg-primary-dark"
                >
                  J&apos;accepte cette garde
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
