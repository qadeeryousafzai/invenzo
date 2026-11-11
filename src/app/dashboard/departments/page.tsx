import { redirect } from "next/navigation";
import { Building2, Briefcase } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export default async function DepartmentsPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("departments.view")) {
    return <div className="surface-card p-10 text-center"><h1 className="text-xl font-semibold text-[#17231f]">Department access unavailable</h1></div>;
  }

  const departments = await prisma.department.findMany({
    where: { businessId: context.businessId, deletedAt: null },
    include: {
      _count: { select: { doctors: true, services: true, beds: true, admissions: true } },
    },
    orderBy: { name: "asc" },
    take: 500,
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#003d32]">Healthcare</p>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-[#17231f] sm:text-3xl">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#003d32]"><Building2 className="h-5 w-5" /></span>
          Departments
        </h1>
        <p className="mt-2 text-sm text-[#77847d]">Organize medical departments, doctors, services, and beds for this workspace.</p>
      </div>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[#e8eee8] px-5 py-4">
          <h2 className="font-semibold text-[#17231f]">All departments</h2>
          <p className="mt-1 text-xs text-[#77847d]">{departments.length} department{departments.length === 1 ? "" : "s"} in this workspace.</p>
        </div>
        {departments.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-[#f1f7ee] text-[11px] uppercase tracking-wide text-[#77847d]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Department</th>
                  <th className="px-5 py-3 font-semibold">Description</th>
                  <th className="px-5 py-3 font-semibold">Doctors</th>
                  <th className="px-5 py-3 font-semibold">Services</th>
                  <th className="px-5 py-3 font-semibold">Beds</th>
                  <th className="px-5 py-3 font-semibold">Admissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8eee8]">
                {departments.map((dept) => (
                  <tr key={dept.id} className="align-top hover:bg-[#f1f7ee]/70">
                    <td className="px-5 py-4 font-medium text-[#17231f]">{dept.name}</td>
                    <td className="px-5 py-4 text-[#77847d]">{dept.description || "—"}</td>
                    <td className="px-5 py-4 font-medium text-[#17231f]">{dept._count.doctors}</td>
                    <td className="px-5 py-4 font-medium text-[#17231f]">{dept._count.services}</td>
                    <td className="px-5 py-4 font-medium text-[#17231f]">{dept._count.beds}</td>
                    <td className="px-5 py-4 font-medium text-[#17231f]">{dept._count.admissions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <Building2 className="mx-auto h-9 w-9 text-[#cddbcb]" />
            <p className="mt-3 font-semibold text-[#17231f]">No departments yet</p>
            <p className="mt-2 text-sm text-[#77847d]">Add departments to organize your healthcare operations.</p>
          </div>
        )}
      </section>
    </div>
  );
}
