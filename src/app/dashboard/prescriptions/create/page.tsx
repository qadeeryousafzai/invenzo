import { redirect } from "next/navigation";
import { ClipboardCheck, Stethoscope, Pill, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export default async function PrescriptionsCreatePage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("prescriptions.create")) {
    return <div className="surface-card p-10 text-center"><h1 className="text-xl font-semibold text-[#17231f]">Prescription access unavailable</h1></div>;
  }

  const [patients, doctors] = await Promise.all([
    prisma.patient.findMany({ where: { businessId: context.businessId, deletedAt: null }, orderBy: { firstName: "asc" }, take: 500 }),
    prisma.doctor.findMany({ where: { businessId: context.businessId, deletedAt: null }, orderBy: { name: "asc" }, take: 500 }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <a href="/dashboard/prescriptions" className="rounded-xl border border-[#e8eee8] bg-[#ffffff] p-2.5 text-[#77847d] hover:bg-[#f1f7ee]"><ArrowRight className="h-5 w-5" /></a>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#003d32]">Healthcare</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#17231f] sm:text-3xl">Create Prescription</h1>
          <p className="mt-1 text-sm text-[#77847d]">Write a new prescription for a patient.</p>
        </div>
      </div>

      <section className="surface-card p-5 sm:p-6">
        <form className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="field-label">Patient *</label>
              <select className="input-control w-full" required>
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Doctor *</label>
              <select className="input-control w-full" required>
                <option value="">Select doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} · {d.specialty}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Diagnosis</label>
              <input className="input-control w-full" placeholder="Diagnosis or condition" />
            </div>
            <div>
              <label className="field-label">Prescription date</label>
              <input className="input-control w-full" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
          </div>
          <div>
            <label className="field-label">Medications / Instructions</label>
            <textarea className="input-control w-full min-h-[120px] resize-y" placeholder="List medications, dosage, frequency, and duration..." />
          </div>
          <div className="flex gap-3">
            <button className="button-primary"><ClipboardCheck className="h-4 w-4 mr-2" /> Create prescription</button>
            <a href="/dashboard/prescriptions" className="button-secondary">Cancel</a>
          </div>
        </form>
      </section>
    </div>
  );
}
