import "server-only";
import raw from "@/data/communes.json";

/**
 * Domaine géo (PLAN.md §3.1) — recherche par commune et rayon.
 * Source : base officielle des communes (geo.api.gouv.fr), centroïdes.
 * V1 : dataset statique en mémoire + distance de Haversine. Migration possible
 * vers PostGIS/earthdistance en base sans changer cette API.
 */

export type Commune = {
  code: string; // code INSEE
  nom: string;
  codesPostaux: string[];
  lat: number;
  lng: number;
};

type Row = [string, string, string[], number, number]; // [code, nom, cps, lng, lat]

const ROWS = raw as Row[];

function toCommune(r: Row): Commune {
  return { code: r[0], nom: r[1], codesPostaux: r[2], lng: r[3], lat: r[4] };
}

// Index par code postal (un CP peut couvrir plusieurs communes).
let byPostal: Map<string, Row[]> | null = null;
function postalIndex(): Map<string, Row[]> {
  if (byPostal) return byPostal;
  const m = new Map<string, Row[]>();
  for (const r of ROWS) {
    for (const cp of r[2]) {
      const list = m.get(cp);
      if (list) list.push(r);
      else m.set(cp, [r]);
    }
  }
  byPostal = m;
  return m;
}

const R_EARTH_KM = 6371;
function toRad(d: number): number {
  return (d * Math.PI) / 180;
}

/** Distance de Haversine en kilomètres entre deux points. */
export function distanceKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_EARTH_KM * Math.asin(Math.sqrt(s));
}

/** Communes correspondant à un code postal (5 chiffres). */
export function findByPostalCode(cp: string): Commune[] {
  return (postalIndex().get(cp) ?? []).map(toCommune);
}

/** Commune par code INSEE. */
export function findByCode(code: string): Commune | null {
  const r = ROWS.find((x) => x[0] === code);
  return r ? toCommune(r) : null;
}

/**
 * Communes dans un rayon (km) autour d'un point, triées par distance.
 * Pré-filtre par bounding-box avant Haversine pour rester rapide sur 35k points.
 */
export function communesWithinRadius(
  lat: number,
  lng: number,
  radiusKm: number,
): Array<Commune & { distanceKm: number }> {
  const dLat = radiusKm / 111; // ~111 km par degré de latitude
  const dLng = radiusKm / (111 * Math.cos(toRad(lat)) || 1);
  const out: Array<Commune & { distanceKm: number }> = [];
  for (const r of ROWS) {
    if (Math.abs(r[4] - lat) > dLat || Math.abs(r[3] - lng) > dLng) continue;
    const d = distanceKm(lat, lng, r[4], r[3]);
    if (d <= radiusKm) out.push({ ...toCommune(r), distanceKm: Math.round(d * 10) / 10 });
  }
  return out.sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Point de départ d'une recherche : le centroïde de la 1ʳᵉ commune du code
 * postal (une recherche s'exprime en CP côté utilisateur).
 */
export function originFromPostalCode(
  cp: string,
): { commune: Commune; lat: number; lng: number } | null {
  const [first] = findByPostalCode(cp);
  return first ? { commune: first, lat: first.lat, lng: first.lng } : null;
}
