import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenant-context";
import { ClientRegisterForm } from "./ClientRegisterForm";

export default async function RegisterPatientPage() {
  const context = await getTenantContext();
  if (!context) redirect("/login");
  if (!context.businessId || !context.permissions?.has("patients.view")) {
    return <div className="surface-card p-10 text-center"><h1 className="text-xl font-semibold text-[#17231f]">Access unavailable</h1></div>;
  }
  return <ClientRegisterForm />;
}
