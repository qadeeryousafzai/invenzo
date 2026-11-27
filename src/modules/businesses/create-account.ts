import { createHash, randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { BusinessType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recordBusinessEvent } from "@/modules/businesses/lifecycle";
import { DEFAULT_ROLES, PERMISSIONS } from "@/modules/businesses/permissions";

export type CreateAccountInput = {
  ownerName: string;
  email: string;
  password: string;
  businessName: string;
  businessType: BusinessType;
  phone?: string | null;
  address?: string | null;
  description?: string | null;
  taxId?: string | null;
  website?: string | null;
  currency: string;
  timezone: string;
  branchName: string;
  branchCode: string;
  branchPhone?: string | null;
  branchAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  plan: string;
  subscriptionExpiresAt: Date | null;
};

export type CreateAccountResult = {
  user: { id: string; email: string; name: string | null };
  business: { id: string; name: string };
  verificationToken: string;
};

export async function createAccount(input: CreateAccountInput): Promise<CreateAccountResult> {
  const email = input.email.trim().toLowerCase();
  const plainToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(plainToken).digest("hex");
  const passwordHash = await hash(input.password, 12);
  const baseSlug = input.businessName
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "business";
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    await tx.permission.createMany({
      data: Object.entries(PERMISSIONS).map(([key, description]) => ({ key, description })),
      skipDuplicates: true,
    });
    const user = await tx.user.create({ data: { name: input.ownerName, email, passwordHash } });
    const business = await tx.business.create({
      data: {
        name: input.businessName,
        slug: `${baseSlug}-${randomBytes(3).toString("hex")}`,
        type: input.businessType,
        email,
        phone: input.phone,
        address: input.address,
        description: input.description,
        taxId: input.taxId,
        website: input.website,
        currency: input.currency,
        timezone: input.timezone,
        latitude: input.latitude ? String(input.latitude) : null,
        longitude: input.longitude ? String(input.longitude) : null,
        accountStatus: "ACTIVE",
        plan: input.plan,
        subscriptionStartedAt: now,
        subscriptionExpiresAt: input.subscriptionExpiresAt,
      },
    });
    await tx.role.createMany({
      data: DEFAULT_ROLES.map((role) => ({ businessId: business.id, name: role.name, key: role.key, isSystem: true })),
    });
    const roles = await tx.role.findMany({ where: { businessId: business.id }, select: { id: true, key: true } });
    const roleIds = new Map(roles.map((role) => [role.key, role.id]));
    const rolePermissions = DEFAULT_ROLES.flatMap((role) => {
      const roleId = roleIds.get(role.key);
      return roleId ? role.permissions.map((permissionKey) => ({ roleId, permissionKey })) : [];
    });
    await tx.rolePermission.createMany({ data: rolePermissions, skipDuplicates: true });
    const ownerRoleId = roleIds.get("OWNER");
    if (!ownerRoleId) throw new Error("Owner role could not be initialized.");
    await tx.membership.create({ data: { businessId: business.id, userId: user.id, roleId: ownerRoleId } });
    await tx.branch.create({
      data: {
        businessId: business.id,
        name: input.branchName,
        code: input.branchCode.toUpperCase(),
        phone: input.branchPhone ?? input.phone,
        address: input.branchAddress ?? input.address,
        latitude: input.latitude ? String(input.latitude) : null,
        longitude: input.longitude ? String(input.longitude) : null,
        warehouses: { create: { name: "Main warehouse", code: "MAIN" } },
      },
    });
    await tx.emailVerificationToken.create({ data: { tokenHash, userId: user.id, expiresAt: new Date(Date.now() + 30 * 60 * 1000) } });
    await recordBusinessEvent(tx, {
      businessId: business.id,
      businessName: business.name,
      ownerUserId: user.id,
      previousStatus: null,
      newStatus: "ACTIVE",
      action: "business.payment_succeeded",
      metadata: { businessType: input.businessType, plan: input.plan },
      adminNotice: { type: "business.payment_received", title: "New workspace activated", body: `${business.name} was activated automatically after payment.` },
      ownerNotice: { type: "business.activated", title: "Workspace activated", body: "Your Invenzo workspace is active. Verify your email to sign in." },
    });
    return { user, business };
  }, { maxWait: 10_000, timeout: 60_000 });

  return {
    user: { id: result.user.id, email: result.user.email, name: result.user.name ?? null },
    business: { id: result.business.id, name: result.business.name },
    verificationToken: plainToken,
  };
}
