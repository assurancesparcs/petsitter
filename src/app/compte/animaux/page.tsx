import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { SPECIES, speciesLabel } from "@/domains/marketplace/catalog";
import { ajouterAnimal, modifierAnimal, supprimerAnimal } from "./actions";

export const metadata: Metadata = {
  title: "Mes animaux",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const MESSAGES_OK: Record<string, string> = {
  ajoute: "Animal ajouté à votre espace.",
  modifie: "Fiche de l'animal mise à jour.",
  supprime: "Animal retiré de votre espace.",
};

const MESSAGES_ERREUR: Record<string, string> = {
  indisponible: "Service momentanément indisponible, réessayez.",
  espece: "Choisissez une espèce (chat, chien ou NAC).",
  nom: "Indiquez le nom de votre animal.",
  annee: "Année de naissance invalide — indiquez une année entre 1990 et aujourd'hui.",
  introuvable: "Animal introuvable ou déjà retiré.",
  filtre: "Retirez tout moyen de contact du champ « à savoir » pour enregistrer.",
};

/** Puce d'espèce — chat = chien = NAC, égalité stricte de traitement visuel. */
const SPECIES_TONE: Record<string, string> = {
  CAT: "border border-primary-border bg-primary-tint text-primary-deep",
  DOG: "border border-forest-border bg-forest-tint text-forest-text",
  OTHER: "border border-line bg-surface-2 text-body",
};

export default async function MesAnimaux({
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
  const editId = one(sp.edit);

  const db = getPrisma();
  // STRICTEMENT scopé : on ne lit QUE les animaux du propriétaire de la session.
  const animaux = db
    ? await db.pet.findMany({
        where: { ownerId: session.user.id },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const currentYear = new Date().getFullYear();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <Link
        href="/compte/tableau-de-bord"
        className="text-sm font-semibold text-primary hover:text-primary-dark"
      >
        ← Retour au tableau de bord
      </Link>
      <p className="kicker mt-4">Espace propriétaire</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
        Mes animaux
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        Décrivez vos compagnons une bonne fois : leurs fiches accompagnent vos
        demandes de garde et aident le pet sitter à bien s&apos;en occuper.
      </p>

      {ok && MESSAGES_OK[ok] && (
        <p className="mt-6 rounded-[12px] border border-forest-border bg-forest-tint px-4 py-3 text-sm font-semibold text-forest-text">
          {MESSAGES_OK[ok]}
        </p>
      )}
      {erreur && (
        <p className="mt-6 rounded-[12px] border border-primary-border bg-primary-tint px-4 py-3 text-sm font-semibold text-primary-deep">
          {detail || MESSAGES_ERREUR[erreur] || "Une erreur est survenue."}
        </p>
      )}

      {!db && (
        <p className="mt-6 rounded-[12px] border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
          La gestion de vos animaux sera de nouveau accessible dans un instant.
        </p>
      )}

      {/* Liste des animaux */}
      <div className="mt-8 space-y-4">
        {db && animaux.length === 0 && (
          <div className="rounded-[20px] border border-dashed border-line bg-surface p-8 text-center">
            <p className="font-semibold text-ink">Aucun animal enregistré</p>
            <p className="mt-1 text-sm text-muted">
              Ajoutez votre premier compagnon avec le formulaire ci-dessous.
            </p>
          </div>
        )}

        {animaux.map((pet) => (
          <div key={pet.id} className="rounded-[20px] border border-line bg-surface p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-ink">{pet.name}</h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  SPECIES_TONE[pet.species] ?? SPECIES_TONE.OTHER
                }`}
              >
                {speciesLabel(pet.species)}
              </span>
            </div>
            <p className="mt-1 text-sm text-body">
              {pet.breed ? pet.breed : "Race non précisée"}
              {pet.birthYear ? ` · né(e) en ${pet.birthYear}` : ""}
            </p>
            {pet.constraints && (
              <p className="mt-2 whitespace-pre-line rounded-[12px] bg-cream px-4 py-3 text-sm text-body">
                <span className="kicker block">À savoir</span>
                {pet.constraints}
              </p>
            )}

            {/* Édition — repliée par défaut, ouverte si une erreur cible cet animal */}
            <details className="mt-4 group" open={editId === pet.id}>
              <summary className="cursor-pointer list-none text-sm font-semibold text-primary hover:text-primary-dark">
                Modifier cette fiche
              </summary>
              <form action={modifierAnimal} className="mt-4 space-y-4">
                <input type="hidden" name="petId" value={pet.id} />
                <PetFields
                  idPrefix={`edit-${pet.id}`}
                  defaults={{
                    species: pet.species,
                    name: pet.name,
                    breed: pet.breed ?? "",
                    birthYear: pet.birthYear ? String(pet.birthYear) : "",
                    constraints: pet.constraints ?? "",
                  }}
                  currentYear={currentYear}
                />
                <button className="rounded-[12px] bg-primary px-5 py-2.5 text-sm font-bold text-surface hover:bg-primary-dark">
                  Enregistrer les modifications
                </button>
              </form>
            </details>

            {/* Suppression — formulaire distinct, scope strict côté serveur */}
            <form action={supprimerAnimal} className="mt-3">
              <input type="hidden" name="petId" value={pet.id} />
              <button className="text-sm text-muted underline-offset-2 hover:text-primary hover:underline">
                Retirer cet animal
              </button>
            </form>
          </div>
        ))}
      </div>

      {/* Ajout d'un animal */}
      {db && (
        <div className="mt-8 rounded-[20px] border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-bold text-ink">
            Ajouter un animal
          </h2>
          <form action={ajouterAnimal} className="mt-4 space-y-4">
            <PetFields idPrefix="add" currentYear={currentYear} />
            <button className="rounded-[12px] bg-primary px-5 py-2.5 text-sm font-bold text-surface hover:bg-primary-dark">
              Ajouter cet animal
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/** Champs partagés entre l'ajout et la modification. */
function PetFields({
  idPrefix,
  defaults,
  currentYear,
}: {
  idPrefix: string;
  defaults?: {
    species: string;
    name: string;
    breed: string;
    birthYear: string;
    constraints: string;
  };
  currentYear: number;
}) {
  return (
    <>
      <label className="flex flex-col gap-1.5" htmlFor={`${idPrefix}-species`}>
        <span className="kicker">Espèce</span>
        <select
          id={`${idPrefix}-species`}
          name="species"
          required
          defaultValue={defaults?.species ?? ""}
          className="w-full rounded-[12px] border border-line bg-cream px-4 py-2.5 text-ink focus:border-primary focus:outline-none"
        >
          <option value="" disabled>
            Choisir une espèce…
          </option>
          {SPECIES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5" htmlFor={`${idPrefix}-name`}>
        <span className="kicker">Nom</span>
        <input
          id={`${idPrefix}-name`}
          name="name"
          type="text"
          required
          maxLength={40}
          defaultValue={defaults?.name ?? ""}
          placeholder="Ex. Milou"
          className="w-full rounded-[12px] border border-line bg-cream px-4 py-2.5 text-ink placeholder:text-faint focus:border-primary focus:outline-none"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5" htmlFor={`${idPrefix}-breed`}>
          <span className="kicker">Race (optionnel)</span>
          <input
            id={`${idPrefix}-breed`}
            name="breed"
            type="text"
            maxLength={60}
            defaultValue={defaults?.breed ?? ""}
            placeholder="Ex. Fox-terrier"
            className="w-full rounded-[12px] border border-line bg-cream px-4 py-2.5 text-ink placeholder:text-faint focus:border-primary focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5" htmlFor={`${idPrefix}-birthYear`}>
          <span className="kicker">Année de naissance (optionnel)</span>
          <input
            id={`${idPrefix}-birthYear`}
            name="birthYear"
            type="number"
            inputMode="numeric"
            min={1990}
            max={currentYear}
            defaultValue={defaults?.birthYear ?? ""}
            placeholder="Ex. 2019"
            className="w-full rounded-[12px] border border-line bg-cream px-4 py-2.5 text-ink placeholder:text-faint focus:border-primary focus:outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5" htmlFor={`${idPrefix}-constraints`}>
        <span className="kicker">À savoir (optionnel)</span>
        <textarea
          id={`${idPrefix}-constraints`}
          name="constraints"
          rows={3}
          maxLength={600}
          defaultValue={defaults?.constraints ?? ""}
          placeholder="Traitement, habitudes, caractère, allergies…"
          className="w-full rounded-[12px] border border-line bg-cream px-4 py-2.5 text-ink placeholder:text-faint focus:border-primary focus:outline-none"
        />
        <span className="text-xs text-faint">
          Décrivez les besoins de votre animal. Les coordonnées s&apos;échangent
          après la mise en relation.
        </span>
      </label>
    </>
  );
}
