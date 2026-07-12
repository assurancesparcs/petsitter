import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-white">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 text-sm sm:grid-cols-3">
        <div>
          <p className="font-bold text-primary">{BRAND}</p>
          <p className="mt-2 text-ink/70">
            Plateforme de mise en relation entre propriétaires d&apos;animaux et
            pet sitters indépendants, partout en France.
          </p>
        </div>
        <div className="space-y-2">
          <p className="font-semibold">Transparence</p>
          <p>
            <Link href="/notre-modele" className="hover:text-primary">
              Comment nous gagnons notre argent
            </Link>
          </p>
          <p>
            <Link href="/nos-limites" className="hover:text-primary">
              Ce que nous ne faisons pas
            </Link>
          </p>
          <p>
            <Link href="/guides" className="hover:text-primary">
              Guides pratiques
            </Link>
          </p>
          <p>
            <Link href="/resilier" className="hover:text-primary">
              Résilier son abonnement
            </Link>
          </p>
        </div>
        <div className="space-y-2">
          <p className="font-semibold">Informations légales</p>
          <p>
            <Link href="/mentions-legales" className="hover:text-primary">
              Mentions légales
            </Link>
          </p>
          <p>
            <Link href="/confidentialite" className="hover:text-primary">
              Confidentialité
            </Link>
          </p>
          <p>
            <Link href="/cgu" className="hover:text-primary">
              CGU
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
