import path from "node:path";
import { downloadFile } from "@/lib/dataset-fetch";
import { unzipSync } from "fflate";
import { streamZip } from "@/lib/archive";
import { cleanText, combineStrengths, normalizeDosageForm } from "../normalize";
import { DAILYMED_SELECTORS, DEFAULT_DAILYMED_SELECTOR } from "../dataset-options";
import type { AdapterInput, CatalogAdapter, NormalizedMedicine } from "../types";

const LABEL_PAGE = "https://dailymed.nlm.nih.gov/dailymed/spl-resources-all-drug-labels.cfm";
const RELEASE_BASE = "https://dailymed-data.nlm.nih.gov/public-release-files/";



const DEFAULT_SELECTOR = process.env.CATALOG_DAILYMED_DATASET?.trim() || DEFAULT_DAILYMED_SELECTOR;

/**
 * Resolve the ZIP URL for a DailyMed release selector.
 *
 * Release parts use stable file names. The periodic update files embed the
 * publication date in the name, so they are resolved by scraping the official
 * downloads page for the newest matching archive.
 */
export async function resolveDailyMedZip(selector: string): Promise<{ url: string; file: string }> {
  const normalized = selector.trim().toLowerCase();

  const partMatch = normalized.match(/^human_(rx|otc)_part(\d{1,2})$/);
  if (partMatch) {
    const file = `dm_spl_release_human_${partMatch[1]}_part${Number(partMatch[2])}.zip`;
    return { url: `${RELEASE_BASE}${file}`, file };
  }

  if (normalized === "daily" || normalized === "weekly" || normalized === "monthly") {
    const page = await fetch(LABEL_PAGE, {
      headers: { "User-Agent": "Invenzo-Catalog-Importer/1.0 (+https://invenzoapp.com)" },
    });
    if (!page.ok) throw new Error(`Could not read the DailyMed download page (${page.status}).`);
    const html = await page.text();
    const pattern = new RegExp(`href="([^"]*dm_spl_${normalized}_update[^"]*\\.zip)"`, "i");
    const match = html.match(pattern);
    if (!match) throw new Error(`No ${normalized} update archive was found on the DailyMed download page.`);
    const file = path.basename(match[1]);
    return { url: `${RELEASE_BASE}${file}`, file };
  }

  throw new Error(
    `Unknown DailyMed dataset selector "${selector}". Use one of: ${DAILYMED_SELECTORS.map((item) => item.value).join(", ")}.`,
  );
}

type SaxStream = {
  on(event: "error", handler: (error: Error) => void): void;
  on(event: "opentag", handler: (node: { name: string; attributes: Record<string, string> }) => void): void;
  on(event: "text", handler: (text: string) => void): void;
  on(event: "closetag", handler: (name: string) => void): void;
  on(event: "end", handler: () => void): void;
  write(chunk: Buffer): void;
  end(): void;
};

type SaxStreamFactory = (strict: boolean, options?: { trim?: boolean; position?: boolean }) => SaxStream;

type SplDocument = {
  setId: string | null;
  title: string | null;
  effectiveTime: string | null;
  productName: string | null;
  genericName: string | null;
  manufacturer: string | null;
  dosageForm: string | null;
  ingredients: { name: string; role: string; strength: string | null }[];
};

/**
 * DailyMed / NLM SPL adapter.
 *
 * Parses Structured Product Labeling XML archives. Because a single SPL file
 * can be several megabytes, each archive entry is streamed straight into a SAX
 * parser instead of being extracted to disk.
 */
class DailyMedAdapter implements CatalogAdapter {
  key = "dailymed";
  label = "DailyMed (NLM SPL)";
  datasetUrl = RELEASE_BASE;

  private zipPath = "";

  async prepare(input: AdapterInput): Promise<void> {
    const selector = (input.datasetLabel && input.datasetLabel.trim()) || DEFAULT_SELECTOR;
    const resolved = await resolveDailyMedZip(selector);
    this.datasetUrl = resolved.url;
    this.zipPath = path.join(input.workDir, resolved.file);
    await downloadFile(resolved.url, this.zipPath);
  }

  async *iterRecords(): AsyncGenerator<NormalizedMedicine, void, void> {
    if (!this.zipPath) throw new Error("DailyMed dataset has not been prepared.");
    const queue = new RecordQueue();
    const saxModule = (await import("sax")) as unknown as {
      createStream?: SaxStreamFactory;
      default?: { createStream?: SaxStreamFactory };
    };
    const createSaxStream = saxModule.createStream ?? saxModule.default?.createStream;
    if (!createSaxStream) throw new Error("The sax XML parser could not be loaded.");

    let sourceError: Error | null = null;

    const parseXml = (data: Uint8Array, label: string) => {
      const parser = createSaxStream(true, { trim: true, position: false });
      const state = createSplState(queue);

      parser.on("error", (error: Error) => {
        queue.fail(new Error(`${label}: ${error.message}`));
      });
      parser.on("opentag", (node: { name: string; attributes: Record<string, string> }) => {
        state.openTag(node.name, node.attributes);
      });
      parser.on("text", (text: string) => state.text(text));
      parser.on("closetag", (name: string) => state.closeTag(name));
      parser.on("end", () => state.finish());

      parser.write(Buffer.from(data));
      parser.end();
    };

    try {
      await streamZip(this.zipPath, (file, relative) => {
        const lower = relative.toLowerCase();

        // DailyMed distributes each label as its own small ZIP inside the
        // release archive; full releases ship plain SPL XML files instead.
        if (lower.endsWith(".zip")) {
          const chunks: Buffer[] = [];
          file.ondata = (error, chunk, final) => {
            if (error) {
              queue.fail(error instanceof Error ? error : new Error(String(error)));
              return;
            }
            if (chunk.length) chunks.push(Buffer.from(chunk));
            if (!final) return;
            try {
              const inner = unzipSync(new Uint8Array(Buffer.concat(chunks)));
              for (const [name, data] of Object.entries(inner)) {
                if (name.toLowerCase().endsWith(".xml")) parseXml(data, relative);
              }
            } catch (innerError) {
              queue.fail(innerError instanceof Error ? innerError : new Error(String(innerError)));
            }
          };
          file.start();
          return;
        }

        if (!lower.endsWith(".xml")) {
          file.ondata = () => undefined;
          file.start();
          return;
        }

        const chunks: Buffer[] = [];
        file.ondata = (error, chunk, final) => {
          if (error) {
            queue.fail(error instanceof Error ? error : new Error(String(error)));
            return;
          }
          if (chunk.length) chunks.push(Buffer.from(chunk));
          if (final) parseXml(new Uint8Array(Buffer.concat(chunks)), relative);
        };
        file.start();
      });
    } catch (error) {
      sourceError = error as Error;
    }

    queue.end();

    for await (const record of queue.drain()) {
      yield record;
    }

    if (sourceError) throw sourceError;
  }

  async cleanup(): Promise<void> {
    this.zipPath = "";
  }
}

function createSplState(queue: RecordQueue) {
  const stack: string[] = [];
  let doc: SplDocument | null = null;
  let capture: "title" | "productName" | "manufacturer" | "generic" | "ingredientName" | null = null;
  let captureBuffer = "";
  let activeIngredient: { name: string; role: string; strength: string | null } | null = null;

  const emit = () => {
    if (!doc || !doc.title) {
      doc = null;
      return;
    }
    const record = buildRecord(doc);
    if (record) queue.push(record);
    doc = null;
  };

  const parent = () => stack[stack.length - 2] ?? "";

  const appendText = (value: string) => {
    if (!value) return;
    if (captureBuffer && !captureBuffer.endsWith(" ") && !value.startsWith(" ")) captureBuffer += " ";
    captureBuffer += value;
  };

  return {
    openTag(name: string, attributes: Record<string, string>) {
      stack.push(name);
      const depth = stack.length;

      if (!doc) {
        if (name === "document") {
          doc = {
            setId: null,
            title: null,
            effectiveTime: null,
            productName: null,
            manufacturer: null,
            dosageForm: null,
            genericName: null,
            ingredients: [],
          };
        }
        return;
      }

      if (name === "setId" && depth === 2 && !doc.setId) doc.setId = cleanText(attributes.root);
      if (name === "effectiveTime" && depth === 2 && !doc.effectiveTime) doc.effectiveTime = cleanText(attributes.value);

      if (name === "title" && depth === 2 && !doc.title) {
        capture = "title";
        captureBuffer = "";
      }

      if (name === "name") {
        const container = parent();
        if (container === "representedOrganization" || container === "manufacturerOrganization") {
          if (!doc.manufacturer) {
            capture = "manufacturer";
            captureBuffer = "";
          }
        } else if (container === "genericMedicine") {
          if (!doc.genericName) {
            capture = "generic";
            captureBuffer = "";
          }
        } else if (container === "manufacturedProduct") {
          if (!doc.productName) {
            capture = "productName";
            captureBuffer = "";
          }
        } else if (container === "ingredientSubstance" && activeIngredient) {
          if (!activeIngredient.name) {
            capture = "ingredientName";
            captureBuffer = "";
          }
        }
      }

      if (name === "formCode" && !doc.dosageForm && stack.includes("manufacturedProduct")) {
        doc.dosageForm = cleanText(attributes.displayName) ?? cleanText(attributes.code);
      }

      if (name === "ingredient" && stack.includes("manufacturedProduct")) {
        const classCode = cleanText(attributes.classCode)?.toUpperCase() ?? "";
        activeIngredient = {
          name: "",
          role: classCode.startsWith("IACT") ? "inactive" : "active",
          strength: null,
        };
        doc.ingredients.push(activeIngredient);
      }

      if (name === "numerator" && activeIngredient) {
        const value = cleanText(attributes.value);
        const unit = cleanText(attributes.unit);
        if (value) activeIngredient.strength = unit && unit !== "1" ? `${value} ${unit}` : value;
      }

      if (name === "strength" && activeIngredient) {
        activeIngredient.strength = null;
      }
    },

    text(value: string) {
      if (!capture) return;
      appendText(value);
    },

    closeTag(name: string) {
      if (capture === "title" && name === "title") {
        if (doc) doc.title = cleanText(captureBuffer);
        capture = null;
        captureBuffer = "";
      } else if (capture === "productName" && name === "name") {
        if (doc && !doc.productName) doc.productName = cleanText(captureBuffer);
        capture = null;
        captureBuffer = "";
      } else if (capture === "manufacturer" && name === "name") {
        if (doc && !doc.manufacturer) doc.manufacturer = cleanText(captureBuffer);
        capture = null;
        captureBuffer = "";
      } else if (capture === "generic" && name === "name") {
        if (doc && !doc.genericName) doc.genericName = cleanText(captureBuffer);
        capture = null;
        captureBuffer = "";
      } else if (capture === "ingredientName" && name === "name") {
        if (activeIngredient && !activeIngredient.name) activeIngredient.name = cleanText(captureBuffer) ?? "";
        capture = null;
        captureBuffer = "";
      }

      if (name === "ingredient") {
        activeIngredient = null;
      }

      if (name === "document") {
        stack.length = 0;
        emit();
        return;
      }

      const index = stack.lastIndexOf(name);
      if (index >= 0) stack.length = index;
    },

    finish() {
      emit();
    },
  };
}

function buildRecord(doc: SplDocument): NormalizedMedicine | null {
  const brandName = doc.productName || doc.title;
  const ingredients = doc.ingredients
    .map((ingredient) => ({
      name: ingredient.name,
      role: ingredient.role,
      strengthText: ingredient.strength,
    }))
    .filter((ingredient) => ingredient.name.length > 0);

  const genericName =
    ingredients.find((ingredient) => ingredient.role === "active")?.name ?? ingredients[0]?.name ?? null;

  const strengthText = combineStrengths(ingredients.map((ingredient) => ingredient.strengthText));
  const title = doc.title ? cleanText(doc.title) : null;
  const displayName = title ?? brandName;

  if (!displayName) return null;

  return {
    sourceKey: "dailymed",
    sourceRecordId: doc.setId ?? displayName,
    brandName,
    genericName: doc.genericName ?? genericName,
    displayName,
    strengthText,
    dosageForm: normalizeDosageForm(doc.dosageForm),
    route: null,
    atcCode: null,
    manufacturerName: doc.manufacturer,
    countryCode: "US",
    regulatoryStatus: "SPL",
    ingredients,
    identifiers: doc.setId ? [{ system: "SPL_SET_ID", value: doc.setId, use: "official" }] : [],
    packages: [],
    aliases: [],
  };
}

class RecordQueue {
  private items: NormalizedMedicine[] = [];
  private resolve: (() => void) | null = null;
  private finished = false;
  private failure: Error | null = null;

  push(item: NormalizedMedicine) {
    this.items.push(item);
    this.wake();
  }

  end() {
    this.finished = true;
    this.wake();
  }

  /** Mark the end of one archive entry without ending the whole stream. */
  markFileDone() {
    this.wake();
  }

  fail(error: Error) {
    this.failure = error;
    this.finished = true;
    this.wake();
  }

  private wake() {
    const resolve = this.resolve;
    this.resolve = null;
    resolve?.();
  }

  async *drain(): AsyncGenerator<NormalizedMedicine, void, void> {
    while (true) {
      if (this.items.length) {
        yield this.items.shift() as NormalizedMedicine;
        continue;
      }
      if (this.failure) throw this.failure;
      if (this.finished) return;
      await new Promise<void>((resolve) => {
        this.resolve = resolve;
      });
    }
  }
}

export const dailyMedAdapter = new DailyMedAdapter();