import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BRAND, BASE_URL } from "@/lib/brand";
import { JsonLd } from "@/components/JsonLd";
import {
  SERVICE_SLUGS,
  getServicePage,
  servicePageLabel,
  type ServicePage,
} from "@/content/services";

// SSG : les 4 slugs sont prérendus au build (aucun rendu dynamique).
export function generateStaticParams() {
  return SERVICE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getServicePage(slug);
  if (!page) return {};
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: `${BASE_URL}/services/${page.slug}` },
  };
}

function serviceLd(page: ServicePage) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.h1,
    serviceType: page.serviceType,
    description: page.definition,
    areaServed: { "@type": "Country", name: "FR" },
    inLanguage: "fr-FR",
    provider: {
      "@type": "Organization",
      name: BRAND,
      url: BASE_URL,
    },
    url: `${BASE_URL}/services/${page.slug}`,
  };
}

function faqLd(page: ServicePage) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "fr-FR",
    mainEntity: page.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

function breadcrumbLd(page: ServicePage) {
  return {
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
      {
        "@type": "ListItem",
        position: 3,
        name: servicePageLabel(page),
        item: `${BASE_URL}/services/${page.slug}`,
      },
    ],
  };
}

export default async function ServicePageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getServicePage(slug);
  if (!page) notFound();

  const label = servicePageLabel(page);

  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <JsonLd data={serviceLd(page)} />
      <JsonLd data={faqLd(page)} />
      <JsonLd data={breadcrumbLd(page)} />

      {/* Fil d'Ariane visible (miroir du BreadcrumbList) */}
      <nav aria-label="Fil d'Ariane" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-primary">
              Accueil
            </Link>
          </li>
          <li aria-hidden>›</li>
          <li>
            <Link href="/services" className="hover:text-primary">
              Services
            </Link>
          </li>
          <li aria-hidden>›</li>
          <li className="text-body" aria-current="page">
            {label}
          </li>
        </ol>
      </nav>

      {/* En-tête + définition citable */}
      <header className="mt-6 max-w-2xl">
        <p className="kicker">Service · {label}</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.02em] text-ink sm:text-5xl">
          {page.h1}
        </h1>
        <p className="mt-5 rounded-[16px] border border-forest-border bg-forest-tint p-5 text-lg leading-relaxed text-forest-text">
          {page.definition}
        </p>
      </header>

      {/* Pour quels animaux — chat = chien = NAC */}
      <section className="mt-14">
        <p className="kicker">Pour quels animaux</p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-ink">
          Chat, chien et NAC, à stricte égalité
        </h2>
        <p className="mt-4 max-w-2xl text-body">{page.animaux}</p>
      </section>

      {/* Comment ça marche — 3 étapes */}
      <section className="mt-14">
        <p className="kicker">Comment ça marche</p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-ink">
          {label} en trois étapes
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {page.etapes.map((s, i) => (
            <div
              key={s.t}
              className="rounded-[20px] border border-line bg-surface p-6"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary-tint font-mono text-lg font-bold text-primary">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tarifs — frais de mise en relation seulement */}
      <section className="mt-14">
        <p className="kicker">Tarifs</p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-ink">
          Le pet sitter fixe son tarif, vous ne réglez que la mise en relation
        </h2>
        <p className="mt-4 max-w-2xl text-body">
          Le tarif de {label.toLowerCase()} est fixé librement par chaque pet
          sitter, qui le touche à 100 % : {BRAND} ne prélève aucune commission
          sur la garde. La plateforme se rémunère uniquement par un frais de
          mise en relation forfaitaire, affiché à l&apos;avance et prélevé
          seulement lorsqu&apos;un pet sitter a accepté — jamais une moyenne, ni
          un prix imposé. Le détail est public sur{" "}
          <Link
            href="/notre-modele"
            className="font-semibold text-primary underline"
          >
            notre modèle, expliqué ligne par ligne
          </Link>
          .
        </p>
      </section>

      {/* Différenciateur 0 % de commission */}
      <section className="mt-14">
        <p className="kicker">Ce qui distingue {BRAND}</p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-ink">
          0 % de commission sur la garde
        </h2>
        <p className="mt-4 max-w-2xl text-body">{page.differenciateur}</p>
      </section>

      {/* FAQ visible (miroir du FAQPage) */}
      <section className="mt-14">
        <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink">
          Questions fréquentes
        </h2>
        <div className="mt-6 space-y-3">
          {page.faq.map((f) => (
            <details
              key={f.q}
              className="group rounded-[16px] border border-line bg-surface px-5 open:border-primary"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                <span>{f.q}</span>
                <span
                  aria-hidden
                  className="shrink-0 font-mono text-lg text-primary transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="pb-5 text-[15px] leading-relaxed text-body">
                {f.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-14">
        <div className="rounded-[20px] border border-line bg-surface p-8 text-center sm:p-10">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Prêt à trouver la bonne personne ?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-body">
            Nous vous aidons à trouver la bonne personne près de chez vous. Le
            dépôt reste à 0 € : votre carte est simplement enregistrée, aucun
            débit tant qu&apos;un pet sitter n&apos;a pas accepté.
          </p>
          <Link
            href="/recherche"
            className="mt-6 inline-block rounded-[14px] bg-primary px-6 py-3 font-bold text-surface hover:bg-primary-dark"
          >
            Lancer une recherche
          </Link>
        </div>
      </section>
    </article>
  );
}
