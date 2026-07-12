import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { serviceLabel, speciesLabel } from "@/domains/marketplace/catalog";
import { displayName, priceLabel } from "@/domains/marketplace/sitters";
import { annulerDemande } from "@/app/demande/actions";

export const metadata: Metadata = {
  title: "Mes demandes de garde",
  robots: { index: false },
};

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const dateFr = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const STATUS_LABEL: Record<string, { label: string; tone: "open" | "closed" }> = {
  OPEN: { label: "En attente de candidatures", tone: "open" },
  EXPIRED: { label: "Expirée — vous n'avez jamais été débité", tone: "closed" },
  CANCELLED_BY_OWNER: { label: "Annulée par vous", tone: "closed" },
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

  const db = getPrisma();
  const demandes = db
    ? await db.careRequest.findMany({
        where: { ownerId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: {
          applications: {
            orderBy: { priceCents: "asc" },
            include: {
              sitterProfile: {
                include: { user: { select: { firstName: true, lastName: true } } },
              },
            },
          },
        },
        take: 20,
      })
    : [];

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

      {ok === "creee" && (
        <p className="mt-4 rounded-[12px] border border-forest-border bg-forest-tint px-4 py-3 text-sm font-semibold text-forest-text">
          Demande déposée — 0 € débité. Les pet sitters compatibles peuvent
          maintenant candidater ; leurs propositions apparaîtront ici.
        </p>
      )}
      {ok === "annulee" && (
        <p className="mt-4 rounded-[12px] border border-line bg-surface px-4 py-3 text-sm font-semibold text-body">
          Demande annulée.
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
          const st = STATUS_LABEL[d.status] ?? {
            label: d.status,
            tone: "closed" as const,
          };
          const ouverte = d.status === "OPEN" && d.responseDeadline > new Date();
          return (
            <div key={d.id} className="rounded-[20px] border border-line bg-surface p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-lg font-bold text-ink">
                  {serviceLabel(d.service)} · {speciesLabel(d.species)}
                  {d.animalCount > 1 ? ` ×${d.animalCount}` : ""}
                </h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    ouverte
                      ? "border border-forest-border bg-forest-tint text-forest-text"
                      : "border border-line bg-surface-2 text-muted"
                  }`}
                >
                  {ouverte ? st.label : STATUS_LABEL[d.status]?.label ?? "Clôturée"}
                </span>
              </div>
              <p className="mt-1 font-mono text-sm text-body">
                {dateFr(d.startDate)} → {dateFr(d.endDate)} ·{" "}
                {d.communeName ?? d.communeCode} ({d.radiusKm} km)
              </p>

              {/* Candidatures reçues */}
              {d.applications.length > 0 ? (
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
                      <div className="text-right">
                        <p className="font-mono font-bold text-ink">
                          {priceLabel(a.priceCents, "per_day").replace("/ jour", "")}
                        </p>
                        <p className="font-mono text-xs font-bold text-success">
                          il reçoit 100 %
                        </p>
                      </div>
                    </div>
                  ))}
                  <p className="rounded-[12px] bg-primary-tint px-4 py-3 text-sm text-primary-deep">
                    <strong>Bientôt :</strong> choisissez votre pet sitter et
                    réglez la mise en relation — c&apos;est à ce moment-là
                    seulement que le débit aura lieu. Ouverture du paiement très
                    prochainement.
                  </p>
                </div>
              ) : (
                ouverte && (
                  <p className="mt-4 border-t border-line-2 pt-4 text-sm text-muted">
                    En attente de candidatures — fenêtre ouverte jusqu&apos;au{" "}
                    {dateFr(d.responseDeadline)}. Si personne n&apos;accepte,
                    la demande expire et vous n&apos;êtes jamais débité.
                  </p>
                )
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
