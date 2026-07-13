"use client";

import { useState } from "react";
import Link from "next/link";
import {
  WEEKDAY_LABELS,
  daysInMonth,
  firstWeekdayMondayBased,
  isoDate,
  monthLabelFr,
} from "@/domains/marketplace/availability";

/**
 * Grille mensuelle de disponibilités (côté client). Suit l'ensemble des dates
 * BLOQUÉES du mois visible ; poste au serveur un payload compact (le mois +
 * la liste des ISO bloqués). Les dates passées sont désactivées. La navigation
 * entre mois se fait par lien serveur (?mois=YYYY-MM) : un changement de mois
 * recharge la page — pensez à enregistrer avant de changer de mois.
 */
export function CalendrierEditor({
  year,
  month,
  initialBlocked,
  today,
  prevMonthKey,
  nextMonthKey,
  action,
}: {
  year: number;
  month: number;
  initialBlocked: string[];
  today: string; // YYYY-MM-DD (Europe/Paris)
  prevMonthKey: string;
  nextMonthKey: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [blocked, setBlocked] = useState<Set<string>>(() => new Set(initialBlocked));

  const nbDays = daysInMonth(year, month);
  const lead = firstWeekdayMondayBased(year, month);

  function toggle(iso: string) {
    setBlocked((prev) => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso);
      else next.add(iso);
      return next;
    });
  }

  // Cellules de la grille : décalage initial + jours du mois.
  const cells: Array<{ day: number; iso: string } | null> = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= nbDays; d++) cells.push({ day: d, iso: isoDate(year, month, d) });

  const blockedList = Array.from(blocked).sort();

  return (
    <form action={action} className="mt-6">
      <input type="hidden" name="mois" value={`${year}-${String(month).padStart(2, "0")}`} />
      <input type="hidden" name="blocked" value={JSON.stringify(blockedList)} />

      {/* Navigation mensuelle (rechargement serveur) */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/compte/disponibilites?mois=${prevMonthKey}`}
          className="rounded-[12px] border border-line px-4 py-2 text-sm font-semibold text-body transition-colors hover:border-primary hover:text-primary"
          aria-label="Mois précédent"
        >
          ← Mois précédent
        </Link>
        <p className="font-display text-lg font-bold capitalize text-ink" aria-live="polite">
          {monthLabelFr(year, month)}
        </p>
        <Link
          href={`/compte/disponibilites?mois=${nextMonthKey}`}
          className="rounded-[12px] border border-line px-4 py-2 text-sm font-semibold text-body transition-colors hover:border-primary hover:text-primary"
          aria-label="Mois suivant"
        >
          Mois suivant →
        </Link>
      </div>

      <p className="mt-3 text-sm text-muted">
        Vous êtes disponible par défaut. Cliquez un jour pour le marquer{" "}
        <strong>indisponible</strong> (cliquez à nouveau pour le rendre
        disponible). Les jours passés ne sont pas modifiables.
      </p>

      {/* En-têtes de jours */}
      <div className="mt-5 grid grid-cols-7 gap-1.5" role="presentation">
        {WEEKDAY_LABELS.map((j) => (
          <div key={j} className="pb-1 text-center text-xs font-semibold text-faint">
            {j}
          </div>
        ))}
      </div>

      {/* Grille */}
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`v${i}`} aria-hidden="true" />;
          const isPast = cell.iso < today;
          const isBlocked = blocked.has(cell.iso);
          if (isPast) {
            return (
              <div
                key={cell.iso}
                className="flex aspect-square items-center justify-center rounded-[12px] border border-line-2 bg-surface-2 text-sm text-faint"
                aria-label={`${cell.day} — jour passé`}
              >
                {cell.day}
              </div>
            );
          }
          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => toggle(cell.iso)}
              aria-pressed={isBlocked}
              aria-label={`${cell.day} ${monthLabelFr(year, month)} — ${
                isBlocked ? "indisponible" : "disponible"
              }`}
              className={
                "flex aspect-square flex-col items-center justify-center rounded-[12px] border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-border " +
                (isBlocked
                  ? "border-primary-border bg-primary-tint text-primary-deep hover:bg-primary-tint/70"
                  : "border-line bg-surface text-ink hover:border-primary hover:text-primary")
              }
            >
              <span>{cell.day}</span>
              <span className="mt-0.5 text-[10px] font-medium">
                {isBlocked ? "indispo." : "dispo."}
              </span>
            </button>
          );
        })}
      </div>

      {/* Légende */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-[4px] border border-line bg-surface" />
          Disponible
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-[4px] border border-primary-border bg-primary-tint" />
          Indisponible
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-[4px] border border-line-2 bg-surface-2" />
          Jour passé
        </span>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          className="rounded-[14px] bg-primary px-6 py-3 font-bold text-surface transition-colors hover:bg-primary-dark sm:px-10"
        >
          Enregistrer ce mois
        </button>
        <p className="text-sm text-muted">
          {blockedList.length === 0
            ? "Aucun jour bloqué ce mois."
            : `${blockedList.length} jour${blockedList.length > 1 ? "s" : ""} bloqué${
                blockedList.length > 1 ? "s" : ""
              } ce mois.`}
        </p>
      </div>
    </form>
  );
}
