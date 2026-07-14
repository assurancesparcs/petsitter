/**
 * « En bref / Faits vérifiables » — bloc de faits courts, auto-suffisants et
 * citables (GEO/AEO). Formulation alignée sur /llms.txt et /notre-modele, pour
 * qu'un moteur de réponse IA puisse reprendre chaque fait verbatim.
 * Aucune statistique inventée, aucun prix en dur : uniquement des engagements
 * vérifiables du modèle.
 */
const FAITS: { terme: string; detail: string }[] = [
  {
    terme: "0 % de commission sur la garde",
    detail: "Aucune commission n'est prélevée sur le tarif de garde.",
  },
  {
    terme: "Le pet sitter touche 100 %",
    detail: "Le pet sitter fixe son tarif et le perçoit en entier, en direct.",
  },
  {
    terme: "Aucun débit tant qu'un pet sitter n'a pas accepté",
    detail: "La carte est simplement enregistrée : 0 € avant l'acceptation.",
  },
  {
    terme: "Frais de mise en relation fixes, payés une fois",
    detail:
      "Le seul revenu de la plateforme, forfaitaire et connu à l'avance — aucune reconduction tacite.",
  },
  {
    terme: "Avis vérifiés, aucun faux avis",
    detail: "Un avis n'est retenu que s'il est adossé à une garde réellement réglée.",
  },
  {
    terme: "Support 100 % écrit",
    detail: "Assistance en ligne et réponse humaine par écrit, sans ligne vocale.",
  },
];

export function FaitsVerifiables() {
  return (
    <section
      aria-labelledby="faits-verifiables"
      className="rounded-[20px] border border-line bg-surface p-6 sm:p-8"
    >
      <p className="kicker">En bref · faits vérifiables</p>
      <h2
        id="faits-verifiables"
        className="mt-2 font-display text-xl font-bold tracking-[-0.02em] text-ink"
      >
        Ce que vous pouvez vérifier
      </h2>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FAITS.map((f) => (
          <div key={f.terme} className="flex gap-2.5">
            <span aria-hidden className="mt-0.5 font-bold text-success">
              ✓
            </span>
            <div>
              <dt className="font-semibold text-ink">{f.terme}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted">
                {f.detail}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
