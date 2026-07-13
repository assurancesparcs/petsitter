import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyBasicAuth } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";
import { isStorageConfigured, readPrivate } from "@/lib/storage";

/**
 * Sert un fichier de vérification d'identité (pièce ou selfie) à
 * l'administrateur authentifié UNIQUEMENT.
 *
 * Sécurité :
 *  - le middleware protège déjà /admin/:path* par Basic Auth ; on revérifie ici
 *    l'en-tête `Authorization` (une route est un endpoint à part entière) ;
 *  - le chemin demandé doit correspondre à un `docStoragePath` /
 *    `selfieStoragePath` réellement présent en base (pas de lecture arbitraire
 *    du bucket) ;
 *  - le flux est marqué non-cacheable (données à risque).
 *
 * Ces fichiers étant privés, ils ne sont accessibles par AUCUNE URL publique :
 * ce flux serveur est le seul chemin de consultation, et il est réservé à
 * l'administrateur.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<Response> {
  if (!verifyBasicAuth(req.headers.get("authorization"))) {
    return new NextResponse("Authentification requise.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="AlloPetsitter Admin", charset="UTF-8"' },
    });
  }

  if (!isStorageConfigured()) {
    return new NextResponse("Stockage non configuré.", { status: 503 });
  }

  const path = req.nextUrl.searchParams.get("p") ?? "";
  if (!path || path.length > 300) {
    return new NextResponse("Requête invalide.", { status: 400 });
  }

  const db = getPrisma();
  if (!db) return new NextResponse("Base indisponible.", { status: 503 });

  // Le chemin doit être rattaché à une vérification existante (anti-lecture arbitraire).
  const known = await db.identityVerification.findFirst({
    where: { OR: [{ docStoragePath: path }, { selfieStoragePath: path }] },
    select: { id: true },
  });
  if (!known) return new NextResponse("Fichier introuvable.", { status: 404 });

  const file = await readPrivate(path);
  if (!file) return new NextResponse("Fichier introuvable.", { status: 404 });

  return new NextResponse(file.stream, {
    status: 200,
    headers: {
      "Content-Type": file.contentType || "application/octet-stream",
      "Content-Disposition": "inline",
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
