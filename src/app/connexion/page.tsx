import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { demanderLienConnexion } from "./actions";

export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Connectez-vous par lien magique : recevez un lien de connexion par e-mail, sans mot de passe à retenir.",
  robots: { index: false },
};

/**
 * Traduction des codes d'erreur (les nôtres + ceux d'Auth.js arrivant via
 * pages.error). Messages volontairement génériques : ils ne révèlent jamais
 * si une adresse existe en base ni un détail technique.
 */
const MESSAGES_ERREUR: Record<string, string> = {
  EmailInvalide: "Cette adresse e-mail ne semble pas valide. Vérifiez la saisie.",
  TropDeTentatives:
    "Trop de demandes en peu de temps. Patientez quelques minutes avant de réessayer.",
  EnvoiDesactive:
    "L'envoi d'e-mails n'est pas encore activé. Réessayez un peu plus tard.",
  Indisponible:
    "La connexion ouvre très bientôt — revenez dans quelques jours.",
  EchecEnvoi:
    "L'e-mail n'a pas pu être envoyé. Réessayez dans quelques instants.",
  Verification:
    "Ce lien de connexion est invalide ou a expiré. Demandez-en un nouveau ci-dessous.",
  Configuration:
    "La connexion est momentanément indisponible. Réessayez un peu plus tard.",
  AccessDenied: "La connexion n'a pas pu aboutir. Réessayez.",
};
const MESSAGE_DEFAUT = "Une erreur est survenue. Réessayez.";

export default async function Connexion({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const messageErreur = error
    ? (MESSAGES_ERREUR[error] ?? MESSAGE_DEFAUT)
    : null;

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-20">
      <p className="kicker">Connexion</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em]">
        Accédez à votre espace
      </h1>
      <p className="mt-4 text-body">
        Recevez un lien de connexion par e-mail — pas de mot de passe à
        retenir. Première visite ? Le même lien crée votre compte {BRAND}.
      </p>

      <div className="mt-8 rounded-[20px] border border-line bg-surface p-6 shadow-panel sm:p-8">
        {messageErreur && (
          <p
            role="alert"
            className="mb-6 rounded-[12px] border border-primary-border bg-primary-tint p-4 text-sm text-body"
          >
            {messageErreur}
          </p>
        )}

        <form action={demanderLienConnexion}>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-ink"
          >
            Votre adresse e-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={254}
            placeholder="vous@exemple.fr"
            className="mt-2 w-full rounded-[12px] border border-line bg-cream px-4 py-3 text-sm text-body outline-none transition-colors focus:border-primary"
          />
          <button
            type="submit"
            className="mt-4 w-full rounded-[14px] bg-primary px-4 py-3 font-semibold text-surface transition-colors hover:bg-primary-dark"
          >
            Recevoir mon lien de connexion
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs text-muted">
        Le lien est valable 24&nbsp;h et ne sert qu&apos;une fois. Votre adresse
        e-mail sert uniquement à vous connecter —{" "}
        <a href="/confidentialite" className="underline hover:text-primary">
          notre page Confidentialité
        </a>{" "}
        détaille ce que nous faisons (et ne faisons pas) de vos données.
      </p>
      <p className="mt-2 text-xs text-muted">
        Aucun démarchage téléphonique — tout se passe en ligne, par écrit.
      </p>
    </div>
  );
}
