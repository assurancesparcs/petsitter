import { handlers } from "@/lib/auth";

/**
 * Point d'entrée Auth.js v5 (App Router) : callbacks de vérification du lien
 * magique, gestion de session, déconnexion. Toute la configuration vit dans
 * src/lib/auth.ts.
 */
export const { GET, POST } = handlers;
