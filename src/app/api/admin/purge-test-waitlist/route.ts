import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/**
 * Purge ponctuelle des enregistrements de test insérés dans la waitlist par
 * les audits de sécurité (e-mails @example.com, verification-deploiement@…,
 * et l'e-mail géant de test de bornage). Protégé par ADMIN_PURGE_TOKEN
 * (Vercel → Environment Variables). À retirer une fois exécuté ; en P3 la
 * gestion se fera depuis le back-office admin.
 *
 *   curl -X POST https://<site>/api/admin/purge-test-waitlist \
 *        -H "Authorization: Bearer $ADMIN_PURGE_TOKEN"
 */
export async function POST(req: Request) {
  const token = process.env.ADMIN_PURGE_TOKEN;
  const auth = req.headers.get("authorization");
  if (!token || auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const db = getPrisma();
  if (!db) {
    return NextResponse.json({ error: "Base indisponible." }, { status: 503 });
  }

  const result = await db.sitterWaitlist.deleteMany({
    where: {
      OR: [
        { email: { contains: "@example.com" } },
        { email: { contains: "verification-deploiement@" } },
        { email: { contains: "audittest" } },
        { email: { contains: "audit+" } },
        { postalCode: { not: { equals: undefined } }, email: { contains: "aaaa" } },
      ],
    },
  });

  return NextResponse.json({ ok: true, deleted: result.count });
}
