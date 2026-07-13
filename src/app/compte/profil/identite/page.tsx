import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isStorageConfigured } from "@/lib/storage";
import { soumettreIdentite } from "./actions";

export const metadata: Metadata = {
  title: "Vérification d'identité",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const ERREURS: Record<string, string> = {
  indisponible: "Service momentanément indisponible, réessayez.",
  bientot: "Vérification d'identité bientôt disponible — revenez très prochainement.",
  profil: "Complétez d'abord votre profil (prénom, commune) avant la vérification.",
  piece: "Pièce d'identité manquante ou invalide (JPEG, PNG ou PDF, 8 Mo max).",
  selfie: "Selfie manquant ou invalide (JPEG, PNG ou PDF, 8 Mo max).",
  stockage: "Le dépôt a échoué, réessayez dans un instant.",
};

const dateFr = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

export default async function VerificationIdentite({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "SITTER") redirect("/compte");

  const sp = await searchParams;
  const ok = one(sp.ok);
  const erreur = one(sp.erreur);

  const db = getPrisma();
  const profile = db
    ? await db.sitterProfile.findUnique({
        where: { userId: session.user.id },
        include: { identityVerification: true },
      })
    : null;

  const verif = profile?.identityVerification ?? null;
  const status = verif?.status ?? "pending";
  const storageOn = isStorageConfigured();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <Link
        href="/compte/profil"
        className="text-sm font-semibold text-primary hover:text-primary-dark"
      >
        ← Retour à mon profil
      </Link>

      <p className="kicker mt-4">Espace pet sitter</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
        Vérification d&apos;identité
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        Le contrôle d&apos;identité est <strong>obligatoire pour recevoir des
        demandes et être visible</strong> dans la recherche. Un administrateur
        examine votre pièce et votre selfie, puis valide votre profil.
      </p>

      {/* Statut courant */}
      <StatutBloc status={status} verif={verif} />

      {/* Messages */}
      {ok && (
        <p className="mt-4 rounded-[12px] border border-forest-border bg-forest-tint px-4 py-3 text-sm font-semibold text-forest-text">
          Documents reçus — votre identité est en cours de vérification.
        </p>
      )}
      {erreur && (
        <p className="mt-4 rounded-[12px] border border-primary-border bg-primary-tint px-4 py-3 text-sm font-semibold text-primary-deep">
          {ERREURS[erreur] ?? "Une erreur est survenue."}
        </p>
      )}

      {/* Bloc RGPD */}
      <div className="mt-6 rounded-[20px] border border-line bg-surface-2 p-5 text-sm text-muted">
        <p className="font-semibold text-ink">Protection de vos données</p>
        <p className="mt-1">
          Votre pièce et votre selfie sont utilisés uniquement pour vérifier
          votre identité. Ils sont conservés en accès privé et{" "}
          <strong>supprimés dès la fin de l&apos;examen</strong> (validé ou
          refusé) : seuls le statut et la date sont conservés, jamais les images.
        </p>
      </div>

      {/* Formulaire de dépôt */}
      {storageOn ? (
        <form
          action={soumettreIdentite}
          encType="multipart/form-data"
          className="mt-8 space-y-6 rounded-[20px] border border-line bg-surface p-6"
        >
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              {status === "submitted"
                ? "Renvoyer mes documents"
                : "Déposer mes documents"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Formats acceptés : JPEG, PNG ou PDF, 8 Mo maximum par fichier.
            </p>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="kicker">Pièce d&apos;identité (recto)</span>
            <input
              type="file"
              name="piece"
              required
              accept="image/jpeg,image/png,application/pdf"
              className="rounded-[12px] border border-line bg-cream px-4 py-3 text-sm text-body file:mr-4 file:rounded-[10px] file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-surface focus:border-primary focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="kicker">Selfie (photo de votre visage)</span>
            <input
              type="file"
              name="selfie"
              required
              accept="image/jpeg,image/png,application/pdf"
              className="rounded-[12px] border border-line bg-cream px-4 py-3 text-sm text-body file:mr-4 file:rounded-[10px] file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-surface focus:border-primary focus:outline-none"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-[14px] bg-primary px-6 py-3.5 font-bold text-surface hover:bg-primary-dark sm:w-auto sm:px-10"
          >
            Envoyer pour vérification
          </button>
        </form>
      ) : (
        <div className="mt-8 rounded-[20px] border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-bold text-ink">
            Vérification bientôt disponible
          </h2>
          <p className="mt-1 text-sm text-muted">
            Le dépôt sécurisé des documents sera activé très prochainement.
            Revenez sous peu pour finaliser votre inscription.
          </p>
        </div>
      )}
    </div>
  );
}

function StatutBloc({
  status,
  verif,
}: {
  status: string;
  verif: { rejectionReason: string | null; verifiedAt: Date | null } | null;
}) {
  const map: Record<
    string,
    { titre: string; texte: string; classe: string }
  > = {
    pending: {
      titre: "Non soumis",
      texte:
        "Déposez votre pièce d'identité et un selfie pour lancer la vérification.",
      classe: "border-line bg-surface",
    },
    submitted: {
      titre: "En cours de vérification",
      texte:
        "Vos documents ont bien été reçus. Un administrateur les examine — vous serez fixé sous peu.",
      classe: "border-forest-border bg-forest-tint",
    },
    verified: {
      titre: "Identité vérifiée",
      texte: verif?.verifiedAt
        ? `Vérifiée le ${dateFr(verif.verifiedAt)}. Vous pouvez publier votre profil.`
        : "Vérifiée. Vous pouvez publier votre profil.",
      classe: "border-forest-border bg-forest-tint",
    },
    rejected: {
      titre: "Vérification refusée",
      texte: verif?.rejectionReason
        ? `Motif : ${verif.rejectionReason}. Vous pouvez déposer de nouveaux documents.`
        : "Vous pouvez déposer de nouveaux documents.",
      classe: "border-primary-border bg-primary-tint",
    },
  };
  const s = map[status] ?? map.pending;
  return (
    <div className={`mt-6 rounded-[20px] border p-5 ${s.classe}`}>
      <p className="font-semibold text-ink">{s.titre}</p>
      <p className="mt-1 text-sm text-muted">{s.texte}</p>
    </div>
  );
}
