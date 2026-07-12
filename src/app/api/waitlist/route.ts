import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { getRateLimiter, clientIp } from "@/lib/ratelimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CP_RE = /^\d{5}$/;
const MAX_EMAIL = 254; // RFC 5321
const ALLOWED_ORIGINS = [
  "https://www.allopetsitter.fr",
  "https://allopetsitter.fr",
  "https://petsitter-iota.vercel.app",
];

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
    const { success } = await rl.limit(`waitlist:${clientIp(req)}`);
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

  // 4. create protégé plutôt qu'upsert : on ne modifie jamais l'enregistrement
  //    d'un tiers (§2). Collision d'e-mail (déjà inscrit) → même réponse, pas
  //    d'énumération.
  try {
    await db.sitterWaitlist.create({ data: { email, postalCode } });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return NextResponse.json({ ok: true });
    }
    console.error("waitlist.create failed", e);
    return NextResponse.json(
      { error: "Une erreur est survenue, réessayez." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
