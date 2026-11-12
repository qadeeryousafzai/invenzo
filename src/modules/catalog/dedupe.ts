import { createHash } from "node:crypto";
import type { NormalizedMedicine } from "./types";
import { normalizeName, slugify } from "./normalize";

/**
 * Build a deterministic canonical key used for duplicate detection.
 *
 * Identity is based on: source, generic (or brand when no generic exists),
 * strength, dosage form, manufacturer and country. Different strengths or
 * dosage forms intentionally produce different keys so they are never merged.
 */
export function canonicalKeyFor(record: NormalizedMedicine): string {
  const identityParts = [
    record.sourceKey,
    normalizeName(record.genericName || record.brandName || record.displayName),
    normalizeName(record.strengthText),
    normalizeName(record.dosageForm),
    normalizeName(record.manufacturerName),
    (record.countryCode || "").toUpperCase(),
  ];
  const digest = createHash("sha1").update(identityParts.join("|")).digest("hex").slice(0, 32);
  const readable = [
    record.sourceKey,
    slugify(record.genericName || record.brandName || record.displayName, 32),
    slugify(record.strengthText, 20),
    slugify(record.dosageForm, 20),
  ]
    .filter(Boolean)
    .join("-")
    .toLowerCase();
  // Keep within the 191-char column limit.
  return `${readable.slice(0, 140)}-${digest}`;
}

/** Build a stable key for a manufacturer name within a source. */
export function manufacturerKeyFor(sourceKey: string, name: string, countryCode?: string | null): string {
  return `${sourceKey}:${(countryCode || "").toUpperCase()}:${slugify(name, 80)}`.toLowerCase();
}

/** Build a stable key for an alias so repeated imports do not duplicate. */
export function aliasKey(medicineId: string, alias: string, aliasType: string): string {
  return `${medicineId}:${aliasType}:${slugify(alias, 100)}`;
}