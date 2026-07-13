"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin-auth";

/**
 * Server actions d'administration (modération).
 *
 * SÉCURITÉ — chaque action commence par `assertAdmin()` : une server action est
 * un endpoint POST à part entière, le middleware qui garde la *page* /admin ne
 * la protège pas. `assertAdmin()` relit l'en-tête `Authorization: Basic` de la
 * requête et revalide les identifiants avec la même logique que le middleware.
 * Aucune suspension / réactivation / revue n'est possible sans passer par là.
 *
 * Toute décision de modération est motivée (motif / note obligatoires) et
 * tracée dans l'AuditLog (append-only), cohérent avec la procédure
 * contradictoire du plan. Le retour se fait par redirection vers la page de
 * modération avec un message (succès ou erreur de validation).
 */

const MODERATION_PATH = "/admin/moderation";
const MAX_REASON = 500;
const MAX_NOTE = 500;

/** Redirige vers la page de modération avec un message d'issue (never revient). */
function done(kind: "ok" | "erreur", message: string): never {
  redirect(`${MODERATION_PATH}?${kind}=${encodeURIComponent(message)}`);
}

/** Identifiant cuid() : lettres/chiffres, borné. Renvoie "" si invalide. */
function cleanId(v: FormDataEntryValue | null): string {
  const s = typeof v === "string" ? v.trim() : "";
  return /^[a-z0-9]{1,40}$/i.test(s) ? s : "";
}

/** Texte libre borné et détouré. */
function cleanText(v: FormDataEntryValue | null, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/**
 * Suspend un pet sitter : pose `suspendedAt = now` + `suspensionReason` (motif
 * obligatoire) et DÉPUBLIE le profil (`publishedAt = null`) pour le retirer
 * immédiatement de la recherche et des candidatures.
 */
export async function suspendreSitter(formData: FormData): Promise<void> {
  await assertAdmin();

  const db = getPrisma();
  if (!db) done("erreur", "Base de données indisponible.");

  const sitterId = cleanId(formData.get("sitterId"));
  const motif = cleanText(formData.get("motif"), MAX_REASON);
  if (!sitterId) done("erreur", "Pet sitter introuvable.");
  if (motif.length < 3) done("erreur", "Motif obligatoire (décision motivée).");

  const profile = await db.sitterProfile.findUnique({
    where: { id: sitterId },
    select: { userId: true, suspendedAt: true },
  });
  if (!profile) done("erreur", "Pet sitter introuvable.");
  if (profile.suspendedAt) done("erreur", "Profil déjà suspendu.");

  const now = new Date();
  await db.$transaction([
    db.sitterProfile.update({
      where: { id: sitterId },
      data: { suspendedAt: now, suspensionReason: motif, publishedAt: null },
    }),
    db.auditLog.create({
      data: {
        userId: profile.userId,
        action: "sitter_suspended",
        payload: { sitterId, motif },
      },
    }),
  ]);

  revalidatePath(MODERATION_PATH);
  done("ok", "Pet sitter suspendu.");
}

/**
 * Réactive un pet sitter : efface `suspendedAt` et `suspensionReason`. Ne
 * REPUBLIE pas le profil — la publication reste une action volontaire du sitter.
 */
export async function reactiverSitter(formData: FormData): Promise<void> {
  await assertAdmin();

  const db = getPrisma();
  if (!db) done("erreur", "Base de données indisponible.");

  const sitterId = cleanId(formData.get("sitterId"));
  if (!sitterId) done("erreur", "Pet sitter introuvable.");

  const profile = await db.sitterProfile.findUnique({
    where: { id: sitterId },
    select: { userId: true, suspendedAt: true },
  });
  if (!profile) done("erreur", "Pet sitter introuvable.");
  if (!profile.suspendedAt) done("erreur", "Profil déjà actif.");

  await db.$transaction([
    db.sitterProfile.update({
      where: { id: sitterId },
      data: { suspendedAt: null, suspensionReason: null },
    }),
    db.auditLog.create({
      data: {
        userId: profile.userId,
        action: "sitter_reactivated",
        payload: { sitterId },
      },
    }),
  ]);

  revalidatePath(MODERATION_PATH);
  done("ok", "Pet sitter réactivé.");
}

/**
 * Marque un signal anti-fuite comme traité : pose `reviewedAt = now` + une note
 * de revue obligatoire (revue HUMAINE motivée, jamais de sanction automatique).
 */
export async function traiterSignal(formData: FormData): Promise<void> {
  await assertAdmin();

  const db = getPrisma();
  if (!db) done("erreur", "Base de données indisponible.");

  const signalId = cleanId(formData.get("signalId"));
  const note = cleanText(formData.get("note"), MAX_NOTE);
  if (!signalId) done("erreur", "Signal introuvable.");
  if (note.length < 3) done("erreur", "Note de revue obligatoire.");

  const signal = await db.fraudSignal.findUnique({
    where: { id: signalId },
    select: { userId: true, reviewedAt: true },
  });
  if (!signal) done("erreur", "Signal introuvable.");
  if (signal.reviewedAt) done("erreur", "Signal déjà traité.");

  const now = new Date();
  await db.$transaction([
    db.fraudSignal.update({
      where: { id: signalId },
      data: { reviewedAt: now, reviewNote: note },
    }),
    db.auditLog.create({
      data: {
        userId: signal.userId,
        action: "fraud_signal_reviewed",
        payload: { signalId, note },
      },
    }),
  ]);

  revalidatePath(MODERATION_PATH);
  done("ok", "Signal marqué comme traité.");
}
