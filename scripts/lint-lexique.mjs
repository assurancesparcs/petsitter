#!/usr/bin/env node
/**
 * Lint lexical — la Règle de vocabulaire comme code (PLAN.md §3.1).
 * Fait échouer la CI si une chaîne du produit contient :
 *  1. du vocabulaire de possession/subordination (risque de requalification) ;
 *  2. une mention d'assurance alors que insurance_live = false ;
 *  3. un claim chiffré non sourçable ou un pattern dark-pattern connu.
 * Périmètre : tout src/ (le texte produit), briefs et docs exclus.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");

// 1. Possession / subordination — interdits absolus, aucun contexte ne les excuse.
const FORBIDDEN = [
  /nos\s+pet[\s-]?sitters?/i,
  /notre\s+(?:équipe|service)\s+de\s+(?:garde|promeneurs?|pet[\s-]?sitters?)/i,
  /nous\s+gardons\s+(?:votre|vos|les)/i,
  /nous\s+(?:envoyons|dépêchons)\s+(?:quelqu'un|un\s+pet[\s-]?sitter)/i,
  /nous\s+vous\s+trouvons\s+un\s+remplaçant/i, // obligation de moyens, pas de résultat
  /garanti(?:e)?\s+ou\s+remboursé/i, // le remboursement n'est pas une garantie déclarative
  // Dark patterns / claims non sourcés
  /des\s+(?:milliers|centaines)\s+de\s+(?:propriétaires|clients|pet[\s-]?sitters)/i,
  /personnes?\s+(?:regardent|consultent)\s+ce/i,
  /offre\s+limitée|dépêchez-vous|plus\s+que\s+\d+\s+place/i,
];

// 2. Assurance : interdite dans src/ tant que insurance_live = false.
//    (Seuls fichiers autorisés à contenir ces mots : lib/flags.ts et le futur
//     domaine insurance/ non exposé — liste blanche ci-dessous.)
const INSURANCE = [/\bRC\s?Pro\b/i, /assuranc/i, /assureur/i, /\bORIAS\b/i, /assistance\s+vétérinaire/i];
const INSURANCE_ALLOWLIST = [
  "lib/flags.ts", // documente le verrou lui-même
];

const flagsSource = readFileSync(join(SRC, "lib/flags.ts"), "utf8");
const insuranceLive = /insurance_live:\s*true/.test(flagsSource);

const errors = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|jsx?|css|md)$/.test(entry)) check(p);
  }
}

function check(file) {
  const rel = relative(SRC, file);
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    for (const re of FORBIDDEN) {
      if (re.test(line)) {
        errors.push(`${rel}:${i + 1} — vocabulaire interdit (${re}) : ${line.trim()}`);
      }
    }
    if (!insuranceLive && !INSURANCE_ALLOWLIST.some((a) => rel.endsWith(a))) {
      for (const re of INSURANCE) {
        if (re.test(line)) {
          errors.push(
            `${rel}:${i + 1} — mention assurance alors que insurance_live=false : ${line.trim()}`,
          );
        }
      }
    }
  });
}

walk(SRC);

if (errors.length) {
  console.error(`✗ Lint lexical : ${errors.length} violation(s) — bug bloquant (PLAN.md §2.1)\n`);
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}
console.log("✓ Lint lexical : aucune violation.");
