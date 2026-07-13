import type { PrismaClient } from "@prisma/client";
import { maskContacts } from "@/domains/fraud/filter";

/**
 * Contrôle d'accès + Règle 8 de la messagerie (PLAN §5-A / charte).
 *
 * Une conversation = une CareRequest, entre son propriétaire et un pet sitter
 * candidat (Application) ou confirmé (Mission). Toute la décision — qui lit,
 * qui écrit, ce qui est masqué — est prise ICI, CÔTÉ SERVEUR. Le corps brut
 * d'un message n'est jamais renvoyé au client tant que la demande n'est pas
 * débloquée : les vues lisent `texteAffiche()`, qui ne rend le brut qu'après
 * déblocage.
 */

// Débloqué = la mise en relation a été payée (ou l'est réputée dans ces états).
const STATUTS_DEBLOQUES = ["UNLOCKED", "CONFIRMED", "COMPLETED"] as const;

export function estDebloquee(status: string): boolean {
  return (STATUTS_DEBLOQUES as readonly string[]).includes(status);
}

export type ConversationContexte = {
  careRequest: {
    id: string;
    ownerId: string;
    status: string;
    service: string;
    species: string;
    startDate: Date;
    endDate: Date;
    animalCount: number;
    communeName: string | null;
    communeCode: string;
    owner: { id: string; firstName: string | null; lastName: string | null };
  };
  role: "owner" | "sitter";
  viewerUserId: string;
  sitterProfileId: string | null; // renseigné si le lecteur est le pet sitter
  estConfirme: boolean;
  unlocked: boolean;
  // Interlocuteur affiché (anonymisé pré-déblocage) selon le rôle du lecteur.
  interlocuteur: { firstName: string | null; lastName: string | null };
};

/**
 * Charge une conversation SI et seulement si `userId` y a droit :
 *  - le propriétaire de la demande, OU
 *  - un pet sitter qui a candidaté (Application) / est confirmé (Mission).
 * Sinon renvoie null (un tiers ne voit rien → 404/redirect côté page/action).
 */
export async function chargerConversation(
  db: PrismaClient,
  userId: string,
  careRequestId: string,
): Promise<ConversationContexte | null> {
  const cr = await db.careRequest.findUnique({
    where: { id: careRequestId },
    select: {
      id: true,
      ownerId: true,
      status: true,
      service: true,
      species: true,
      startDate: true,
      endDate: true,
      animalCount: true,
      communeName: true,
      communeCode: true,
      owner: { select: { id: true, firstName: true, lastName: true } },
      applications: {
        select: {
          sitterProfileId: true,
          sitterProfile: {
            select: {
              userId: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
      mission: { select: { confirmedSitterId: true, backupSitterId: true } },
    },
  });
  if (!cr) return null;

  const isOwner = cr.ownerId === userId;
  const monApplication = cr.applications.find(
    (a) => a.sitterProfile.userId === userId,
  );

  // Ni propriétaire, ni pet sitter candidat/confirmé → aucun accès.
  if (!isOwner && !monApplication) return null;

  const unlocked = estDebloquee(cr.status);

  const confirmedSitterId = cr.mission?.confirmedSitterId ?? null;
  const backupSitterId = cr.mission?.backupSitterId ?? null;
  const estConfirme =
    !!monApplication && confirmedSitterId === monApplication.sitterProfileId;
  const estBackup =
    !!monApplication && backupSitterId === monApplication.sitterProfileId;

  // Bascule pré→post déblocage (Règle 8). Une fois la mise en relation payée,
  // le fil expose le contenu BRUT (coordonnées comprises). L'accès est alors
  // STRICTEMENT limité au propriétaire et au sitter retenu (ou au remplaçant
  // Plan B, dont les coordonnées sont volontairement révélées). Un candidat
  // NON retenu perd tout accès : sans ce garde-fou, il récupérerait
  // gratuitement les coordonnées échangées entre l'owner et le sitter confirmé.
  if (unlocked && !isOwner && !estConfirme && !estBackup) return null;

  // Interlocuteur : pour le propriétaire, le pet sitter confirmé sinon le 1er
  // candidat ; pour le pet sitter, le propriétaire.
  let interlocuteur: { firstName: string | null; lastName: string | null } = {
    firstName: null,
    lastName: null,
  };
  if (isOwner) {
    const confirme = cr.mission
      ? cr.applications.find(
          (a) => a.sitterProfileId === cr.mission!.confirmedSitterId,
        )
      : undefined;
    const cible = confirme ?? cr.applications[0];
    if (cible) interlocuteur = cible.sitterProfile.user;
  } else {
    interlocuteur = { firstName: cr.owner.firstName, lastName: cr.owner.lastName };
  }

  return {
    careRequest: {
      id: cr.id,
      ownerId: cr.ownerId,
      status: cr.status,
      service: cr.service,
      species: cr.species,
      startDate: cr.startDate,
      endDate: cr.endDate,
      animalCount: cr.animalCount,
      communeName: cr.communeName,
      communeCode: cr.communeCode,
      owner: cr.owner,
    },
    role: isOwner ? "owner" : "sitter",
    viewerUserId: userId,
    sitterProfileId: isOwner ? null : monApplication!.sitterProfileId,
    estConfirme,
    unlocked,
    interlocuteur,
  };
}

/**
 * Texte à afficher pour un message, selon l'état de déblocage. AVANT déblocage
 * on ne renvoie JAMAIS le brut : la version caviardée stockée (maskedBody) est
 * utilisée, avec un caviardage de secours à la volée si elle manque (messages
 * antérieurs à la Règle 8). APRÈS déblocage, l'échange est libre.
 */
export function texteAffiche(
  m: { body: string | null; maskedBody: string | null },
  unlocked: boolean,
): string {
  if (unlocked) return m.body ?? "";
  if (m.maskedBody != null) return m.maskedBody;
  return maskContacts(m.body ?? "").masked;
}
