import "server-only";
import type { PrismaClient } from "@prisma/client";

/**
 * Score de fiabilité du pet sitter — calculé UNIQUEMENT à partir de données
 * réelles (gardes déclarées terminées, avis vérifiés, annulations, délais de
 * réponse). Jamais de valeur inventée, jamais de 0 déguisé en note : une
 * métrique inconnue reste `null` et n'est PAS affichée.
 *
 * Charte de qualité : « Zéro faux avis, zéro score gonflé. Sous le seuil :
 * badge "Nouveau", assumé. » Le score n'est exposé publiquement qu'au-delà du
 * seuil (`displayEligible`). Recalcul idempotent, déclenché sur évènement
 * (avis posté, garde déclarée terminée) — sûr à rejouer à tout moment.
 */

/**
 * Seuil de gardes réalisées (déclarées terminées) à partir duquel un score
 * chiffré a un sens statistique et devient affichable. En dessous : badge
 * « Nouveau ». Constante nommée, source unique de la règle d'éligibilité.
 */
export const RELIABILITY_THRESHOLD = 3;

/** Arrondi à une décimale (ex. 4,6667 → 4,7). */
function round1(x: number): number {
  return Math.round(x * 10) / 10;
}

/** Médiane d'une liste de nombres (liste non vide requise par l'appelant). */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Recalcule et met à jour (upsert) le `ReliabilityScore` d'un pet sitter à
 * partir des données réelles en base. Ne lève jamais vers l'appelant : toute
 * erreur est journalisée et avalée localement (le geste métier — poser un avis,
 * déclarer une garde — ne doit jamais échouer à cause du recalcul du score).
 *
 * Renvoie le score recalculé, ou `null` si la base est indisponible / en erreur.
 */
export async function recomputeReliability(
  db: PrismaClient,
  sitterProfileId: string,
) {
  try {
    // Le profil doit exister : on borne memberSince sur l'ancienneté du compte.
    const profile = await db.sitterProfile.findUnique({
      where: { id: sitterProfileId },
      select: { id: true, publishedAt: true, user: { select: { createdAt: true } } },
    });
    if (!profile) return null;

    // completedCount — gardes réellement réalisées (mission déclarée terminée)
    // dont ce pet sitter est le sitter confirmé.
    const completedCount = await db.mission.count({
      where: { confirmedSitterId: sitterProfileId, declaredDone: true },
    });

    // averageRating + reviewCount — avis VÉRIFIÉS (adossés à une garde réglée),
    // hors avis masqués par une modération motivée (moderatedAt != null). La
    // moyenne reste null tant qu'aucun avis : jamais 0 comme note.
    const reviewAgg = await db.review.aggregate({
      where: { moderatedAt: null, mission: { confirmedSitterId: sitterProfileId } },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const reviewCount = reviewAgg._count._all;
    const averageRating =
      reviewCount > 0 && reviewAgg._avg.rating !== null
        ? round1(reviewAgg._avg.rating)
        : null;

    // cancellationRate — annulations par CE pet sitter après confirmation,
    // rapportées à ses missions confirmées. Une mission n'existe qu'après
    // déblocage (paiement capturé), donc « missions du sitter » = dénominateur
    // des gardes confirmées. Null si aucune mission (division indéfinie).
    const confirmedMissions = await db.mission.count({
      where: { confirmedSitterId: sitterProfileId },
    });
    const cancelledPost = await db.mission.count({
      where: {
        confirmedSitterId: sitterProfileId,
        careRequest: { status: "CANCELLED_BY_SITTER_POST_CONFIRMATION" },
      },
    });
    // Fraction BRUTE (0–1) : on n'arrondit PAS ici. Arrondir la fraction à une
    // décimale la quantifierait par pas de 10 % — une annulation réelle (ex.
    // 1/40 = 2,5 %) s'afficherait « 0 % » (score gonflé, interdit par la charte).
    // Le formatage en pourcentage entier se fait au seul niveau de l'affichage.
    const cancellationRate =
      confirmedMissions > 0 ? cancelledPost / confirmedMissions : null;

    // medianResponseH — médiane du délai entre l'ouverture de la demande
    // (CareRequest.createdAt) et la candidature du sitter (Application.createdAt),
    // en heures. Dérivé de données réelles ; null si aucune candidature.
    const applications = await db.application.findMany({
      where: { sitterProfileId },
      select: { createdAt: true, careRequest: { select: { createdAt: true } } },
    });
    const responseHours = applications
      .map(
        (a) =>
          (a.createdAt.getTime() - a.careRequest.createdAt.getTime()) / 3_600_000,
      )
      // Garde-fou : on ignore les valeurs aberrantes négatives (candidature
      // horodatée avant la demande — ne devrait pas arriver, jamais compté).
      .filter((h) => h >= 0);
    // Valeur BRUTE en heures : le formatage (heures/minutes) se fait à
    // l'affichage. Arrondir ici à 0,1 h ferait afficher « 0 h » pour une réponse
    // en quelques minutes (lu comme « cassé » plutôt que « très rapide »).
    const medianResponseH =
      responseHours.length > 0 ? median(responseHours) : null;

    // responseRate — LAISSÉ NULL EN V1 (choix assumé). On ne trace pas de
    // façon fiable le nombre de demandes « vues » (diffusées et réellement
    // consultées) par un sitter : sans ce dénominateur honnête, un taux de
    // réponse serait fabriqué. On préfère ne rien afficher plutôt qu'un chiffre
    // inventé (charte : zéro score gonflé).
    const responseRate = null;

    // Éligibilité à l'affichage : au moins RELIABILITY_THRESHOLD gardes
    // réalisées. En dessous, la fiche garde le badge « Nouveau ». L'en-tête
    // chiffré de note nécessite en plus reviewCount >= 1 (géré à l'affichage).
    const displayEligible = completedCount >= RELIABILITY_THRESHOLD;

    const memberSince = profile.publishedAt ?? profile.user.createdAt;

    const data = {
      responseRate,
      medianResponseH,
      cancellationRate,
      completedCount,
      averageRating,
      reviewCount,
      displayEligible,
    };

    const saved = await db.reliabilityScore.upsert({
      where: { sitterProfileId },
      // memberSince fixé à la création uniquement (ancienneté stable).
      create: { sitterProfileId, memberSince, ...data },
      update: data,
    });
    return saved;
  } catch (err) {
    // On journalise sans faire remonter : un échec de recalcul ne doit jamais
    // casser le geste métier appelant (best-effort).
    console.error(
      `[reliability] Échec du recalcul du score pour ${sitterProfileId}`,
      err,
    );
    return null;
  }
}
