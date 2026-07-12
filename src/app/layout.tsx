import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BRAND, BASE_URL } from "@/lib/brand";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: `${BRAND} — Trouvez un pet sitter pour votre chat ou votre chien`,
    template: `%s · ${BRAND}`,
  },
  description:
    "Mise en relation avec des pet sitters indépendants partout en France. 0 % de commission : le pet sitter touche 100 % de ce que vous lui versez. Vous ne payez que si un pet sitter accepte votre garde.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
