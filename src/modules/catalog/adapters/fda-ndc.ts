import { accessSync, createReadStream, readdirSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { downloadFile } from "@/lib/dataset-fetch";
import { extractZip } from "@/lib/archive";
import { cleanText, combineStrengths, normalizeDosageForm } from "../normalize";
import type { AdapterInput, CatalogAdapter, NormalizedMedicine } from "../types";

const NDC_ZIP = "https://www.accessdata.fda.gov/cder/ndctext.zip";

type ProductRow = {
  productId: string;
  proprietaryName: string;
  dosageForm: string;
  route: string;
  productType: string;
  marketingCategory: string;
  labelerName: string;
  substanceName: string;
  numeratorStrength: string;
  ingredientUnit: string;
};

type PackageRow = {
  productId: string;
  ndc: string;
  description: string;
};

/**
 * US FDA NDC Directory adapter.
 *
 * Reads `product.txt` and `package.txt` from the FDA NDC text archive. The
 * product file lists one row per active ingredient, so rows are grouped by
 * PRODUCTID into a single medicine with multiple ingredients.
 */
class FdaNdcAdapter implements CatalogAdapter {
  key = "fda-ndc";
  label = "US FDA NDC Directory";
  datasetUrl = NDC_ZIP;

  private productPath: string | null = null;
  private packagePath: string | null = null;

  async prepare(input: AdapterInput): Promise<void> {
    const zipPath = path.join(input.workDir, "ndctext.zip");
    await downloadFile(NDC_ZIP, zipPath);

    const extractDir = path.join(input.workDir, "extracted");
    await extractZip(zipPath, extractDir, (relative) => {
      const name = path.basename(relative).toLowerCase();
      return name === "product.txt" || name === "package.txt";
    });

    const product = findFile(extractDir, "product.txt");
    const pkg = findFile(extractDir, "package.txt");
    if (!product) throw new Error("product.txt was not found inside the FDA NDC archive.");
    this.productPath = product;
    this.packagePath = pkg ?? null;
  }

  async *iterRecords(): AsyncGenerator<NormalizedMedicine, void, void> {
    if (!this.productPath) throw new Error("FDA NDC dataset has not been prepared.");

    const packagesByProduct = new Map<string, PackageRow[]>();
    if (this.packagePath) {
      await this.forEachRow(this.packagePath, (row) => {
        const productId = cleanText(row.PRODUCTID);
        const ndc = cleanText(row.NDC) ?? cleanText(row.PACKAGEGTN);
        if (!productId) return;
        const list = packagesByProduct.get(productId) ?? [];
        list.push({
          productId,
          ndc: ndc ?? "",
          description: cleanText(row.PACKAGEDESCRIPTION) ?? "",
        });
        packagesByProduct.set(productId, list);
      });
    }

    const grouped = new Map<string, ProductRow[]>();
    await this.forEachRow(this.productPath, (row) => {
      const productId = cleanText(row.PRODUCTID);
      if (!productId) return;
      const list = grouped.get(productId) ?? [];
      list.push({
        productId,
        proprietaryName: cleanText(row.PROPRIETARYNAME) ?? "",
        dosageForm: cleanText(row.DOSAGEFORMNAME) ?? "",
        route: cleanText(row.ROUTENAME) ?? "",
        productType: cleanText(row.PRODUCTTYPENAME) ?? "",
        marketingCategory: cleanText(row.MARKETINGCATEGORYNAME) ?? "",
        labelerName: cleanText(row.LABELERNAME) ?? "",
        substanceName: cleanText(row.SUBSTANCENAME) ?? "",
        numeratorStrength: cleanText(row.ACTIVE_NUMERATOR_STRENGTH) ?? "",
        ingredientUnit: cleanText(row.ACTIVE_INGRED_UNIT) ?? "",
      });
      grouped.set(productId, list);
    });

    for (const [productId, rows] of grouped) {
      const first = rows[0];
      const ingredientNames = Array.from(new Set(rows.map((row) => row.substanceName).filter(Boolean)));
      const genericName = ingredientNames[0] ?? null;
      const strengthText = combineStrengths(
        rows.map((row) => (row.numeratorStrength ? `${row.numeratorStrength} ${row.ingredientUnit}`.trim() : null)),
      );
      const displayName = [first.proprietaryName || genericName, strengthText].filter(Boolean).join(" ").trim() || productId;
      const packages = packagesByProduct.get(productId) ?? [];

      yield {
        sourceKey: "fda-ndc",
        sourceRecordId: productId,
        brandName: first.proprietaryName || null,
        genericName,
        displayName,
        strengthText,
        dosageForm: normalizeDosageForm(first.dosageForm),
        route: first.route || null,
        atcCode: null,
        manufacturerName: first.labelerName || null,
        countryCode: "US",
        regulatoryStatus: first.marketingCategory || null,
        ingredients: rows.map((row, index) => ({
          name: row.substanceName,
          role: "active",
          strengthText: row.numeratorStrength ? `${row.numeratorStrength} ${row.ingredientUnit}`.trim() : index === 0 ? strengthText : null,
        })),
        identifiers: [
          { system: "NDC", value: productId, use: "official" },
          ...packages
            .map((pkg) => pkg.ndc)
            .filter(Boolean)
            .map((ndc) => ({ system: "NDC_PACKAGE", value: ndc, use: "official" as const })),
        ],
        packages: packages.map((pkg) => ({
          description: pkg.description || null,
          quantityValue: null,
          quantityUnit: null,
          gtin: null,
          regulatoryStatus: first.marketingCategory || null,
          marketingStatus: null,
          sourceRecordId: pkg.ndc || null,
        })),
        aliases: [],
      } satisfies NormalizedMedicine;
    }
  }

  async cleanup(): Promise<void> {
    this.productPath = null;
    this.packagePath = null;
  }

  private async forEachRow(file: string, callback: (row: Record<string, string>) => void): Promise<void> {
    const reader = createInterface({ input: createReadStream(file, { encoding: "utf8" }), crlfDelay: Infinity });
    let header: string[] | null = null;
    for await (const line of reader) {
      if (!line) continue;
      const fields = splitDelimited(line);
      if (!header) {
        header = fields.map((field) => field.trim().toUpperCase());
        continue;
      }
      const row: Record<string, string> = {};
      header.forEach((key, index) => {
        row[key] = fields[index] ?? "";
      });
      callback(row);
    }
  }
}

/** FDA NDC text files are tab-delimited; fall back to pipe for safety. */
function splitDelimited(line: string): string[] {
  const delimiter = line.includes("\t") ? "\t" : line.includes("|") ? "|" : ",";
  return line.split(delimiter).map((field) => field.trim().replace(/^"|"$/g, ""));
}

function findFile(dir: string, name: string): string | null {
  const direct = path.join(dir, name);
  try {
    accessSync(direct);
    return direct;
  } catch {
    /* search one level down */
  }
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const nested = path.join(dir, entry.name, name);
      try {
        accessSync(nested);
        return nested;
      } catch {
        /* not a file */
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

export const fdaNdcAdapter = new FdaNdcAdapter();