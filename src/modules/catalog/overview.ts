import { prisma } from "@/lib/prisma";
import { CATALOG_SOURCES } from "./sources";

export type CatalogSourceOverview = {
  key: string;
  name: string;
  countryCode: string | null;
  countryName: string | null;
  homepageUrl: string;
  datasetUrl: string;
  licenseName: string;
  licenseUrl: string;
  attributionRequired: boolean;
  redistributionAllowed: boolean;
  commercialUseAllowed: boolean;
  enabled: boolean;
  status: "ready" | "review-required" | "blocked";
  notes: string;
  registered: boolean;
  medicineCount: number;
  latestJob: { id: string; status: string; processedRecords: number; importedRecords: number; finishedAt: Date | null } | null;
};

export type CatalogTotals = {
  sources: number;
  enabled: number;
  medicines: number;
};

/** Load the source registry with stored medicine counts and the latest import job. */
export async function getCatalogSourceOverview(): Promise<{ sources: CatalogSourceOverview[]; totals: CatalogTotals }> {
  const [medicinesBySource, jobsBySource, rows] = await Promise.all([
    prisma.medicine.groupBy({ by: ["sourceId"], _count: { _all: true } }),
    prisma.medicineImportJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
      select: { id: true, sourceId: true, status: true, processedRecords: true, importedRecords: true, finishedAt: true },
    }),
    prisma.medicineSource.findMany({ orderBy: { name: "asc" } }),
  ]);

  const countBySource = new Map(medicinesBySource.map((row) => [row.sourceId, row._count._all]));
  const latestJobBySource = new Map<string, (typeof jobsBySource)[number]>();
  for (const job of jobsBySource) {
    if (!latestJobBySource.has(job.sourceId)) latestJobBySource.set(job.sourceId, job);
  }

  const storedKeys = new Set(rows.map((row) => row.key));

  const sources = CATALOG_SOURCES.map((definition) => {
    const stored = rows.find((row) => row.key === definition.key);
    const latestJob = stored ? latestJobBySource.get(stored.id) ?? null : null;
    return {
      key: definition.key,
      name: definition.name,
      countryCode: definition.countryCode,
      countryName: stored?.countryName ?? null,
      homepageUrl: definition.homepageUrl,
      datasetUrl: definition.datasetUrl,
      licenseName: definition.licenseName,
      licenseUrl: definition.licenseUrl,
      attributionRequired: definition.attributionRequired,
      redistributionAllowed: definition.redistributionAllowed,
      commercialUseAllowed: definition.commercialUseAllowed,
      enabled: definition.enabled,
      status: definition.status,
      notes: definition.notes,
      registered: storedKeys.has(definition.key),
      medicineCount: stored ? countBySource.get(stored.id) ?? 0 : 0,
      latestJob: latestJob
        ? {
            id: latestJob.id,
            status: latestJob.status,
            processedRecords: latestJob.processedRecords,
            importedRecords: latestJob.importedRecords,
            finishedAt: latestJob.finishedAt,
          }
        : null,
    } satisfies CatalogSourceOverview;
  });

  return {
    sources,
    totals: {
      sources: sources.length,
      enabled: sources.filter((source) => source.enabled).length,
      medicines: sources.reduce((sum, source) => sum + source.medicineCount, 0),
    },
  };
}