import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminCredentials, verifyBasicAuth } from "@/lib/admin-auth";

/**
 * Protège /admin par authentification HTTP Basic (identifiants dans les
 * variables d'environnement Vercel : ADMIN_USER / ADMIN_PASSWORD). Sur HTTPS,
 * suffisant pour un accès administrateur unique en P1. Sera remplacé par une
 * vraie authentification (Auth.js + rôles) en P2/P3.
 *
 * La logique de vérification est factorisée dans `@/lib/admin-auth` et
 * réutilisée par les server actions d'administration (chacune étant un endpoint
 * POST qui doit revérifier l'accès de son côté).
 */
export const config = { matcher: ["/admin/:path*"] };

export function middleware(req: NextRequest) {
  if (!adminCredentials()) {
    return new NextResponse(
      "Accès admin non configuré : définissez ADMIN_USER et ADMIN_PASSWORD dans Vercel.",
      { status: 503 },
    );
  }

  if (verifyBasicAuth(req.headers.get("authorization"))) {
    return NextResponse.next();
  }

  return new NextResponse("Authentification requise.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="AlloPetsitter Admin", charset="UTF-8"' },
  });
}
