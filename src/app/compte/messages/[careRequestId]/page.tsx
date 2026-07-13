import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { serviceLabel, speciesLabel } from "@/domains/marketplace/catalog";
import { displayName } from "@/domains/marketplace/sitters";
import { chargerConversation, texteAffiche } from "@/domains/messaging/access";
import { envoyerMessage } from "../actions";

export const metadata: Metadata = {
  title: "Conversation",
  robots: { index: false },
};

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const dateFr = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
const heureFr = (d: Date) =>
  d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

const ERREURS: Record<string, string> = {
  longueur: "Votre message doit faire entre 1 et 2000 caractères.",
  trop: "Trop de messages envoyés — patientez un instant avant de réessayer.",
  indisponible: "Messagerie momentanément indisponible.",
};

export default async function Fil({
  params,
  searchParams,
}: {
  params: Promise<{ careRequestId: string }>;
  searchParams: Promise<SP>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  const { careRequestId } = await params;
  const sp = await searchParams;
  const erreur = one(sp.erreur);

  const db = getPrisma();
  if (!db) redirect("/compte/messages");

  // Contrôle d'accès STRICT côté serveur — un tiers ne voit rien.
  const conv = await chargerConversation(db, session.user.id, careRequestId);
  if (!conv) redirect("/compte/messages");

  const cr = conv.careRequest;

  // Fil complet. Le brut (body) est chargé côté serveur uniquement pour être
  // converti en version masquée avant déblocage : il ne part jamais au client.
  const rows = await db.structuredMessage.findMany({
    where: { careRequestId },
    orderBy: { createdAt: "asc" },
    select: { id: true, senderId: true, body: true, maskedBody: true, createdAt: true },
    take: 500,
  });

  // Isolation : un pet sitter ne voit QUE les messages échangés avec le
  // propriétaire (lui-même + propriétaire), jamais ceux d'un autre candidat.
  const visibles =
    conv.role === "owner"
      ? rows
      : rows.filter(
          (m) => m.senderId === conv.viewerUserId || m.senderId === cr.ownerId,
        );

  const messages = visibles.map((m) => ({
    id: m.id,
    mine: m.senderId === conv.viewerUserId,
    texte: texteAffiche(m, conv.unlocked),
    date: m.createdAt,
  }));

  const nomInterlocuteur = displayName(
    conv.interlocuteur.firstName,
    conv.interlocuteur.lastName,
  );

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col px-4 py-8 sm:py-12">
      <Link
        href="/compte/messages"
        className="text-sm text-muted underline-offset-2 hover:text-primary hover:underline"
      >
        ← Toutes mes conversations
      </Link>

      {/* En-tête : interlocuteur + service/dates */}
      <div className="mt-4 rounded-[20px] border border-line bg-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="font-display text-xl font-bold text-ink">{nomInterlocuteur}</h1>
          <span className="kicker">
            {serviceLabel(cr.service)} · {speciesLabel(cr.species)}
            {cr.animalCount > 1 ? ` ×${cr.animalCount}` : ""}
          </span>
        </div>
        <p className="mt-1 font-mono text-sm text-body">
          {dateFr(cr.startDate)} → {dateFr(cr.endDate)} ·{" "}
          {cr.communeName ?? cr.communeCode}
        </p>

        {/* Bandeau d'état — pré-paiement vs débloqué */}
        {conv.unlocked ? (
          <p className="mt-3 rounded-[12px] border border-forest-border bg-forest-tint px-4 py-2.5 text-sm font-semibold text-forest-text">
            Mise en relation débloquée — vous pouvez échanger vos coordonnées
            librement.
          </p>
        ) : (
          <p className="mt-3 rounded-[12px] border border-primary-border bg-primary-tint px-4 py-2.5 text-sm font-semibold text-primary-deep">
            Les coordonnées (téléphone, e-mail, adresse, réseaux) seront visibles
            après le paiement de la mise en relation. D&apos;ici là, elles sont
            masquées automatiquement.
          </p>
        )}
      </div>

      {erreur && (
        <p className="mt-4 rounded-[12px] border border-primary-border bg-primary-tint px-4 py-3 text-sm font-semibold text-primary-deep">
          {ERREURS[erreur] ?? "Une erreur est survenue."}
        </p>
      )}

      {/* Fil */}
      <div className="mt-4 flex-1 space-y-3">
        {messages.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
            Aucun message pour l&apos;instant — écrivez le premier ci-dessous.
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.mine ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap break-words rounded-[16px] px-4 py-2.5 text-sm ${
                  m.mine
                    ? "bg-forest text-surface"
                    : "border border-line bg-surface text-body"
                }`}
              >
                {m.texte}
              </div>
              <span className="mt-1 px-1 font-mono text-[11px] text-faint">
                {heureFr(m.date)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Saisie */}
      <form
        action={envoyerMessage}
        className="sticky bottom-0 mt-4 rounded-[20px] border border-line bg-surface p-3"
      >
        <input type="hidden" name="careRequestId" value={cr.id} />
        <textarea
          name="message"
          required
          rows={3}
          maxLength={2000}
          placeholder={
            conv.unlocked
              ? "Écrivez votre message…"
              : "Écrivez votre message (les coordonnées seront masquées avant paiement)…"
          }
          className="w-full resize-none rounded-[12px] border border-line bg-cream px-4 py-3 text-ink placeholder:text-faint focus:border-primary focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-xs text-faint">Pas de pièce jointe · 2000 caractères max.</p>
          <button
            type="submit"
            className="rounded-[14px] bg-primary px-5 py-2.5 text-sm font-bold text-surface hover:bg-primary-dark"
          >
            Envoyer
          </button>
        </div>
      </form>
    </div>
  );
}
