import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/brand";
import { GUIDES } from "@/content/guides";
import { ARTICLES } from "@/content/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  // Pages indexables publiques. /comparatif et /qu-est-ce-qu-un-pet-sitter sont
  // créées par un second chantier de contenu — incluses ici pour qu'elles soient
  // indexées dès leur publication.
  const staticPaths = [
    "",
    "/recherche",
    "/notre-modele",
    "/nos-limites",
    "/charte-qualite",
    "/transparence-score",
    "/devenir-pet-sitter",
    "/guides",
    "/a-propos",
    "/faq",
    "/centre-aide",
    "/blog",
    "/confidentialite",
    "/comparatif",
    "/qu-est-ce-qu-un-pet-sitter",
  ];
  return [
    ...staticPaths.map((p) => ({
      url: `${BASE_URL}${p}`,
      lastModified: new Date("2026-07-12"),
      changeFrequency: "monthly" as const,
      priority: p === "" ? 1 : 0.7,
    })),
    ...GUIDES.map((g) => ({
      url: `${BASE_URL}/guides/${g.slug}`,
      lastModified: new Date(g.updated),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...ARTICLES.map((a) => ({
      url: `${BASE_URL}/blog/${a.slug}`,
      lastModified: new Date(a.updated),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
