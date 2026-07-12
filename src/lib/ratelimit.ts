import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Limiteur de débit partagé (audit sécurité §1). Actif uniquement si
 * UPSTASH_REDIS_REST_URL / _TOKEN sont configurés ; sinon renvoie null et
 * l'appelant applique un repli (le squelette tourne sans Upstash).
 */
let limiter: Ratelimit | null | undefined;

export function getRateLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  limiter =
    url && token
      ? new Ratelimit({
          redis: new Redis({ url, token }),
          limiter: Ratelimit.slidingWindow(5, "10 m"), // 5 requêtes / 10 min / IP
          prefix: "allopetsitter",
        })
      : null;
  return limiter;
}

/** IP client derrière le proxy Vercel. */
export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anon"
  );
}
