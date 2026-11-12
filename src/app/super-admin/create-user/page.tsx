"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function SuperAdminCreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    brandName: "",
    brandCategory: "",
    address: "",
    role: "USER",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const body = JSON.stringify({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone || undefined,
        brandName: formData.brandName || undefined,
        brandCategory: formData.brandCategory || undefined,
        address: formData.address || undefined,
      });
      const res = await fetch("/api/super-admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");
      setSuccess("User created successfully!");
      setFormData({ name: "", email: "", password: "", phone: "", brandName: "", brandCategory: "", address: "", role: "USER" });
      setTimeout(() => router.push("/super-admin/verified-users"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-5 py-8 sm:px-8">
      <div>
        <p className="text-xs font-bold tracking-[.15em] text-slate-500">USER MANAGEMENT</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Create User</h1>
        <p className="mt-2 text-sm text-slate-500">Create a new user account for the platform.</p>
      </div>
      <div className="surface-card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              <CheckCircle size={16} />
              {success}
            </div>
          )}
          <div>
            <label className="field-label">Full name<input className="input-control" type="text" name="name" required placeholder="John Doe" value={formData.name} onChange={handleChange} /></label>
          </div>
          <div>
            <label className="field-label">Email address<input className="input-control" type="email" name="email" required placeholder="john@example.com" value={formData.email} onChange={handleChange} /></label>
          </div>
          <div>
            <label className="field-label">Phone number<input className="input-control" type="tel" name="phone" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleChange} /></label>
          </div>
          <div>
            <label className="field-label">Brand name<input className="input-control" type="text" name="brandName" placeholder="Acme Pharmacy" value={formData.brandName} onChange={handleChange} /></label>
          </div>
          <div>
            <label className="field-label">Brand category
              <select className="input-control mt-1" name="brandCategory" value={formData.brandCategory} onChange={handleChange}>
                <option value="">Select category</option>
                <option value="PHARMACY">Pharmacy</option>
                <option value="CLINIC">Clinic</option>
                <option value="HOSPITAL">Hospital</option>
                <option value="DISTRIBUTOR">Distributor</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
          </div>
          <div>
            <label className="field-label">Address<textarea className="input-control mt-1" name="address" rows={3} placeholder="123 Main St, City, State, ZIP" value={formData.address} onChange={handleChange} /></label>
          </div>
          <div>
            <label className="field-label">Password<input className="input-control" type="password" name="password" required placeholder="••••••••" minLength={8} value={formData.password} onChange={handleChange} /></label>
          </div>
          <div>
            <label className="field-label">Role
              <select className="input-control mt-1" name="role" value={formData.role} onChange={handleChange}>
                <option value="USER">Client User (creates business)</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </label>
          </div>
          <button type="submit" disabled={loading} className="button-primary w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create User"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}