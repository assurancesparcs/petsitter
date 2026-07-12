"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { findByPostalCode } from "@/domains/geo/communes";
import { SERVICES, SPECIES } from "@/domains/marketplace/catalog";
import { CONSTRAINT_KEYS } from "@/domains/marketplace/constraints";
import type { ServiceType, Species } from "@prisma/client";

// Fenêtre de réponse par défaut : 72 h (paramètre — PLAN §7, migrera en base).
const RESPONSE_WINDOW_H = 72;

export async function deposerDemande(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "OWNER") redirect("/compte");
  const db = getPrisma();
  if (!db) redirect("/demande?erreur=indisponible");

  const service = String(formData.get("service") ?? "");
  const species = String(formData.get("species") ?? "");
  if (
    !SERVICES.some((s) => s.key === service) ||
    !SPECIES.some((s) => s.key === species)
  ) {
    redirect("/demande?erreur=champs");
  }

  // Dates : début >= aujourd'hui, fin >= début. Le Pass est DÉDUIT des dates
  // (>= 2 nuits => Séjour), jamais choisi — anti-arbitrage (DECISIONS n°9).
  const start = new Date(String(formData.get("startDate") ?? ""));
  const end = new Date(String(formData.get("endDate") ?? formData.get("startDate") ?? ""));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start < today || end < start) {
    redirect("/demande?erreur=dates");
  }

  const cp = String(formData.get("cp") ?? "").trim();
  const commune = /^\d{5}$/.test(cp) ? findByPostalCode(cp)[0] : undefined;
  if (!commune) redirect("/demande?erreur=cp");
  const radiusKm = Math.min(
    Math.max(parseInt(String(formData.get("rayon") ?? "15"), 10) || 15, 1),
    50,
  );
  const animalCount = Math.min(
    Math.max(parseInt(String(formData.get("animalCount") ?? "1"), 10) || 1, 1),
    10,
  );

  // Puces pré-définies uniquement — on ne stocke que les clés connues.
  const constraints = CONSTRAINT_KEYS.filter(
    (c) => formData.get(`c_${c.key}`) === "on",
  ).map((c) => c.key);

  const deadline = new Date(Date.now() + RESPONSE_WINDOW_H * 3600 * 1000);

  const request = await db.careRequest.create({
    data: {
      ownerId: session.user.id,
      service: service as ServiceType,
      species: species as Species,
      startDate: start,
      endDate: end,
      communeCode: commune.code,
      communeName: commune.nom,
      lat: commune.lat,
      lng: commune.lng,
      radiusKm,
      animalCount,
      constraints,
      responseDeadline: deadline,
      events: { create: { type: "created", payload: { constraints } } },
    },
  });

  redirect(`/compte/mes-demandes?ok=creee&id=${request.id}`);
}

export async function annulerDemande(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  const db = getPrisma();
  if (!db) redirect("/compte/mes-demandes");

  const id = String(formData.get("id") ?? "");
  // Bornée au propriétaire de la session ET aux demandes encore ouvertes.
  const updated = await db.careRequest.updateMany({
    where: { id, ownerId: session.user.id, status: "OPEN" },
    data: { status: "CANCELLED_BY_OWNER" },
  });
  if (updated.count === 1) {
    await db.requestEvent.create({
      data: { careRequestId: id, type: "cancelled_by_owner" },
    });
  }
  redirect("/compte/mes-demandes?ok=annulee");
}
