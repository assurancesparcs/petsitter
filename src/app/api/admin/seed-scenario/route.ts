import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { verifyBasicAuth } from "@/lib/admin-auth";
import { BASE_URL } from "@/lib/brand";
import { ensureDemoScenario, removeDemoScenario } from "@/domains/dev/seed";

/**
 * Monte un SCÉNARIO de démonstration AVANT PAIEMENT pour simuler le parcours
 * client en conditions réelles : pet sitter de démo + compte propriétaire (ton
 * adresse) + une demande ouverte à Caen + une candidature du pet sitter. Une
 * fois connecté comme propriétaire, tu vois « candidatures reçues » et tu vas
 * jusqu'au mur du paiement (Stripe dormant).
 *
 * Protégé par les identifiants ADMIN (HTTP Basic). Idempotent : rejouable.
 *
 *   curl -X POST   -u "ADMIN_USER:ADMIN_PASSWORD" "https://<site>/api/admin/seed-scenario?owner=TON_EMAIL"
 *   curl -X DELETE -u "ADMIN_USER:ADMIN_PASSWORD" "https://<site>/api/admin/seed-scenario?owner=TON_EMAIL"
 *
 * ⚠️ `owner` DOIT être l'adresse avec laquelle tu te connectes (celle du compte
 * Resend en mode test, sinon le lien de connexion ne t'arrive pas). Le compte
 * est (re)basculé en rôle PROPRIÉTAIRE.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Validation e-mail simple (borne + forme) — pas de dépendance, suffisant ici.
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

function authorized(req: Request): boolean {
  return verifyBasicAuth(req.headers.get("authorization"));
}

function ownerParam(req: Request): string | null {
  const raw = new URL(req.url).searchParams.get("owner")?.trim().toLowerCase() ?? "";
  return EMAIL_RE.test(raw) ? raw : null;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const owner = ownerParam(req);
  if (!owner) {
    return NextResponse.json(
      { error: "Paramètre ?owner=<e-mail valide> requis (ton adresse de connexion)." },
      { status: 400 },
    );
  }
  const db = getPrisma();
  if (!db) {
    return NextResponse.json({ error: "Base indisponible." }, { status: 503 });
  }

  const res = await ensureDemoScenario(db, owner);
  if (!res.ok) {
    return NextResponse.json({ error: `Scénario impossible (${res.reason}).` }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    ownerEmail: owner,
    careRequestId: res.careRequestId,
    connexionUrl: `${BASE_URL}/connexion`,
    mesDemandesUrl: `${BASE_URL}/compte/mes-demandes`,
    ficheSitterUrl: `${BASE_URL}/petsitter/${res.sitterProfileId}`,
    note:
      "Connecte-toi avec cette adresse (rôle propriétaire) : la demande à Caen affiche déjà une candidature du pet sitter de démo. Tu peux la choisir → tu arrives au mur du paiement (Stripe dormant). DELETE pour tout nettoyer.",
  });
}

export async function DELETE(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const owner = ownerParam(req);
  if (!owner) {
    return NextResponse.json({ error: "Paramètre ?owner=<e-mail valide> requis." }, { status: 400 });
  }
  const db = getPrisma();
  if (!db) {
    return NextResponse.json({ error: "Base indisponible." }, { status: 503 });
  }

  await removeDemoScenario(db, owner);
  return NextResponse.json({ ok: true, cleaned: true });
}
