import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-surface-2">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-8">
        <div>
          <Logo size={28} />
          <p className="mt-3 max-w-xs text-sm text-muted">
            Mise en relation entre propriétaires d&apos;animaux et pet sitters
            indépendants, partout en France. Nous vous aidons à trouver la bonne
            personne.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="kicker">Transparence</p>
          <p>
            <Link href="/notre-modele" className="text-body hover:text-primary">
              Comment nous gagnons notre argent
            </Link>
          </p>
          <p>
            <Link href="/nos-limites" className="text-body hover:text-primary">
              Ce que nous ne faisons pas
            </Link>
          </p>
          <p>
            <Link href="/charte-qualite" className="text-body hover:text-primary">
              Notre charte de qualité
            </Link>
          </p>
          <p>
            <Link
              href="/transparence-score"
              className="text-body hover:text-primary"
            >
              Comment le score est calculé
            </Link>
          </p>
          <p>
            <Link href="/guides" className="text-body hover:text-primary">
              Guides pratiques
            </Link>
          </p>
          <p>
            <Link href="/resilier" className="text-body hover:text-primary">
              Résilier son abonnement
            </Link>
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="kicker">Informations légales</p>
          <p>
            <Link href="/mentions-legales" className="text-body hover:text-primary">
              Mentions légales
            </Link>
          </p>
          <p>
            <Link href="/confidentialite" className="text-body hover:text-primary">
              Confidentialité
            </Link>
          </p>
          <p>
            <Link href="/cgu" className="text-body hover:text-primary">
              CGU
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
