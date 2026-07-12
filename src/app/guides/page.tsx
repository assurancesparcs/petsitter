import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/content/guides";

export const metadata: Metadata = {
  title: "Guides — conseils pour la garde de votre animal",
  description:
    "Nos guides pratiques pour bien préparer la garde de votre chat ou de votre chien et choisir le bon pet sitter.",
};

export default function Guides() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Guides</h1>
      <p className="mt-2 text-ink/70">
        Des conseils simples et factuels pour confier votre animal en toute
        sérénité — pour les chats comme pour les chiens.
      </p>
      <div className="mt-8 grid gap-4">
        {GUIDES.map((g) => (
          <Link
            key={g.slug}
            href={`/guides/${g.slug}`}
            className="rounded-2xl border border-line bg-white p-6 hover:border-primary"
          >
            <h2 className="text-lg font-semibold text-primary">{g.title}</h2>
            <p className="mt-2 text-sm text-ink/80">{g.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
