import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/brand";
import { GUIDES } from "@/content/guides";
import { ARTICLES } from "@/content/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "",
    "/recherche",
    "/notre-modele",
    "/nos-limites",
    "/charte-qualite",
    "/devenir-pet-sitter",
    "/guides",
    "/a-propos",
    "/faq",
    "/centre-aide",
    "/blog",
  ];
  return [
    ...staticPaths.map((p) => ({
      url: `${BASE_URL}${p}`,
      lastModified: new Date("2026-07-12"),
    })),
    ...GUIDES.map((g) => ({
      url: `${BASE_URL}/guides/${g.slug}`,
      lastModified: new Date(g.updated),
    })),
    ...ARTICLES.map((a) => ({
      url: `${BASE_URL}/blog/${a.slug}`,
      lastModified: new Date(a.updated),
    })),
  ];
}
