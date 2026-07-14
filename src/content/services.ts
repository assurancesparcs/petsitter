/**
 * Pages services SEO (long-traîne « visite à domicile chat », « garde à
 * domicile », « garde chez le pet sitter », « promenade chien »).
 * Source unique et typée des 4 pages `/services/[slug]`.
 *
 * Règles produit respectées :
 *  - Chat = chien = NAC : égalité stricte, chaque service applicable à toutes
 *    les espèces (catalog.ts §SPECIES).
 *  - Honnêteté : aucun prix de garde inventé, aucune moyenne. Seuls les frais
 *    de mise en relation forfaitaires viennent de PRICING (lib/pricing.ts) ;
 *    le tarif de la garde est fixé librement par le pet sitter, touché à 100 %.
 *  - Vocabulaire de mise en relation (aucune possession, aucun téléphone).
 */
import {
  centsLabel,
  PASS_SEJOUR_DEUXIEME_CENTS,
  PASS_SEJOUR_DEUXIEME_REDUCTION_PCT,
  PRICING,
} from "@/lib/pricing";
import { BRAND } from "@/lib/brand";
import { SERVICES, serviceLabel, type ServiceKey } from "@/domains/marketplace/catalog";

export type ServiceSlug =
  | "visite-a-domicile"
  | "garde-a-domicile"
  | "garde-chez-le-pet-sitter"
  | "promenade-chien";

export type ServiceStep = { t: string; d: string };
export type ServiceFaq = { q: string; a: string };

export type ServicePage = {
  slug: ServiceSlug;
  serviceKey: ServiceKey;
  /** Type de service pour le JSON-LD schema.org (Service.serviceType). */
  serviceType: string;
  keyword: string; // requête long-traîne visée (documentation interne)
  h1: string;
  metaTitle: string;
  metaDescription: string;
  /** Définition citable, auto-suffisante (AEO) — reprise à l'identique en JSON-LD. */
  definition: string;
  /** Pour quels animaux — chat = chien = NAC. */
  animaux: string;
  etapes: ServiceStep[];
  /** Le différenciateur 0 % de commission, contextualisé au service. */
  differenciateur: string;
  faq: ServiceFaq[];
};

// Réponse « prix » réutilisable — construite depuis PRICING, aucun montant en
// dur, aucune moyenne inventée. `pass` = le Pass déduit pour ce service.
function feeAnswer(service: string, pass: "court" | "sejour"): string {
  const p = pass === "court" ? PRICING.passCourt : PRICING.passSejour;
  const deuxiemeSejour =
    pass === "sejour"
      ? ` Votre deuxième ${PRICING.passSejour.label} est automatiquement à −${PASS_SEJOUR_DEUXIEME_REDUCTION_PCT} % (${centsLabel(PASS_SEJOUR_DEUXIEME_CENTS)}), sans code ni démarche.`
      : "";
  return (
    `Le tarif de ${service} est fixé librement par chaque pet sitter, qui le perçoit à 100 % : ` +
    `il n'y a pas de prix imposé ni de moyenne affichée. Sur ${BRAND}, la plateforme facture ` +
    `uniquement la mise en relation — ${p.label} à ${p.price} (${p.detail.toLowerCase()}) — ` +
    `sans jamais prélever de commission sur la garde.${deuxiemeSejour} Pour un besoin régulier, le ${PRICING.passTrimestre.label} ` +
    `à ${PRICING.passTrimestre.price}, payé ${PRICING.passTrimestre.unit}, couvre des mises en relation illimitées ` +
    `pendant 3 mois — sans aucune reconduction.`
  );
}

const ANIMAUX_COMMUN =
  "Chat, chien et NAC (nouveaux animaux de compagnie : lapins, rongeurs, oiseaux…) bénéficient de ce service à stricte égalité, avec la même attention et les mêmes règles. Chaque pet sitter indique les espèces qu'il accueille ; vous filtrez selon votre animal.";

export const SERVICE_PAGES: Record<ServiceSlug, ServicePage> = {
  "visite-a-domicile": {
    slug: "visite-a-domicile",
    serviceKey: "HOME_VISIT",
    serviceType: "Visite d'animal à domicile",
    keyword: "visite à domicile chat pet sitter",
    h1: "Visite à domicile pour chat (et chien, NAC)",
    metaTitle: "Visite à domicile pour chat, chien ou NAC — pet sitter",
    metaDescription:
      "La visite à domicile : un pet sitter passe chez vous nourrir, changer la litière et jouer avec votre animal. Idéale pour les chats, ouverte aux chiens et aux NAC. 0 % de commission, 0 € tant qu'aucun pet sitter n'accepte.",
    definition:
      "La visite à domicile est un service où un pet sitter se rend chez le propriétaire, une ou plusieurs fois par jour, pour s'occuper de son animal pendant son absence : nourriture, eau fraîche, litière, jeu, câlins et surveillance. L'animal — chat, chien ou NAC — reste dans son environnement habituel, avec ses repères. C'est la solution idéale pour les chats, animaux territoriaux qui supportent mal le déplacement. Sur " +
      BRAND +
      ", vous décrivez votre besoin, un pet sitter à l'identité vérifiée accepte à son tarif, et vous vous organisez en direct.",
    animaux:
      "La visite à domicile est particulièrement adaptée aux chats, qui gardent ainsi leur territoire et leurs habitudes. Mais elle convient aussi aux chiens habitués à rester seuls une partie de la journée, et aux NAC (lapins, rongeurs, oiseaux…) dont l'installation ne se déplace pas facilement. " +
      ANIMAUX_COMMUN,
    etapes: [
      {
        t: "Vous décrivez votre besoin",
        d: "Dates, animal, nombre de visites par jour. Votre carte est simplement enregistrée : aucun débit tant qu'un pet sitter n'a pas accepté.",
      },
      {
        t: "Un pet sitter accepte",
        d: "Les pet sitters disponibles près de chez vous candidatent avec leur tarif. Vous comparez et vous choisissez. C'est seulement à ce moment que la mise en relation est réglée.",
      },
      {
        t: "Vous vous organisez en direct",
        d: "Coordonnées, messagerie, remise des clés et rencontre préalable gratuite. Le pet sitter est payé directement par vous, à son tarif, sans commission.",
      },
    ],
    differenciateur:
      "Pour une visite à domicile, le pet sitter touche 100 % du tarif qu'il a fixé : la plateforme ne prélève aucune commission sur la garde. Elle se rémunère uniquement par un frais de mise en relation forfaitaire, affiché à l'avance et prélevé seulement lorsqu'un pet sitter a accepté.",
    faq: [
      {
        q: "Combien coûte une visite à domicile ?",
        a: feeAnswer("la visite", "court"),
      },
      {
        q: "La visite à domicile convient-elle à un chat ?",
        a: "Oui, c'est même le service le plus adapté aux chats. Territorial, le chat supporte mal d'être déplacé : la visite à domicile lui permet de rester chez lui, avec sa litière, ses gamelles et ses repères, pendant qu'un pet sitter passe chaque jour s'occuper de lui.",
      },
      {
        q: "Quand suis-je débité pour une visite à domicile ?",
        a: `Jamais au dépôt de votre demande : votre carte est simplement enregistrée, le dépôt reste à 0 €. Le débit n'intervient qu'au moment où un pet sitter accepte votre demande. Tant que personne n'a accepté, vous n'êtes pas débité.`,
      },
    ],
  },

  "garde-a-domicile": {
    slug: "garde-a-domicile",
    serviceKey: "HOUSE_SITTING",
    serviceType: "Garde d'animal au domicile du propriétaire",
    keyword: "garde animaux à domicile pet sitter",
    h1: "Garde à votre domicile pour chat, chien ou NAC",
    metaTitle: "Garde à domicile — un pet sitter chez vous | pet sitter",
    metaDescription:
      "La garde à domicile : un pet sitter s'installe chez vous pendant votre absence, votre animal reste dans son environnement. Chat, chien et NAC à égalité. 0 % de commission, débit uniquement à l'acceptation.",
    definition:
      "La garde à votre domicile est un service où un pet sitter s'installe chez le propriétaire, pendant son absence, pour assurer une présence continue auprès de son animal. L'animal — chat, chien ou NAC — reste dans son environnement habituel, avec ses repères, sa gamelle et ses horaires : c'est la personne qui vient à lui, pas l'inverse. La maison est aussi occupée pendant l'absence. Sur " +
      BRAND +
      ", vous décrivez votre besoin, un pet sitter à l'identité vérifiée accepte à son tarif, et vous vous organisez en direct.",
    animaux:
      "La garde à domicile convient aux chiens qui ont besoin d'une présence continue, aux chats qui préfèrent rester sur leur territoire, comme aux NAC dont l'installation reste en place. " +
      ANIMAUX_COMMUN,
    etapes: [
      {
        t: "Vous décrivez votre besoin",
        d: "Dates, animal, consignes de la maison. Votre carte est simplement enregistrée : aucun débit tant qu'un pet sitter n'a pas accepté, même pour un séjour prévu dans plusieurs mois.",
      },
      {
        t: "Un pet sitter accepte",
        d: "Les pet sitters disponibles près de chez vous candidatent avec leur tarif. Vous comparez et vous choisissez. C'est seulement à ce moment que la mise en relation est réglée.",
      },
      {
        t: "Vous vous organisez en direct",
        d: "Coordonnées, messagerie, contrat de garde type, remise des clés et rencontre préalable gratuite. Le pet sitter est payé directement par vous, à son tarif, sans commission.",
      },
    ],
    differenciateur:
      "Pour une garde à votre domicile, le pet sitter touche 100 % du tarif qu'il a fixé : la plateforme ne prélève aucune commission sur la garde. Elle se rémunère uniquement par un frais de mise en relation forfaitaire, affiché à l'avance et prélevé seulement lorsqu'un pet sitter a accepté.",
    faq: [
      {
        q: "Combien coûte une garde à domicile ?",
        a: feeAnswer("la garde à domicile", "sejour"),
      },
      {
        q: "Quelle différence entre garde à domicile et visite à domicile ?",
        a: "Lors d'une visite à domicile, le pet sitter passe une ou plusieurs fois par jour puis repart. Lors d'une garde à domicile, il s'installe chez le propriétaire et assure une présence continue, jour et nuit. La garde à domicile convient donc aux animaux qui supportent mal la solitude, et rassure aussi sur la maison occupée.",
      },
      {
        q: "Quand suis-je débité pour une garde à domicile ?",
        a: `Jamais au dépôt de votre demande : votre carte est simplement enregistrée, le dépôt reste à 0 €. Le débit n'intervient qu'au moment où un pet sitter accepte votre demande. Tant que personne n'a accepté, vous n'êtes pas débité.`,
      },
    ],
  },

  "garde-chez-le-pet-sitter": {
    slug: "garde-chez-le-pet-sitter",
    serviceKey: "BOARDING",
    serviceType: "Garde d'animal au domicile du pet sitter",
    keyword: "garde chien chez un pet sitter",
    h1: "Garde chez le pet sitter pour chat, chien ou NAC",
    metaTitle: "Garde chez le pet sitter — chat, chien, NAC | pet sitter",
    metaDescription:
      "La garde chez le pet sitter : votre animal est accueilli à son domicile, avec une rencontre préalable. Chat, chien et NAC à égalité. 0 % de commission, 0 € tant qu'aucun pet sitter n'accepte.",
    definition:
      "La garde chez le pet sitter est un service où l'animal est accueilli au domicile du pet sitter, pendant l'absence de son propriétaire. Une rencontre préalable gratuite permet de vérifier que l'environnement convient à l'animal — chat, chien ou NAC — avant la garde. L'animal profite d'une présence et d'un cadre familial, souvent en petit comité. Sur " +
      BRAND +
      ", vous décrivez votre besoin, un pet sitter à l'identité vérifiée accepte à son tarif, et vous vous organisez en direct.",
    animaux:
      "La garde chez le pet sitter est souvent choisie pour les chiens sociables, mais elle est ouverte aux chats et aux NAC quand l'environnement d'accueil leur convient — ce que la rencontre préalable permet justement de vérifier. " +
      ANIMAUX_COMMUN,
    etapes: [
      {
        t: "Vous décrivez votre besoin",
        d: "Dates, animal, habitudes. Votre carte est simplement enregistrée : aucun débit tant qu'un pet sitter n'a pas accepté.",
      },
      {
        t: "Un pet sitter accepte",
        d: "Les pet sitters disponibles près de chez vous candidatent avec leur tarif. Vous comparez et vous choisissez. C'est seulement à ce moment que la mise en relation est réglée.",
      },
      {
        t: "Rencontre préalable puis garde",
        d: "Vous rencontrez le pet sitter et découvrez son domicile gratuitement avant de confirmer. Le pet sitter est payé directement par vous, à son tarif, sans commission.",
      },
    ],
    differenciateur:
      "Pour une garde chez le pet sitter, celui-ci touche 100 % du tarif qu'il a fixé : la plateforme ne prélève aucune commission sur la garde. Elle se rémunère uniquement par un frais de mise en relation forfaitaire, affiché à l'avance et prélevé seulement lorsqu'un pet sitter a accepté.",
    faq: [
      {
        q: "Combien coûte une garde chez le pet sitter ?",
        a: feeAnswer("la garde chez le pet sitter", "sejour"),
      },
      {
        q: "Puis-je visiter le domicile du pet sitter avant la garde ?",
        a: "Oui. Une rencontre préalable gratuite est prévue avant chaque garde chez le pet sitter : elle permet de découvrir son domicile, de vérifier que le cadre convient à votre animal et de lever les derniers doutes, pour vous comme pour votre animal.",
      },
      {
        q: "Quand suis-je débité pour une garde chez le pet sitter ?",
        a: `Jamais au dépôt de votre demande : votre carte est simplement enregistrée, le dépôt reste à 0 €. Le débit n'intervient qu'au moment où un pet sitter accepte votre demande. Tant que personne n'a accepté, vous n'êtes pas débité.`,
      },
    ],
  },

  "promenade-chien": {
    slug: "promenade-chien",
    serviceKey: "WALK",
    serviceType: "Promenade de chien",
    keyword: "promenade chien pet sitter",
    h1: "Promenade de chien près de chez vous",
    metaTitle: "Promenade de chien — un pet sitter près de chez vous",
    metaDescription:
      "La promenade : un pet sitter sort votre chien près de chez vous quand vous manquez de temps. Sorties régulières ou ponctuelles. 0 % de commission, débit uniquement à l'acceptation.",
    definition:
      "La promenade est un service où un pet sitter vient chercher le chien, près de chez le propriétaire, pour une sortie — quand celui-ci manque de temps ou s'absente dans la journée. Le chien se dépense, fait ses besoins et garde son rythme, sans attendre le retour de son propriétaire. Les sorties peuvent être régulières ou ponctuelles. Sur " +
      BRAND +
      ", vous décrivez votre besoin, un pet sitter à l'identité vérifiée accepte à son tarif, et vous vous organisez en direct.",
    animaux:
      "La promenade concerne d'abord les chiens, qui ont besoin de sorties régulières. Pour les chats et les NAC, un pet sitter proposera plutôt une visite à domicile, mieux adaptée à leurs besoins. Sur les autres services, chat, chien et NAC restent à stricte égalité : chaque pet sitter indique les espèces et les services qu'il propose.",
    etapes: [
      {
        t: "Vous décrivez votre besoin",
        d: "Dates, horaires, votre chien. Votre carte est simplement enregistrée : aucun débit tant qu'un pet sitter n'a pas accepté.",
      },
      {
        t: "Un pet sitter accepte",
        d: "Les pet sitters disponibles près de chez vous candidatent avec leur tarif. Vous comparez et vous choisissez. C'est seulement à ce moment que la mise en relation est réglée.",
      },
      {
        t: "Vous vous organisez en direct",
        d: "Coordonnées, messagerie, points de rendez-vous et rencontre préalable gratuite. Le pet sitter est payé directement par vous, à son tarif, sans commission.",
      },
    ],
    differenciateur:
      "Pour une promenade, le pet sitter touche 100 % du tarif qu'il a fixé : la plateforme ne prélève aucune commission sur la garde. Elle se rémunère uniquement par un frais de mise en relation forfaitaire, affiché à l'avance et prélevé seulement lorsqu'un pet sitter a accepté.",
    faq: [
      {
        q: "Combien coûte une promenade de chien ?",
        a: feeAnswer("la promenade", "court"),
      },
      {
        q: "Peut-on prévoir des promenades régulières ?",
        a: "Oui. Vous pouvez organiser des sorties ponctuelles ou régulières avec le pet sitter, en direct. Pour des besoins récurrents, le " + PRICING.passTrimestre.label + " à " + PRICING.passTrimestre.price + ", payé " + PRICING.passTrimestre.unit + ", donne droit à des mises en relation illimitées pendant 3 mois — aucune reconduction, rien à résilier.",
      },
      {
        q: "Quand suis-je débité pour une promenade ?",
        a: `Jamais au dépôt de votre demande : votre carte est simplement enregistrée, le dépôt reste à 0 €. Le débit n'intervient qu'au moment où un pet sitter accepte votre demande. Tant que personne n'a accepté, vous n'êtes pas débité.`,
      },
    ],
  },
};

/** Les 4 slugs, dans l'ordre de présentation (generateStaticParams, index, nav). */
export const SERVICE_SLUGS = Object.keys(SERVICE_PAGES) as ServiceSlug[];

/** Vérifie qu'un slug inconnu renvoie 404 côté route. */
export function getServicePage(slug: string): ServicePage | undefined {
  return (SERVICE_PAGES as Record<string, ServicePage>)[slug];
}

/** Libellé officiel du service (catalog.ts) — source unique. */
export function servicePageLabel(page: ServicePage): string {
  return serviceLabel(page.serviceKey);
}

// Garde-fou : le map couvre exactement les 4 services du catalogue.
const _CATALOG_KEYS = SERVICES.map((s) => s.key).sort();
const _PAGE_KEYS = SERVICE_SLUGS.map((s) => SERVICE_PAGES[s].serviceKey).sort();
if (
  process.env.NODE_ENV !== "production" &&
  JSON.stringify(_CATALOG_KEYS) !== JSON.stringify(_PAGE_KEYS)
) {
  throw new Error(
    "SERVICE_PAGES doit couvrir exactement les 4 services du catalogue (catalog.ts).",
  );
}
