import type { PaymentStatus } from "@prisma/client";

/**
 * Rendu d'un statut de Payment RÉEL (jamais inventé) — libellé + tonalité.
 * Reflète strictement la ligne Payment en base : empreinte (0 € débité),
 * débit capturé, remboursement constaté, etc.
 */
export type ReceiptTone = "open" | "action" | "done" | "closed";

const PAYMENT_LABEL: Record<PaymentStatus, { label: string; tone: ReceiptTone }> = {
  SETUP_PENDING: { label: "Empreinte en attente — 0 € débité", tone: "closed" },
  SETUP_COMPLETED: { label: "Empreinte enregistrée — 0 € débité", tone: "open" },
  CHARGE_PENDING: { label: "Débit en cours", tone: "action" },
  CAPTURED: { label: "Payé", tone: "done" },
  CHARGE_FAILED: { label: "Débit à refaire", tone: "action" },
  CANCELED: { label: "Annulé — jamais débité", tone: "closed" },
  REFUNDED: { label: "Remboursé", tone: "closed" },
};

export function paymentStatusView(status: PaymentStatus): {
  label: string;
  tone: ReceiptTone;
} {
  return PAYMENT_LABEL[status];
}

/**
 * Un reçu de mise en relation n'est consultable que lorsque le débit a
 * réellement eu lieu (ou a été remboursé) — jamais sur une simple empreinte.
 */
export function hasReceipt(status: PaymentStatus): boolean {
  return status === "CAPTURED" || status === "REFUNDED";
}

export const TONE_CLASS: Record<ReceiptTone, string> = {
  open: "border border-forest-border bg-forest-tint text-forest-text",
  action: "border border-primary-border bg-primary-tint text-primary-deep",
  done: "border border-forest-border bg-forest-tint text-forest-text",
  closed: "border border-line bg-surface-2 text-muted",
};
