import { redirect } from "next/navigation";
import { Briefcase, Stethoscope } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export default async function ServicesPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("services.view")) {
    return <div className="surface-card p-10 text-center"><h1 className="text-xl font-semibold text-[#17231f]">Service access unavailable</h1><p className="mt-2 text-sm text-[#77847d]">Your role does not include service viewing permission.</p></div>;
  }

  const services = await prisma.service.findMany({
    where: { businessId: context.businessId, deletedAt: null },
    include: { department: { select: { name: true } } },
    orderBy: { name: "asc" },
    take: 500,
  });

  const totalPrice = services.reduce((sum, s) => sum + Number(s.price ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#003d32]">Healthcare</p>
          <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-[#17231f] sm:text-3xl">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#003d32]"><Briefcase className="h-5 w-5" /></span>
            Services
          </h1>
          <p className="mt-2 text-sm text-[#77847d]">Manage medical services offered by this workspace, including pricing and department assignment.</p>
        </div>
      </div>

      <section className="surface-card p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#e8eee8] bg-[#ffffff] p-4">
            <p className="text-xs text-[#77847d]">Total services</p>
            <p className="mt-2 text-2xl font-semibold text-[#17231f]">{services.length}</p>
          </div>
          <div className="rounded-xl border border-[#e8eee8] bg-[#ffffff] p-4">
            <p className="text-xs text-[#77847d]">With department</p>
            <p className="mt-2 text-2xl font-semibold text-[#17231f]">{services.filter((s) => s.departmentId).length}</p>
          </div>
          <div className="rounded-xl border border-[#e8eee8] bg-[#ffffff] p-4">
            <p className="text-xs text-[#77847d]">Avg price</p>
            <p className="mt-2 text-2xl font-semibold text-[#17231f]">{services.length ? (totalPrice / services.length).toFixed(2) : "0.00"}</p>
          </div>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[#e8eee8] px-5 py-4">
          <h2 className="font-semibold text-[#17231f]">All services</h2>
          <p className="mt-1 text-xs text-[#77847d]">{services.length} service{services.length === 1 ? "" : "s"} configured.</p>
        </div>
        {services.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-[#f1f7ee] text-[11px] uppercase tracking-wide text-[#77847d]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Service</th>
                  <th className="px-5 py-3 font-semibold">Department</th>
                  <th className="px-5 py-3 font-semibold">Price</th>
                  <th className="px-5 py-3 font-semibold">Duration</th>
                  <th className="px-5 py-3 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8eee8]">
                {services.map((svc) => (
                  <tr key={svc.id} className="align-top hover:bg-[#f1f7ee]/70">
                    <td className="px-5 py-4 font-medium text-[#17231f]">{svc.name}</td>
                    <td className="px-5 py-4 text-[#77847d]">{svc.department?.name || "General"}</td>
                    <td className="px-5 py-4 font-medium text-[#17231f]">${Number(svc.price ?? 0).toFixed(2)}</td>
                    <td className="px-5 py-4 text-[#77847d]">{svc.duration ?? 30} min</td>
                    <td className="px-5 py-4 text-[#77847d]">{svc.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <Briefcase className="mx-auto h-9 w-9 text-[#cddbcb]" />
            <p className="mt-3 font-semibold text-[#17231f]">No services configured</p>
            <p className="mt-2 text-sm text-[#77847d]">Add services to start offering them to patients.</p>
          </div>
        )}
      </section>
    </div>
  );
}
