#!/usr/bin/env node
/**
 * Applique les migrations Prisma UNIQUEMENT en production (audit supply-chain
 * §2) : un déploiement Preview ne doit jamais migrer la base de prod. Neutre
 * si DATABASE_URL est absent (le squelette build sans base).
 */
import { execSync } from "node:child_process";

const env = process.env.VERCEL_ENV; // "production" | "preview" | "development"
if (env && env !== "production") {
  console.log(`[migrate] VERCEL_ENV=${env} → migration ignorée (prod uniquement).`);
  process.exit(0);
}
if (!process.env.DATABASE_URL) {
  console.log("[migrate] DATABASE_URL absent → migration ignorée.");
  process.exit(0);
}
console.log("[migrate] prisma migrate deploy…");
execSync("prisma migrate deploy", { stdio: "inherit" });
