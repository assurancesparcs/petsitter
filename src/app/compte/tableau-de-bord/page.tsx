import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { serviceLabel, speciesLabel } from "@/domains/marketplace/catalog";
import { displayName } from "@/domains/marketplace/sitters";

export const metadata: Metadata = {
  title: "Tableau de bord",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const dateFr = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

type Todo = { key: string; label: string; hint: string; href: string };

export default async function TableauDeBord() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "OWNER") redirect("/compte");

  const db = getPrisma();

  // Dégradation gracieuse sans base : la page reste honnête, sans donnée inventée.
  if (!db) {
    return (
      <Shell email={session.user.email}>
        <div className="mt-6 rounded-[20px] border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-bold text-ink">
            Service momentanément indisponible
          </h2>
          <p className="mt-1 text-sm text-muted">
            Votre tableau de bord sera de nouveau accessible dans un instant.
          </p>
        </div>
      </Shell>
    );
  }

  // TOUT est scopé au propriétaire de la session : where { ownerId: session.user.id }.
  const [demandes, animaux] = await Promise.all([
    db.careRequest.findMany({
      where: { ownerId: session.user.id },
      orderBy: { startDate: "asc" },
      include: {
        mission: {
          select: { confirmedSitterId: true, declaredDone: true, review: { select: { id: true } } },
        },
        applications: {
          select: {
            sitterProfileId: true,
            sitterProfile: {
              select: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
    }),
    db.pet.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, species: true },
    }),
  ]);

  const now = new Date();

  // Prochaine garde : la plus proche à venir, déjà confirmée (débloquée).
  const prochaine = demandes.find(
    (d) => ["UNLOCKED", "CONFIRMED"].includes(d.status) && d.endDate >= now,
  );
  const sitterProchaine = prochaine?.mission
    ? prochaine.applications.find(
        (a) => a.sitterProfileId === prochaine.mission?.confirmedSitterId,
      )
    : undefined;

  // « À faire » — dérivé de l'état réel des demandes, chaque item pointe vers
  // la page qui permet de le traiter.
  const todos: Todo[] = [];
  for (const d of demandes) {
    const ouverte = d.status === "OPEN" && d.responseDeadline > now;
    if (ouverte && d.applications.length > 0) {
      todos.push({
        key: `choisir-${d.id}`,
        label: "Choisir votre pet sitter",
        hint: `${d.applications.length} candidature${d.applications.length > 1 ? "s" : ""} reçue${d.applications.length > 1 ? "s" : ""} pour ${serviceLabel(d.service)} · ${speciesLabel(d.species)}`,
        href: "/compte/mes-demandes",
      });
    }
    if (d.status === "PAYMENT_REQUIRED") {
      todos.push({
        key: `paiement-${d.id}`,
        label: "Finaliser le paiement",
        hint: "Une confirmation de votre carte est nécessaire — aucun débit n'a eu lieu",
        href: `/demande/paiement/${d.id}`,
      });
    }
    if (["UNLOCKED", "CONFIRMED"].includes(d.status) && d.endDate <= now && !d.mission?.declaredDone) {
      todos.push({
        key: `terminer-${d.id}`,
        label: "Déclarer la garde terminée",
        hint: `Garde du ${dateFr(d.startDate)} au ${dateFr(d.endDate)}`,
        href: "/compte/mes-demandes",
      });
    }
    if (d.status === "COMPLETED" && d.mission && !d.mission.review) {
      todos.push({
        key: `avis-${d.id}`,
        label: "Laisser un avis vérifié",
        hint: `Votre garde du ${dateFr(d.endDate)} attend votre avis`,
        href: "/compte/mes-demandes",
      });
    }
  }

  return (
    <Shell email={session.user.email}>
      {/* Prochaine garde */}
      <section className="mt-8">
        <h2 className="kicker">Votre prochaine garde</h2>
        {prochaine ? (
          <div className="mt-3 rounded-[20px] border border-forest-border bg-forest-tint p-6">
            <p className="font-display text-lg font-bold text-ink">
              {serviceLabel(prochaine.service)} · {speciesLabel(prochaine.species)}
              {prochaine.animalCount > 1 ? ` ×${prochaine.animalCount}` : ""}
            </p>
            <p className="mt-1 font-mono text-sm text-body">
              {dateFr(prochaine.startDate)} → {dateFr(prochaine.endDate)} ·{" "}
              {prochaine.communeName ?? prochaine.communeCode}
            </p>
            {sitterProchaine && (
              <p className="mt-2 text-sm text-forest-text">
                Avec{" "}
                <strong>
                  {displayName(
                    sitterProchaine.sitterProfile.user.firstName,
                    sitterProchaine.sitterProfile.user.lastName,
                  )}
                </strong>
              </p>
            )}
            <Link
              href="/compte/gardes"
              className="mt-3 inline-block text-sm font-semibold text-forest-text underline-offset-2 hover:underline"
            >
              Voir mes gardes &amp; reçus →
            </Link>
          </div>
        ) : (
          <div className="mt-3 rounded-[20px] border border-dashed border-line bg-surface p-6">
            <p className="font-semibold text-ink">Aucune garde confirmée à venir</p>
            <p className="mt-1 text-sm text-muted">
              Déposez une demande : les pet sitters autour de vous candidateront
              avec leur tarif.
            </p>
            <Link
              href="/demande"
              className="mt-4 inline-flex rounded-[14px] bg-primary px-5 py-2.5 text-sm font-bold text-surface hover:bg-primary-dark"
            >
              Déposer une demande de garde →
            </Link>
          </div>
        )}
      </section>

      {/* À faire */}
      <section className="mt-10">
        <h2 className="kicker">À faire</h2>
        {todos.length > 0 ? (
          <div className="mt-3 space-y-3">
            {todos.map((t) => (
              <Link
                key={t.key}
                href={t.href}
                className="flex items-center justify-between gap-3 rounded-[16px] border border-primary-border bg-primary-tint px-5 py-4 transition-colors hover:border-primary"
              >
                <span>
                  <span className="block font-semibold text-primary-deep">{t.label}</span>
                  <span className="mt-0.5 block text-sm text-body">{t.hint}</span>
                </span>
                <span aria-hidden className="text-primary-deep">
                  →
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-[16px] border border-line bg-surface-2 px-5 py-4 text-sm text-muted">
            Rien ne requiert votre attention pour l&apos;instant. Tout est à jour.
          </p>
        )}
      </section>

      {/* Mes animaux */}
      <section className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="kicker">Mes animaux</h2>
          <Link
            href="/compte/animaux"
            className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
          >
            Gérer →
          </Link>
        </div>
        {animaux.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {animaux.map((p) => (
              <span
                key={p.id}
                className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink"
              >
                {p.name}{" "}
                <span className="font-normal text-muted">· {speciesLabel(p.species)}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-[16px] border border-dashed border-line bg-surface px-5 py-4 text-sm text-muted">
            Vous n&apos;avez pas encore enregistré d&apos;animal.{" "}
            <Link href="/compte/animaux" className="font-semibold text-primary hover:text-primary-dark">
              Ajouter un animal
            </Link>
          </p>
        )}
      </section>

      {/* Rappel 0 € au dépôt */}
      <section className="mt-10 rounded-[20px] bg-forest p-6">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-on-forest">
          Rappel
        </p>
        <p className="mt-2 text-sm leading-relaxed text-surface">
          Déposer une demande coûte{" "}
          <strong className="font-mono">0 €</strong>. Vous n&apos;êtes débité que
          lorsque vous choisissez votre pet sitter — et uniquement pour la mise en
          relation. Le tarif de garde revient à 100&nbsp;% au pet sitter.
        </p>
      </section>
    </Shell>
  );
}

function Shell({
  email,
  children,
}: {
  email: string | null | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <Link href="/compte" className="text-sm font-semibold text-primary hover:text-primary-dark">
        ← Mon compte
      </Link>
      <p className="kicker mt-4">Espace propriétaire</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
        Tableau de bord
      </h1>
      <p className="mt-2 break-all text-sm text-muted">{email}</p>
      {children}
    </div>
  );
}
