import "server-only";
import { put, del, get } from "@vercel/blob";

/**
 * Stockage de fichiers SENSIBLES (pièce d'identité + selfie du pet sitter),
 * env-gated sur BLOB_READ_WRITE_TOKEN (Vercel Blob).
 *
 * ─── RGPD — DONNÉES À RISQUE (principe de minimisation + limitation de la
 *     conservation, art. 5 RGPD) ─────────────────────────────────────────────
 *  1. Accès PRIVÉ (`access: 'private'`) : les fichiers ne sont JAMAIS accessibles
 *     par une URL publique. Un suffixe aléatoire rend en outre le chemin
 *     imprévisible. Seul l'administrateur (déjà protégé par Basic Auth sur
 *     /admin) peut les consulter, via un flux serveur — voir la route
 *     /admin/verifications/fichier.
 *  2. CONSERVATION MINIMALE : les fichiers sont SUPPRIMÉS dès la décision de
 *     l'administrateur (validé OU refusé). On ne conserve alors que le statut et
 *     les horodatages — jamais les images. Cette suppression est appliquée dans
 *     les server actions d'administration (validerIdentite / refuserIdentite).
 *  3. Le contrôle d'identité MVP est interne. Un prestataire d'identité UE
 *     (type Ubble) prendra le relais plus tard ; ce module isole le stockage
 *     pour rendre cette bascule sans impact sur le reste du code.
 *
 * DÉGRADÉ SANS TOKEN : si BLOB_READ_WRITE_TOKEN est absent, `putPrivate` renvoie
 * null et `remove`/`readPrivate` sont neutres — le build et le site tournent
 * sans stockage (le contrôle d'identité s'affiche « bientôt disponible »).
 */

/** Le stockage sensible est-il configuré ? (présence du token Vercel Blob) */
export function isStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function token(): string {
  // Ne jamais appeler sans avoir vérifié isStorageConfigured() au préalable.
  return process.env.BLOB_READ_WRITE_TOKEN as string;
}

/**
 * Dépose un fichier en accès PRIVÉ, sous un chemin rendu imprévisible par un
 * suffixe aléatoire. Renvoie le `pathname` interne (à stocker en base), ou null
 * si le stockage n'est pas configuré.
 */
export async function putPrivate(
  keyPrefix: string,
  file: File,
): Promise<string | null> {
  if (!isStorageConfigured()) return null;
  const safePrefix = keyPrefix.replace(/[^a-z0-9/_-]/gi, "").slice(0, 120);
  const res = await put(safePrefix, file, {
    access: "private",
    addRandomSuffix: true,
    contentType: file.type || undefined,
    token: token(),
  });
  return res.pathname;
}

/**
 * Supprime définitivement un fichier privé. No-op si le stockage n'est pas
 * configuré ou si le chemin est vide. Best-effort : une suppression déjà
 * effectuée ne doit pas faire échouer la décision d'administration.
 */
export async function remove(pathname: string | null | undefined): Promise<void> {
  if (!isStorageConfigured() || !pathname) return;
  try {
    await del(pathname, { token: token() });
  } catch {
    /* déjà supprimé / introuvable → on ignore (idempotent) */
  }
}

/**
 * Lit un fichier privé (flux + type MIME) pour le servir à l'administrateur
 * authentifié. Renvoie null si le stockage n'est pas configuré ou si le fichier
 * est introuvable.
 */
export async function readPrivate(
  pathname: string,
): Promise<{ stream: ReadableStream<Uint8Array>; contentType: string } | null> {
  if (!isStorageConfigured()) return null;
  const res = await get(pathname, { access: "private", token: token() });
  if (!res || res.statusCode !== 200) return null;
  return { stream: res.stream, contentType: res.blob.contentType };
}
