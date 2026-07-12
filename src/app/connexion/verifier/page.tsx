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
    <div className="mx-auto max-w-md px-4 py-16 sm:py-20">
      <p className="kicker">Connexion</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em]">
        E-mail envoyé
      </h1>
      <div className="mt-6 rounded-[20px] border border-line bg-surface p-6 shadow-panel sm:p-8">
        <p className="text-body">
          Si l&apos;adresse saisie est valide, un lien de connexion vient de
          vous être envoyé. Ouvrez l&apos;e-mail et cliquez sur{" "}
          <strong className="text-ink">« Se connecter »</strong> — c&apos;est
          tout.
        </p>
        <ul className="mt-5 space-y-3 text-sm text-body">
          <li className="flex gap-3">
            <span aria-hidden className="font-mono font-bold text-success">
              ✓
            </span>
            <span>Le lien est valable 24&nbsp;h et ne sert qu&apos;une seule fois.</span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="font-mono font-bold text-success">
              ✓
            </span>
            <span>Rien reçu au bout de quelques minutes ? Vérifiez vos spams.</span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="font-mono font-bold text-success">
              ✓
            </span>
            <span>
              Vous pouvez fermer cette page : la connexion s&apos;ouvrira depuis
              l&apos;e-mail.
            </span>
          </li>
        </ul>
      </div>
      <p className="mt-6 text-sm text-muted">
        Adresse erronée ?{" "}
        <Link href="/connexion" className="underline hover:text-primary">
          Demander un nouveau lien
        </Link>
        .
      </p>
    </div>
  );
}
