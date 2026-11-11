import { redirect } from "next/navigation";
import { Stethoscope, UserPlus, FileText, History, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export default async function PatientsPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("patients.view")) {
    return <div className="surface-card p-10 text-center"><h1 className="text-xl font-semibold text-[#17231f]">Patient access unavailable</h1><p className="mt-2 text-sm text-[#77847d]">Your role does not include patient viewing permission.</p></div>;
  }

  const patients = await prisma.patient.findMany({
    where: { businessId: context.businessId, deletedAt: null },
    include: {
      _count: { select: { appointments: true, prescriptions: true, admissions: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#003d32]">Healthcare</p>
          <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-[#17231f] sm:text-3xl">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#003d32]"><Stethoscope className="h-5 w-5" /></span>
            Patient Records
          </h1>
          <p className="mt-2 text-sm text-[#77847d]">Manage patient demographics, medical history, and visit records for this workspace.</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/dashboard/patients/register" className="button-primary"><UserPlus className="h-4 w-4" /> Register Patient</a>
        </div>
      </div>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[#e8eee8] px-5 py-4">
          <h2 className="font-semibold text-[#17231f]">All patients</h2>
          <p className="mt-1 text-xs text-[#77847d]">{patients.length} registered patient{patients.length === 1 ? "" : "s"} in this workspace.</p>
        </div>
        {patients.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-[#f1f7ee] text-[11px] uppercase tracking-wide text-[#77847d]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Patient ID</th>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Contact</th>
                  <th className="px-5 py-3 font-semibold">DOB / Gender</th>
                  <th className="px-5 py-3 font-semibold">Records</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8eee8]">
                {patients.map((patient) => (
                  <tr key={patient.id} className="align-top hover:bg-[#f1f7ee]/70">
                    <td className="px-5 py-4 font-medium text-[#17231f]">{patient.patientId}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-[#17231f]">{patient.firstName} {patient.lastName}</p>
                      {patient.email && <p className="mt-0.5 text-xs text-[#77847d]">{patient.email}</p>}
                    </td>
                    <td className="px-5 py-4 text-[#77847d]">{patient.phone || "—"}</td>
                    <td className="px-5 py-4 text-[#77847d]">
                      {patient.dateOfBirth ? patient.dateOfBirth.toLocaleDateString() : "—"} · {patient.gender?.replace("_", " ") || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2 text-xs">
                        <span className="rounded-full px-2 py-0.5 bg-[#f1fce0] text-[#003d32]">{patient._count.appointments}</span>
                        <span className="rounded-full px-2 py-0.5 bg-[#f1fce0] text-[#003d32]">{patient._count.prescriptions}</span>
                        <span className="rounded-full px-2 py-0.5 bg-[#f1fce0] text-[#003d32]">{patient._count.admissions}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${patient.status === "ACTIVE" ? "bg-[#f1fce0] text-[#003d32]" : "bg-slate-100 text-[#77847d]"}`}>
                        {patient.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <Stethoscope className="mx-auto h-9 w-9 text-[#cddbcb]" />
            <p className="mt-3 font-semibold text-[#17231f]">No patients registered yet</p>
            <p className="mt-2 text-sm text-[#77847d]">Register your first patient to begin managing healthcare records.</p>
            <a href="/dashboard/patients/register" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#003d32] underline underline-offset-4">
              Register patient <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
