import { PrismaClient } from "@prisma/client";

/**
 * Client Prisma centralisé (singleton). Un seul point d'accès à la base pour
 * tout le code serveur — évite l'accumulation de connexions en dev (HMR) et
 * en serverless (audit sécurité §5). Renvoie null tant que DATABASE_URL n'est
 * pas configuré, pour que le squelette builde et tourne sans base.
 *
 * ⚠️ En production serverless, DATABASE_URL doit pointer sur l'URL POOLED de
 * Neon (host `-pooler`) avec `?pgbouncer=true&connection_limit=1`.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  return (globalForPrisma.prisma ??= new PrismaClient());
}
