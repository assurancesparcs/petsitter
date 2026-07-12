import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES, getGuide } from "@/content/guides";
import { BASE_URL, BRAND } from "@/lib/brand";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const g = getGuide((await params).slug);
  if (!g) return {};
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: `${BASE_URL}/guides/${g.slug}` },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const g = getGuide((await params).slug);
  if (!g) notFound();

  // Données structurées Article (schema.org) — aide au référencement.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.title,
    description: g.description,
    dateModified: g.updated,
    inLanguage: "fr-FR",
    publisher: { "@type": "Organization", name: BRAND },
  };

  return (
    <div className="bg-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Bandeau de couverture ----------------------------------------- */}
      <header className="bg-forest">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-on-forest">
            <Link href="/guides" className="text-on-forest hover:text-surface">
              Guides
            </Link>{" "}
            ·{" "}
            {new Date(g.updated).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
          <h1 className="mt-3 text-3xl font-extrabold leading-[1.08] tracking-[-0.02em] text-surface sm:text-4xl">
            {g.title}
          </h1>
          <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-on-forest">
            {g.description}
          </p>
        </div>
      </header>

      {/* Corps de l'article -------------------------------------------- */}
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="space-y-6">
          {g.body.map((block, i) => (
            <div key={i}>
              {block.h && (
                <h2 className="font-display text-xl font-bold text-ink">
                  {block.h}
                </h2>
              )}
              {block.p && (
                <p className="mt-2 text-[17px] leading-relaxed text-body">
                  {block.p}
                </p>
              )}
              {block.ul && (
                <ul className="mt-3 space-y-2">
                  {block.ul.map((li, j) => (
                    <li key={j} className="flex gap-3 text-[17px] leading-relaxed text-body">
                      <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{li}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Rappel transparence */}
        <div className="mt-10 rounded-[16px] border border-forest-border bg-forest-tint p-5 text-[15px] leading-relaxed text-forest-text">
          Rappel : vous ne payez que si un pet sitter accepte votre garde. 0 €
          tant que personne n&apos;a dit oui.
        </div>

        {/* CTA recherche */}
        <div className="mt-6 flex flex-col gap-5 rounded-[20px] bg-primary p-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-xl font-bold text-surface">
            Prêt à trouver un pet sitter près de chez vous ?
          </p>
          <Link
            href="/recherche"
            className="inline-flex shrink-0 items-center justify-center rounded-[14px] bg-surface px-6 py-3 font-bold text-primary-dark transition-colors hover:bg-cream"
          >
            Lancer une recherche
          </Link>
        </div>
      </article>
    </div>
  );
}
