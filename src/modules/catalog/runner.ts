import { mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canonicalKeyFor, manufacturerKeyFor } from "./dedupe";
import { normalizeName } from "./normalize";
import { getCatalogAdapter } from "./registry";
import { countryName, getSourceDefinition } from "./sources";
import type { NormalizedMedicine } from "./types";
import { SourceNotLicensedError } from "./adapters/restricted";

const MAX_STORED_ERRORS = 200;

export type StartImportInput = {
  sourceKey: string;
  datasetLabel?: string | null;
  batchSize?: number;
  createdById?: string | null;
  resumeFromJobId?: string | null;
};

export type StartImportResult = {
  jobId: string;
  sourceId: string;
  status: string;
};

/** Create an import job and kick off processing in the background. */
export async function startCatalogImport(input: StartImportInput): Promise<StartImportResult> {
  const definition = getSourceDefinition(input.sourceKey);
  if (!definition) throw new Error(`Unknown catalog source "${input.sourceKey}".`);
  if (!definition.adapterKey) throw new Error(`The ${definition.name} source has no import adapter.`);
  if (!definition.enabled) {
    throw new Error(
      `The ${definition.name} source is disabled because its licence has not been cleared for redistribution. ${definition.notes}`,
    );
  }

  const source = await ensureSourceRow(definition.key);
  const batchSize = clampBatchSize(input.batchSize ?? 500);

  let cursor: string | null = null;
  if (input.resumeFromJobId) {
    const previous = await prisma.medicineImportJob.findUnique({
      where: { id: input.resumeFromJobId },
      select: { cursor: true, sourceId: true },
    });
    if (!previous) throw new Error("The job to resume from was not found.");
    if (previous.sourceId !== source.id) throw new Error("The job to resume from belongs to a different source.");
    cursor = previous.cursor;
  }

  const job = await prisma.medicineImportJob.create({
    data: {
      sourceId: source.id,
      status: "QUEUED",
      datasetUrl: definition.datasetUrl,
      datasetLabel: input.datasetLabel ?? definition.name,
      cursor,
      createdById: input.createdById ?? null,
    },
    select: { id: true },
  });

  void runCatalogImport(job.id, batchSize).catch(async (error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[catalog] import job failed", { jobId: job.id, message });
    await prisma.medicineImportJob
      .update({ where: { id: job.id }, data: { status: "FAILED", errorMessage: message, finishedAt: new Date() } })
      .catch(() => undefined);
  });

  return { jobId: job.id, sourceId: source.id, status: "QUEUED" };
}

export async function runCatalogImport(jobId: string, batchSize = 500): Promise<void> {
  const job = await prisma.medicineImportJob.findUnique({
    where: { id: jobId },
    include: { source: true },
  });
  if (!job) throw new Error("Import job not found.");
  if (job.status === "RUNNING") {
    throw new Error("This import job is already running.");
  }

  const definition = getSourceDefinition(job.source.key);
  const adapter = definition?.adapterKey ? getCatalogAdapter(definition.adapterKey) : null;
  if (!adapter) throw new Error(`No adapter is registered for source "${job.source.key}".`);

  const workDir = path.join(os.tmpdir(), "invenzo-catalog", job.source.key, jobId);
  await mkdir(workDir, { recursive: true });

  const resumeOffset = await resolveResumeOffset(job.cursor);
  let processed = 0;
  let imported = 0;
  let duplicate = 0;
  let failed = 0;
  let pending: NormalizedMedicine[] = [];
  let storedErrors = 0;
  let lastProgressAt = 0;
  let stopped = false;

  await prisma.medicineImportJob.update({
    where: { id: jobId },
    data: { status: "RUNNING", startedAt: job.startedAt ?? new Date(), errorMessage: null },
  });

  const flush = async () => {
    if (!pending.length) return;
    const batch = pending;
    pending = [];
    try {
      const result = await persistBatch({
        sourceId: job.sourceId,
        sourceKey: job.source.key,
        records: batch,
        jobId,
        licenseName: job.source.licenseName,
        licenseUrl: job.source.licenseUrl,
        attributionRequired: job.source.attributionRequired,
        redistributionAllowed: job.source.redistributionAllowed,
        commercialUseAllowed: job.source.commercialUseAllowed,
        countryCode: job.source.countryCode,
      });
      imported += result.imported;
      duplicate += result.duplicate;
      if (result.failed) {
        failed += result.failed;
        for (const entry of result.errors) {
          if (storedErrors >= MAX_STORED_ERRORS) break;
          storedErrors += 1;
          await prisma.medicineImportError.create({
            data: {
              jobId,
              stage: entry.stage,
              message: entry.message,
              details: (entry.details ?? undefined) as Prisma.InputJsonValue | undefined,
            },
          });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failed += batch.length;
      if (storedErrors < MAX_STORED_ERRORS) {
        storedErrors += 1;
        await prisma.medicineImportError
          .create({ data: { jobId, stage: "batch", message: message.slice(0, 4000) } })
          .catch(() => undefined);
      }
    }
  };

  try {
    await adapter.prepare({
      workDir,
      archivePath: null,
      datasetLabel: job.datasetLabel,
    });

    for await (const record of adapter.iterRecords({
      workDir,
      archivePath: null,
      datasetLabel: job.datasetLabel,
    })) {
      if (processed < resumeOffset) {
        processed += 1;
        continue;
      }
      if (adapterShouldStop()) {
        stopped = true;
        break;
      }

      processed += 1;
      pending.push(record);
      if (pending.length >= batchSize) await flush();

      const now = Date.now();
      if (now - lastProgressAt > 2000) {
        lastProgressAt = now;
        await prisma.medicineImportJob
          .update({
            where: { id: jobId },
            data: {
              processedRecords: processed,
              importedRecords: imported,
              duplicateRecords: duplicate,
              failedRecords: failed,
              lastBatchSize: pending.length,
              cursor: String(processed),
            },
          })
          .catch(() => undefined);
      }
    }

    await flush();

    await prisma.medicineImportJob.update({
      where: { id: jobId },
      data: {
        status: stopped ? "CANCELLED" : "SUCCEEDED",
        processedRecords: processed,
        importedRecords: imported,
        duplicateRecords: duplicate,
        failedRecords: failed,
        lastBatchSize: 0,
        cursor: String(processed),
        finishedAt: new Date(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (error instanceof SourceNotLicensedError) {
      await prisma.medicineImportError
        .create({ data: { jobId, stage: "license", message: message.slice(0, 4000) } })
        .catch(() => undefined);
    }
    await prisma.medicineImportJob
      .update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          errorMessage: message.slice(0, 4000),
          processedRecords: processed,
          importedRecords: imported,
          duplicateRecords: duplicate,
          failedRecords: failed,
          cursor: String(processed),
          finishedAt: new Date(),
        },
      })
      .catch(() => undefined);
  } finally {
    await adapter.cleanup?.().catch(() => undefined);
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

/** Placeholder for a future cooperative stop flag (set by cancel endpoints). */
function adapterShouldStop(): boolean {
  return false;
}

async function resolveResumeOffset(cursor: string | null): Promise<number> {
  if (!cursor) return 0;
  const parsed = Number.parseInt(cursor, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function clampBatchSize(value: number): number {
  if (!Number.isFinite(value)) return 500;
  return Math.min(Math.max(Math.trunc(value), 50), 5000);
}

async function ensureSourceRow(key: string) {
  const definition = getSourceDefinition(key);
  if (!definition) throw new Error(`Unknown catalog source "${key}".`);

  const existing = await prisma.medicineSource.findUnique({ where: { key: definition.key } });
  const data = {
    key: definition.key,
    name: definition.name,
    countryCode: definition.countryCode,
    countryName: countryName(definition.countryCode),
    homepageUrl: definition.homepageUrl,
    datasetUrl: definition.datasetUrl,
    licenseName: definition.licenseName,
    licenseUrl: definition.licenseUrl,
    attributionRequired: definition.attributionRequired,
    redistributionAllowed: definition.redistributionAllowed,
    commercialUseAllowed: definition.commercialUseAllowed,
    adapterKey: definition.adapterKey,
    notes: definition.notes,
  };

  if (existing) {
    return prisma.medicineSource.update({ where: { id: existing.id }, data });
  }
  return prisma.medicineSource.create({ data });
}

type PersistResult = {
  imported: number;
  duplicate: number;
  failed: number;
  errors: { stage: string; message: string; details?: Record<string, unknown> }[];
};

type PersistInput = {
  sourceId: string;
  sourceKey: string;
  jobId: string;
  records: NormalizedMedicine[];
  licenseName: string | null;
  licenseUrl: string | null;
  attributionRequired: boolean;
  redistributionAllowed: boolean;
  commercialUseAllowed: boolean;
  countryCode: string | null;
};

/** Persist one batch of records using bulk queries instead of per-row round trips. */
async function persistBatch(input: PersistInput): Promise<PersistResult> {
  const result: PersistResult = { imported: 0, duplicate: 0, failed: 0, errors: [] };

  const prepared = input.records.map((record) => {
    const canonicalKey = canonicalKeyFor(record);
    return { record, canonicalKey };
  });

  const existing = await prisma.medicine.findMany({
    where: { canonicalKey: { in: prepared.map((entry) => entry.canonicalKey) } },
    select: { id: true, canonicalKey: true },
  });
  const existingKeys = new Set(existing.map((row) => row.canonicalKey));

  const fresh = prepared.filter((entry) => !existingKeys.has(entry.canonicalKey));
  result.duplicate += prepared.length - fresh.length;
  if (!fresh.length) return result;

  const manufacturerKeys = new Map<string, string>();
  for (const entry of fresh) {
    const name = entry.record.manufacturerName?.trim();
    if (!name) continue;
    manufacturerKeys.set(manufacturerKeyFor(input.sourceKey, name, entry.record.countryCode), name);
  }

  const existingManufacturers = manufacturerKeys.size
    ? await prisma.medicineManufacturer.findMany({
        where: { key: { in: Array.from(manufacturerKeys.keys()) } },
        select: { id: true, key: true },
      })
    : [];

  const manufacturerIdByKey = new Map(existingManufacturers.map((row) => [row.key, row.id]));

  const missingManufacturers = Array.from(manufacturerKeys.entries()).filter(([key]) => !manufacturerIdByKey.has(key));
  if (missingManufacturers.length) {
    await prisma.medicineManufacturer.createMany({
      data: missingManufacturers.map(([key, name]) => ({
        key,
        name: name.slice(0, 191),
        countryCode: input.countryCode,
        sourceId: input.sourceId,
      })),
      skipDuplicates: true,
    });
    const created = await prisma.medicineManufacturer.findMany({
      where: { key: { in: missingManufacturers.map(([key]) => key) } },
      select: { id: true, key: true },
    });
    for (const row of created) manufacturerIdByKey.set(row.key, row.id);
  }

  const medicineRows = fresh.map((entry) => {
    const record = entry.record;
    const manufacturerName = record.manufacturerName?.trim() ?? null;
    const manufacturerId = manufacturerName
      ? manufacturerIdByKey.get(manufacturerKeyFor(input.sourceKey, manufacturerName, record.countryCode)) ?? null
      : null;

    return {
      canonicalKey: entry.canonicalKey,
      sourceId: input.sourceId,
      sourceRecordId: record.sourceRecordId.slice(0, 191),
      brandName: record.brandName?.slice(0, 191) ?? null,
      genericName: record.genericName?.slice(0, 191) ?? null,
      displayName: record.displayName.slice(0, 191),
      nameNormalized: normalizeName(record.genericName || record.brandName || record.displayName).slice(0, 191),
      searchText: buildSearchText(record),
      strengthText: record.strengthText?.slice(0, 191) ?? null,
      dosageForm: record.dosageForm?.slice(0, 120) ?? null,
      route: record.route?.slice(0, 120) ?? null,
      atcCode: record.atcCode?.slice(0, 32) ?? null,
      manufacturerId,
      categoryId: null,
      countryCode: record.countryCode?.slice(0, 2).toUpperCase() ?? null,
      regulatoryStatus: record.regulatoryStatus?.slice(0, 64) ?? null,
      isBrand: Boolean(record.brandName),
      isGeneric: Boolean(record.genericName),
    };
  });

  try {
    await prisma.medicine.createMany({ data: medicineRows, skipDuplicates: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.failed += fresh.length;
    result.errors.push({ stage: "medicine-create", message: message.slice(0, 4000) });
    return result;
  }

  const stored = await prisma.medicine.findMany({
    where: { canonicalKey: { in: medicineRows.map((row) => row.canonicalKey) } },
    select: { id: true, canonicalKey: true },
  });
  const medicineIdByKey = new Map(stored.map((row) => [row.canonicalKey, row.id]));

  const linked = stored.filter((row) => medicineIdByKey.has(row.canonicalKey)).length;
  if (!linked) {
    result.failed += fresh.length;
    result.errors.push({ stage: "medicine-lookup", message: "Inserted medicines could not be read back for linking." });
    return result;
  }

  const ingredientRows: {
    medicineId: string;
    name: string;
    role: string | null;
    strengthText: string | null;
    sortOrder: number;
  }[] = [];
  const identifierRows: { medicineId: string; system: string; value: string; use: string | null }[] = [];
  const packageRows: {
    medicineId: string;
    description: string | null;
    quantityValue: string | null;
    quantityUnit: string | null;
    gtin: string | null;
    regulatoryStatus: string | null;
    marketingStatus: string | null;
    sourceRecordId: string | null;
  }[] = [];
  const aliasRows: { medicineId: string; alias: string; aliasType: string; sourceId: string }[] = [];
  const sourceRecordRows: {
    sourceId: string;
    sourceRecordId: string;
    medicineId: string;
    countryCode: string | null;
    licenseName: string | null;
    licenseUrl: string | null;
    attributionRequired: boolean;
    redistributionAllowed: boolean;
    commercialUseAllowed: boolean;
  }[] = [];

  for (const entry of fresh) {
    const medicineId = medicineIdByKey.get(entry.canonicalKey);
    if (!medicineId) continue;
    const record = entry.record;

    record.ingredients.forEach((ingredient, index) => {
      if (!ingredient.name) return;
      ingredientRows.push({
        medicineId,
        name: ingredient.name.slice(0, 191),
        role: ingredient.role ?? null,
        strengthText: ingredient.strengthText?.slice(0, 191) ?? null,
        sortOrder: index,
      });
    });

    for (const identifier of record.identifiers) {
      if (!identifier.value) continue;
      identifierRows.push({
        medicineId,
        system: identifier.system.slice(0, 120),
        value: identifier.value.slice(0, 191),
        use: identifier.use ?? null,
      });
    }

    for (const pkg of record.packages) {
      packageRows.push({
        medicineId,
        description: pkg.description?.slice(0, 500) ?? null,
        quantityValue: pkg.quantityValue?.slice(0, 64) ?? null,
        quantityUnit: pkg.quantityUnit?.slice(0, 64) ?? null,
        gtin: pkg.gtin?.slice(0, 64) ?? null,
        regulatoryStatus: pkg.regulatoryStatus?.slice(0, 64) ?? null,
        marketingStatus: pkg.marketingStatus?.slice(0, 64) ?? null,
        sourceRecordId: pkg.sourceRecordId?.slice(0, 191) ?? null,
      });
    }

    for (const alias of record.aliases) {
      if (!alias.alias) continue;
      aliasRows.push({
        medicineId,
        alias: alias.alias.slice(0, 191),
        aliasType: alias.aliasType,
        sourceId: input.sourceId,
      });
    }

    sourceRecordRows.push({
      sourceId: input.sourceId,
      sourceRecordId: record.sourceRecordId.slice(0, 191),
      medicineId,
      countryCode: record.countryCode?.slice(0, 2).toUpperCase() ?? null,
      licenseName: input.licenseName,
      licenseUrl: input.licenseUrl,
      attributionRequired: input.attributionRequired,
      redistributionAllowed: input.redistributionAllowed,
      commercialUseAllowed: input.commercialUseAllowed,
    });
  }

  if (ingredientRows.length) await prisma.medicineIngredient.createMany({ data: ingredientRows, skipDuplicates: true });
  if (identifierRows.length) await prisma.medicineIdentifier.createMany({ data: identifierRows, skipDuplicates: true });
  if (packageRows.length) await prisma.medicinePackage.createMany({ data: packageRows, skipDuplicates: true });
  if (aliasRows.length) await prisma.medicineAlias.createMany({ data: aliasRows, skipDuplicates: true });
  if (sourceRecordRows.length) {
    await prisma.medicineSourceRecord.createMany({ data: sourceRecordRows, skipDuplicates: true });
  }

  result.imported += medicineRows.length;
  return result;
}

function buildSearchText(record: NormalizedMedicine): string {
  const parts = [
    record.brandName,
    record.genericName,
    record.displayName,
    record.strengthText,
    record.dosageForm,
    record.manufacturerName,
    ...record.ingredients.map((ingredient) => ingredient.name),
  ]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => value.trim());
  return Array.from(new Set(parts)).join(" ").slice(0, 4000);
}