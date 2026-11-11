import { redirect } from "next/navigation";
import { Stethoscope, UserPlus, BadgeDollarSign, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export default async function DoctorsPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("doctors.view")) {
    return <div className="surface-card p-10 text-center"><h1 className="text-xl font-semibold text-[#17231f]">Doctor access unavailable</h1><p className="mt-2 text-sm text-[#77847d]">Your role does not include doctor viewing permission.</p></div>;
  }

  const [departments, doctors] = await Promise.all([
    prisma.department.findMany({ where: { businessId: context.businessId, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.doctor.findMany({ where: { businessId: context.businessId, deletedAt: null }, include: { department: { select: { name: true } }, _count: { select: { appointments: true, prescriptions: true } } }, orderBy: { name: "asc" }, take: 500 }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#003d32]">Healthcare</p>
          <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-[#17231f] sm:text-3xl">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#003d32]"><Stethoscope className="h-5 w-5" /></span>
            Doctors
          </h1>
          <p className="mt-2 text-sm text-[#77847d]">Manage medical staff, specialties, and consultation fees for this workspace.</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/dashboard/doctors/register" className="button-primary"><UserPlus className="h-4 w-4" /> Add Doctor</a>
        </div>
      </div>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[#e8eee8] px-5 py-4">
          <h2 className="font-semibold text-[#17231f]">All doctors</h2>
          <p className="mt-1 text-xs text-[#77847d]">{doctors.length} doctor{doctors.length === 1 ? "" : "s"} registered in this workspace.</p>
        </div>
        {doctors.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-[#f1f7ee] text-[11px] uppercase tracking-wide text-[#77847d]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Doctor</th>
                  <th className="px-5 py-3 font-semibold">Specialty</th>
                  <th className="px-5 py-3 font-semibold">Department</th>
                  <th className="px-5 py-3 font-semibold">Contact</th>
                  <th className="px-5 py-3 font-semibold">Fee</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8eee8]">
                {doctors.map((doctor) => (
                  <tr key={doctor.id} className="align-top hover:bg-[#f1f7ee]/70">
                    <td className="px-5 py-4 font-medium text-[#17231f]">{doctor.name}</td>
                    <td className="px-5 py-4 text-[#77847d]">{doctor.specialty}</td>
                    <td className="px-5 py-4 text-[#77847d]">{doctor.department?.name || "—"}</td>
                    <td className="px-5 py-4 text-[#77847d]">{doctor.phone || "—"}</td>
                    <td className="px-5 py-4 font-medium text-[#17231f]">{doctor.consultationFee ? doctor.consultationFee.toFixed(2) : "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${doctor.status === "ACTIVE" ? "bg-[#f1fce0] text-[#003d32]" : "bg-slate-100 text-[#77847d]"}`}>
                        {doctor.status.replace("_", " ")}
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
            <p className="mt-3 font-semibold text-[#17231f]">No doctors registered yet</p>
            <p className="mt-2 text-sm text-[#77847d]">Add doctors to enable appointment scheduling and prescriptions.</p>
          </div>
        )}
      </section>
    </div>
  );
}
