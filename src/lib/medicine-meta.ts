import type { DosageForm } from "@/components/medicine/MedicineIllustration";
import { DOSAGE_FORMS } from "@/components/medicine/MedicineIllustration";

const FORM_PREFIX = "Form:";

/**
 * Encode structured medicine metadata (dosage form + generic name + strength)
 * into the free-text `description` column so no database migration is needed.
 *
 * Format: `Form: Tablet || Amoxicillin trihydrate · 500mg`
 */
export function encodeMedicineMeta(input: { dosageForm?: string | null; genericName?: string | null; strength?: string | null; manufacturer?: string | null; notes?: string | null }): string | undefined {
  const form = normalizeForm(input.dosageForm);
  const details = [input.genericName, input.strength, input.manufacturer].map((v) => v?.toString().trim()).filter(Boolean).join(" · ");
  const parts: string[] = [];
  if (form) parts.push(`${FORM_PREFIX} ${form}`);
  if (details) parts.push(details);
  if (input.notes?.trim()) parts.push(input.notes.trim());
  return parts.length ? parts.join(" || ") : undefined;
}

export function decodeMedicineMeta(description?: string | null): { dosageForm?: DosageForm; genericName?: string; strength?: string; manufacturer?: string; notes?: string } {
  if (!description) return {};
  const segments = description.split("||").map((s) => s.trim()).filter(Boolean);
  let dosageForm: DosageForm | undefined;
  const rest: string[] = [];
  for (const segment of segments) {
    if (segment.startsWith(FORM_PREFIX)) {
      const value = segment.slice(FORM_PREFIX.length).trim();
      const match = DOSAGE_FORMS.find((f) => f.toLowerCase() === value.toLowerCase());
      if (match) { dosageForm = match; continue; }
    }
    rest.push(segment);
  }
  const detail = rest.shift() ?? "";
  const [genericName, strength, manufacturer, ...noteParts] = detail.split("·").map((s) => s.trim());
  const notes = [...noteParts, ...rest].filter(Boolean).join(" · ");
  return {
    dosageForm,
    genericName: genericName || undefined,
    strength: strength || undefined,
    manufacturer: manufacturer || undefined,
    notes: notes || undefined,
  };
}

export function normalizeForm(value?: string | null): DosageForm | undefined {
  if (!value) return undefined;
  const match = DOSAGE_FORMS.find((f) => f.toLowerCase() === value.toLowerCase());
  return match;
}