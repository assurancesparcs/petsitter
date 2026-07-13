"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { checkFreeText } from "@/domains/fraud/filter";
import { SPECIES } from "@/domains/marketplace/catalog";
import type { PrismaClient, Species } from "@prisma/client";

/** Bornes de validation — champs plafonnés, année de naissance plausible. */
const NAME_MAX = 40;
const BREED_MAX = 60;
const CONSTRAINTS_MAX = 600;
const BIRTH_YEAR_MIN = 1990;
const SPECIES_KEYS = SPECIES.map((s) => s.key) as readonly string[];

async function requireOwner(): Promise<{ userId: string; db: PrismaClient }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "OWNER") redirect("/compte");
  const db = getPrisma();
  if (!db) redirect("/compte/animaux?erreur=indisponible");
  return { userId: session.user.id, db };
}

type ParsedPet = {
  species: Species;
  name: string;
  breed: string | null;
  birthYear: number | null;
  constraints: string | null;
};

/**
 * Valide les champs communs (ajout/modification). Renvoie un code d'erreur à
 * rediriger (string) ou les données propres. Le champ libre `constraints` passe
 * au filtre anti-fuite comme la bio — une fuite est journalisée (contentFilterHit).
 */
async function parsePet(
  formData: FormData,
  userId: string,
  db: PrismaClient,
): Promise<{ error: string } | { data: ParsedPet }> {
  const speciesRaw = String(formData.get("species") ?? "").trim();
  if (!SPECIES_KEYS.includes(speciesRaw)) return { error: "espece" };

  const name = String(formData.get("name") ?? "").trim().slice(0, NAME_MAX);
  if (!name) return { error: "nom" };

  const breed = String(formData.get("breed") ?? "").trim().slice(0, BREED_MAX) || null;

  const birthYearRaw = String(formData.get("birthYear") ?? "").trim();
  let birthYear: number | null = null;
  if (birthYearRaw) {
    // Entier STRICT : on rejette "20ans", "2010.5"…
    if (!/^\d{4}$/.test(birthYearRaw)) return { error: "annee" };
    const year = Number(birthYearRaw);
    const now = new Date().getFullYear();
    if (year < BIRTH_YEAR_MIN || year > now) return { error: "annee" };
    birthYear = year;
  }

  const constraintsRaw = String(formData.get("constraints") ?? "")
    .trim()
    .slice(0, CONSTRAINTS_MAX);
  let constraints: string | null = null;
  if (constraintsRaw) {
    const check = checkFreeText(constraintsRaw);
    if (!check.ok) {
      // Fuite de coordonnées : on journalise (récidive → revue humaine) comme la bio.
      await db.contentFilterHit.create({
        data: { userId, field: "pet_constraints", pattern: "regex" },
      });
      return { error: `filtre&detail=${encodeURIComponent(check.reason)}` };
    }
    constraints = constraintsRaw;
  }

  return { data: { species: speciesRaw as Species, name, breed, birthYear, constraints } };
}

/** Ajoute un animal rattaché au propriétaire de la session. */
export async function ajouterAnimal(formData: FormData) {
  const { userId, db } = await requireOwner();
  const parsed = await parsePet(formData, userId, db);
  if ("error" in parsed) redirect(`/compte/animaux?erreur=${parsed.error}`);

  await db.pet.create({
    data: { ownerId: userId, ...parsed.data },
  });

  revalidatePath("/compte/animaux");
  redirect("/compte/animaux?ok=ajoute");
}

/**
 * Modifie un animal — STRICTEMENT scopé au propriétaire : le `where` combine
 * l'id ET l'ownerId de la session (updateMany), donc l'id d'un autre
 * propriétaire ne matche jamais (count = 0 → introuvable). Jamais de confiance
 * en l'id client seul.
 */
export async function modifierAnimal(formData: FormData) {
  const { userId, db } = await requireOwner();
  const petId = String(formData.get("petId") ?? "");
  if (!petId) redirect("/compte/animaux?erreur=introuvable");

  const parsed = await parsePet(formData, userId, db);
  if ("error" in parsed) {
    redirect(`/compte/animaux?erreur=${parsed.error}&edit=${encodeURIComponent(petId)}`);
  }

  const res = await db.pet.updateMany({
    where: { id: petId, ownerId: userId },
    data: parsed.data,
  });
  if (res.count !== 1) redirect("/compte/animaux?erreur=introuvable");

  revalidatePath("/compte/animaux");
  redirect("/compte/animaux?ok=modifie");
}

/**
 * Supprime un animal — même scope strict que la modification : deleteMany avec
 * `where { id, ownerId }` ne supprime jamais l'animal d'autrui.
 */
export async function supprimerAnimal(formData: FormData) {
  const { userId, db } = await requireOwner();
  const petId = String(formData.get("petId") ?? "");
  if (!petId) redirect("/compte/animaux?erreur=introuvable");

  const res = await db.pet.deleteMany({
    where: { id: petId, ownerId: userId },
  });
  if (res.count !== 1) redirect("/compte/animaux?erreur=introuvable");

  revalidatePath("/compte/animaux");
  redirect("/compte/animaux?ok=supprime");
}
