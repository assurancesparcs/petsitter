/**
 * Le Journal (PLAN.md §8 — hub éditorial) — articles de fond, factuels et
 * honnêtes. Aucune statistique inventée, aucun faux témoignage, aucun auteur
 * fictif : les articles sont signés « L'équipe AlloPetsitter ». Vocabulaire de
 * mise en relation, chat = chien = NAC à égalité, support écrit uniquement.
 *
 * Structure calquée sur src/content/guides.ts pour réutiliser le même rendu de
 * blocs (titres, paragraphes, listes). Sujets du LOT B exclus.
 */

export type Article = {
  slug: string;
  title: string;
  description: string;
  updated: string; // AAAA-MM-JJ
  kicker: string; // étiquette de rubrique
  body: { h?: string; p?: string; ul?: string[] }[];
};

export const AUTHOR = "L'équipe AlloPetsitter" as const;

export const ARTICLES: Article[] = [
  {
    slug: "pourquoi-zero-commission",
    title: "Pourquoi 0 % de commission sur la garde",
    description:
      "Nous ne prenons rien sur ce que vous versez au pet sitter. Voici pourquoi ce choix change la relation de confiance — et comment la plateforme se rémunère autrement.",
    updated: "2026-07-13",
    kicker: "Notre modèle",
    body: [
      {
        p: "La plupart des plateformes de garde d'animaux prélèvent une commission sur chaque prestation. Sur AlloPetsitter, ce prélèvement est nul : le pet sitter touche 100 % de ce que vous lui versez. Ce n'est pas une promotion de lancement, c'est le cœur du modèle.",
      },
      {
        h: "Ce que change une commission, concrètement",
        p: "Quand une plateforme prend, disons, 15 % sur chaque garde, deux choses arrivent. D'abord, le pet sitter gagne moins pour un travail identique — ou remonte ses tarifs pour compenser, et c'est vous qui payez. Ensuite, la plateforme a intérêt à multiplier et à gonfler les transactions, pas forcément à vous mettre en relation avec la bonne personne.",
      },
      {
        p: "En retirant la commission, on retire cet intérêt divergent. Le prix affiché par le pet sitter est le prix qu'il touche, intégralement. Vous savez exactement où va votre argent.",
      },
      {
        h: "Alors, comment gagnons-nous notre vie ?",
        p: "Notre seul revenu est la mise en relation, payée par le propriétaire, et uniquement lorsqu'un pet sitter a accepté la garde. Trois formules existent : un Pass ponctuel selon la durée de la garde, ou un abonnement mensuel sans engagement pour qui fait garder souvent. Côté pet sitter, l'inscription et la présence sur la plateforme sont gratuites.",
      },
      {
        ul: [
          "Aucun débit tant qu'aucun pet sitter n'a accepté votre demande",
          "Le tarif de garde revient en entier au pet sitter",
          "Le prix de la mise en relation est affiché à l'avance, sans frais surprise au moment de payer",
        ],
      },
      {
        h: "Une transparence qui s'écrit noir sur blanc",
        p: "Nous détaillons publiquement chaque source de revenu sur une page dédiée, datée, dont l'historique de modifications est destiné à rester consultable. Si un service optionnel payant apparaît un jour, il sera expliqué là, avec son prix, avant son lancement — jamais découvert après coup.",
      },
      {
        p: "La confiance ne se décrète pas : elle se vérifie. Retirer la commission, c'est retirer une raison de se méfier.",
      },
    ],
  },
  {
    slug: "choisir-un-pet-sitter-en-confiance",
    title: "Comment choisir un pet sitter en confiance",
    description:
      "Vérification d'identité, avis adossés à de vraies gardes, rencontre préalable : les repères concrets pour confier son animal sereinement.",
    updated: "2026-07-13",
    kicker: "Bien s'y prendre",
    body: [
      {
        p: "Confier son animal, c'est confier une partie de son foyer. La confiance ne devrait pas reposer sur une jolie photo de profil, mais sur des repères vérifiables. En voici quelques-uns, et la façon dont la plateforme les rend visibles.",
      },
      {
        h: "Une identité vérifiée avant toute demande",
        p: "Chaque pet sitter dépose une pièce d'identité et un selfie, examinés avant qu'il ne devienne visible et puisse recevoir des demandes. Au lancement, ce contrôle est réalisé en interne par une personne ; un prestataire de vérification d'identité européen prendra le relais ensuite. Les fichiers déposés sont supprimés dès la décision : seul le statut « identité vérifiée » est conservé, jamais vos documents.",
      },
      {
        h: "Des avis adossés à de vraies gardes",
        p: "Un avis ne compte que s'il correspond à une garde réellement réglée via la plateforme. Il n'y a pas de faux avis, pas de compteur gonflé. Tant qu'un pet sitter n'a pas assez de gardes déclarées pour qu'une note veuille dire quelque chose, il porte simplement un badge « Nouveau » — pas une fausse note, pas un vide déguisé en score.",
      },
      {
        h: "La rencontre préalable, le meilleur des repères",
        p: "Avant toute garde, une rencontre gratuite permet à votre animal et au pet sitter de faire connaissance, et à vous de poser vos questions. C'est souvent le moment qui lève les derniers doutes. Quelques points utiles à aborder :",
      },
      {
        ul: [
          "L'expérience du pet sitter avec un animal au caractère proche du vôtre",
          "Sa disponibilité réelle sur l'intégralité de vos dates, pas seulement le début",
          "Le rythme de nouvelles que vous souhaitez pendant la garde",
          "Les consignes précises : alimentation, traitements, habitudes, coordonnées du vétérinaire",
        ],
      },
      {
        h: "Notre rôle, et ses limites",
        p: "AlloPetsitter met en relation, elle ne garde pas les animaux. La garde est proposée et exécutée par le pet sitter, en toute indépendance, avec un contrat de garde type entre vous et lui. Nous vous aidons à trouver la bonne personne ; le choix final vous appartient. Si un pet sitter confirmé doit annuler, une recherche prioritaire de remplaçant est lancée — c'est une obligation de moyens, et si personne ne prend le relais, vous êtes remboursé automatiquement.",
      },
    ],
  },
  {
    slug: "chat-chien-nac-meme-exigence",
    title: "Chat, chien, NAC : la même exigence",
    description:
      "Le chat n'est pas un chien au rabais, et un NAC n'est pas un animal de seconde zone. Pourquoi nous traitons chaque espèce à égalité, sans hiérarchie.",
    updated: "2026-07-13",
    kicker: "Notre conviction",
    body: [
      {
        p: "Beaucoup d'outils de garde ont été pensés d'abord pour le chien, puis ont ajouté le chat, et parfois oublié le reste. Nous partons du principe inverse : chat, chien et NAC (nouveaux animaux de compagnie) méritent la même attention et les mêmes garanties de sérénité.",
      },
      {
        h: "Des besoins différents, une exigence identique",
        p: "Traiter à égalité ne veut pas dire traiter à l'identique. Chaque espèce a ses besoins propres, et un bon service les respecte plutôt que de les niveler.",
      },
      {
        ul: [
          "Le chat est territorial : pour beaucoup, la visite à domicile est plus douce que le déplacement, car il garde ses repères et ses odeurs",
          "Le chien a souvent besoin de sorties, d'exercice et de présence régulière",
          "Les NAC — lapin, furet, rongeurs, oiseaux, reptiles — demandent des connaissances spécifiques, sur l'alimentation comme sur l'environnement",
        ],
      },
      {
        h: "Ce que l'égalité change sur la plateforme",
        p: "Concrètement, aucune espèce n'est reléguée au second plan. Un pet sitter indique les animaux qu'il accueille, et la recherche vous aide à trouver quelqu'un réellement à l'aise avec le vôtre — un chat craintif, un chiot, un furet. La même vérification d'identité, les mêmes avis vérifiés et la même rencontre préalable s'appliquent, quelle que soit l'espèce que vous confiez.",
      },
      {
        h: "Pourquoi ça compte",
        p: "Considérer un chat comme un chien plus discret, ou un NAC comme un cas marginal, mène à des services bâclés. En posant l'égalité comme principe, on s'oblige à bien faire pour chacun. C'est une conviction simple, mais elle guide beaucoup de nos choix.",
      },
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
