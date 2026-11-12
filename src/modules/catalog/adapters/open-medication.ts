import { readFile } from "node:fs/promises";
import path from "node:path";
import { downloadFile } from "@/lib/dataset-fetch";
import { extractZip } from "@/lib/archive";
import { openSqliteReadOnly, type SqliteReader } from "../sqlite";
import { cleanStrengthText, cleanText, combineStrengths, normalizeDosageForm } from "../normalize";
import type { AdapterInput, CatalogAdapter, NormalizedMedicine } from "../types";

const CATALOG_INDEX_URL = "https://openmedicationcatalog.org/catalog.json";

type CatalogIndex = {
  artifacts: Record<string, { latest: string; zip: string; manifest: string; tag: string }>;
};

type Manifest = {
  artifactId: string;
  release: string;
  jurisdiction: string;
  sources: { id: string; sourceEffectiveDate?: string; retrievedAt?: string }[];
};

type MedicinalProductRow = {
  id: string;
  product_group_id: string | null;
  jurisdiction: string;
  authority_key: string;
  name: string;
  dose_form: string | null;
  regulatory_status: string;
};

type PackageRow = {
  medicinal_product_id: string;
  id: string;
  description: string;
  gtin: string | null;
  authority_key: string;
  quantity_value: string | null;
  quantity_unit: string | null;
  regulatory_status: string;
  marketing_status: string | null;
};

type IngredientRow = { medicinal_product_id: string; name: string; role: string | null; strength_text: string | null };
type IdentifierRow = { entity_id: string; system: string; value: string };
type OrganizationRow = { id: string; name: string; role: string };

/**
 * Open Medication Catalog adapter.
 *
 * Reads the published `database/medication.sqlite` from a country release
 * (us-base, fr-base, pl-base, ch-base, ...) and maps medicinal products,
 * ingredients, identifiers and packages into the global catalog.
 *
 * `datasetLabel` selects the artifact key, e.g. "us-base" (default).
 */
class OpenMedicationAdapter implements CatalogAdapter {
  key = "omc";
  label = "Open Medication Catalog";
  datasetUrl = CATALOG_INDEX_URL;

  private artifactKey = "us-base";
  private db: SqliteReader | null = null;
  private manifest: Manifest | null = null;

  async prepare(input: AdapterInput): Promise<void> {
    this.artifactKey = input.datasetLabel?.trim() || "us-base";

    const indexPath = path.join(input.workDir, "catalog.json");
    await downloadFile(CATALOG_INDEX_URL, indexPath);
    const index = JSON.parse(await readFile(indexPath, "utf8")) as CatalogIndex;
    const artifact = index.artifacts?.[this.artifactKey];
    if (!artifact) {
      throw new Error(
        `Unknown Open Medication Catalog artifact "${this.artifactKey}". Expected one of: ${Object.keys(index.artifacts ?? {}).join(", ")}.`,
      );
    }

    const zipPath = path.join(input.workDir, `${this.artifactKey}-${artifact.latest}.zip`);
    await downloadFile(artifact.zip, zipPath);

    const extractDir = path.join(input.workDir, "extracted");
    await extractZip(zipPath, extractDir, (relative) => {
      const normalized = relative.replace(/\\/g, "/");
      return normalized === "database/medication.sqlite" || normalized === "manifest.json";
    });

    this.db = await openSqliteReadOnly(path.join(extractDir, "database", "medication.sqlite"));
    try {
      this.manifest = JSON.parse(await readFile(path.join(extractDir, "manifest.json"), "utf8")) as Manifest;
    } catch {
      this.manifest = null;
    }
  }

  async *iterRecords(): AsyncGenerator<NormalizedMedicine, void, void> {
    if (!this.db) throw new Error("Open Medication Catalog dataset has not been prepared.");
    const db = this.db;

    const products = db
      .prepare<MedicinalProductRow>(
        `SELECT id, product_group_id, jurisdiction, authority_key, name, dose_form, regulatory_status
         FROM medicinal_product
         ORDER BY id`,
      )
      .all();

    // The release ships no index on the foreign-key columns, so a per-product
    // lookup would full-scan the child tables for every row. Read each child
    // table once and bucket it in memory instead.
    type IngredientValue = Omit<IngredientRow, "medicinal_product_id">;
    type IdentifierValue = Omit<IdentifierRow, "entity_id">;
    type PackageValue = Omit<PackageRow, "medicinal_product_id">;

    const ingredientsByProduct = new Map<string, IngredientValue[]>();
    for (const row of db.iterate<IngredientRow>(
      `SELECT medicinal_product_id, name, role, strength_text FROM ingredient`,
    )) {
      const list = ingredientsByProduct.get(row.medicinal_product_id);
      const entry = { name: row.name, role: row.role, strength_text: row.strength_text };
      if (list) list.push(entry);
      else ingredientsByProduct.set(row.medicinal_product_id, [entry]);
    }

    const identifiersByProduct = new Map<string, IdentifierValue[]>();
    for (const row of db.iterate<IdentifierRow>(`SELECT entity_id, system, value FROM identifier`)) {
      const list = identifiersByProduct.get(row.entity_id);
      const entry = { system: row.system, value: row.value };
      if (list) list.push(entry);
      else identifiersByProduct.set(row.entity_id, [entry]);
    }

    const packagesByProduct = new Map<string, PackageValue[]>();
    for (const row of db.iterate<PackageRow>(
      `SELECT medicinal_product_id, id, description, gtin, authority_key, quantity_value, quantity_unit, regulatory_status, marketing_status FROM package`,
    )) {
      const list = packagesByProduct.get(row.medicinal_product_id);
      const entry = {
        id: row.id,
        description: row.description,
        gtin: row.gtin,
        authority_key: row.authority_key,
        quantity_value: row.quantity_value,
        quantity_unit: row.quantity_unit,
        regulatory_status: row.regulatory_status,
        marketing_status: row.marketing_status,
      };
      if (list) list.push(entry);
      else packagesByProduct.set(row.medicinal_product_id, [entry]);
    }

    const authorizations = new Map<string, { holderId: string | null; status: string | null }>();
    for (const row of db.iterate<{ authority_key: string; holder_id: string | null; status: string | null }>(
      `SELECT authority_key, holder_id, status FROM authorization`,
    )) {
      authorizations.set(row.authority_key, { holderId: row.holder_id, status: row.status });
    }

    const organizations = new Map<string, Omit<OrganizationRow, "id">>();
    for (const row of db.iterate<OrganizationRow>(`SELECT id, name, role FROM organization`)) {
      organizations.set(row.id, { name: row.name, role: row.role });
    }

    const groupHolders = new Map<string, string | null>();
    for (const row of db.iterate<{ id: string; authorization_holder_id: string | null }>(
      `SELECT id, authorization_holder_id FROM product_group`,
    )) {
      groupHolders.set(row.id, row.authorization_holder_id);
    }

    const countryCode = this.manifest?.jurisdiction?.slice(0, 2).toUpperCase() ?? null;

    for (const product of products) {
      const ingredients = ingredientsByProduct.get(product.id) ?? [];
      const identifiers = identifiersByProduct.get(product.id) ?? [];
      const packages = packagesByProduct.get(product.id) ?? [];

      const authorization = product.authority_key ? authorizations.get(product.authority_key) ?? null : null;
      const holderId = authorization?.holderId ?? (product.product_group_id ? groupHolders.get(product.product_group_id) ?? null : null);
      const holder = holderId ? organizations.get(holderId) ?? null : null;

      const genericName = ingredients[0]?.name ?? product.name ?? null;
      const strengthText = combineStrengths(ingredients.map((ingredient) => ingredient.strength_text));
      const dosageForm = normalizeDosageForm(product.dose_form);
      const displayName = [product.name, strengthText].filter(Boolean).join(" ").trim() || product.name;

      yield {
        sourceKey: "omc",
        sourceRecordId: product.id,
        brandName: null,
        genericName,
        displayName,
        strengthText,
        dosageForm,
        route: null,
        atcCode: null,
        manufacturerName: holder?.name ?? null,
        countryCode,
        regulatoryStatus: cleanText(authorization?.status ?? product.regulatory_status),
        ingredients: ingredients.map((ingredient) => ({
          name: cleanText(ingredient.name) ?? "",
          role: cleanText(ingredient.role),
          strengthText: cleanStrengthText(ingredient.strength_text),
        })),
        identifiers: identifiers.map((identifier) => ({
          system: cleanText(identifier.system) ?? "omc",
          value: cleanText(identifier.value) ?? "",
          use: null,
        })),
        packages: packages.map((pkg) => ({
          description: cleanText(pkg.description),
          quantityValue: cleanText(pkg.quantity_value),
          quantityUnit: cleanText(pkg.quantity_unit),
          gtin: cleanText(pkg.gtin),
          regulatoryStatus: cleanText(pkg.regulatory_status),
          marketingStatus: cleanText(pkg.marketing_status),
          sourceRecordId: cleanText(pkg.authority_key),
        })),
        aliases: [],
      } satisfies NormalizedMedicine;
    }
  }

  async cleanup(): Promise<void> {
    this.db?.close();
    this.db = null;
    this.manifest = null;
  }
}

export const openMedicationAdapter = new OpenMedicationAdapter();