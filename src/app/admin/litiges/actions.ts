"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin-auth";

/**
 * Server actions d'administration des litiges (avis signalés).
 *
 * SÉCURITÉ — chaque action commence par `assertAdmin()` : une server action est
 * un endpoint POST à part entière ; le middleware qui garde la *page* /admin ne
 * la protège pas. `assertAdmin()` relit l'en-tête `Authorization: Basic` de la
 * requête POST courante et revalide les identifiants.
 *
 * DROIT DES AVIS — art. L111-7-2 / D111-16 : un avis n'est JAMAIS supprimé, et
 * jamais retiré pour son seul caractère négatif. Deux issues, toutes deux
 * MOTIVÉES (note obligatoire) et tracées dans l'AuditLog (append-only) :
 *  - `modererAvis`   : MASQUE l'avis du public en posant `moderatedAt = now`
 *                      + `moderationNote` (la requête publique `getSitterPublic`
 *                      exclut déjà `moderatedAt != null`). L'avis reste en base.
 *  - `laisserEnLigne`: le signalement est revu SANS modération → on efface
 *                      `reportedAt`. L'avis reste visible ; la décision est
 *                      journalisée.
 */

const CIBLE = "/admin/litiges";
const MAX_NOTE = 500;

/** Redirige vers la page des litiges avec un message d'issue (ne revient jamais). */
function done(kind: "ok" | "erreur", message: string): never {
  redirect(`${CIBLE}?${kind}=${encodeURIComponent(message)}`);
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
 * MASQUE un avis signalé au public sur décision MOTIVÉE : pose `moderatedAt = now`
 * + `moderationNote` (obligatoire). Ne SUPPRIME jamais l'avis (il reste en base et
 * ré-affichable) ; la requête publique exclut simplement `moderatedAt != null`.
 * Un avis n'est jamais masqué pour son seul caractère négatif : la note doit
 * exposer un motif réel (propos injurieux, hors sujet, faux, etc.).
 */
export async function modererAvis(formData: FormData): Promise<void> {
  await assertAdmin();

  const db = getPrisma();
  if (!db) done("erreur", "Base de données indisponible.");

  const reviewId = cleanId(formData.get("reviewId"));
  const note = cleanText(formData.get("note"), MAX_NOTE);
  if (!reviewId) done("erreur", "Avis introuvable.");
  if (note.length < 3)
    done("erreur", "Motif obligatoire — un avis n'est jamais masqué sans décision motivée.");

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { id: true, authorId: true, moderatedAt: true, mission: { select: { confirmedSitterId: true } } },
  });
  if (!review) done("erreur", "Avis introuvable.");
  if (review.moderatedAt) done("erreur", "Avis déjà modéré.");

  const now = new Date();
  await db.$transaction([
    // MASQUE (moderatedAt) + note motivée — l'avis n'est PAS supprimé.
    db.review.update({
      where: { id: reviewId },
      data: { moderatedAt: now, moderationNote: note },
    }),
    db.auditLog.create({
      data: {
        userId: review.authorId,
        action: "review_moderated",
        payload: { reviewId, note, sitterProfileId: review.mission.confirmedSitterId },
      },
    }),
  ]);

  revalidatePath(CIBLE);
  done("ok", "Avis masqué du public (conservé en base) — décision motivée.");
}

/**
 * Signalement revu SANS modération : l'avis RESTE en ligne (jamais retiré pour
 * son seul caractère négatif). On efface `reportedAt` (le signalement est traité)
 * et on journalise la décision motivée dans l'AuditLog.
 */
export async function laisserEnLigne(formData: FormData): Promise<void> {
  await assertAdmin();

  const db = getPrisma();
  if (!db) done("erreur", "Base de données indisponible.");

  const reviewId = cleanId(formData.get("reviewId"));
  const note = cleanText(formData.get("note"), MAX_NOTE);
  if (!reviewId) done("erreur", "Avis introuvable.");
  if (note.length < 3) done("erreur", "Note de revue obligatoire (décision motivée).");

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { id: true, authorId: true, reportedAt: true, moderatedAt: true, mission: { select: { confirmedSitterId: true } } },
  });
  if (!review) done("erreur", "Avis introuvable.");
  if (review.moderatedAt) done("erreur", "Avis déjà modéré.");
  if (!review.reportedAt) done("erreur", "Aucun signalement à traiter sur cet avis.");

  await db.$transaction([
    // On lève le signalement — l'avis reste visible du public.
    db.review.update({
      where: { id: reviewId },
      data: { reportedAt: null },
    }),
    db.auditLog.create({
      data: {
        userId: review.authorId,
        action: "review_report_dismissed",
        payload: { reviewId, note, sitterProfileId: review.mission.confirmedSitterId },
      },
    }),
  ]);

  revalidatePath(CIBLE);
  done("ok", "Signalement traité — l'avis reste en ligne.");
}
