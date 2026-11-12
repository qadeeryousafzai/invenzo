import { connection } from "next/server";
import { Database, Globe2, Pill } from "lucide-react";
import { requireSuperAdmin } from "@/lib/tenant-context";
import { CatalogImportPanel } from "@/components/super-admin/catalog-import-panel";
import { getCatalogSourceOverview } from "@/modules/catalog/overview";

export const dynamic = "force-dynamic";

export const metadata = { title: "Global Medicine Catalog" };

export default async function CatalogPage() {
  await connection();
  await requireSuperAdmin();
  const { sources, totals } = await getCatalogSourceOverview();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header>
        <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
          <Globe2 size={18} /> Global Medicine Catalog
        </h1>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600">
          Ingest public pharmaceutical reference datasets once, then reuse them across every pharmacy. Records are deduplicated
          into a single catalog that products and inventory can be linked to. Each source keeps its own licence, so check the
          redistribution and commercial-use flags before enabling a new dataset.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="surface-card flex items-center gap-3 p-4">
          <span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-700">
            <Database size={16} />
          </span>
          <div>
            <p className="text-xs text-slate-500">Sources registered</p>
            <p className="text-xl font-semibold text-slate-950">{totals.sources}</p>
          </div>
        </article>
        <article className="surface-card flex items-center gap-3 p-4">
          <span className="grid size-9 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
            <Globe2 size={16} />
          </span>
          <div>
            <p className="text-xs text-slate-500">Enabled for import</p>
            <p className="text-xl font-semibold text-slate-950">{totals.enabled}</p>
          </div>
        </article>
        <article className="surface-card flex items-center gap-3 p-4">
          <span className="grid size-9 place-items-center rounded-lg bg-sky-100 text-sky-700">
            <Pill size={16} />
          </span>
          <div>
            <p className="text-xs text-slate-500">Catalog medicines</p>
            <p className="text-xl font-semibold text-slate-950">{new Intl.NumberFormat("en-US").format(totals.medicines)}</p>
          </div>
        </article>
      </section>

      <CatalogImportPanel
        initialSources={sources.map((source) => ({
          ...source,
          latestJob: source.latestJob
            ? {
                id: source.latestJob.id,
                status: source.latestJob.status,
                processedRecords: source.latestJob.processedRecords,
                importedRecords: source.latestJob.importedRecords,
                finishedAt: source.latestJob.finishedAt ? source.latestJob.finishedAt.toISOString() : null,
              }
            : null,
        }))}
      />
    </div>
  );
}