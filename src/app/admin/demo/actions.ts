"use server";

import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin-auth";
import { ensureDemoScenario, removeDemoScenario } from "@/domains/dev/seed";

/**
 * Actions de la page de démonstration admin. `assertAdmin()` en première ligne
 * de chaque action (une server action est un POST à part entière). Elles
 * s'appuient sur le module partagé de seed (mêmes objets que les routes API).
 */

const CIBLE = "/admin/demo";
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

function done(params: string): never {
  redirect(`${CIBLE}?${params}`);
}

function cleanEmail(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  return EMAIL_RE.test(s) ? s : null;
}

/** Monte le scénario complet (sitter + demande + candidature) pour un e-mail. */
export async function creerScenario(formData: FormData): Promise<void> {
  await assertAdmin();
  const email = cleanEmail(formData.get("owner"));
  if (!email) done("erreur=email");
  const db = getPrisma();
  if (!db) done("erreur=indisponible");

  const res = await ensureDemoScenario(db, email);
  if (!res.ok) done(`erreur=scenario&owner=${encodeURIComponent(email)}`);
  done(`ok=scenario&owner=${encodeURIComponent(email)}`);
}

/** Nettoie le scénario (demandes de démo du compte + pet sitter de démo). */
export async function nettoyerScenario(formData: FormData): Promise<void> {
  await assertAdmin();
  const email = cleanEmail(formData.get("owner"));
  if (!email) done("erreur=email");
  const db = getPrisma();
  if (!db) done("erreur=indisponible");

  await removeDemoScenario(db, email);
  done("ok=nettoye");
}
