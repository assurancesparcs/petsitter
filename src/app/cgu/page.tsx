import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  robots: { index: false },
};

// ⚠️ GABARIT (P1) — CGU/CGV complètes rédigées en P3 (avec juriste) :
// intermédiaire de mise en relation (jamais partie au contrat de garde),
// rétractation L221-18 + exécution immédiate, Pass prépayés sans reconduction,
// critères de classement (L111-7/P2B), politique d'avis (D111-16+),
// motifs de suspension avec procédure contradictoire, médiateur.
export default function Cgu() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="kicker">Informations légales</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em]">
        Conditions générales d&apos;utilisation
      </h1>
      <div className="mt-8 rounded-[20px] border border-line bg-surface p-6 shadow-panel sm:p-8">
        <p className="text-body">
          Les CGU complètes seront publiées avant l&apos;ouverture du service.
          Le principe fondateur, lui, ne changera pas : {BRAND} est une
          plateforme de mise en relation — la garde est contractée et exécutée
          par le pet sitter, en toute indépendance, payée directement par le
          propriétaire. Chaque version de ces conditions sera datée, archivée et
          notifiée : pas de modification silencieuse.
        </p>
      </div>
    </article>
  );
}
