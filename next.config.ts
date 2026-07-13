import type { NextConfig } from "next";

// En-têtes de sécurité (audit surface web §1-5). CSP volontairement stricte ;
// 'unsafe-inline' conservé pour les styles (Tailwind/Next injecte de l'inline).
// À durcir vers des nonces quand du JS tiers sera nécessaire.
// Stripe (empreinte carte + débit off-session) : seules les origines
// documentées par Stripe sont ouvertes — js.stripe.com (script + iframes),
// hooks.stripe.com (3-D Secure), api.stripe.com / m.stripe.network /
// r.stripe.com (appels réseau du PaymentElement).
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https://*.stripe.com",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "connect-src 'self' https://api.stripe.com https://m.stripe.network https://r.stripe.com",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // payment : ouvert à Stripe uniquement (Payment Request API du PaymentElement).
    value:
      'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com"), usb=(), interest-cohort=()',
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
