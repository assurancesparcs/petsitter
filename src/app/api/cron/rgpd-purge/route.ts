import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getPrisma } from "@/lib/prisma";
import { runRgpdPurge } from "@/domains/rgpd/purge";

/**
 * Cron RGPD — purge quotidienne (limitation de la conservation, art. 5 RGPD).
 *
 * Déclenché par Vercel Cron (voir vercel.json → « /api/cron/rgpd-purge »), qui
 * émet une requête GET portant `Authorization: Bearer ${CRON_SECRET}` lorsque
 * CRON_SECRET est défini. On revalide ce jeton en temps constant : sans
 * CRON_SECRET configuré, ou si l'en-tête ne correspond pas → 401. Le secret
 * n'est jamais journalisé ; la réponse ne contient QUE des compteurs.
 *
 * Sans base (build / preview sans DATABASE_URL) → 200 { skipped }, no-op propre.
 *
 * Variable d'environnement à définir (Vercel → Settings → Environment
 * Variables) : CRON_SECRET.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Comparaison à temps constant de deux chaînes (évite un oracle temporel). */
function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  // Secret absent OU en-tête non conforme → refus, sans jamais logguer le secret.
  if (!secret || !auth || !timingSafeEqualStr(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const db = getPrisma();
  if (!db) {
    // Pas de base configurée : no-op propre (build / preview).
    return NextResponse.json({ skipped: "no database" }, { status: 200 });
  }

  try {
    const summary = await runRgpdPurge(db);
    // Isolation par étape : toutes les étapes ont tourné. Si l'une a échoué, on
    // renvoie 500 (avec les compteurs + les noms d'étapes en échec) pour que le
    // tableau de bord Vercel le signale, sans jamais divulguer de donnée.
    const status = summary.errors.length > 0 ? 500 : 200;
    return NextResponse.json({ ok: summary.errors.length === 0, ...summary }, { status });
  } catch (err) {
    // Aucune fuite d'interne ni de donnée personnelle : nom de l'erreur seul.
    console.error("[cron/rgpd-purge] échec :", (err as Error).name);
    return NextResponse.json({ error: "Purge différée." }, { status: 500 });
  }
}
