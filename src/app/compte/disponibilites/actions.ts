"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import {
  MAX_BLOCKED_PER_MONTH,
  daysInMonth,
  isoDate,
  monthKey,
  parseMonthKey,
  slotDate,
  slotISO,
  todayISOParis,
} from "@/domains/marketplace/availability";

/**
 * Server actions du calendrier de disponibilités.
 *
 * Sémantique (voir aussi availability.ts) : par défaut le pet sitter est
 * DISPONIBLE ; on ne stocke QUE des exceptions `available = false` (jour
 * bloqué). L'absence de ligne = disponible. Le diff se limite STRICTEMENT au
 * mois soumis (jamais de wipe des autres mois) et aux dates >= aujourd'hui
 * (les dates passées sont ignorées, jamais modifiées).
 */

async function requireSitter() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "SITTER") redirect("/compte");
  const db = getPrisma();
  if (!db) redirect("/compte/disponibilites?erreur=indisponible");
  return { userId: session.user.id, db };
}

export async function enregistrerDisponibilites(formData: FormData) {
  const { userId, db } = await requireSitter();

  // 1. Mois cible — validation stricte du format YYYY-MM.
  const moisRaw = String(formData.get("mois") ?? "");
  const parsed = parseMonthKey(moisRaw);
  if (!parsed) redirect("/compte/disponibilites?erreur=mois");
  const { year, month } = parsed!;

  // 2. Le pet sitter doit avoir un profil (ownership : on n'agit QUE dessus).
  const profile = await db.sitterProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) redirect("/compte/disponibilites?erreur=profil");

  // 3. Ensemble des jours bloqués soumis (JSON : ["2026-07-14", ...]).
  //    Bornage : uniquement des ISO du mois cible, dédupliqués, plafonnés.
  const today = todayISOParis();
  const nbDays = daysInMonth(year, month);
  const desiredBlocked = new Set<string>();
  try {
    const raw = JSON.parse(String(formData.get("blocked") ?? "[]"));
    if (Array.isArray(raw)) {
      // Un mois compte au plus 31 jours : on borne aussi le NOMBRE d'entrées
      // parcourues (pas seulement l'ensemble retenu) pour ne jamais itérer un
      // tableau volumineux d'entrées invalides/dupliquées.
      const items = raw.slice(0, 200);
      for (const item of items) {
        if (typeof item !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(item)) continue;
        // Doit appartenir AU mois cible.
        if (item.slice(0, 7) !== monthKey(year, month)) continue;
        const day = Number(item.slice(8, 10));
        if (day < 1 || day > nbDays) continue;
        // Ignorer le passé : on ne bloque jamais une date déjà écoulée.
        if (item < today) continue;
        desiredBlocked.add(item);
        if (desiredBlocked.size >= MAX_BLOCKED_PER_MONTH) break;
      }
    }
  } catch {
    redirect("/compte/disponibilites?erreur=payload");
  }

  // 4. Fenêtre du mois [1er 00:00 UTC ; 1er du mois suivant 00:00 UTC[.
  const monthStart = slotDate(isoDate(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month, 1)); // 1er du mois suivant

  // Lignes existantes du profil pour CE mois uniquement (jamais les autres).
  // On ne lit QUE les exceptions « bloqué » (available:false), en symétrie avec
  // les lectures d'affichage (page + fiche publique) — jamais de ligne
  // available:true à écraser par erreur.
  const existing = await db.availabilitySlot.findMany({
    where: {
      sitterProfileId: profile!.id,
      available: false,
      date: { gte: monthStart, lt: monthEnd },
    },
    select: { id: true, date: true },
  });

  const existingISO = new Set<string>();
  const idByISO = new Map<string, string>();
  for (const row of existing) {
    const iso = slotISO(row.date);
    existingISO.add(iso);
    idByISO.set(iso, row.id);
  }

  // 5. Diff, restreint aux dates >= aujourd'hui (le passé reste intact).
  const toCreate: string[] = [];
  desiredBlocked.forEach((iso) => {
    if (!existingISO.has(iso)) toCreate.push(iso);
  });

  const toDelete: string[] = [];
  existingISO.forEach((iso) => {
    if (iso < today) return; // ne jamais toucher au passé
    if (!desiredBlocked.has(iso)) {
      const id = idByISO.get(iso);
      if (id) toDelete.push(id);
    }
  });

  // 6. Application transactionnelle + horodatage (règle des 14 jours).
  // createMany + skipDuplicates : idempotent, insensible au double-clic / rejeu
  // POST (pas de P2002 sur @@unique([sitterProfileId, date]) en cas de course).
  await db.$transaction([
    ...(toDelete.length
      ? [db.availabilitySlot.deleteMany({ where: { id: { in: toDelete } } })]
      : []),
    ...(toCreate.length
      ? [
          db.availabilitySlot.createMany({
            data: toCreate.map((iso) => ({
              sitterProfileId: profile!.id,
              date: slotDate(iso),
              available: false,
            })),
            skipDuplicates: true,
          }),
        ]
      : []),
    db.sitterProfile.update({
      where: { id: profile!.id },
      data: { calendarUpdated: new Date() },
    }),
  ]);

  redirect(`/compte/disponibilites?mois=${monthKey(year, month)}&ok=1`);
}
