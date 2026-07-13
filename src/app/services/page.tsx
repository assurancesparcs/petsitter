import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, BASE_URL } from "@/lib/brand";
import { JsonLd } from "@/components/JsonLd";
import { SERVICE_SLUGS, SERVICE_PAGES } from "@/content/services";

export const metadata: Metadata = {
  title: "Les 4 services de pet sitting — visite, garde, promenade",
  description:
    "Visite à domicile, garde à domicile, garde chez le pet sitter, promenade : les quatre services de pet sitting sur AlloPetsitter, à stricte égalité pour chat, chien et NAC. 0 % de commission sur la garde.",
  alternates: { canonical: `${BASE_URL}/services` },
};

const BREADCRUMB_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: "Services",
      item: `${BASE_URL}/services`,
    },
  ],
};

export default function ServicesIndex() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <JsonLd data={BREADCRUMB_LD} />

      <header className="max-w-2xl">
        <p className="kicker">Nos services</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.02em] text-ink sm:text-5xl">
          Quatre services de pet sitting, à stricte égalité
        </h1>
        <p className="mt-5 max-w-2xl text-body">
          Visite à domicile, garde à votre domicile, garde chez le pet sitter et
          promenade : quatre façons de faire garder son animal sur {BRAND}. Chat,
          chien et NAC bénéficient des mêmes services, avec la même attention.
        </p>
      </header>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {SERVICE_SLUGS.map((slug) => {
          const p = SERVICE_PAGES[slug];
          return (
            <Link
              key={slug}
              href={`/services/${slug}`}
              className="group rounded-[20px] border border-line bg-surface p-6 hover:border-primary"
            >
              <h2 className="text-lg font-bold text-ink group-hover:text-primary">
                {p.h1}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {p.metaDescription}
              </p>
              <span className="mt-4 inline-block text-sm font-semibold text-primary">
                En savoir plus →
              </span>
            </Link>
          );
        })}
      </div>

      <p className="mt-10 text-sm text-muted">
        Prêt à trouver un pet sitter près de chez vous ?{" "}
        <Link href="/recherche" className="font-semibold text-primary underline">
          Lancer une recherche
        </Link>
        .
      </p>
    </article>
  );
}
