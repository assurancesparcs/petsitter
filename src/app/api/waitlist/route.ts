import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Instanciation paresseuse : le squelette P1 doit builder et tourner sans base.
let prisma: PrismaClient | null = null;
function getPrisma() {
  if (!process.env.DATABASE_URL) return null;
  prisma ??= new PrismaClient();
  return prisma;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CP_RE = /^\d{5}$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const postalCode =
    typeof body?.postalCode === "string" ? body.postalCode.trim() : "";

  if (!EMAIL_RE.test(email) || !CP_RE.test(postalCode)) {
    return NextResponse.json(
      { error: "E-mail ou code postal invalide." },
      { status: 400 },
    );
  }

  const db = getPrisma();
  if (!db) {
    // Base non configurée (P1 sans DATABASE_URL) — on ne perd pas l'utilisateur en silence.
    return NextResponse.json(
      { error: "Les inscriptions ouvrent très bientôt — revenez dans quelques jours." },
      { status: 503 },
    );
  }

  await db.sitterWaitlist.upsert({
    where: { email },
    update: { postalCode },
    create: { email, postalCode },
  });

  return NextResponse.json({ ok: true });
}
