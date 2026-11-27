import { z } from "zod";

export const registrationSchema = z.object({
  ownerName: z.string().trim().min(2).max(100),
  email: z.email().max(191),
  password: z.string().min(12).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/),
  businessName: z.string().trim().min(2).max(191),
  businessType: z.enum(["PHARMACY", "GROCERY", "ELECTRONICS", "CLOTHING", "WHOLESALE", "GENERAL_RETAIL", "OTHER"]),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(1000).optional(),
  description: z.string().trim().max(2000).optional(),
  taxId: z.string().trim().max(100).optional(),
  website: z.url().max(255).optional(),
  currency: z.string().regex(/^[A-Z]{3}$/).default("PKR"),
  timezone: z.string().trim().min(1).max(64).default("UTC"),
  branchName: z.string().trim().min(2).max(191),
  branchCode: z.string().trim().min(2).max(32).regex(/^[A-Za-z0-9_-]+$/).default("MAIN"),
  branchPhone: z.string().trim().max(40).optional(),
  branchAddress: z.string().trim().max(1000).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  businessHours: z.record(z.string(), z.string().max(100)).optional(),
}).strict();
