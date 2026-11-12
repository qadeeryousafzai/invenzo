"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Database, Download, Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { DAILYMED_SELECTORS } from "@/modules/catalog/dataset-options";

type CatalogSource = {
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
  latestJob: { id: string; status: string; processedRecords: number; importedRecords: number; finishedAt: string | null } | null;
};

type CatalogJob = {
  id: string;
  status: string;
  sourceKey: string;
  sourceName: string;
  datasetLabel: string | null;
  processedRecords: number;
  importedRecords: number;
  duplicateRecords: number;
  failedRecords: number;
  cursor: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
};

const STATUS_TONE: Record<string, string> = {
  QUEUED: "bg-slate-100 text-slate-700",
  RUNNING: "bg-sky-100 text-sky-700",
  SUCCEEDED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-rose-100 text-rose-700",
  CANCELLED: "bg-amber-100 text-amber-700",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export function CatalogImportPanel({ initialSources }: { initialSources: CatalogSource[] }) {
  const [sources, setSources] = useState(initialSources);
  const [jobs, setJobs] = useState<CatalogJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [pendingSource, setPendingSource] = useState<string | null>(null);
  const [datasetChoice, setDatasetChoice] = useState<Record<string, string>>({});

  const loadJobs = useCallback(async () => {
    try {
      const response = await fetch("/api/super-admin/catalog/jobs?limit=20", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Jobs could not be loaded.");
      setJobs(payload.data ?? []);
    } catch (error) {
      if (jobs.length === 0) toast.error(error instanceof Error ? error.message : "Jobs could not be loaded.");
    } finally {
      setLoadingJobs(false);
    }
  }, [jobs.length]);

  const loadSources = useCallback(async () => {
    const response = await fetch("/api/super-admin/catalog/sources", { cache: "no-store" });
    const payload = await response.json();
    if (response.ok && payload.data?.sources) setSources(payload.data.sources);
  }, []);

  const hasRunningJob = useMemo(() => jobs.some((job) => job.status === "RUNNING" || job.status === "QUEUED"), [jobs]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    if (!hasRunningJob) return;
    const timer = setInterval(() => {
      void loadJobs();
    }, 4000);
    return () => clearInterval(timer);
  }, [hasRunningJob, loadJobs]);

  const startImport = async (source: CatalogSource) => {
    setPendingSource(source.key);
    try {
      const datasetLabel = source.key === "dailymed" ? datasetChoice[source.key] ?? DAILYMED_SELECTORS[0].value : null;
      const response = await fetch("/api/super-admin/catalog/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceKey: source.key, datasetLabel }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "The import could not be started.");
      toast.success(`${source.name} import queued.`);
      await Promise.all([loadJobs(), loadSources()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The import could not be started.");
    } finally {
      setPendingSource(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sources.map((source) => {
          const busy = pendingSource === source.key;
          return (
            <article key={source.key} className="surface-card flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-950">{source.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {source.countryName ?? source.countryCode ?? "Global"}
                    {source.registered ? " · registered" : " · not yet imported"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    source.enabled ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {source.status.replace("-", " ")}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <dt className="text-slate-500">Medicines</dt>
                  <dd className="text-sm font-semibold text-slate-950">{formatNumber(source.medicineCount)}</dd>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <dt className="text-slate-500">Last import</dt>
                  <dd className="truncate text-sm font-semibold text-slate-950">
                    {source.latestJob ? source.latestJob.status : "—"}
                  </dd>
                </div>
              </dl>

              <p className="text-xs leading-relaxed text-slate-600">{source.notes}</p>

              <div className="flex flex-wrap gap-1.5 text-[10px] font-medium">
                <span className={`rounded px-1.5 py-0.5 ${source.redistributionAllowed ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {source.redistributionAllowed ? "Redistribution allowed" : "Redistribution restricted"}
                </span>
                <span className={`rounded px-1.5 py-0.5 ${source.commercialUseAllowed ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {source.commercialUseAllowed ? "Commercial use allowed" : "Commercial use restricted"}
                </span>
                {source.attributionRequired ? (
                  <span className="rounded bg-sky-50 px-1.5 py-0.5 text-sky-700">Attribution required</span>
                ) : null}
              </div>

              {source.key === "dailymed" && source.enabled ? (
                <label className="block text-xs">
                  <span className="text-slate-500">Dataset</span>
                  <select
                    value={datasetChoice[source.key] ?? DAILYMED_SELECTORS[0].value}
                    onChange={(event) => setDatasetChoice((prev) => ({ ...prev, [source.key]: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900"
                  >
                    {DAILYMED_SELECTORS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <div className="mt-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void startImport(source)}
                  disabled={!source.enabled || busy || hasRunningJob}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  {busy ? "Queuing…" : "Start import"}
                </button>
                <a
                  href={source.licenseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Licence
                </a>
              </div>

              {!source.enabled ? (
                <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800">
                  <ShieldAlert size={13} className="mt-0.5 shrink-0" />
                  Disabled until the upstream licence is confirmed in writing.
                </p>
              ) : null}
            </article>
          );
        })}
      </section>

      <section className="surface-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">Import history</h2>
            <p className="text-xs text-slate-500">Most recent catalog import jobs, newest first.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setLoadingJobs(true);
              void Promise.all([loadJobs(), loadSources()]).finally(() => setLoadingJobs(false));
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="text-slate-500">
              <tr className="border-b border-slate-100">
                <th className="py-2 pr-3 font-medium">Source</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Processed</th>
                <th className="py-2 pr-3 font-medium">Imported</th>
                <th className="py-2 pr-3 font-medium">Duplicates</th>
                <th className="py-2 pr-3 font-medium">Failed</th>
                <th className="py-2 pr-3 font-medium">Started</th>
                <th className="py-2 font-medium">Finished</th>
              </tr>
            </thead>
            <tbody>
              {loadingJobs && jobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
                    <Loader2 size={16} className="mx-auto animate-spin" />
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
                    No imports have been run yet.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2 pr-3">
                      <p className="font-medium text-slate-900">{job.sourceName}</p>
                      {job.datasetLabel ? <p className="text-[11px] text-slate-500">{job.datasetLabel}</p> : null}
                      {job.errorMessage ? (
                        <p className="mt-1 flex items-start gap-1 text-[11px] text-rose-600">
                          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                          {job.errorMessage.slice(0, 160)}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-2 pr-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_TONE[job.status] ?? "bg-slate-100 text-slate-700"}`}>
                        {job.status === "SUCCEEDED" ? <CheckCircle2 size={11} /> : null}
                        {job.status === "RUNNING" ? <Loader2 size={11} className="animate-spin" /> : null}
                        {job.status}
                      </span>
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{formatNumber(job.processedRecords)}</td>
                    <td className="py-2 pr-3 tabular-nums">{formatNumber(job.importedRecords)}</td>
                    <td className="py-2 pr-3 tabular-nums">{formatNumber(job.duplicateRecords)}</td>
                    <td className="py-2 pr-3 tabular-nums">{formatNumber(job.failedRecords)}</td>
                    <td className="py-2 pr-3 text-slate-500">{formatDate(job.startedAt ?? job.createdAt)}</td>
                    <td className="py-2 text-slate-500">{formatDate(job.finishedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 flex items-start gap-1.5 text-[11px] text-slate-500">
          <Database size={13} className="mt-0.5 shrink-0" />
          Large archives (3 GB+) download to the server before parsing. Run imports off-peak and keep the browser tab open to
          watch progress.
        </p>
      </section>
    </div>
  );
}