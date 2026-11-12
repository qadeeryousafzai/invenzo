import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(191),
  password: z.string().min(8).max(128),
  phone: z.string().trim().max(40).optional(),
  brandName: z.string().trim().max(191).optional(),
  brandCategory: z.enum(["PHARMACY", "GROCERY", "ELECTRONICS", "CLOTHING", "WHOLESALE", "GENERAL_RETAIL", "OTHER"]).or(z.literal("")).optional(),
  address: z.string().trim().max(1000).optional(),
  role: z.enum(["USER", "SUPER_ADMIN"]).default("USER"),
}).strict();

const businessTypeEnum = ["PHARMACY", "GROCERY", "ELECTRONICS", "CLOTHING", "WHOLESALE", "GENERAL_RETAIL", "OTHER"] as const;

export async function POST(request: Request) {
  if (!originIsAllowed(request)) return originError();
  try {
    await requireSuperAdmin();
    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      console.warn("[super-admin/create-user] validation failed", { fieldErrors, bodyKeys: body ? Object.keys(body) : null });
      return NextResponse.json({ error: "Invalid input.", details: fieldErrors }, { status: 400 });
    }
    const data = parsed.data;

    const email = data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });

    const passwordHash = await hash(data.password, 12);

    if (data.role === "SUPER_ADMIN") {
      const user = await prisma.user.create({
        data: { name: data.name, email, passwordHash, platformRole: "SUPER_ADMIN", emailVerified: new Date() },
        select: { id: true, name: true, email: true, platformRole: true, createdAt: true },
      });
      return NextResponse.json({ data: user }, { status: 201 });
    }

    if (!data.brandName) return NextResponse.json({ error: "Brand name is required for client users." }, { status: 400 });

    const brandName = data.brandName;

    const baseSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120) || "business";
    const brandCategory: "PHARMACY" | "GROCERY" | "ELECTRONICS" | "CLOTHING" | "WHOLESALE" | "GENERAL_RETAIL" | "OTHER" = (data.brandCategory && businessTypeEnum.includes(data.brandCategory) ? data.brandCategory : "GENERAL_RETAIL") as "PHARMACY" | "GROCERY" | "ELECTRONICS" | "CLOTHING" | "WHOLESALE" | "GENERAL_RETAIL" | "OTHER";

    const businessId = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { name: data.name, email, passwordHash, emailVerified: new Date() } });

      await tx.permission.createMany({
        data: [
          { key: "business.read", description: "Read business info" },
          { key: "business.write", description: "Update business info" },
          { key: "branch.read", description: "Read branches" },
          { key: "branch.write", description: "Manage branches" },
          { key: "user.read", description: "Read users" },
          { key: "user.write", description: "Manage users" },
          { key: "role.read", description: "Read roles" },
          { key: "role.write", description: "Manage roles" },
          { key: "product.read", description: "Read products" },
          { key: "product.write", description: "Manage products" },
          { key: "category.read", description: "Read categories" },
          { key: "category.write", description: "Manage categories" },
          { key: "supplier.read", description: "Read suppliers" },
          { key: "supplier.write", description: "Manage suppliers" },
          { key: "customer.read", description: "Read customers" },
          { key: "customer.write", description: "Manage customers" },
          { key: "sale.read", description: "Read sales" },
          { key: "sale.write", description: "Manage sales" },
          { key: "purchase.read", description: "Read purchases" },
          { key: "purchase.write", description: "Manage purchases" },
          { key: "expense.read", description: "Read expenses" },
          { key: "expense.write", description: "Manage expenses" },
          { key: "report.read", description: "Read reports" },
          { key: "settings.read", description: "Read settings" },
          { key: "settings.write", description: "Manage settings" },
          { key: "audit.read", description: "Read audit logs" },
        ],
        skipDuplicates: true,
      });

      const business = await tx.business.create({
        data: {
          name: brandName,
          slug: `${baseSlug}-${Math.random().toString(36).slice(2, 5)}`,
          type: brandCategory as "PHARMACY" | "GROCERY" | "ELECTRONICS" | "CLOTHING" | "WHOLESALE" | "GENERAL_RETAIL" | "OTHER",
          email,
          phone: data.phone,
          address: data.address,
          currency: "USD",
          timezone: "UTC",
          accountStatus: "ACTIVE",
          subscriptionStartedAt: new Date(),
          subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      await tx.role.createMany({
        data: [
          { businessId: business.id, name: "Owner", key: "OWNER", isSystem: true },
          { businessId: business.id, name: "Manager", key: "MANAGER", isSystem: true },
          { businessId: business.id, name: "Staff", key: "STAFF", isSystem: true },
        ],
      });
      const roles = await tx.role.findMany({ where: { businessId: business.id }, select: { id: true, key: true } });
      const roleIds = new Map<string, string>(roles.map((r) => [r.key, r.id]));
      const rolePermissions: { roleId: string; permissionKey: string }[] = [];
      const ownerPerms = ["business.read", "business.write", "branch.read", "branch.write", "user.read", "user.write", "role.read", "role.write", "product.read", "product.write", "category.read", "category.write", "supplier.read", "supplier.write", "customer.read", "customer.write", "sale.read", "sale.write", "purchase.read", "purchase.write", "expense.read", "expense.write", "report.read", "settings.read", "settings.write", "audit.read"];
      const managerPerms = ["business.read", "branch.read", "branch.write", "user.read", "product.read", "product.write", "category.read", "category.write", "supplier.read", "supplier.write", "customer.read", "customer.write", "sale.read", "sale.write", "purchase.read", "purchase.write", "expense.read", "expense.write", "report.read", "settings.read"];
      const staffPerms = ["business.read", "branch.read", "product.read", "customer.read", "customer.write", "sale.read", "sale.write"];

      const ownerRoleId = roleIds.get("OWNER");
      const managerRoleId = roleIds.get("MANAGER");
      const staffRoleId = roleIds.get("STAFF");

      if (ownerRoleId) ownerPerms.forEach((p) => rolePermissions.push({ roleId: ownerRoleId, permissionKey: p }));
      if (managerRoleId) managerPerms.forEach((p) => rolePermissions.push({ roleId: managerRoleId, permissionKey: p }));
      if (staffRoleId) staffPerms.forEach((p) => rolePermissions.push({ roleId: staffRoleId, permissionKey: p }));

      await tx.rolePermission.createMany({ data: rolePermissions, skipDuplicates: true });

      const ownerId = roleIds.get("OWNER");
      if (!ownerId) throw new Error("Owner role not found");
      await tx.membership.create({ data: { businessId: business.id, userId: user.id, roleId: ownerId } });
      await tx.branch.create({ data: { businessId: business.id, name: "Main Branch", code: "MAIN", phone: data.phone ?? undefined, address: data.address ?? undefined, warehouses: { create: { name: "Main warehouse", code: "MAIN" } } } });

      return business.id;
    }, { maxWait: 10000, timeout: 60000 });

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true, platformRole: true, createdAt: true } });
    return NextResponse.json({ data: { user, businessId } }, { status: 201 });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "An account with those details already exists." }, { status: 409 });
    console.error("Create user failed", error);
    return NextResponse.json({ error: "User could not be created." }, { status: 500 });
  }
}