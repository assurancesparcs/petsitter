import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { serviceLabel, speciesLabel } from "@/domains/marketplace/catalog";
import { displayName } from "@/domains/marketplace/sitters";
import { estDebloquee, texteAffiche } from "@/domains/messaging/access";

export const metadata: Metadata = {
  title: "Mes messages",
  description: "Vos conversations AlloPetsitter.",
  robots: { index: false },
};

const dateFr = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

type Item = {
  id: string;
  titre: string;
  sousTitre: string;
  apercu: string;
  unlocked: boolean;
  date: Date;
};

export default async function Messages() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  const userId = session.user.id;

  const db = getPrisma();
  if (!db) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-3xl font-extrabold tracking-[-0.02em]">Mes messages</h1>
        <p className="mt-4 rounded-[12px] border border-line bg-surface p-6 text-muted">
          Messagerie momentanément indisponible.
        </p>
      </div>
    );
  }

  // Côté propriétaire : ses demandes ayant des candidatures (ou des messages).
  const asOwner = await db.careRequest.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      service: true,
      species: true,
      status: true,
      createdAt: true,
      mission: { select: { confirmedSitterId: true } },
      applications: {
        select: {
          sitterProfileId: true,
          sitterProfile: {
            select: { user: { select: { firstName: true, lastName: true } } },
          },
        },
      },
    },
    take: 50,
  });

  // Côté pet sitter : les demandes où il a candidaté / est confirmé.
  const profile = await db.sitterProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  const asSitter = profile
    ? await db.careRequest.findMany({
        where: { applications: { some: { sitterProfileId: profile.id } } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          service: true,
          species: true,
          status: true,
          createdAt: true,
          owner: { select: { id: true, firstName: true, lastName: true } },
          mission: { select: { confirmedSitterId: true, backupSitterId: true } },
        },
        take: 50,
      })
    : [];

  // Messages par conversation (masqués si pré-déblocage — jamais le brut). On
  // charge senderId pour rejouer CÔTÉ SERVEUR la même isolation que le fil :
  // un sitter ne « voit » comme dernier message que le sien ou celui de l'owner,
  // jamais celui d'un autre candidat.
  type Msg = {
    senderId: string;
    body: string | null;
    maskedBody: string | null;
    createdAt: Date;
  };
  const ids = [...new Set([...asOwner.map((d) => d.id), ...asSitter.map((d) => d.id)])];
  const parConv = new Map<string, Msg[]>();
  if (ids.length) {
    const rows = await db.structuredMessage.findMany({
      where: { careRequestId: { in: ids } },
      orderBy: { createdAt: "desc" },
      select: {
        careRequestId: true,
        senderId: true,
        body: true,
        maskedBody: true,
        createdAt: true,
      },
    });
    for (const m of rows) {
      const arr = parConv.get(m.careRequestId);
      if (arr) arr.push(m);
      else parConv.set(m.careRequestId, [m]);
    }
  }

  const apercuDe = (m: Msg | undefined, unlocked: boolean, secours: string): string => {
    if (!m) return secours;
    const t = texteAffiche(m, unlocked).trim();
    return t.length > 80 ? `${t.slice(0, 80)}…` : t || secours;
  };

  const itemsOwner: Item[] = asOwner
    // On garde les demandes ayant au moins une candidature OU un message.
    .filter((d) => d.applications.length > 0 || parConv.has(d.id))
    .map((d) => {
      const unlocked = estDebloquee(d.status);
      // Le propriétaire voit tous les messages : dernier message global.
      const dernier = (parConv.get(d.id) ?? [])[0];
      const confirme = d.mission
        ? d.applications.find(
            (a) => a.sitterProfileId === d.mission!.confirmedSitterId,
          )
        : undefined;
      const cible = confirme ?? d.applications[0];
      const nom = cible
        ? displayName(cible.sitterProfile.user.firstName, cible.sitterProfile.user.lastName)
        : "Pet sitter";
      const titre =
        d.applications.length > 1 && !confirme
          ? `${d.applications.length} pet sitters`
          : nom;
      return {
        id: d.id,
        titre,
        sousTitre: `${serviceLabel(d.service)} · ${speciesLabel(d.species)}`,
        apercu: apercuDe(dernier, unlocked, "Aucun message — démarrez la conversation."),
        unlocked,
        date: dernier?.createdAt ?? d.createdAt,
      };
    });

  const itemsSitter: Item[] = asSitter
    // Post-déblocage : un candidat NON retenu perd l'accès (même règle que
    // chargerConversation) — sinon l'aperçu révélerait le brut de l'owner.
    .filter((d) => {
      if (!estDebloquee(d.status)) return true;
      const sid = profile!.id;
      return (
        !!d.mission &&
        (d.mission.confirmedSitterId === sid || d.mission.backupSitterId === sid)
      );
    })
    .map((d) => {
      const unlocked = estDebloquee(d.status);
      // Isolation : le sitter ne « voit » que son message ou celui de l'owner.
      const dernier = (parConv.get(d.id) ?? []).find(
        (m) => m.senderId === userId || m.senderId === d.owner.id,
      );
      return {
        id: d.id,
        titre: displayName(d.owner.firstName, d.owner.lastName),
        sousTitre: `${serviceLabel(d.service)} · ${speciesLabel(d.species)}`,
        apercu: apercuDe(dernier, unlocked, "Aucun message — démarrez la conversation."),
        unlocked,
        date: dernier?.createdAt ?? d.createdAt,
      };
    });

  // Dédoublonnage (au cas où un même utilisateur serait des deux côtés) + tri.
  const parId = new Map<string, Item>();
  for (const it of [...itemsOwner, ...itemsSitter]) if (!parId.has(it.id)) parId.set(it.id, it);
  const items = [...parId.values()].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <p className="kicker">Espace personnel</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
        Mes messages
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        Échangez avec votre interlocuteur. Tant que la mise en relation n&apos;est
        pas réglée, les coordonnées (téléphone, e-mail, réseaux) restent masquées —
        c&apos;est automatique.
      </p>

      {items.length === 0 ? (
        <div className="mt-8 rounded-[20px] border border-dashed border-line bg-surface p-8 text-center">
          <p className="font-semibold text-ink">Aucune conversation pour le moment</p>
          <p className="mt-1 text-sm text-muted">
            Une conversation s&apos;ouvre dès qu&apos;une candidature relie une
            demande de garde à un pet sitter.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((it) => (
            <li key={it.id}>
              <Link
                href={`/compte/messages/${it.id}`}
                className="block rounded-[16px] border border-line bg-surface p-4 transition-colors hover:border-primary"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-semibold text-ink">{it.titre}</p>
                  <span className="shrink-0 font-mono text-xs text-faint">
                    {dateFr(it.date)}
                  </span>
                </div>
                <p className="kicker mt-0.5">{it.sousTitre}</p>
                <p className="mt-1.5 truncate text-sm text-muted">{it.apercu}</p>
                {!it.unlocked && (
                  <span className="mt-2 inline-block rounded-full border border-primary-border bg-primary-tint px-2.5 py-0.5 text-[11px] font-semibold text-primary-deep">
                    Coordonnées masquées
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
