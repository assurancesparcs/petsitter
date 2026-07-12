"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

/** Déconnexion (invalide la session en base) puis retour à l'accueil. */
export async function seDeconnecter(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

/**
 * Choix du rôle à la première connexion : « Propriétaire d'animal » (OWNER)
 * ou « Pet sitter » (SITTER). Le rôle ne se choisit qu'UNE fois ici : si un
 * rôle est déjà posé, l'action ne fait rien (un changement passera par un
 * parcours dédié, avec les vérifications qui vont avec).
 */
export async function choisirRole(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/connexion");
  }

  const role = formData.get("role");
  if (role !== "OWNER" && role !== "SITTER") {
    // Valeur inattendue (formulaire altéré) : on réaffiche la page telle quelle.
    redirect("/compte");
  }

  const db = getPrisma();
  if (!db) {
    redirect("/compte");
  }

  await db.$transaction(async (tx) => {
    // Ne pose le rôle QUE s'il est encore vide (protection contre le double
    // envoi et contre l'écrasement d'un rôle existant).
    const maj = await tx.user.updateMany({
      where: { id: session.user.id, role: null },
      data: { role },
    });
    if (maj.count === 1 && role === "SITTER") {
      // Profil sitter vide, prêt à être complété à l'onboarding.
      await tx.sitterProfile.upsert({
        where: { userId: session.user.id },
        create: { userId: session.user.id },
        update: {},
      });
    }
  });

  revalidatePath("/compte");
  redirect("/compte");
}
