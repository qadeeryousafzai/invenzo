import { connection } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/tenant-context";

export default async function SuperAdminMessagesPage() {
  await connection();
  try { await requireSuperAdmin(); } catch { redirect("/login"); }
  const messages = await prisma.notification.findMany({
    where: { audience: "PLATFORM_ADMIN" },
    select: { id: true, title: true, body: true, type: true, readAt: true, createdAt: true, businessId: true, userId: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <main className="mx-auto max-w-360 space-y-8 px-5 py-8 sm:px-8 sm:py-10">
      <div>
        <p className="text-xs font-bold tracking-[.15em] text-slate-500">COMMUNICATIONS</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Messages from Users</h1>
        <p className="mt-2 text-sm text-slate-500">Messages and notifications received from platform users.</p>
      </div>
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-[#fafbfa] text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Message</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {messages.map((message) => (
                <tr key={message.id}>
                  <td className="px-5 py-4 font-semibold text-slate-800">{message.title}</td>
                  <td className="px-5 py-4 text-sm text-slate-600 max-w-xs truncate">{message.body}</td>
                  <td className="px-5 py-4 text-xs text-slate-600">{message.type}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      message.readAt ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                    }`}>
                      {message.readAt ? "Read" : "Unread"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600">
                    {new Date(message.createdAt).toLocaleDateString("en", { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                </tr>
              ))}
              {!messages.length && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">No messages found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}