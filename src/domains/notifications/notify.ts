import "server-only";
import type { PrismaClient } from "@prisma/client";

/**
 * Point d'entrée UNIQUE des notifications in-app (le « choke-point »). Toute
 * émission passe par ici pour que les appelants (paiement, complétion…) restent
 * propres et surtout pour que l'écriture d'une notification — un effet de bord —
 * ne puisse JAMAIS casser l'action métier qui la déclenche.
 *
 * Règle d'or : `notify` NE LÈVE JAMAIS. En cas d'échec (base indisponible,
 * course…), on logue le NOM de l'erreur seulement (jamais de PII, jamais de
 * secret) et on rend la main. Une notification ratée n'annule pas un paiement,
 * une transition d'état ni une redirection.
 *
 * Les notifications reflètent des ÉVÉNEMENTS RÉELS : on n'émet que lorsqu'un
 * vrai fait s'est produit (garde débloquée, débit refusé, garde terminée…).
 * Aucune donnée inventée.
 */

// Types métier réellement émis aujourd'hui + ceux prévus par le modèle pour des
// flux futurs (émis uniquement quand l'événement correspondant survient).
export type NotificationType =
  | "accepted"
  | "unlocked"
  | "review_request"
  | "payment_failed"
  | "reminder_j3"
  | "refund"
  | "plan_b"
  | "message";

export type NotifyInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  careRequestId?: string;
};

/** Insère une notification. Best-effort : n'échoue jamais bruyamment. */
export async function notify(db: PrismaClient, input: NotifyInput): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        careRequestId: input.careRequestId ?? null,
      },
    });
  } catch (err) {
    // Nom de l'erreur seulement — jamais le contenu (pas de PII/secret en logs).
    console.error(`[notify] écriture notification impossible (${(err as Error)?.name ?? "Error"})`);
  }
}

/** Émet plusieurs notifications, chacune isolée : une qui rate n'arrête pas les autres. */
export async function notifyMany(db: PrismaClient, inputs: NotifyInput[]): Promise<void> {
  for (const input of inputs) {
    await notify(db, input);
  }
}
