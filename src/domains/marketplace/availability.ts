/**
 * Calendrier de disponibilités — helpers de dates PURS (aucun accès base,
 * aucun import server-only) : ils sont partagés entre le composant client
 * (grille), la server action (diff) et la fiche publique (bande à venir).
 *
 * Sémantique retenue (documentée aussi dans actions.ts) :
 *  - Par défaut un pet sitter est DISPONIBLE.
 *  - Une ligne AvailabilitySlot est une EXCEPTION. On n'écrit QUE des lignes
 *    `available = false` = jour BLOQUÉ (indisponible). L'absence de ligne pour
 *    une date = disponible par défaut. La table reste ainsi minimale.
 *
 * Toutes les dates sont manipulées comme des dates calendaires « nues »
 * (YYYY-MM-DD) via l'arithmétique UTC, pour éviter tout décalage de fuseau.
 * Le « aujourd'hui » de référence est calculé en Europe/Paris.
 */

/** Règle des 14 jours : au-delà, le calendrier est considéré « à confirmer ». */
export const STALE_AFTER_DAYS = 14;

/** Borne de sûreté : au plus 31 jours bloqués soumis pour un mois. */
export const MAX_BLOCKED_PER_MONTH = 31;

const MOIS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

const JOURS_FR_COURTS = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];
export const WEEKDAY_LABELS = JOURS_FR_COURTS;

const pad = (n: number) => String(n).padStart(2, "0");

/** Clé de mois valide → { year, month(1-12) }, sinon null (rejet strict). */
export function parseMonthKey(s: string | null | undefined): { year: number; month: number } | null {
  if (!s || !/^\d{4}-\d{2}$/.test(s)) return null;
  const year = Number(s.slice(0, 4));
  const month = Number(s.slice(5, 7));
  if (month < 1 || month > 12) return null;
  if (year < 2020 || year > 2100) return null; // fenêtre raisonnable
  return { year, month };
}

/** ISO YYYY-MM-DD pour une date calendaire. */
export function isoDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** YYYY-MM d'une clé de mois. */
export function monthKey(year: number, month: number): string {
  return `${year}-${pad(month)}`;
}

/** Nombre de jours du mois (month 1-12). */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Index du 1er du mois dans une grille commençant le LUNDI (0 = lundi). */
export function firstWeekdayMondayBased(year: number, month: number): number {
  const dow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0 = dimanche
  return (dow + 6) % 7;
}

/** Aujourd'hui en Europe/Paris, au format YYYY-MM-DD. */
export function todayISOParis(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(now);
}

/** ISO + n jours (n peut être négatif), arithmétique UTC pure. */
export function addDaysISO(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return isoDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/** Mois précédent / suivant sous forme de clé YYYY-MM. */
export function shiftMonth(year: number, month: number, delta: number): string {
  const t = new Date(Date.UTC(year, month - 1 + delta, 1));
  return monthKey(t.getUTCFullYear(), t.getUTCMonth() + 1);
}

/** Libellé « juillet 2026 ». */
export function monthLabelFr(year: number, month: number): string {
  return `${MOIS_FR[month - 1]} ${year}`;
}

/** Date d'un slot (UTC minuit) à partir d'un ISO — cohérent avec l'unicité en base. */
export function slotDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

/** ISO YYYY-MM-DD d'une Date de slot (lue en UTC). */
export function slotISO(d: Date): string {
  return isoDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/**
 * Calendrier obsolète ? (règle des 14 jours). null = jamais mis à jour = obsolète.
 * Aucune sanction : sert seulement à afficher un rappel / le label « à confirmer ».
 */
export function isCalendarStale(calendarUpdated: Date | null | undefined, now: Date = new Date()): boolean {
  if (!calendarUpdated) return true;
  const ageMs = now.getTime() - calendarUpdated.getTime();
  return ageMs > STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
}

/** Date FR courte, ex. « 13/07/2026 » — ancrée Europe/Paris (le runtime Vercel
 * est en UTC : sans fuseau explicite, un horodatage juste après minuit à Paris
 * s'afficherait la veille). */
export function dateFrShort(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}
