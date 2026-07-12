import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { SERVICES, SPECIES } from "@/domains/marketplace/catalog";
import { enregistrerProfil, publierProfil, depublierProfil } from "./actions";

export const metadata: Metadata = {
  title: "Mon profil pet sitter",
  robots: { index: false, follow: false },
};

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const ERREURS: Record<string, string> = {
  identite: "Indiquez votre prénom et votre nom (seule l'initiale du nom sera publique).",
  cp: "Code postal introuvable — vérifiez la saisie.",
  incomplet:
    "Pour publier : prénom, commune et au moins un service avec un tarif.",
  indisponible: "Service momentanément indisponible, réessayez.",
  filtre: "", // détail fourni via ?detail=
};

export default async function ProfilSitter({
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
        include: { services: true, user: { select: { firstName: true, lastName: true } } },
      })
    : null;

  const prix = (service: string, species: string) => {
    const s = profile?.services.find(
      (x) => x.service === service && x.species === species,
    );
    return s ? (s.priceCents / 100).toString().replace(".", ",") : "";
  };

  const publie = Boolean(profile?.publishedAt);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <p className="kicker">Espace pet sitter</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
        Mon profil
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        Votre nom complet reste privé : les propriétaires voient « Prénom I. »,
        votre commune et votre rayon — jamais votre adresse. Vos tarifs sont
        libres, et vous les touchez à 100 %.
      </p>

      {/* Statut de publication */}
      <div
        className={`mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[20px] border p-5 ${
          publie
            ? "border-forest-border bg-forest-tint"
            : "border-line bg-surface"
        }`}
      >
        <div>
          <p className="font-semibold text-ink">
            {publie ? "Profil publié" : "Profil non publié"}
          </p>
          <p className="text-sm text-muted">
            {publie
              ? "Visible dans la recherche. Vous pouvez le retirer à tout moment."
              : "Complétez-le puis publiez-le pour apparaître dans la recherche."}
          </p>
        </div>
        {publie ? (
          <div className="flex gap-3">
            <Link
              href={`/petsitter/${profile!.id}`}
              className="rounded-[14px] border border-forest-border px-5 py-2.5 text-sm font-bold text-forest-text hover:bg-surface"
            >
              Voir ma fiche publique
            </Link>
            <form action={depublierProfil}>
              <button className="rounded-[14px] border border-line px-5 py-2.5 text-sm font-semibold text-muted hover:text-ink">
                Dépublier
              </button>
            </form>
          </div>
        ) : (
          <form action={publierProfil}>
            <button className="rounded-[14px] bg-primary px-6 py-2.5 text-sm font-bold text-surface hover:bg-primary-dark">
              Publier mon profil
            </button>
          </form>
        )}
      </div>

      {/* Messages */}
      {ok && (
        <p className="mt-4 rounded-[12px] border border-forest-border bg-forest-tint px-4 py-3 text-sm font-semibold text-forest-text">
          {ok === "publie"
            ? "Votre profil est publié — il apparaît dans la recherche."
            : ok === "depublie"
              ? "Profil retiré de la recherche."
              : "Profil enregistré."}
        </p>
      )}
      {erreur && (
        <p className="mt-4 rounded-[12px] border border-primary-border bg-primary-tint px-4 py-3 text-sm font-semibold text-primary-deep">
          {detail || ERREURS[erreur] || "Une erreur est survenue."}
        </p>
      )}

      {/* Formulaire */}
      <form action={enregistrerProfil} className="mt-8 space-y-8">
        {/* Identité */}
        <section className="rounded-[20px] border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-bold text-ink">Identité</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="kicker">Prénom (public)</span>
              <input
                name="firstName"
                required
                maxLength={60}
                defaultValue={profile?.user.firstName ?? ""}
                className="rounded-[12px] border border-line bg-cream px-4 py-3 text-ink focus:border-primary focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="kicker">Nom (privé — seule l&apos;initiale est publique)</span>
              <input
                name="lastName"
                required
                maxLength={80}
                defaultValue={profile?.user.lastName ?? ""}
                className="rounded-[12px] border border-line bg-cream px-4 py-3 text-ink focus:border-primary focus:outline-none"
              />
            </label>
          </div>
        </section>

        {/* Zone */}
        <section className="rounded-[20px] border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-bold text-ink">
            Votre zone d&apos;intervention
          </h2>
          <p className="mt-1 text-sm text-muted">
            Commune + rayon. Votre adresse exacte ne sera jamais affichée.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="kicker">Code postal</span>
              <input
                name="cp"
                required
                inputMode="numeric"
                pattern="[0-9]{5}"
                defaultValue={profile?.communeCode ? undefined : ""}
                placeholder={profile?.communeName ? `Actuel : ${profile.communeName}` : "14400"}
                className="rounded-[12px] border border-line bg-cream px-4 py-3 font-mono text-ink placeholder:text-faint focus:border-primary focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="kicker">Rayon d&apos;intervention</span>
              <select
                name="rayon"
                defaultValue={String(profile?.radiusKm ?? 10)}
                className="rounded-[12px] border border-line bg-cream px-4 py-3 text-body focus:border-primary focus:outline-none"
              >
                {["5", "10", "15", "25", "40", "50"].map((r) => (
                  <option key={r} value={r}>
                    {r} km
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* Présentation */}
        <section className="rounded-[20px] border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-bold text-ink">Présentation</h2>
          <p className="mt-1 text-sm text-muted">
            Votre expérience, votre approche, votre cadre de vie. Pas de
            coordonnées ici : elles s&apos;échangent après la mise en relation
            (un filtre le vérifie).
          </p>
          <textarea
            name="bio"
            rows={5}
            maxLength={1200}
            defaultValue={profile?.bio ?? ""}
            className="mt-4 w-full rounded-[12px] border border-line bg-cream px-4 py-3 text-ink focus:border-primary focus:outline-none"
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="kicker">Logement (optionnel)</span>
              <input
                name="housingType"
                maxLength={60}
                defaultValue={profile?.housingType ?? ""}
                placeholder="Maison, appartement…"
                className="rounded-[12px] border border-line bg-cream px-4 py-3 text-ink placeholder:text-faint focus:border-primary focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="kicker">Vos animaux (optionnel)</span>
              <input
                name="ownAnimals"
                maxLength={200}
                defaultValue={profile?.ownAnimals ?? ""}
                placeholder="Un chat, pas de chien…"
                className="rounded-[12px] border border-line bg-cream px-4 py-3 text-ink placeholder:text-faint focus:border-primary focus:outline-none"
              />
            </label>
          </div>
          <label className="mt-4 flex items-center gap-3 text-sm text-body">
            <input
              type="checkbox"
              name="hasGarden"
              defaultChecked={profile?.hasGarden ?? false}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            Jardin ou extérieur clôturé
          </label>
        </section>

        {/* Services & tarifs */}
        <section className="rounded-[20px] border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-bold text-ink">
            Services et tarifs — fixés par vous, touchés à 100 %
          </h2>
          <p className="mt-1 text-sm text-muted">
            Renseignez un tarif pour chaque service que vous proposez ; laissez
            vide ceux que vous ne proposez pas.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="text-left">
                  <th className="kicker pb-3">Service</th>
                  {SPECIES.map((sp) => (
                    <th key={sp.key} className="kicker pb-3">
                      {sp.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SERVICES.map((s) => (
                  <tr key={s.key} className="border-t border-line-2">
                    <td className="py-3 pr-4 font-semibold text-ink">
                      {s.label}
                      <span className="block text-xs font-normal text-faint">
                        {s.key === "HOME_VISIT"
                          ? "€ / visite"
                          : s.key === "WALK"
                            ? "€ / promenade"
                            : "€ / nuit"}
                      </span>
                    </td>
                    {SPECIES.map((sp) => (
                      <td key={sp.key} className="py-3 pr-4">
                        <input
                          name={`price_${s.key}_${sp.key}`}
                          inputMode="decimal"
                          pattern="[0-9]+([.,][0-9]{1,2})?"
                          defaultValue={prix(s.key, sp.key)}
                          placeholder="—"
                          className="w-24 rounded-[12px] border border-line bg-cream px-3 py-2 font-mono text-ink placeholder:text-faint focus:border-primary focus:outline-none"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <button
          type="submit"
          className="w-full rounded-[14px] bg-primary px-6 py-3.5 font-bold text-surface hover:bg-primary-dark sm:w-auto sm:px-10"
        >
          Enregistrer mon profil
        </button>
      </form>
    </div>
  );
}
