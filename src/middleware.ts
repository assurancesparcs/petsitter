import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Protège /admin par authentification HTTP Basic (identifiants dans les
 * variables d'environnement Vercel : ADMIN_USER / ADMIN_PASSWORD). Sur HTTPS,
 * suffisant pour un accès administrateur unique en P1. Sera remplacé par une
 * vraie authentification (Auth.js + rôles) en P2/P3.
 */
export const config = { matcher: ["/admin/:path*"] };

export function middleware(req: NextRequest) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;

  if (!user || !pass) {
    return new NextResponse(
      "Accès admin non configuré : définissez ADMIN_USER et ADMIN_PASSWORD dans Vercel.",
      { status: 503 },
    );
  }

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const decoded = atob(auth.slice(6));
    const sep = decoded.indexOf(":");
    const u = decoded.slice(0, sep);
    const p = decoded.slice(sep + 1);
    if (u === user && p === pass) return NextResponse.next();
  }

  return new NextResponse("Authentification requise.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="AlloPetsitter Admin", charset="UTF-8"' },
  });
}
