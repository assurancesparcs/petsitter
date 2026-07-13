import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, AUTHOR, getArticle } from "@/content/blog";
import { BASE_URL, BRAND } from "@/lib/brand";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const a = getArticle((await params).slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.description,
    alternates: { canonical: `${BASE_URL}/blog/${a.slug}` },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const a = getArticle((await params).slug);
  if (!a) notFound();

  // Données structurées Article (schema.org) — aide au référencement.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.description,
    datePublished: a.updated,
    dateModified: a.updated,
    image: `${BASE_URL}/opengraph-image`,
    inLanguage: "fr-FR",
    author: { "@type": "Organization", name: BRAND },
    publisher: {
      "@type": "Organization",
      name: BRAND,
      logo: { "@type": "ImageObject", url: `${BASE_URL}/icon.svg` },
    },
    mainEntityOfPage: `${BASE_URL}/blog/${a.slug}`,
  };

  // Fil d'Ariane (schema.org) — Accueil › Le Journal › article.
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Le Journal", item: `${BASE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: a.title, item: `${BASE_URL}/blog/${a.slug}` },
    ],
  };

  return (
    <div className="bg-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Bandeau de couverture ----------------------------------------- */}
      <header className="bg-forest">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-on-forest">
            <Link href="/blog" className="text-on-forest hover:text-surface">
              Le Journal
            </Link>{" "}
            · {a.kicker} ·{" "}
            {new Date(a.updated).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
          <h1 className="mt-3 text-3xl font-extrabold leading-[1.08] tracking-[-0.02em] text-surface sm:text-4xl">
            {a.title}
          </h1>
          <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-on-forest">
            {a.description}
          </p>
        </div>
      </header>

      {/* Corps de l'article -------------------------------------------- */}
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="space-y-6">
          {a.body.map((block, i) => (
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
                    <li
                      key={j}
                      className="flex gap-3 text-[17px] leading-relaxed text-body"
                    >
                      <span
                        aria-hidden
                        className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary"
                      />
                      <span>{li}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Signature */}
        <p className="mt-10 border-t border-line pt-6 text-sm text-muted">
          Écrit par <span className="font-semibold text-ink">{AUTHOR}</span>.
        </p>

        {/* Rappel transparence */}
        <div className="mt-6 rounded-[16px] border border-forest-border bg-forest-tint p-5 text-[15px] leading-relaxed text-forest-text">
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
