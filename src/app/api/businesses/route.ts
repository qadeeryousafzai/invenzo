import { createHash, randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail, safeEmailHtml } from "@/lib/email";
import { rateLimit, requestIp } from "@/lib/rate-limit";
import { DEFAULT_ROLES, PERMISSIONS } from "@/modules/businesses/permissions";

const registrationSchema = z.object({
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
  currency: z.string().regex(/^[A-Z]{3}$/).default("USD"),
  timezone: z.string().trim().min(1).max(64).default("UTC"),
  branchName: z.string().trim().min(2).max(191),
  branchCode: z.string().trim().min(2).max(32).regex(/^[A-Za-z0-9_-]+$/).default("MAIN"),
  branchPhone: z.string().trim().max(40).optional(),
  branchAddress: z.string().trim().max(1000).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  businessHours: z.record(z.string(), z.string().max(100)).optional(),
}).strict();

export async function POST(request: Request) {
  const limit = rateLimit(`register:${requestIp(request)}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many registration attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });

  const body = await request.json().catch(() => null);
  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check the registration details.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  const data = parsed.data;
  const email = data.email.trim().toLowerCase();
  let existing;
  try {
    existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  } catch (error) {
    console.error("Registration database check failed", error);
    return NextResponse.json({ error: "Registration is temporarily unavailable. The database may not be configured." }, { status: 503 });
  }
  if (existing) return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });

  const plainToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(plainToken).digest("hex");
  const appUrl = process.env.APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";
  const baseSlug = data.businessName.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120) || "business";
  const passwordHash = await hash(data.password, 12);
  let createdBusinessId = "";

  try {
    createdBusinessId = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { name: data.ownerName, email, passwordHash } });
      const business = await tx.business.create({
        data: {
          name: data.businessName,
          slug: `${baseSlug}-${randomBytes(3).toString("hex")}`,
          type: data.businessType,
          email,
          phone: data.phone,
          address: data.address,
          description: data.description,
          taxId: data.taxId,
          website: data.website,
          currency: data.currency,
          timezone: data.timezone,
          roles: {
            create: DEFAULT_ROLES.map((role) => ({
              name: role.name,
              key: role.key,
              isSystem: true,
              permissions: { create: role.permissions.map((permissionKey) => ({ permission: { connectOrCreate: { where: { key: permissionKey }, create: { key: permissionKey, description: PERMISSIONS[permissionKey] } } } })) },
            })),
          },
        },
        include: { roles: true },
      });
      const ownerRole = business.roles.find((role) => role.key === "OWNER");
      if (!ownerRole) throw new Error("Owner role could not be initialized.");
      await tx.membership.create({ data: { businessId: business.id, userId: user.id, roleId: ownerRole.id } });
      await tx.branch.create({ data: { businessId: business.id, name: data.branchName, code: data.branchCode.toUpperCase(), phone: data.branchPhone ?? data.phone, address: data.branchAddress ?? data.address, latitude: data.latitude, longitude: data.longitude, businessHours: data.businessHours, warehouses: { create: { businessId: business.id, name: "Main warehouse", code: "MAIN" } } } });
      await tx.emailVerificationToken.create({ data: { tokenHash, userId: user.id, expiresAt: new Date(Date.now() + 30 * 60 * 1000) } });
      await tx.auditLog.create({ data: { businessId: business.id, userId: user.id, action: "business.registered", entity: "business", entityId: business.id, metadata: { businessType: data.businessType } } });
      return business.id;
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") return NextResponse.json({ error: "An account or workspace with those details already exists." }, { status: 409 });
    console.error("Business registration failed", error);
    return NextResponse.json({ error: "Registration could not be completed. Please try again." }, { status: 500 });
  }

  try {
    const link = new URL("/verify-email", appUrl);
    link.searchParams.set("token", plainToken);
    await sendTransactionalEmail(email, "Verify your Invenzo account", safeEmailHtml("Verify your email address", link.toString(), "Verify email"));
  } catch (error) {
    if (createdBusinessId) {
      await prisma.$transaction([
        prisma.business.delete({ where: { id: createdBusinessId } }),
        prisma.user.delete({ where: { email } }),
      ]).catch(() => undefined);
    }
    console.error("Verification email delivery failed", error);
    return NextResponse.json({ error: "Email verification is not configured or could not be delivered. Ask the administrator to configure email, then try again." }, { status: 503 });
  }

  return NextResponse.json({ message: "Workspace created. Check your email to verify the account before signing in." }, { status: 201 });
}
