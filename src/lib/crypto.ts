import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "node:crypto";

/**
 * Chiffrement applicatif authentifié (AES-256-GCM) pour les données à risque
 * stockées au repos : adresse exacte du domicile + dates d'absence (risque
 * cambriolage), PII DAC7. À utiliser SYSTÉMATIQUEMENT en écriture/lecture de
 * ces champs dès qu'ils sont alimentés (P2/P3).
 *
 * La clé vient de DATA_ENCRYPTION_KEY (32 octets en base64 ou hex, ou toute
 * chaîne — dérivée par SHA-256). JAMAIS commitée : Vercel → Environment
 * Variables. Un champ dont le nom finit par « Encrypted » NE DOIT recevoir
 * QUE la sortie de encrypt().
 *
 * Format : v1:<iv b64>:<tag b64>:<ciphertext b64>.
 */
function key(): Buffer {
  const raw = process.env.DATA_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "DATA_ENCRYPTION_KEY manquant : impossible de chiffrer une donnée sensible.",
    );
  }
  // Dérivation déterministe en 32 octets, quel que soit le format fourni.
  return createHash("sha256").update(raw).digest();
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decrypt(payload: string): string {
  const [version, ivB64, tagB64, dataB64] = payload.split(":");
  if (version !== "v1" || !ivB64 || !tagB64 || !dataB64) {
    throw new Error("Format de donnée chiffrée invalide.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
