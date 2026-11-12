/** Normalization helpers shared by all catalog adapters. */

export function cleanText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text.length ? text : null;
}

/** Lowercase, strip accents/punctuation, collapse whitespace. */
export function normalizeName(value: unknown): string {
  const text = cleanText(value) ?? "";
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** URL-safe slug used inside canonical keys. */
export function slugify(value: unknown, maxLength = 48): string {
  const slug = normalizeName(value).replace(/\s+/g, "-").slice(0, maxLength).replace(/^-+|-+$/g, "");
  return slug || "unknown";
}

const DOSAGE_FORM_ALIASES: Record<string, string> = {
  tablet: "Tablet",
  tablets: "Tablet",
  "film-coated tablet": "Tablet",
  "coated tablet": "Tablet",
  capsule: "Capsule",
  capsules: "Capsule",
  "hard capsule": "Capsule",
  "soft capsule": "Capsule",
  syrup: "Syrup",
  suspension: "Suspension",
  solution: "Solution",
  "oral solution": "Solution",
  injection: "Injection",
  "solution for injection": "Injection",
  "powder for solution for infusion": "Powder for infusion",
  cream: "Cream",
  ointment: "Ointment",
  gel: "Gel",
  drops: "Drops",
  "eye drops": "Drops",
  "oral drops": "Drops",
  inhaler: "Inhaler",
  "inhalation solution": "Inhalation solution",
  "inhalation powder": "Inhalation powder",
  sachet: "Sachet",
  powder: "Powder",
  "oral powder": "Powder",
  suppository: "Suppository",
  patch: "Patch",
  "transdermal patch": "Patch",
  spray: "Spray",
  "nasal spray": "Nasal spray",
  "mouthwash": "Mouthwash",
  "oral paste": "Oral paste",
  "chewing gum": "Chewing gum",
  "lozenge": "Lozenge",
};

/** Canonicalize a dosage-form string to one of the display labels when possible. */
export function normalizeDosageForm(value: unknown): string | null {
  const text = cleanText(value);
  if (!text) return null;
  const key = text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (DOSAGE_FORM_ALIASES[key]) return DOSAGE_FORM_ALIASES[key];
  // Fall back to a trimmed title-cased version for unknown forms.
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Extract a strength token such as "500 mg" or "0.5 %" from free text. */
const STRENGTH_PATTERN =
  /(\d*\.?\d+)\s*(mg\/ml|mcg\/ml|g\/100g|mg\/g|g\/dl|mg|mcg|µg|ug|ml|l|iu|units?|%|mmol|meq)(?![a-z0-9])/i;

export function extractStrength(value: unknown): string | null {
  const text = cleanText(value);
  if (!text) return null;
  const match = text.match(STRENGTH_PATTERN);
  if (!match) return null;
  return `${match[1].replace(",", ".")} ${match[2].toLowerCase()}`;
}

/** Drop per-unit denominators such as the "/1" in "40 mg/1". */
export function cleanStrengthText(value: string | null | undefined): string | null {
  const text = cleanText(value);
  if (!text) return null;
  const cleaned = text
    .replace(/\s*\/\s*1\b/g, "")
    .replace(/\s*\/\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned || null;
}

/** Combine one or more strength strings into a single normalized value. */
export function combineStrengths(values: (string | null | undefined)[]): string | null {
  const parts = values
    .map((value) => cleanStrengthText(extractStrength(value)))
    .filter((value): value is string => Boolean(value));
  const unique = Array.from(new Set(parts));
  return unique.length ? unique.join(" + ") : null;
}

/** Split a combined product term like "metformin 500 MG Oral Tablet". */
export function splitTerm(term: string): { name: string; strength: string | null; dosageForm: string | null } {
  const text = cleanText(term) ?? "";
  const strength = extractStrength(text);
  const withoutStrength = strength ? text.replace(new RegExp(strength.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), " ") : text;
  const dosageForm = normalizeDosageForm(withoutStrength);
  const name = normalizeName(withoutStrength.replace(/\b(oral|tablet|capsule|syrup|injection|solution|suspension|cream|ointment|drops|inhaler|sachet|powder|suppository|patch|spray|lozenge|chewing gum)\b/gi, " "));
  return { name, strength, dosageForm };
}

/** Countries that may appear in source metadata. */
export const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  CH: "Switzerland",
  FR: "France",
  PL: "Poland",
  GB: "United Kingdom",
  NO: "Norway",
  CA: "Canada",
  SA: "Saudi Arabia",
  ID: "Indonesia",
  PK: "Pakistan",
  IN: "India",
  DE: "Germany",
  NL: "Netherlands",
  IT: "Italy",
  ES: "Spain",
  BR: "Brazil",
  JP: "Japan",
  AU: "Australia",
  MULTI: "Multiple countries",
  GLOBAL: "Global",
};