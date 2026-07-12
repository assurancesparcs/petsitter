/** Services et espèces — source unique (PLAN.md §7). Le chat à égalité stricte. */

export const SERVICES = [
  { key: "HOME_VISIT", label: "Visite à domicile", hint: "Idéal pour les chats" },
  { key: "WALK", label: "Promenade" },
  { key: "HOUSE_SITTING", label: "Garde à votre domicile" },
  { key: "BOARDING", label: "Garde chez le pet sitter" },
] as const;

export const SPECIES = [
  { key: "CAT", label: "Chat" },
  { key: "DOG", label: "Chien" },
] as const;

export type ServiceKey = (typeof SERVICES)[number]["key"];
export type SpeciesKey = (typeof SPECIES)[number]["key"];

export function serviceLabel(key: string): string {
  return SERVICES.find((s) => s.key === key)?.label ?? "Service";
}
export function speciesLabel(key: string): string {
  return SPECIES.find((s) => s.key === key)?.label ?? "Animal";
}
