import { NextResponse } from "next/server";
import { Species } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { getRateLimiter, clientIp } from "@/lib/ratelimit";

/**
 * Liste d'attente PROPRIÉTAIRES (pré-lancement) — miroir de /api/waitlist
 * (sitters) : mêmes bornes de validation, même rate-limiting, même contrôle
 * d'origine, mêmes réponses d'erreur honnêtes. Finalité unique : être prévenu
 * à l'ouverture de sa zone (RGPD : purge à 6 mois si non converti).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CP_RE = /^\d{5}$/;
const MAX_EMAIL = 254; // RFC 5321
const ALLOWED_ORIGINS = [
  "https://www.allo-pet-sitter.fr",
  "https://allo-pet-sitter.fr",
  "https://petsitter-iota.vercel.app",
];

/** Espèces admises = l'enum Prisma (CAT, DOG, OTHER = NAC). */
const VALID_SPECIES = new Set<string>(Object.values(Species));

export async function POST(req: Request) {
  // 1. Origine : n'accepter que nos propres pages (anti-abus cross-site, §6).
  const origin = req.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: "Origine non autorisée." }, { status: 403 });
  }

  // 2. Rate-limiting par IP (§1). Si Upstash n'est pas configuré, on laisse
  //    passer (le squelette reste fonctionnel) — à activer avant l'ouverture.
  const rl = getRateLimiter();
  if (rl) {
    const { success } = await rl.limit(`waitlist-proprietaire:${clientIp(req)}`);
    if (!success) {
      return NextResponse.json(
        { error: "Trop de tentatives, réessayez dans quelques minutes." },
        { status: 429 },
      );
    }
  }

  // 3. Corps + validation bornée (§3).
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const postalCode =
    typeof body?.postalCode === "string" ? body.postalCode.trim() : "";

  if (
    email.length > MAX_EMAIL ||
    !EMAIL_RE.test(email) ||
    !CP_RE.test(postalCode)
  ) {
    return NextResponse.json(
      { error: "E-mail ou code postal invalide." },
      { status: 400 },
    );
  }

  // Espèces : optionnelles, bornées, chaque valeur DOIT appartenir à l'enum.
  const rawSpecies: unknown = body?.species ?? [];
  if (!Array.isArray(rawSpecies) || rawSpecies.length > VALID_SPECIES.size) {
    return NextResponse.json({ error: "Espèces invalides." }, { status: 400 });
  }
  const species: Species[] = [];
  for (const s of rawSpecies) {
    if (typeof s !== "string" || !VALID_SPECIES.has(s)) {
      return NextResponse.json({ error: "Espèces invalides." }, { status: 400 });
    }
    if (!species.includes(s as Species)) species.push(s as Species);
  }

  const db = getPrisma();
  if (!db) {
    return NextResponse.json(
      {
        error:
          "Les inscriptions ouvrent très bientôt — revenez dans quelques jours.",
      },
      { status: 503 },
    );
  }

  // 4. Upsert par e-mail : une re-soumission met simplement la ligne à jour
  //    (code postal / espèces) — même réponse dans tous les cas, donc aucune
  //    énumération possible des e-mails déjà inscrits (§2).
  try {
    await db.ownerWaitlist.upsert({
      where: { email },
      create: { email, postalCode, species },
      update: { postalCode, species },
    });
  } catch (e) {
    console.error("waitlist-proprietaire.upsert failed", e);
    return NextResponse.json(
      { error: "Une erreur est survenue, réessayez." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
