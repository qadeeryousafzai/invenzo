import { redirect } from "next/navigation";
import { Calendar, Stethoscope, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export default async function AppointmentsCalendarPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("appointments.view")) {
    return <div className="surface-card p-10 text-center"><h1 className="text-xl font-semibold text-[#17231f]">Calendar access unavailable</h1></div>;
  }

  const appointments = await prisma.appointment.findMany({
    where: { businessId: context.businessId },
    include: {
      patient: { select: { patientId: true, firstName: true, lastName: true } },
      doctor: { select: { name: true } },
    },
    orderBy: { appointmentDate: "asc" },
    take: 500,
  });

  const today = new Date();
  const todayCount = appointments.filter((a) => new Date(a.appointmentDate).toDateString() === today.toDateString()).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <a href="/dashboard/appointments" className="rounded-xl border border-[#e8eee8] bg-[#ffffff] p-2.5 text-[#77847d] hover:bg-[#f1f7ee]"><ArrowRight className="h-5 w-5" /></a>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#003d32]">Healthcare</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#17231f] sm:text-3xl">Appointment Calendar</h1>
          <p className="mt-1 text-sm text-[#77847d]">View all scheduled appointments in a calendar layout.</p>
        </div>
      </div>

      <section className="surface-card p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#e8eee8] bg-[#ffffff] p-4">
            <p className="text-xs text-[#77847d]">Today</p>
            <p className="mt-2 text-2xl font-semibold text-[#17231f]">{todayCount}</p>
          </div>
          <div className="rounded-xl border border-[#e8eee8] bg-[#ffffff] p-4">
            <p className="text-xs text-[#77847d]">Upcoming</p>
            <p className="mt-2 text-2xl font-semibold text-[#17231f]">{appointments.length}</p>
          </div>
          <div className="rounded-xl border border-[#e8eee8] bg-[#ffffff] p-4">
            <p className="text-xs text-[#77847d]">Doctors</p>
            <p className="mt-2 text-2xl font-semibold text-[#17231f]">{new Set(appointments.map((a) => a.doctorId)).size}</p>
          </div>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[#e8eee8] px-5 py-4">
          <h2 className="font-semibold text-[#17231f]">Upcoming appointments</h2>
          <p className="mt-1 text-xs text-[#77847d]">{appointments.length} appointment{appointments.length === 1 ? "" : "s"} scheduled.</p>
        </div>
        {appointments.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-[#f1f7ee] text-[11px] uppercase tracking-wide text-[#77847d]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Time</th>
                  <th className="px-5 py-3 font-semibold">Patient</th>
                  <th className="px-5 py-3 font-semibold">Doctor</th>
                  <th className="px-5 py-3 font-semibold">Reason</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8eee8]">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="align-top hover:bg-[#f1f7ee]/70">
                    <td className="px-5 py-4 text-[#77847d]">{new Date(appt.appointmentDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-5 py-4 font-medium text-[#17231f]">{appt.patient.firstName} {appt.patient.lastName}</td>
                    <td className="px-5 py-4 text-[#77847d]">{appt.doctor?.name || "—"}</td>
                    <td className="px-5 py-4 text-[#77847d]">{appt.reason || "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${appt.status === "SCHEDULED" ? "bg-[#f1fce0] text-[#003d32]" : "bg-slate-100 text-[#77847d]"}`}>
                        {appt.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <Calendar className="mx-auto h-9 w-9 text-[#cddbcb]" />
            <p className="mt-3 font-semibold text-[#17231f]">No appointments scheduled</p>
            <p className="mt-2 text-sm text-[#77847d]">Book your first appointment to see it here.</p>
          </div>
        )}
      </section>
    </div>
  );
}
