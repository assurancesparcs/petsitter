import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

// Carte OpenGraph par défaut (1200×630), générée à la volée sans police ni
// image externe (contrainte ImageResponse). Fond crème, marque en gros, accent
// vermillon. Aucune donnée inventée, aucun vocabulaire téléphone.
export const alt = `${BRAND} — Garde d'animaux, 0 % de commission`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CREAM = "#EDE6DA";
const VERMILLON = "#DD5A3F";
const INK = "#1C1B1A";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: CREAM,
          padding: "80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "32px 32px 32px 10px",
              backgroundColor: VERMILLON,
              marginRight: 28,
            }}
          />
          <div
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: INK,
              letterSpacing: "-0.02em",
            }}
          >
            {BRAND}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              color: INK,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            Garde d&apos;animaux
          </div>
          <div
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: VERMILLON,
              marginTop: 28,
              lineHeight: 1.2,
            }}
          >
            0 % de commission — le pet sitter touche 100 %
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
