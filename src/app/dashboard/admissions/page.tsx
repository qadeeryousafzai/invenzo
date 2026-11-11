import { redirect } from "next/navigation";
import { ClipboardCheck, UserRound, Bed, LogOut } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export default async function AdmissionsPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("admissions.view")) {
    return <div className="surface-card p-10 text-center"><h1 className="text-xl font-semibold text-[#17231f]">Admission access unavailable</h1></div>;
  }

  const admissions = await prisma.admission.findMany({
    where: { businessId: context.businessId },
    include: {
      patient: { select: { patientId: true, firstName: true, lastName: true } },
      doctor: { select: { name: true } },
      department: { select: { name: true } },
      bed: { select: { bedNumber: true } },
    },
    orderBy: { admissionDate: "desc" },
    take: 200,
  });

  const activeCount = admissions.filter((a) => a.status === "ADMITTED").length;
  const dischargedCount = admissions.filter((a) => a.status === "DISCHARGED").length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#003d32]">Healthcare</p>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-[#17231f] sm:text-3xl">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#003d32]"><ClipboardCheck className="h-5 w-5" /></span>
          Patient Admissions
        </h1>
        <p className="mt-2 text-sm text-[#77847d]">Manage patient admissions, discharges, and bed assignments.</p>
      </div>

      <section className="surface-card p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#e8eee8] bg-[#ffffff] p-4">
            <p className="text-xs text-[#77847d]">Active admissions</p>
            <p className="mt-2 text-2xl font-semibold text-[#17231f]">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-[#e8eee8] bg-[#ffffff] p-4">
            <p className="text-xs text-[#77847d]">Discharged</p>
            <p className="mt-2 text-2xl font-semibold text-[#17231f]">{dischargedCount}</p>
          </div>
          <div className="rounded-xl border border-[#e8eee8] bg-[#ffffff] p-4">
            <p className="text-xs text-[#77847d]">Total admissions</p>
            <p className="mt-2 text-2xl font-semibold text-[#17231f]">{admissions.length}</p>
          </div>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[#e8eee8] px-5 py-4">
          <h2 className="font-semibold text-[#17231f]">All admissions</h2>
          <p className="mt-1 text-xs text-[#77847d]">{admissions.length} admission{admissions.length === 1 ? "" : "s"} recorded.</p>
        </div>
        {admissions.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-[#f1f7ee] text-[11px] uppercase tracking-wide text-[#77847d]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Admission ID</th>
                  <th className="px-5 py-3 font-semibold">Patient</th>
                  <th className="px-5 py-3 font-semibold">Doctor</th>
                  <th className="px-5 py-3 font-semibold">Department</th>
                  <th className="px-5 py-3 font-semibold">Bed</th>
                  <th className="px-5 py-3 font-semibold">Admitted</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8eee8]">
                {admissions.map((adm) => (
                  <tr key={adm.id} className="align-top hover:bg-[#f1f7ee]/70">
                    <td className="px-5 py-4 font-medium text-[#17231f]">{adm.admissionId}</td>
                    <td className="px-5 py-4 text-[#77847d]">{adm.patient.firstName} {adm.patient.lastName}</td>
                    <td className="px-5 py-4 text-[#77847d]">{adm.doctor?.name || "—"}</td>
                    <td className="px-5 py-4 text-[#77847d]">{adm.department?.name || "—"}</td>
                    <td className="px-5 py-4 text-[#77847d]">{adm.bed?.bedNumber || "—"}</td>
                    <td className="px-5 py-4 text-[#77847d]">{new Date(adm.admissionDate).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${adm.status === "ADMITTED" ? "bg-[#f1fce0] text-[#003d32]" : "bg-slate-100 text-[#77847d]"}`}>
                        {adm.status.replace("_", " ")}
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
            <p className="mt-3 font-semibold text-[#17231f]">No admissions yet</p>
            <p className="mt-2 text-sm text-[#77847d]">Admit your first patient to begin tracking.</p>
          </div>
        )}
      </section>
    </div>
  );
}
