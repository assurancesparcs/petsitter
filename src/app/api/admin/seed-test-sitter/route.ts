import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { verifyBasicAuth } from "@/lib/admin-auth";
import { BASE_URL } from "@/lib/brand";
import { ensureDemoSitter, removeDemoSitter } from "@/domains/dev/seed";

/**
 * Crée (ou met à jour) UN pet sitter de DÉMONSTRATION à Caen (14000), publié et
 * vérifié, pour parcourir le processus client (recherche → fiche → dépôt de
 * demande). Outil interne, protégé par les identifiants ADMIN (HTTP Basic, les
 * mêmes que la console /admin). Idempotent : rejouable sans doublon.
 *
 *   POST   → crée/rafraîchit le sitter de démo
 *   DELETE → le retire proprement
 *
 *   curl -X POST   -u "ADMIN_USER:ADMIN_PASSWORD" https://<site>/api/admin/seed-test-sitter
 *   curl -X DELETE -u "ADMIN_USER:ADMIN_PASSWORD" https://<site>/api/admin/seed-test-sitter
 *
 * Aucun faux avis ni chiffre inventé : le profil s'affiche « Nouveau » (état
 * honnête). La bio indique qu'il s'agit d'un profil de démonstration.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  // Mêmes identifiants que la console /admin (HTTP Basic, comparaison à temps
  // constant). Sans identifiants configurés → refus (fail-closed).
  return verifyBasicAuth(req.headers.get("authorization"));
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const db = getPrisma();
  if (!db) {
    return NextResponse.json({ error: "Base indisponible." }, { status: 503 });
  }

  const sitter = await ensureDemoSitter(db);
  if (!sitter) {
    return NextResponse.json({ error: "Commune 14000 introuvable." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    sitterId: sitter.profileId,
    ficheUrl: `${BASE_URL}/petsitter/${sitter.profileId}`,
    rechercheUrl: `${BASE_URL}/recherche?cp=14000&service=HOME_VISIT&species=CAT`,
    note: "Pet sitter de démonstration à Caen (14000), publié + identité vérifiée. Rejouable (idempotent). DELETE pour le retirer.",
  });
}

export async function DELETE(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const db = getPrisma();
  if (!db) {
    return NextResponse.json({ error: "Base indisponible." }, { status: 503 });
  }

  const deleted = await removeDemoSitter(db);
  return NextResponse.json({ ok: true, deleted });
}
