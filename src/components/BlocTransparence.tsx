/**
 * Bloc Transparence — l'objet le plus important de l'identité (charte Claude
 * Design). Présent sur chaque fiche pet sitter et chaque devis :
 * « Vous versez X · Le pet sitter reçoit X (100 %) · Commission : 0 € ».
 * Beau, clair, irréfutable.
 */
export function BlocTransparence({ montant }: { montant?: string }) {
  return (
    <div className="rounded-[18px] border border-forest-border bg-forest-tint p-5">
      <div className="grid gap-px overflow-hidden rounded-[12px] border border-forest-border bg-forest-border sm:grid-cols-3">
        <Ligne label="Vous versez" value={montant ?? "—"} />
        <Ligne label="Le pet sitter reçoit" value={montant ?? "—"} strong note="100 %" />
        <Ligne label="Commission AlloPetsitter" value="0 €" />
      </div>
    </div>
  );
}

function Ligne({
  label,
  value,
  note,
  strong,
}: {
  label: string;
  value: string;
  note?: string;
  strong?: boolean;
}) {
  return (
    <div className="bg-surface p-4 text-center">
      <p className="kicker">{label}</p>
      <p
        className={`mt-1 font-mono text-2xl font-bold ${strong ? "text-success" : "text-forest-text"}`}
      >
        {value}
      </p>
      {note && <p className="font-mono text-xs font-bold text-success">{note}</p>}
    </div>
  );
}
