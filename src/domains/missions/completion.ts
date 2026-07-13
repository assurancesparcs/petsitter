import "server-only";
import type { PrismaClient, Role } from "@prisma/client";

/**
 * « Déclarer la garde terminée » — transition d'état partagée (owner ou pet
 * sitter confirmé). Source de vérité : le statut de la CareRequest, verrouillé
 * par un updateMany conditionnel (une seule transition gagne, même en
 * double-clic). La garde ne peut être déclarée qu'APRÈS sa date de fin :
 * `experienceDate` de l'avis découlera de cette même endDate (conformité
 * D111-16 : date réelle de l'expérience).
 *
 * Transition : UNLOCKED | CONFIRMED  →  COMPLETED  (+ Mission.declaredDone,
 * + RequestEvent "completed"). Idempotente : re-déclarer une garde déjà
 * terminée ne rejoue rien et ne casse pas.
 */
export type CompletionResult =
  | "done" // transition effectuée
  | "already" // déjà terminée (idempotent)
  | "trop_tot" // la date de fin n'est pas passée
  | "etat" // statut incompatible (annulée, expirée, non débloquée…)
  | "introuvable"; // mission absente ou l'utilisateur n'est pas partie

export async function declareMissionDone(
  db: PrismaClient,
  params: { userId: string; role: Role; requestId: string },
): Promise<CompletionResult> {
  const mission = await db.mission.findUnique({
    where: { careRequestId: params.requestId },
    include: {
      careRequest: { select: { id: true, ownerId: true, status: true, endDate: true } },
    },
  });
  if (!mission) return "introuvable";
  const cr = mission.careRequest;

  // Appartenance STRICTE : seul le propriétaire de la demande ou le pet sitter
  // confirmé de la mission peut déclarer la garde terminée.
  let isParty = false;
  if (params.role === "OWNER") {
    isParty = cr.ownerId === params.userId;
  } else if (params.role === "SITTER") {
    const profile = await db.sitterProfile.findUnique({
      where: { userId: params.userId },
      select: { id: true },
    });
    isParty = !!profile && profile.id === mission.confirmedSitterId;
  }
  if (!isParty) return "introuvable";

  // Idempotence : déjà terminée → on s'assure seulement que declaredDone suit.
  if (cr.status === "COMPLETED") {
    if (!mission.declaredDone) {
      await db.mission.update({
        where: { careRequestId: cr.id },
        data: { declaredDone: true },
      });
    }
    return "already";
  }

  const now = new Date();
  if (cr.endDate > now) return "trop_tot";

  // Transition ATOMIQUE (transaction interactive) : le verrou d'état → COMPLETED,
  // Mission.declaredDone=true et l'événement "completed" commitent ensemble.
  // Une seule transition gagne (même en double-soumission) ; jamais de COMPLETED
  // avec declaredDone=false, jamais d'événement manquant.
  const gagne = await db.$transaction(async (tx) => {
    const verrou = await tx.careRequest.updateMany({
      where: { id: cr.id, status: { in: ["UNLOCKED", "CONFIRMED"] }, endDate: { lte: now } },
      data: { status: "COMPLETED" },
    });
    if (verrou.count !== 1) return false;
    await tx.mission.update({
      where: { careRequestId: cr.id },
      data: { declaredDone: true },
    });
    await tx.requestEvent.create({
      data: { careRequestId: cr.id, type: "completed", payload: { by: params.role } },
    });
    return true;
  });

  if (gagne) return "done";

  // Verrou non déclenché : re-lire le statut (course éventuelle) pour distinguer
  // « déjà terminée entre-temps » d'un statut réellement incompatible.
  const fresh = await db.careRequest.findUnique({
    where: { id: cr.id },
    select: { status: true },
  });
  if (fresh?.status === "COMPLETED") {
    if (!mission.declaredDone) {
      await db.mission.update({
        where: { careRequestId: cr.id },
        data: { declaredDone: true },
      });
    }
    return "already";
  }
  return "etat";
}
