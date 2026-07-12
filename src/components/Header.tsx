import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function Header() {
  return (
    <header className="border-b border-line bg-cream/90 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-primary">
          {BRAND}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/notre-modele" className="hover:text-primary">
            Notre modèle
          </Link>
          <Link
            href="/devenir-pet-sitter"
            className="rounded-full bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark"
          >
            Devenir pet sitter
          </Link>
        </nav>
      </div>
    </header>
  );
}
