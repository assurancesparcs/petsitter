"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin-auth";
import { remove } from "@/lib/storage";

/**
 * Server actions d'administration du contrôle d'identité.
 *
 * SÉCURITÉ — chaque action commence par `assertAdmin()` (une server action est
 * un endpoint POST à part entière ; le middleware qui garde la page ne la
 * protège pas).
 *
 * RGPD — DÉCISION = SUPPRESSION : que l'identité soit validée ou refusée, les
 * fichiers (pièce + selfie) sont SUPPRIMÉS du stockage et les chemins vidés en
 * base. On ne conserve que le statut, les horodatages et l'éventuel motif de
 * refus. Toute décision est motivée et tracée dans l'AuditLog (append-only).
 */

const CIBLE = "/admin/verifications";
const MAX_MOTIF = 500;

function done(kind: "ok" | "erreur", message: string): never {
  redirect(`${CIBLE}?${kind}=${encodeURIComponent(message)}`);
}

function cleanId(v: FormDataEntryValue | null): string {
  const s = typeof v === "string" ? v.trim() : "";
  return /^[a-z0-9]{1,40}$/i.test(s) ? s : "";
}

function cleanText(v: FormDataEntryValue | null, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Charge une vérification à traiter (statut « submitted » attendu). */
async function chargerVerif(id: string) {
  const db = getPrisma();
  if (!db) done("erreur", "Base de données indisponible.");
  const verif = await db.identityVerification.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      docStoragePath: true,
      selfieStoragePath: true,
      sitterProfile: { select: { userId: true } },
    },
  });
  if (!verif) done("erreur", "Vérification introuvable.");
  return { db, verif };
}

export async function validerIdentite(formData: FormData): Promise<void> {
  await assertAdmin();

  const id = cleanId(formData.get("verifId"));
  if (!id) done("erreur", "Vérification introuvable.");
  const { db, verif } = await chargerVerif(id);
  if (verif.status !== "submitted") done("erreur", "Cette demande n'est plus à traiter.");

  // Suppression des fichiers AVANT de vider les chemins (RGPD).
  await remove(verif.docStoragePath);
  await remove(verif.selfieStoragePath);

  const now = new Date();
  await db.$transaction([
    db.identityVerification.update({
      where: { id },
      data: {
        status: "verified",
        verifiedAt: now,
        reviewedAt: now,
        rejectionReason: null,
        docStoragePath: null,
        selfieStoragePath: null,
      },
    }),
    db.auditLog.create({
      data: {
        userId: verif.sitterProfile.userId,
        action: "identity_verified",
        payload: { verifId: id },
      },
    }),
  ]);

  revalidatePath(CIBLE);
  done("ok", "Identité validée.");
}

export async function refuserIdentite(formData: FormData): Promise<void> {
  await assertAdmin();

  const id = cleanId(formData.get("verifId"));
  const motif = cleanText(formData.get("motif"), MAX_MOTIF);
  if (!id) done("erreur", "Vérification introuvable.");
  if (motif.length < 3) done("erreur", "Motif de refus obligatoire (décision motivée).");

  const { db, verif } = await chargerVerif(id);
  if (verif.status !== "submitted") done("erreur", "Cette demande n'est plus à traiter.");

  // Suppression des fichiers même en cas de refus (RGPD).
  await remove(verif.docStoragePath);
  await remove(verif.selfieStoragePath);

  const now = new Date();
  await db.$transaction([
    db.identityVerification.update({
      where: { id },
      data: {
        status: "rejected",
        rejectionReason: motif,
        reviewedAt: now,
        verifiedAt: null,
        docStoragePath: null,
        selfieStoragePath: null,
      },
    }),
    db.auditLog.create({
      data: {
        userId: verif.sitterProfile.userId,
        action: "identity_rejected",
        payload: { verifId: id, motif },
      },
    }),
  ]);

  revalidatePath(CIBLE);
  done("ok", "Identité refusée — le pet sitter pourra soumettre à nouveau.");
}
