"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import { randomBytes } from "node:crypto";

const schema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().email().max(191).optional().or(z.literal("")),
  address: z.string().trim().max(2000).optional(),
  emergencyContact: z.string().trim().max(191).optional(),
  emergencyPhone: z.string().trim().max(40).optional(),
  allergies: z.string().trim().max(4000).optional(),
  medicalHistory: z.string().trim().max(4000).optional(),
  bloodType: z.string().trim().max(10).optional(),
});

export async function registerPatient(prevState: any, formData: FormData) {
  const context = await getTenantContext();
  if (!context?.businessId) return { error: "No business context" };
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: "Invalid data", details: parsed.error.flatten().fieldErrors };
  const data = parsed.data;
  const patientId = `PT-${randomBytes(4).toString("hex").toUpperCase()}`;
  try {
    await prisma.patient.create({
      data: {
        businessId: context.businessId,
        patientId,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth as string) : null,
        gender: data.gender || undefined,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        emergencyContact: data.emergencyContact || null,
        emergencyPhone: data.emergencyPhone || null,
        allergies: data.allergies || null,
        medicalHistory: data.medicalHistory || null,
        bloodType: data.bloodType || null,
      },
    });
    return { success: true };
  } catch {
    return { error: "Patient could not be registered." };
  }
}
