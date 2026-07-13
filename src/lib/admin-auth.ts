/**
 * Authentification administrateur partagée.
 *
 * Une SEULE source de vérité pour la comparaison des identifiants, utilisée à
 * la fois par le middleware (qui protège les *pages* /admin) et par les server
 * actions d'administration. C'est indispensable : une server action est un
 * endpoint POST à part entière — le fait que le middleware garde la page ne
 * protège pas l'action, qui doit donc revérifier l'accès de son côté.
 *
 * Mécanisme : HTTP Basic. Une fois le navigateur authentifié pour le realm
 * « /admin », il renvoie l'en-tête `Authorization` sur toutes les requêtes de
 * ce chemin, y compris le POST de la server action. On relit cet en-tête et on
 * revalide les identifiants.
 *
 * Ce module ne doit PAS importer `next/headers` au niveau module : il est aussi
 * chargé par le middleware (runtime edge). `assertAdmin()` importe donc
 * `next/headers` dynamiquement, à l'appel, côté server action uniquement.
 */

/** Identifiants attendus, lus dans l'environnement (Vercel). */
export function adminCredentials(): { user: string; pass: string } | null {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;
  if (!user || !pass) return null;
  return { user, pass };
}

/** Comparaison à temps constant (évite un oracle temporel sur le mot de passe). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Vérifie un en-tête `Authorization: Basic …` contre les identifiants admin.
 * Renvoie `false` si les identifiants ne sont pas configurés, si l'en-tête est
 * absent, mal formé ou invalide. L'entrée est bornée avant décodage.
 */
export function verifyBasicAuth(authorization: string | null | undefined): boolean {
  const creds = adminCredentials();
  if (!creds) return false;
  if (!authorization || !authorization.startsWith("Basic ")) return false;

  const encoded = authorization.slice(6);
  if (encoded.length > 512) return false; // borne anti-abus avant décodage

  let decoded: string;
  try {
    decoded = atob(encoded);
  } catch {
    return false;
  }

  const sep = decoded.indexOf(":");
  if (sep < 0) return false;
  const u = decoded.slice(0, sep);
  const p = decoded.slice(sep + 1);
  return safeEqual(u, creds.user) && safeEqual(p, creds.pass);
}

/**
 * Garde d'accès pour les server actions d'administration. Relit l'en-tête
 * `Authorization` de la requête POST courante et lève si l'accès n'est pas
 * admin. À appeler EN PREMIER dans chaque action de modération.
 */
export async function assertAdmin(): Promise<void> {
  const { headers } = await import("next/headers");
  const h = await headers();
  if (!verifyBasicAuth(h.get("authorization"))) {
    throw new Error("Accès administrateur refusé.");
  }
}
