import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/brand";

// Robots — stratégie : on VEUT l'indexation Google ET la citation par les
// moteurs de réponse IA. On autorise donc explicitement les crawlers IA, tout
// en gardant hors index les espaces techniques et privés (ceinture + bretelles
// avec le noindex par page sur /compte, /connexion, /demande).
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Espaces non publics / techniques / privés.
        disallow: ["/admin", "/api/", "/compte", "/connexion", "/demande"],
      },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    host: BASE_URL,
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
