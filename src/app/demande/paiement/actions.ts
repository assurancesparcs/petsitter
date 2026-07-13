"use server";

import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

/**
 * Recueil rétractation (L221-18 / L221-28 C. conso) — horodaté CÔTÉ SERVEUR,
 * appelé AVANT la confirmation Stripe : la case cochée côté client ne vaut
 * rien tant que ce double horodatage n'est pas en base. Sans lui, le choix
 * d'un pet sitter (donc le débit) est refusé.
 * On conserve le PREMIER horodatage (append-only : l'AuditLog trace l'acte).
 */
export async function demanderExecutionImmediate(
  requestId: string,
): Promise<{ ok: boolean; erreur?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, erreur: "Session expirée — reconnectez-vous." };
  }
  const db = getPrisma();
  if (!db) return { ok: false, erreur: "Service momentanément indisponible." };

  // Borné au propriétaire de la session : jamais le Payment d'un autre compte.
  const payment = await db.payment.findFirst({
    where: { careRequestId: requestId, careRequest: { ownerId: session.user.id } },
    select: { id: true, immediateExecutionRequestedAt: true, withdrawalWaiverAt: true },
  });
  if (!payment) return { ok: false, erreur: "Demande introuvable." };

  if (!payment.immediateExecutionRequestedAt || !payment.withdrawalWaiverAt) {
    const now = new Date();
    await db.payment.update({
      where: { id: payment.id },
      data: {
        immediateExecutionRequestedAt: payment.immediateExecutionRequestedAt ?? now,
        withdrawalWaiverAt: payment.withdrawalWaiverAt ?? now,
      },
    });
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "withdrawal_waiver_recorded",
        payload: { careRequestId: requestId, paymentId: payment.id },
      },
    });
  }
  return { ok: true };
}
