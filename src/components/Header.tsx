import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line-2 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8">
        <Link href="/" aria-label="AlloPetsitter — accueil">
          <Logo size={32} />
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium sm:gap-6">
          <Link href="/recherche" className="hidden text-body hover:text-primary sm:inline">
            Rechercher
          </Link>
          <Link href="/notre-modele" className="hidden text-body hover:text-primary sm:inline">
            Notre modèle
          </Link>
          <Link href="/compte" className="text-muted hover:text-primary">
            Mon compte
          </Link>
          <Link
            href="/devenir-pet-sitter"
            className="rounded-[14px] bg-primary px-4 py-2 font-semibold text-surface hover:bg-primary-dark"
          >
            Devenir pet sitter
          </Link>
        </nav>
      </div>
    </header>
  );
}
