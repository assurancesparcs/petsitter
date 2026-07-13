import type { Metadata } from "next";
import { AdminNav } from "./AdminNav";

export const metadata: Metadata = {
  // La console reste hors index (déjà protégée par le middleware /admin/:path*).
  robots: { index: false, follow: false },
};

/**
 * Cadre commun à toutes les pages /admin (charte « Panneau Admin ») :
 * bandeau interne + carte à deux colonnes (navigation latérale + contenu).
 * Ce layout ne refait PAS l'authentification : le middleware protège déjà
 * /admin/:path*. Il n'habille que la mise en page.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-cream">
      <div className="mx-auto max-w-[1240px] px-4 py-8 lg:py-12">
        {/* Bandeau interne */}
        <p className="kicker mb-4">
          Admin · Outil interne. Aucune donnée client exportée hors plateforme
        </p>

        {/* Carte console : navigation latérale + contenu */}
        <div className="overflow-hidden rounded-[20px] border border-line bg-surface shadow-[0_20px_60px_rgba(60,40,20,0.10)] lg:grid lg:grid-cols-[240px_1fr]">
          <AdminNav />
          <main className="min-w-0 p-5 sm:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
