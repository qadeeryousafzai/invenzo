import { redirect } from "next/navigation";
import { ClipboardCheck, Pill, UserPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export default async function PrescriptionsPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("prescriptions.view")) {
    return <div className="surface-card p-10 text-center"><h1 className="text-xl font-semibold text-[#17231f]">Prescription access unavailable</h1></div>;
  }

  const prescriptions = await prisma.prescription.findMany({
    where: { businessId: context.businessId },
    include: {
      patient: { select: { patientId: true, firstName: true, lastName: true } },
      doctor: { select: { name: true, specialty: true } },
      _count: { select: { items: true } },
    },
    orderBy: { prescriptionDate: "desc" },
    take: 200,
  });

  const activeCount = prescriptions.filter((p) => p.status === "ACTIVE").length;
  const dispensedCount = prescriptions.filter((p) => p.status === "DISPENSED").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#003d32]">Healthcare</p>
          <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-[#17231f] sm:text-3xl">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#003d32]"><ClipboardCheck className="h-5 w-5" /></span>
            Prescriptions
          </h1>
          <p className="mt-2 text-sm text-[#77847d]">Create and track medical prescriptions for patients.</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/dashboard/prescriptions/create" className="button-primary"><UserPlus className="h-4 w-4" /> Create Prescription</a>
        </div>
      </div>

      <section className="surface-card p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#e8eee8] bg-[#ffffff] p-4">
            <p className="text-xs text-[#77847d]">Active prescriptions</p>
            <p className="mt-2 text-2xl font-semibold text-[#17231f]">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-[#e8eee8] bg-[#ffffff] p-4">
            <p className="text-xs text-[#77847d]">Dispensed</p>
            <p className="mt-2 text-2xl font-semibold text-[#17231f]">{dispensedCount}</p>
          </div>
          <div className="rounded-xl border border-[#e8eee8] bg-[#ffffff] p-4">
            <p className="text-xs text-[#77847d]">Total items</p>
            <p className="mt-2 text-2xl font-semibold text-[#17231f]">{prescriptions.reduce((s, p) => s + p._count.items, 0)}</p>
          </div>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[#e8eee8] px-5 py-4">
          <h2 className="font-semibold text-[#17231f]">All prescriptions</h2>
          <p className="mt-1 text-xs text-[#77847d]">{prescriptions.length} prescription{prescriptions.length === 1 ? "" : "s"} recorded.</p>
        </div>
        {prescriptions.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-[#f1f7ee] text-[11px] uppercase tracking-wide text-[#77847d]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Prescription ID</th>
                  <th className="px-5 py-3 font-semibold">Patient</th>
                  <th className="px-5 py-3 font-semibold">Doctor</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Items</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8eee8]">
                {prescriptions.map((rx) => (
                  <tr key={rx.id} className="align-top hover:bg-[#f1f7ee]/70">
                    <td className="px-5 py-4 font-medium text-[#17231f]">{rx.prescriptionId}</td>
                    <td className="px-5 py-4 text-[#77847d]">{rx.patient.firstName} {rx.patient.lastName}</td>
                    <td className="px-5 py-4 text-[#77847d]">{rx.doctor?.name || "—"}</td>
                    <td className="px-5 py-4 text-[#77847d]">{new Date(rx.prescriptionDate).toLocaleDateString()}</td>
                    <td className="px-5 py-4 font-medium text-[#17231f]">{rx._count.items}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${rx.status === "ACTIVE" ? "bg-[#f1fce0] text-[#003d32]" : "bg-slate-100 text-[#77847d]"}`}>
                        {rx.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <ClipboardCheck className="mx-auto h-9 w-9 text-[#cddbcb]" />
            <p className="mt-3 font-semibold text-[#17231f]">No prescriptions yet</p>
            <p className="mt-2 text-sm text-[#77847d]">Create your first prescription to begin.</p>
          </div>
        )}
      </section>
    </div>
  );
}
