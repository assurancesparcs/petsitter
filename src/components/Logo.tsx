import { BRAND } from "@/lib/brand";

/**
 * Logo AlloPetsitter (charte Claude Design) : carré vermillon à rayon
 * asymétrique (queue de bulle) + glyphe combiné — clin d'œil « Allo » à la
 * mise en relation. Le combiné est décoratif : le service est 100 % en ligne,
 * aucun appel téléphonique (README design, règle 1).
 */
export function Logo({ size = 32 }: { size?: number }) {
  const glyph = Math.round(size * 0.47);
  const radius =
    size <= 20 ? "8px 8px 8px 2px" : size <= 36 ? "9px 9px 9px 3px" : "16px 16px 16px 5px";
  return (
    <span className="inline-flex items-center gap-[11px]">
      <span
        aria-hidden
        className="inline-flex items-center justify-center bg-primary"
        style={{ width: size, height: size, borderRadius: radius }}
      >
        <svg viewBox="0 0 24 24" width={glyph} height={glyph} fill="var(--color-surface)">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
        </svg>
      </span>
      <span
        className="font-display font-extrabold tracking-[-0.02em] text-ink"
        style={{ fontSize: size * 0.62 }}
      >
        {BRAND}
      </span>
    </span>
  );
}
