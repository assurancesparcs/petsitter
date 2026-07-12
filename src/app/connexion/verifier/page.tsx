import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "E-mail envoyé",
  description: "Votre lien de connexion vient de vous être envoyé par e-mail.",
  robots: { index: false },
};

/** Page de confirmation après demande de lien magique (pages.verifyRequest). */
export default function Verifier() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-bold">E-mail envoyé</h1>
      <div className="mt-6 rounded-2xl border border-line bg-white p-6">
        <p className="text-ink/80">
          Si l&apos;adresse saisie est valide, un lien de connexion vient de
          vous être envoyé. Ouvrez l&apos;e-mail et cliquez sur{" "}
          <strong>« Se connecter »</strong> — c&apos;est tout.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-ink/70">
          <li>Le lien est valable 24&nbsp;h et ne sert qu&apos;une seule fois.</li>
          <li>Rien reçu au bout de quelques minutes ? Vérifiez vos spams.</li>
          <li>
            Vous pouvez fermer cette page : la connexion s&apos;ouvrira depuis
            l&apos;e-mail.
          </li>
        </ul>
      </div>
      <p className="mt-6 text-sm text-ink/60">
        Adresse erronée ?{" "}
        <Link href="/connexion" className="underline hover:text-primary">
          Demander un nouveau lien
        </Link>
        .
      </p>
    </div>
  );
}
