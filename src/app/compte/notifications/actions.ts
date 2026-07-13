"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

/**
 * Marque TOUTES les notifications non lues de l'utilisateur connecté comme lues.
 * Strictement cadré à la session (`userId` de la session, jamais du client) :
 * aucun accès à la boîte d'un autre utilisateur (IDOR). Idempotent — relancer
 * quand tout est déjà lu ne fait rien et ne casse pas.
 */
export async function marquerToutLu() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  const db = getPrisma();
  if (!db) redirect("/compte/notifications?erreur=indisponible");

  await db.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/compte/notifications");
  redirect("/compte/notifications?ok=lu");
}

/**
 * Marque UNE notification comme lue. Verrou d'appartenance dans le `where`
 * (`id` ET `userId` de la session) : on ne peut jamais toucher la notification
 * d'autrui, même en forgeant l'id. Idempotent.
 */
export async function marquerLu(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  const db = getPrisma();
  if (!db) redirect("/compte/notifications?erreur=indisponible");

  const id = String(formData.get("id") ?? "");
  if (id) {
    await db.notification.updateMany({
      where: { id, userId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    });
  }

  revalidatePath("/compte/notifications");
  redirect("/compte/notifications");
}
