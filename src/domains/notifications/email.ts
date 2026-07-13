import "server-only";
import { BRAND, DOMAIN, BASE_URL } from "@/lib/brand";

/**
 * E-mail de relance UNIQUE en cas de débit refusé (3DS exigé, carte expirée,
 * fonds…). Réutilise EXACTEMENT le motif HTTP Resend de l'e-mail de connexion
 * (src/lib/auth.ts) : même clé d'environnement (RESEND_API_KEY / EMAIL_FROM),
 * même dégradation silencieuse si la clé est absente.
 *
 * Anti-dark-pattern : un seul e-mail, factuel, sans fausse urgence. On rappelle
 * qu'AUCUN montant n'a été prélevé et on propose simplement de réessayer.
 *
 * Best-effort ABSOLU : cette fonction NE LÈVE JAMAIS. Un échec d'envoi ne doit
 * pas casser le parcours de paiement ni sa redirection. Jamais de donnée de
 * carte ni de secret dans les logs (code d'erreur / statut HTTP uniquement).
 */

const FROM_DEFAUT = `${BRAND} <connexion@${DOMAIN}>` as const;

function echapperHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function corpsHtml(lien: string): string {
  const url = echapperHtml(lien);
  return `
  <div style="margin:0;padding:24px;background:#faf7f2;color:#1f2a2e;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e5ded2;border-radius:16px;padding:32px;">
      <p style="margin:0;font-size:20px;font-weight:700;color:#16575a;">${BRAND}</p>
      <h1 style="margin:16px 0 0;font-size:18px;">Votre carte n'a pas pu être débitée</h1>
      <p style="margin:12px 0 0;font-size:14px;line-height:1.6;">
        Le débit de la mise en relation n'a pas abouti. <strong>Aucun montant n'a
        été prélevé (0&nbsp;€).</strong> Cela arrive parfois : validation 3-D&nbsp;Secure
        demandée par votre banque, carte expirée, plafond… Vous pouvez réessayer
        quand vous le souhaitez, il n'y a rien d'urgent.
      </p>
      <p style="margin:24px 0;text-align:center;">
        <a href="${url}" style="display:inline-block;background:#16575a;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 28px;border-radius:9999px;">
          Réessayer le paiement
        </a>
      </p>
      <p style="margin:0;font-size:12px;line-height:1.6;color:#1f2a2e;opacity:.7;">
        Votre demande reste en l'état : vous choisirez votre pet sitter une fois
        le paiement finalisé. Aucun débit n'a lieu tant que ce n'est pas le cas.
      </p>
    </div>
  </div>`.trim();
}

function corpsTexte(lien: string): string {
  return [
    `${BRAND} — votre carte n'a pas pu être débitée`,
    "",
    "Le débit de la mise en relation n'a pas abouti. Aucun montant n'a été prélevé (0 €).",
    "Vous pouvez réessayer quand vous le souhaitez :",
    lien,
    "",
    "Votre demande reste en l'état. Aucun débit n'a lieu tant que le paiement n'est pas finalisé.",
  ].join("\n");
}

/**
 * Envoie l'unique e-mail de relance au propriétaire. Sans RESEND_API_KEY :
 * on saute proprement en loguant une ligne (comme la dégradation existante).
 */
export async function envoyerRelancePaiement(params: {
  to: string;
  requestId: string;
}): Promise<void> {
  const lien = `${BASE_URL}/demande/paiement/${params.requestId}`;
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("[relance] RESEND_API_KEY absente — e-mail de relance non envoyé.");
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? FROM_DEFAUT,
        to: params.to,
        subject: `Votre carte n'a pas pu être débitée — réessayez quand vous voulez`,
        html: corpsHtml(lien),
        text: corpsTexte(lien),
      }),
    });
    if (!res.ok) {
      // Statut HTTP + début de réponse Resend uniquement — jamais de donnée carte.
      const body = await res.text().catch(() => "");
      console.error(`[relance] Échec envoi Resend : HTTP ${res.status} — ${body.slice(0, 200)}`);
    }
  } catch (err) {
    console.error(`[relance] envoi impossible (${(err as Error)?.name ?? "Error"})`);
  }
}
