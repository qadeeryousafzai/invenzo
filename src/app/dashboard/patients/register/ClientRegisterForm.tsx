"use client";

import { useActionState } from "react";
import { Stethoscope, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { registerPatient } from "./actions";

export function ClientRegisterForm() {
  const [state, formAction] = useActionState(registerPatient, null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/patients" className="rounded-xl border border-[#e8eee8] bg-[#ffffff] p-2.5 text-[#77847d] hover:bg-[#f1f7ee]"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#003d32]">Healthcare</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#17231f] sm:text-3xl">Register Patient</h1>
          <p className="mt-1 text-sm text-[#77847d]">Create a new patient record for this workspace.</p>
        </div>
      </div>

      <section className="surface-card p-5 sm:p-6">
        <form action={formAction}>
          {state?.error && <div className="mb-4 alert-error">{state.error}</div>}
          {state?.success && <div className="mb-4 alert-success">Patient registered successfully.</div>}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="col-span-full">
              <label className="field-label">Patient ID (auto-generated)</label>
              <input className="input-control" readOnly defaultValue={`PT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`} />
            </div>
            <label className="field-label">First name *<input className="input-control" name="firstName" required /></label>
            <label className="field-label">Last name *<input className="input-control" name="lastName" required /></label>
            <label className="field-label">Date of birth<input className="input-control" name="dateOfBirth" type="date" /></label>
            <label className="field-label">Gender
              <select className="input-control" name="gender">
                <option value="">Not specified</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </label>
            <label className="field-label">Phone<input className="input-control" name="phone" placeholder="+1 (555) 000-0000" /></label>
            <label className="field-label">Email<input className="input-control" name="email" type="email" placeholder="patient@example.com" /></label>
            <label className="field-label sm:col-span-2 xl:col-span-3">Address<textarea className="input-control min-h-20 resize-y" name="address"></textarea></label>
            <label className="field-label">Emergency contact<input className="input-control" name="emergencyContact" placeholder="Name and relationship" /></label>
            <label className="field-label">Emergency phone<input className="input-control" name="emergencyPhone" /></label>
            <label className="field-label">Allergies<textarea className="input-control min-h-20 resize-y" name="allergies"></textarea></label>
            <label className="field-label sm:col-span-2 xl:col-span-3">Medical history<textarea className="input-control min-h-32 resize-y" name="medicalHistory"></textarea></label>
            <label className="field-label">Blood type
              <select className="input-control" name="bloodType">
                <option value="">Not specified</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </label>
            <div className="sm:col-span-2 xl:col-span-3 flex gap-3">
              <button className="button-primary flex-1"><Stethoscope className="h-4 w-4 mr-2" /> Register patient</button>
              <Link href="/dashboard/patients" className="button-secondary flex-1 text-center">Cancel</Link>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
