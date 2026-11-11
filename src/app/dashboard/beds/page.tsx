import { redirect } from "next/navigation";
import { Building as BuildingIcon, Bed, UserRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export default async function BedsPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("beds.view")) {
    return <div className="surface-card p-10 text-center"><h1 className="text-xl font-semibold text-[#17231f]">Bed access unavailable</h1></div>;
  }

  const beds = await prisma.bed.findMany({
    where: { businessId: context.businessId, deletedAt: null },
    include: {
      department: { select: { name: true } },
      patient: { select: { patientId: true, firstName: true, lastName: true } },
    },
    orderBy: { bedNumber: "asc" },
    take: 500,
  });

  const availableCount = beds.filter((b) => b.status === "AVAILABLE").length;
  const occupiedCount = beds.filter((b) => b.status === "OCCUPIED").length;
  const maintenanceCount = beds.filter((b) => b.status === "MAINTENANCE").length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#003d32]">Healthcare</p>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-[#17231f] sm:text-3xl">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#003d32]"><Bed className="h-5 w-5" /></span>
          Bed Management
        </h1>
        <p className="mt-2 text-sm text-[#77847d]">Track bed availability, occupancy, and assignments across departments.</p>
      </div>

      <section className="surface-card p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-[#e8eee8] bg-[#ffffff] p-4">
            <p className="text-xs text-[#77847d]">Total beds</p>
            <p className="mt-2 text-2xl font-semibold text-[#17231f]">{beds.length}</p>
          </div>
          <div className="rounded-xl border border-[#e8eee8] bg-[#ffffff] p-4">
            <p className="text-xs text-[#77847d]">Available</p>
            <p className="mt-2 text-2xl font-semibold text-[#17231f]">{availableCount}</p>
          </div>
          <div className="rounded-xl border border-[#e8eee8] bg-[#ffffff] p-4">
            <p className="text-xs text-[#77847d]">Occupied</p>
            <p className="mt-2 text-2xl font-semibold text-[#17231f]">{occupiedCount}</p>
          </div>
          <div className="rounded-xl border border-[#e8eee8] bg-[#ffffff] p-4">
            <p className="text-xs text-[#77847d]">Maintenance</p>
            <p className="mt-2 text-2xl font-semibold text-[#17231f]">{maintenanceCount}</p>
          </div>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[#e8eee8] px-5 py-4">
          <h2 className="font-semibold text-[#17231f]">All beds</h2>
          <p className="mt-1 text-xs text-[#77847d]">{beds.length} bed{beds.length === 1 ? "" : "s"} in this workspace.</p>
        </div>
        {beds.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-[#f1f7ee] text-[11px] uppercase tracking-wide text-[#77847d]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Bed number</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Department</th>
                  <th className="px-5 py-3 font-semibold">Patient</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8eee8]">
                {beds.map((bed) => (
                  <tr key={bed.id} className="align-top hover:bg-[#f1f7ee]/70">
                    <td className="px-5 py-4 font-medium text-[#17231f]">{bed.bedNumber}</td>
                    <td className="px-5 py-4 text-[#77847d]">{bed.bedType.replace("_", " ")}</td>
                    <td className="px-5 py-4 text-[#77847d]">{bed.department?.name || "—"}</td>
                    <td className="px-5 py-4">{bed.patient ? <span className="font-medium text-[#17231f]">{bed.patient.firstName} {bed.patient.lastName}</span> : <span className="text-[#77847d]">—</span>}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${bedStatusColor(bed.status)}`}>
                        {bed.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <Bed className="mx-auto h-9 w-9 text-[#cddbcb]" />
            <p className="mt-3 font-semibold text-[#17231f]">No beds configured</p>
            <p className="mt-2 text-sm text-[#77847d]">Add beds to track hospital capacity.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function bedStatusColor(status: string) {
  switch (status) {
    case "AVAILABLE": return "bg-[#f1fce0] text-[#003d32]";
    case "OCCUPIED": return "bg-[#fdecea] text-[#b91c1c]";
    case "MAINTENANCE": return "bg-[#fef3c7] text-[#92400e]";
    case "RESERVED": return "bg-[#dbeafe] text-[#1d4ed8]";
    default: return "bg-slate-100 text-[#77847d]";
  }
}
