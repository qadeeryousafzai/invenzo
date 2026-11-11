import { redirect } from "next/navigation";
import { Calendar, UserPlus, Stethoscope, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export default async function AppointmentsPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("appointments.view")) {
    return <div className="surface-card p-10 text-center"><h1 className="text-xl font-semibold text-[#17231f]">Appointment access unavailable</h1></div>;
  }

  const appointments = await prisma.appointment.findMany({
    where: { businessId: context.businessId },
    include: {
      patient: { select: { patientId: true, firstName: true, lastName: true } },
      doctor: { select: { name: true, specialty: true } },
      department: { select: { name: true } },
    },
    orderBy: { appointmentDate: "desc" },
    take: 200,
  });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayCount = appointments.filter((a) => new Date(a.appointmentDate).toDateString() === today.toDateString()).length;
  const pendingCount = appointments.filter((a) => a.status === "SCHEDULED").length;
  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#003d32]">Healthcare</p>
          <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-tight text-[#17231f] sm:text-3xl">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1fce0] text-[#003d32]"><Calendar className="h-5 w-5" /></span>
            Appointments
          </h1>
          <p className="mt-2 text-sm text-[#77847d]">Schedule and track patient appointments with doctors and departments.</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/dashboard/appointments/book" className="button-primary"><UserPlus className="h-4 w-4" /> Book Appointment</a>
        </div>
      </div>

      <section className="surface-card p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#e8eee8] bg-[#ffffff] p-4">
            <p className="text-xs text-[#77847d]">Today's appointments</p>
            <p className="mt-2 text-2xl font-semibold text-[#17231f]">{todayCount}</p>
          </div>
          <div className="rounded-xl border border-[#e8eee8] bg-[#ffffff] p-4">
            <p className="text-xs text-[#77847d]">Pending</p>
            <p className="mt-2 text-2xl font-semibold text-[#17231f]">{pendingCount}</p>
          </div>
          <div className="rounded-xl border border-[#e8eee8] bg-[#ffffff] p-4">
            <p className="text-xs text-[#77847d]">Completed</p>
            <p className="mt-2 text-2xl font-semibold text-[#17231f]">{completedCount}</p>
          </div>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[#e8eee8] px-5 py-4">
          <h2 className="font-semibold text-[#17231f]">All appointments</h2>
          <p className="mt-1 text-xs text-[#77847d]">{appointments.length} appointment{appointments.length === 1 ? "" : "s"} scheduled.</p>
        </div>
        {appointments.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-[#f1f7ee] text-[11px] uppercase tracking-wide text-[#77847d]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Patient</th>
                  <th className="px-5 py-3 font-semibold">Doctor</th>
                  <th className="px-5 py-3 font-semibold">Department</th>
                  <th className="px-5 py-3 font-semibold">Date / Time</th>
                  <th className="px-5 py-3 font-semibold">Reason</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8eee8]">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="align-top hover:bg-[#f1f7ee]/70">
                    <td className="px-5 py-4 font-medium text-[#17231f]">{appt.patient.firstName} {appt.patient.lastName}</td>
                    <td className="px-5 py-4 text-[#77847d]">{appt.doctor?.name || "—"}</td>
                    <td className="px-5 py-4 text-[#77847d]">{appt.department?.name || "—"}</td>
                    <td className="px-5 py-4 text-[#77847d]">{new Date(appt.appointmentDate).toLocaleDateString()} · {appt.appointmentTime}</td>
                    <td className="px-5 py-4 text-[#77847d]">{appt.reason || "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(appt.status)}`}>
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
            <p className="mt-2 text-sm text-[#77847d]">Book your first appointment to get started.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function statusColor(status: string) {
  switch (status) {
    case "SCHEDULED": return "bg-[#f1fce0] text-[#003d32]";
    case "CONFIRMED": return "bg-[#dcfce7] text-[#166534]";
    case "CHECKED_IN": return "bg-[#dbeafe] text-[#1d4ed8]";
    case "COMPLETED": return "bg-[#f1fce0] text-[#003d32]";
    case "CANCELLED": return "bg-[#fdecea] text-[#b91c1c]";
    case "NO_SHOW": return "bg-[#fdecea] text-[#b91c1c]";
    default: return "bg-slate-100 text-[#77847d]";
  }
}
