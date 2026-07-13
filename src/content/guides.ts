/**
 * Hub de contenu (PLAN.md §8) — guides utiles, démarrent l'ancienneté SEO.
 * Contenu factuel, sans statistique inventée, chat à égalité, vocabulaire de
 * mise en relation. Sujets du LOT B (cf. flag insurance_live) exclus d'ici.
 */
import { PRICING } from "@/lib/pricing";

export type Guide = {
  slug: string;
  title: string;
  description: string;
  updated: string; // AAAA-MM-JJ
  body: { h?: string; p?: string; ul?: string[] }[];
};

export const GUIDES: Guide[] = [
  {
    slug: "choisir-son-pet-sitter",
    title: "Bien choisir son pet sitter en quelques questions",
    description:
      "Les bons réflexes pour confier son chat ou son chien à un pet sitter en toute sérénité : ce qu'il faut demander, vérifier et prévoir.",
    updated: "2026-07-12",
    body: [
      {
        p: "Confier son animal à quelqu'un demande de la confiance. Voici les questions simples qui permettent de faire le bon choix, que vous cherchiez une visite à domicile pour votre chat ou une garde pour votre chien.",
      },
      {
        h: "1. L'expérience correspond-elle à votre animal ?",
        p: "Un pet sitter à l'aise avec les chats craintifs, les chiots ou les animaux âgés n'a pas le même profil. Décrivez le caractère et les besoins de votre animal, et demandez au pet sitter comment il s'y prendrait.",
      },
      {
        h: "2. Le pet sitter est-il disponible sur toutes vos dates ?",
        p: "Un calendrier à jour évite les mauvaises surprises. Assurez-vous que la disponibilité couvre l'intégralité de la période, pas seulement le début.",
      },
      {
        h: "3. Une rencontre préalable est-elle possible ?",
        p: "Une première rencontre, avant la garde, permet à votre animal et au pet sitter de faire connaissance, et de lever les derniers doutes. C'est le meilleur réducteur d'anxiété, pour vous comme pour votre animal.",
      },
      {
        h: "Ce que vous voyez avant de choisir",
        ul: [
          "Les services proposés et le tarif, fixé librement par le pet sitter",
          "La zone couverte et les disponibilités",
          "Les avis laissés après de vraies gardes",
        ],
      },
      {
        p: "Sur AlloPetsitter, vous ne réglez la mise en relation que lorsqu'un pet sitter a accepté votre demande — jamais avant.",
      },
    ],
  },
  {
    slug: "faire-garder-son-chat",
    title: "Faire garder son chat : la visite à domicile plutôt que la pension",
    description:
      "Le chat est un animal territorial. Pour beaucoup de chats, la visite à domicile est une alternative plus douce que la pension. Explications.",
    updated: "2026-07-12",
    body: [
      {
        p: "Contrairement au chien, le chat est fortement attaché à son territoire. Un changement d'environnement peut être une vraie source de stress. C'est pourquoi, pour de nombreux chats, la solution la plus sereine consiste à rester chez soi.",
      },
      {
        h: "La visite à domicile, comment ça marche",
        p: "Un pet sitter passe chez vous une ou plusieurs fois par jour : nourriture et eau fraîche, litière, jeu et surveillance de l'état de santé. Votre chat garde ses repères, ses odeurs et ses habitudes.",
      },
      {
        h: "Quand l'envisager",
        ul: [
          "Chat casanier ou anxieux, qui supporte mal les transports",
          "Absences de quelques jours à quelques semaines",
          "Plusieurs chats à la maison, plus simples à garder ensemble chez eux",
        ],
      },
      {
        h: "Bien préparer la visite",
        ul: [
          "Laissez des consignes claires : quantités, horaires, cachettes habituelles",
          "Indiquez les coordonnées de votre vétérinaire",
          "Montrez l'emplacement de la nourriture, de la litière et des jouets",
        ],
      },
      {
        p: "Cherchez un pet sitter proposant la visite à domicile près de chez vous, et organisez une rencontre préalable pour que tout soit clair avant votre départ.",
      },
    ],
  },
  {
    slug: "preparer-la-garde",
    title: "Préparer la garde de son animal : la checklist avant de partir",
    description:
      "Consignes, matériel, contacts utiles : la liste des choses à préparer pour que la garde de votre chat ou de votre chien se passe bien.",
    updated: "2026-07-12",
    body: [
      {
        p: "Une garde réussie se prépare avant le départ. Voici l'essentiel à transmettre au pet sitter pour qu'il ait tout en main.",
      },
      {
        h: "Les informations à transmettre",
        ul: [
          "Habitudes alimentaires : quantités, horaires, interdits",
          "Traitements en cours et où les trouver",
          "Comportement : peurs, jeux préférés, tolérance aux autres animaux",
          "Coordonnées du vétérinaire habituel",
        ],
      },
      {
        h: "Le matériel à préparer",
        ul: [
          "Nourriture en quantité suffisante pour toute la durée",
          "Litière, sacs, gamelles, laisse ou harnais",
          "Jouets et couchage habituels",
        ],
      },
      {
        h: "Avant de fermer la porte",
        ul: [
          "Faites un tour des lieux avec le pet sitter",
          "Laissez un moyen de vous joindre et un contact de secours",
          "Convenez du rythme des nouvelles que vous souhaitez recevoir",
        ],
      },
    ],
  },
  {
    slug: "combien-coute-une-garde-d-animaux",
    title: "Combien coûte une garde d'animaux ?",
    description:
      "Le prix d'une garde d'animaux dépend du pet sitter, du service et de la durée. Voici comment le coût se compose et ce que facture AlloPetsitter, en toute transparence.",
    updated: "2026-07-13",
    body: [
      {
        p: "Il n'existe pas de prix unique pour une garde d'animaux : le tarif est fixé librement par chaque pet sitter, qui le perçoit à 100 %. AlloPetsitter ne fixe pas ce tarif et ne prélève aucune commission dessus. Comprendre la structure du coût aide à comparer les propositions sereinement, plutôt que de chercher un « prix moyen » qui ne veut pas dire grand-chose.",
      },
      {
        h: "Deux montants distincts, à ne pas confondre",
        ul: [
          "Le tarif de la garde : fixé par le pet sitter, versé en direct, perçu à 100 % par lui — aucune commission.",
          "Le frais de mise en relation d'AlloPetsitter : forfaitaire et affiché à l'avance, c'est le seul revenu de la plateforme.",
        ],
      },
      {
        h: "Ce que facture AlloPetsitter",
        p: `La plateforme facture uniquement la mise en relation, à un tarif fixe et connu d'avance : ${PRICING.passCourt.label} à ${PRICING.passCourt.price} (${PRICING.passCourt.detail.toLowerCase()}), ${PRICING.passSejour.label} à ${PRICING.passSejour.price} (${PRICING.passSejour.detail.toLowerCase()}), ou l'${PRICING.abonnement.label.toLowerCase()} à ${PRICING.abonnement.price} (${PRICING.abonnement.unit}). Le Pass est déduit automatiquement de la durée de la garde, il ne se choisit pas. Vous n'êtes débité que lorsqu'un pet sitter a accepté votre garde.`,
      },
      {
        h: "Ce qui fait varier le tarif de la garde",
        ul: [
          "La durée : nombre de visites, de nuits ou de promenades sur la période.",
          "Le service : une visite à domicile, une garde à domicile, une garde chez le pet sitter ou une promenade ne demandent pas le même temps.",
          "Le nombre d'animaux et leurs besoins : plusieurs animaux, un traitement à administrer ou des sorties fréquentes demandent davantage d'attention.",
        ],
      },
      {
        p: "Pour estimer un budget, décrivez précisément votre besoin : les pet sitters disponibles près de chez vous candidatent avec leur tarif, et vous choisissez en connaissance de cause. Le montant que vous versez au pet sitter lui revient intégralement.",
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
