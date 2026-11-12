#!/usr/bin/env npx tsx
/**
 * Import a pre-extracted Open Medication Catalog release into the database.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/import-catalog.ts --dir src/medicine/us-base-2026.11
 *
 * Options:
 *   --dir <path>     Directory containing database/medication.sqlite and manifest.json
 *   --batch <n>      Records per insert batch (default 500)
 *   --label <text>   Dataset label stored on the import job (default us-base)
 */
import path from "node:path";
import { runLocalCatalogImport } from "../src/modules/catalog/runner";
import { prisma } from "../src/lib/prisma";

type Args = { dir?: string; batch?: number; label?: string };

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];
    if (token === "--dir" && value) args.dir = value;
    if (token === "--batch" && value) args.batch = Number(value);
    if (token === "--label" && value) args.label = value;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.dir) {
    console.error("Missing --dir <path to extracted OMC release>");
    process.exit(1);
  }

  const dir = path.resolve(args.dir);
  const started = Date.now();

  let lastReport = 0;
  const timer = setInterval(async () => {
    const now = Date.now();
    if (now - lastReport < 15000) return;
    lastReport = now;
    const jobs = await prisma.medicineImportJob.findMany({
      where: { datasetUrl: dir },
      orderBy: { createdAt: "desc" },
      take: 1,
      select: { processedRecords: true, importedRecords: true, duplicateRecords: true, failedRecords: true, status: true },
    });
    const job = jobs[0];
    if (!job) return;
    console.log(
      `[${Math.round((now - started) / 1000)}s] ${job.status} processed=${job.processedRecords} imported=${job.importedRecords} duplicates=${job.duplicateRecords} failed=${job.failedRecords}`,
    );
  }, 5000);

  try {
    const result = await runLocalCatalogImport({
      sourceKey: "omc",
      localDir: dir,
      datasetLabel: args.label ?? "us-base",
      batchSize: args.batch ?? 500,
    });
    console.log("Import finished:", JSON.stringify({ ...result, seconds: Math.round((Date.now() - started) / 1000) }));
  } catch (error) {
    console.error("Import failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    clearInterval(timer);
    await prisma.$disconnect();
  }
}

void main();