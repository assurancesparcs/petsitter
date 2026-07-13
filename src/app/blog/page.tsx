import type { Metadata } from "next";
import Link from "next/link";
import { ARTICLES } from "@/content/blog";
import { BASE_URL } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Le Journal — articles et convictions",
  description:
    "Le Journal d'AlloPetsitter : des articles de fond, factuels et honnêtes, sur notre modèle sans commission, le choix d'un pet sitter en confiance et l'égalité chat / chien / NAC.",
  alternates: { canonical: `${BASE_URL}/blog` },
};

export default function Blog() {
  return (
    <div className="bg-cream">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <p className="kicker">Le Journal</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.02em] text-ink sm:text-4xl">
          Ce que nous pensons, écrit noir sur blanc.
        </h1>
        <p className="mt-3 max-w-[52ch] text-lg leading-relaxed text-muted">
          Des articles de fond, factuels et sans détour, sur notre façon de
          faire de la mise en relation. Pas de chiffres inventés, pas de faux
          témoignages — seulement des convictions assumées.
        </p>

        <div className="mt-8 grid gap-4">
          {ARTICLES.map((a) => (
            <Link
              key={a.slug}
              href={`/blog/${a.slug}`}
              className="group rounded-[20px] border border-line bg-surface p-6 transition-colors hover:border-primary"
            >
              <p className="kicker">{a.kicker}</p>
              <h2 className="mt-2 font-display text-xl font-bold text-ink transition-colors group-hover:text-primary-dark">
                {a.title}
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                {a.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary-dark">
                Lire l&apos;article
                <span
                  aria-hidden
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-sm text-muted">
          Vous cherchez des conseils pratiques pour préparer une garde ? Voir nos{" "}
          <Link href="/guides" className="font-semibold text-primary underline">
            guides pratiques
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
