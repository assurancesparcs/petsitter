"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/brand";

/**
 * Navigation latérale de la console d'administration (charte « Panneau Admin »).
 * - Desktop : colonne sombre (bg-ink) avec onglets empilés.
 * - Mobile : barre d'onglets repliée, défilante horizontalement.
 * L'état actif est déduit du chemin courant (usePathname).
 */

type NavLink = { href: string; label: string; exact?: boolean };

const LINKS: NavLink[] = [
  { href: "/admin", label: "Tableau de bord", exact: true },
  { href: "/admin/verifications", label: "Vérifications" },
  { href: "/admin/moderation", label: "Modération" },
  { href: "/admin/litiges", label: "Litiges & Plan B" },
  { href: "/admin/remboursements", label: "Remboursements" },
];

function isActive(pathname: string, link: NavLink): boolean {
  if (link.exact) return pathname === link.href;
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-4 bg-ink p-5 text-surface lg:min-h-full lg:gap-7 lg:p-6">
      {/* Marque de la console */}
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center bg-primary"
          style={{ borderRadius: "9px 9px 9px 3px" }}
        >
          <svg viewBox="0 0 24 24" width={15} height={15} fill="var(--color-surface)">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          </svg>
        </span>
        <span className="font-display text-[15px] font-extrabold leading-tight tracking-[-0.02em] text-surface">
          Console {BRAND}
        </span>
      </div>

      {/* Onglets */}
      <nav
        aria-label="Navigation de l'administration"
        className="flex gap-1 overflow-x-auto pb-1 lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0"
      >
        {LINKS.map((link) => {
          const active = isActive(pathname, link);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 whitespace-nowrap rounded-[10px] px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-surface/10 font-bold text-surface"
                  : "font-medium text-line-faint hover:bg-surface/5 hover:text-surface"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Mention outil interne */}
      <p className="hidden rounded-[12px] bg-surface/5 p-3.5 text-xs leading-relaxed text-line-faint lg:block">
        Outil interne · aucune donnée client exportée hors plateforme.
      </p>
    </div>
  );
}
