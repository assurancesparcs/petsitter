"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isStorageConfigured, putPrivate, remove } from "@/lib/storage";

/**
 * Soumission du contrôle d'identité par le pet sitter (pièce + selfie).
 *
 * RGPD — les fichiers déposés ici sont des données à risque : ils sont stockés
 * en accès PRIVÉ (src/lib/storage.ts) et SUPPRIMÉS dès la décision de
 * l'administrateur. Ce module ne fait que les recevoir, les valider et les
 * confier au stockage.
 */

const TYPES_AUTORISES = ["image/jpeg", "image/png", "application/pdf"];
const TAILLE_MAX = 8 * 1024 * 1024; // ~8 Mo

const CIBLE = "/compte/profil/identite";

function done(kind: "ok" | "erreur", code: string): never {
  redirect(`${CIBLE}?${kind}=${encodeURIComponent(code)}`);
}

/** Valide un champ fichier obligatoire (présence, type, taille). */
function validerFichier(v: FormDataEntryValue | null): File | null {
  if (!(v instanceof File) || v.size === 0) return null;
  if (v.size > TAILLE_MAX) return null;
  if (!TYPES_AUTORISES.includes(v.type)) return null;
  return v;
}

export async function soumettreIdentite(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "SITTER") redirect("/compte");

  const db = getPrisma();
  if (!db) done("erreur", "indisponible");

  // Stockage non configuré : on refuse proprement, sans crash ni fichier perdu.
  if (!isStorageConfigured()) done("erreur", "bientot");

  const profile = await db.sitterProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  // Le profil doit exister (créé à l'enregistrement du profil) avant de pouvoir
  // rattacher une vérification d'identité.
  if (!profile) done("erreur", "profil");

  const piece = validerFichier(formData.get("piece"));
  const selfie = validerFichier(formData.get("selfie"));
  if (!piece) done("erreur", "piece");
  if (!selfie) done("erreur", "selfie");

  // Dépôt en stockage privé (chemins imprévisibles).
  const docPath = await putPrivate(`identite/${profile.id}/piece`, piece);
  const selfiePath = await putPrivate(`identite/${profile.id}/selfie`, selfie);
  if (!docPath || !selfiePath) {
    // Échec partiel du stockage : on nettoie ce qui a pu être déposé.
    await remove(docPath);
    await remove(selfiePath);
    done("erreur", "stockage");
  }

  const now = new Date();
  await db.identityVerification.upsert({
    where: { sitterProfileId: profile.id },
    update: {
      provider: "manual",
      status: "submitted",
      submittedAt: now,
      docStoragePath: docPath,
      selfieStoragePath: selfiePath,
      // Réinitialise une éventuelle décision précédente (nouvelle soumission).
      rejectionReason: null,
      reviewedAt: null,
      verifiedAt: null,
    },
    create: {
      sitterProfileId: profile.id,
      provider: "manual",
      status: "submitted",
      submittedAt: now,
      docStoragePath: docPath,
      selfieStoragePath: selfiePath,
    },
  });

  done("ok", "soumis");
}
