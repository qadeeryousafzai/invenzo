export default function Loading() {
  return (
    <main className="min-h-screen bg-[#f7f8f6] px-5 py-10 sm:px-8" role="status" aria-label="Loading marketplace">
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div className="h-8 w-28 rounded-lg bg-slate-200" />
          <div className="h-4 w-24 rounded bg-slate-100" />
        </div>
        <div className="py-12 sm:py-16">
          <div className="h-3 w-40 rounded bg-slate-200" />
          <div className="mt-4 h-10 w-64 max-w-full rounded-lg bg-slate-200" />
          <div className="mt-4 h-4 w-full max-w-xl rounded bg-slate-100" />
          <div className="surface-card mt-8 space-y-4 p-5">
            <div className="h-4 w-44 rounded bg-slate-200" />
            <div className="h-12 rounded-lg bg-slate-100" />
            <div className="h-10 w-40 rounded-lg bg-slate-100" />
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="surface-card flex h-36 gap-4 p-5">
                <div className="size-16 shrink-0 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-100" />
                  <div className="h-5 w-1/3 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Loading products and nearby businesses</span>
    </main>
  );
}
