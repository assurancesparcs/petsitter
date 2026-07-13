import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/content/guides";
import { BASE_URL } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Guides — conseils pour la garde de votre animal",
  description:
    "Nos guides pratiques pour bien préparer la garde de votre chat ou de votre chien et choisir le bon pet sitter.",
  alternates: { canonical: `${BASE_URL}/guides` },
};

export default function Guides() {
  return (
    <div className="bg-cream">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <p className="kicker">Guides propriétaires</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
          Bien préparer la garde de votre animal.
        </h1>
        <p className="mt-3 max-w-[52ch] text-lg leading-relaxed text-muted">
          Des conseils simples et factuels pour confier votre animal en toute
          sérénité — pour les chats comme pour les chiens.
        </p>

        <div className="mt-8 grid gap-4">
          {GUIDES.map((g) => (
            <Link
              key={g.slug}
              href={`/guides/${g.slug}`}
              className="group rounded-[20px] border border-line bg-surface p-6 transition-colors hover:border-primary"
            >
              <h2 className="font-display text-xl font-bold text-ink transition-colors group-hover:text-primary-dark">
                {g.title}
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                {g.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary-dark">
                Lire le guide
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
