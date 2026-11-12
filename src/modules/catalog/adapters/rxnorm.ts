import { createReadStream, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline";
import { downloadFile } from "@/lib/dataset-fetch";
import { extractZip } from "@/lib/archive";
import { cleanText, normalizeDosageForm, splitTerm } from "../normalize";
import type { AdapterInput, CatalogAdapter, NormalizedMedicine } from "../types";

const PRESCRIBABLE_ZIP = "https://download.nlm.nih.gov/rxnorm/RxNorm_full_prescribe_current.zip";

/** RxNorm term types that describe prescribable clinical drug products. */
const PRODUCT_TERM_TYPES = new Set(["SCD", "SBD", "GPCK", "BPCK"]);

type ConsoRow = {
  rxcui: string;
  sab: string;
  tty: string;
  code: string;
  str: string;
  suppress: string;
  lat: string;
};

/**
 * RxNorm Current Prescribable Content adapter.
 *
 * Parses RXNCONSO.RRF (pipe-delimited RRF) and emits prescribable clinical drug
 * products (SCD/SBD/GPCK/BPCK) with strength and dose form parsed from the term,
 * plus ingredient names and brand aliases.
 */
class RxNormAdapter implements CatalogAdapter {
  key = "rxnorm";
  label = "RxNorm Current Prescribable Content";
  datasetUrl = PRESCRIBABLE_ZIP;

  private consoPath = "";

  async prepare(input: AdapterInput): Promise<void> {
    const zipPath = path.join(input.workDir, "rxnorm-prescribe.zip");
    await downloadFile(PRESCRIBABLE_ZIP, zipPath);

    const extractDir = path.join(input.workDir, "extracted");
    await extractZip(zipPath, extractDir, (relative) => /(^|\/)RXNCONSO\.RRF$/i.test(relative));

    this.consoPath = path.join(findRrfDir(extractDir), "RXNCONSO.RRF");
    await readFile(this.consoPath, "utf8").catch(() => {
      throw new Error("RXNCONSO.RRF was not found inside the RxNorm archive.");
    });
  }

  async *iterRecords(): AsyncGenerator<NormalizedMedicine, void, void> {
    if (!this.consoPath) throw new Error("RxNorm dataset has not been prepared.");

    const productRows: ConsoRow[] = [];
    await this.forEachConsoRow((row) => {
      if (row.lat !== "ENG" || row.suppress === "Y") return;
      if (row.sab !== "RXNORM") return;
      if (PRODUCT_TERM_TYPES.has(row.tty)) productRows.push(row);
    });

    for (const row of productRows) {
      const parsed = splitTerm(row.str);
      if (!parsed.name) continue;

      const isBranded = row.tty === "SBD" || row.tty === "BPCK";
      const brandName = isBranded ? extractBracketedBrand(row.str) : null;
      const displayName = cleanText(row.str) ?? parsed.name;
      const dosageForm = normalizeDosageForm(parsed.dosageForm);
      const strengthText = parsed.strength;

      const ingredientNames = parsed.name
        .split(" / ")
        .map((name) => name.trim())
        .filter(Boolean);

      yield {
        sourceKey: "rxnorm",
        sourceRecordId: row.rxcui,
        brandName,
        genericName: parsed.name,
        displayName,
        strengthText,
        dosageForm,
        route: inferRoute(row.str),
        atcCode: null,
        manufacturerName: null,
        countryCode: "US",
        regulatoryStatus: null,
        ingredients: ingredientNames.map((name, index) => ({
          name,
          role: "active",
          strengthText: index === 0 ? strengthText : null,
        })),
        identifiers: [
          { system: "RXCUI", value: row.rxcui, use: "official" },
          ...(row.code ? [{ system: "RXNORM_CODE", value: row.code, use: "official" as const }] : []),
        ],
        packages: [],
        aliases: brandName ? [{ alias: brandName, aliasType: "BRAND" as const }] : [],
      } satisfies NormalizedMedicine;
    }
  }

  async cleanup(): Promise<void> {
    this.consoPath = "";
  }

  private async forEachConsoRow(callback: (row: ConsoRow) => void): Promise<void> {
    const reader = createInterface({
      input: createReadStream(this.consoPath, { encoding: "utf8" }),
      crlfDelay: Infinity,
    });
    for await (const line of reader) {
      if (!line) continue;
      const fields = line.split("|");
      // RXNCONSO: RXCUI|LAT|TS|LUI|STT|SUI|ISPREF|RXAUI|SAUI|SCUI|SDUI|SAB|TTY|CODE|STR|SRL|SUPPRESS|CVF
      callback({
        rxcui: fields[0] ?? "",
        lat: fields[1] ?? "",
        sab: fields[11] ?? "",
        tty: fields[12] ?? "",
        code: fields[13] ?? "",
        str: fields[14] ?? "",
        suppress: fields[16] ?? "",
      });
    }
  }
}

function extractBracketedBrand(term: string): string | null {
  const match = term.match(/\[([^\]]+)\]/);
  if (!match) return null;
  const brand = cleanText(match[1]);
  return brand && brand.length > 1 ? brand : null;
}

function inferRoute(term: string): string | null {
  const lower = term.toLowerCase();
  if (/\b(oral|tablet|capsule|suspension|syrup|solution)\b/.test(lower)) return "Oral";
  if (/\b(injection|intravenous|intramuscular|subcutaneous)\b/.test(lower)) return "Parenteral";
  if (/\b(ophthalmic|eye)\b/.test(lower)) return "Ophthalmic";
  if (/\b(topical|cream|ointment|gel)\b/.test(lower)) return "Topical";
  if (/\binhalation\b/.test(lower)) return "Inhalation";
  return null;
}

function findRrfDir(extractDir: string): string {
  const candidates = [path.join(extractDir, "rrf"), extractDir];
  for (const candidate of candidates) {
    try {
      if (readdirSync(candidate).some((entry) => entry.toUpperCase() === "RXNCONSO.RRF")) return candidate;
    } catch {
      /* try next */
    }
  }
  return path.join(extractDir, "rrf");
}

export const rxnormAdapter = new RxNormAdapter();