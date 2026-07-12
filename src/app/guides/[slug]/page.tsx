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
    <article className="mx-auto max-w-3xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="text-sm text-ink/50">
        <Link href="/guides" className="hover:text-primary">
          Guides
        </Link>{" "}
        ·{" "}
        {new Date(g.updated).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </p>
      <h1 className="mt-2 text-3xl font-bold">{g.title}</h1>

      <div className="mt-6 space-y-5">
        {g.body.map((block, i) => (
          <div key={i}>
            {block.h && (
              <h2 className="text-xl font-bold text-primary">{block.h}</h2>
            )}
            {block.p && <p className="mt-2 text-ink/85">{block.p}</p>}
            {block.ul && (
              <ul className="mt-2 list-disc space-y-1 pl-6 text-ink/85">
                {block.ul.map((li, j) => (
                  <li key={j}>{li}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-primary p-6 text-white">
        <p className="font-semibold">
          Prêt à trouver un pet sitter près de chez vous ?
        </p>
        <Link
          href="/recherche"
          className="mt-3 inline-block rounded-full bg-white px-5 py-2 font-semibold text-primary"
        >
          Lancer une recherche
        </Link>
      </div>
    </article>
  );
}
