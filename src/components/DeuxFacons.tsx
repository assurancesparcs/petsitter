import Link from "next/link";

/**
 * « Deux façons de trouver » — rend visible le second parcours de la
 * plateforme (le propriétaire dépose sa demande, les pet sitters candidatent),
 * à côté du parcours classique de recherche par code postal.
 * Copy strictement factuelle : aucun nombre de candidatures promis, aucun
 * délai de réponse, aucune couverture garantie (Règle de vocabulaire).
 */

const ETAPES_RECHERCHE = [
  "Entrez votre code postal",
  "Parcourez les fiches vérifiées : services, tarif, disponibilités, avis",
  "Contactez le profil qui vous plaît, directement depuis sa fiche",
];

const ETAPES_DEMANDE = [
  "Déposez votre demande : dates, animal, service, commune — 0 € débité, votre carte est simplement enregistrée",
  "Elle est diffusée automatiquement aux pet sitters compatibles de votre zone",
  "Les pet sitters intéressés candidatent, chacun avec son tarif ferme et un message",
  "Vous comparez, vous choisissez — et vous ne payez qu'à ce moment-là",
];

export function DeuxFacons() {
  return (
    <section aria-labelledby="deux-facons" className="mt-16">
      <p className="kicker">Deux façons de trouver</p>
      <h2
        id="deux-facons"
        className="mt-2 max-w-3xl text-2xl font-bold sm:text-3xl"
      >
        Cherchez vous-même — ou laissez les pet sitters venir à vous
      </h2>
      <p className="mt-3 max-w-2xl text-body">
        Deux chemins, les mêmes garanties : identité vérifiée pour chaque pet
        sitter, 0 % de commission sur la garde, 0 € débité tant que personne
        n&apos;a accepté.
      </p>

      <div className="mt-8 grid items-stretch gap-4 lg:grid-cols-2">
        {/* ===== Chemin A — Vous cherchez ===== */}
        <article className="flex flex-col rounded-[20px] border border-line bg-surface p-6 sm:p-8">
          <p className="kicker">Chemin nº 1 · Vous cherchez</p>
          <h3 className="mt-2 text-xl font-bold text-ink">
            Parcourez les profils vérifiés, à votre rythme
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Vous préférez comparer par vous-même ? Regardez qui garde des
            animaux près de chez vous et faites votre choix, fiche par fiche.
          </p>
          <ol className="mt-5 space-y-3">
            {ETAPES_RECHERCHE.map((e, i) => (
              <li key={e} className="flex items-start gap-3 text-sm text-body">
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-xs font-bold text-ink"
                >
                  {i + 1}
                </span>
                <span>{e}</span>
              </li>
            ))}
          </ol>
          <div className="mt-auto pt-6">
            <Link
              href="/recherche"
              className="inline-flex rounded-[14px] border border-line px-6 py-3 font-bold text-body transition-colors hover:border-primary hover:text-primary"
            >
              Voir les pet sitters
            </Link>
          </div>
        </article>

        {/* ===== Chemin B — Ils viennent à vous (mis en avant) ===== */}
        <article className="relative flex flex-col rounded-[20px] border-2 border-forest-border bg-forest-tint p-6 sm:p-8">
          <span className="absolute -top-3 left-6 rounded-full bg-forest px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-surface">
            Le plus simple
          </span>
          <p className="kicker">Chemin nº 2 · Ils viennent à vous</p>
          <h3 className="mt-2 text-xl font-bold text-ink">
            Décrivez votre besoin. Les pet sitters candidatent.
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-forest-text-2">
            Une seule demande, zéro recherche : décrivez la garde une fois,
            puis laissez les candidatures venir — avec leur tarif, noir sur
            blanc.
          </p>
          <ol className="mt-5 space-y-3">
            {ETAPES_DEMANDE.map((e, i) => (
              <li key={e} className="flex items-start gap-3 text-sm text-body">
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest font-mono text-xs font-bold text-surface"
                >
                  {i + 1}
                </span>
                <span>{e}</span>
              </li>
            ))}
          </ol>
          <div className="mt-auto pt-6">
            <Link
              href="/demande"
              className="inline-flex rounded-[14px] bg-primary px-6 py-3 font-bold text-surface transition-colors hover:bg-primary-dark"
            >
              Déposer ma demande — 0 € aujourd&apos;hui
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
