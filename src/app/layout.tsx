import type { Metadata } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { BRAND, BASE_URL } from "@/lib/brand";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: `${BRAND} — Trouvez un pet sitter pour votre chat ou votre chien`,
    template: `%s · ${BRAND}`,
  },
  description:
    "Mise en relation avec des pet sitters indépendants partout en France. 0 % de commission : le pet sitter touche 100 % de ce que vous lui versez. Vous ne payez que si un pet sitter accepte votre garde.",
  alternates: { canonical: BASE_URL },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: BRAND,
    url: BASE_URL,
    title: `${BRAND} — Trouvez un pet sitter pour votre chat ou votre chien`,
    description:
      "Mise en relation avec des pet sitters indépendants partout en France. 0 % de commission : le pet sitter touche 100 % de ce que vous lui versez.",
    images: [`${BASE_URL}/opengraph-image`],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND} — Trouvez un pet sitter pour votre chat ou votre chien`,
    description:
      "0 % de commission : le pet sitter touche 100 % de ce que vous lui versez. Vous ne payez que si un pet sitter accepte votre garde.",
  },
};

// Données structurées sitewide (schema.org) — Organization + WebSite. Rendues
// sur chaque page via le layout racine. Valeurs factuelles uniquement : pas de
// `sameAs` (aucun réseau social officiel à ce jour — jamais inventé).
const ORGANIZATION_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: BRAND,
  url: BASE_URL,
  logo: `${BASE_URL}/icon.svg`,
  description:
    "Plateforme française de mise en relation entre propriétaires d'animaux et pet sitters indépendants. 0 % de commission : le pet sitter touche 100 % de ce que vous lui versez.",
  areaServed: "FR",
  knowsLanguage: "fr-FR",
};

const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  url: BASE_URL,
  name: BRAND,
  inLanguage: "fr-FR",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/recherche?cp={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${bricolage.variable} ${hanken.variable} ${spaceMono.variable}`}
    >
      <body className="flex min-h-screen flex-col">
        <JsonLd data={ORGANIZATION_LD} />
        <JsonLd data={WEBSITE_LD} />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
