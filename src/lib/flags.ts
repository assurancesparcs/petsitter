/**
 * Feature flags de conformité. En P1 ils vivent ici ; dès que la base est en
 * place (P2) ils migrent en base pour être pilotables sans déploiement.
 */
export const flags = {
  /**
   * ⛔ NE PAS ALLUMER avant que (1) l'immatriculation ORIAS MIA de l'entité
   * AlloPetsitter soit effective ET (2) le contrat groupe RC Pro soit signé
   * (PLAN.md §3.1 et Q2/Q3). Tant que ce flag est false, AUCUNE chaîne
   * publique ne mentionne l'assurance ou la RC Pro — le lint lexical
   * (scripts/lint-lexique.mjs) le vérifie en CI.
   */
  insurance_live: false,

  /**
   * Landing de pré-lancement (ouverture commerciale : janvier 2027).
   * true  → la home (/) affiche <PrelaunchLanding /> : appel aux pet sitters
   *         fondateurs + liste d'attente propriétaires. Toutes les autres pages
   *         (recherche, services, blog…) restent accessibles telles quelles.
   * false → la home marketplace actuelle est restaurée EXACTEMENT à
   *         l'identique (son JSX est conservé intact dans src/app/page.tsx).
   * À passer à false à l'ouverture, en janvier 2027 — un seul commit suffit.
   */
  prelaunch_live: true,
} as const;
