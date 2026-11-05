import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, TenantAuthorizationError } from "@/lib/tenant-context";
import { PERMISSIONS } from "@/modules/businesses/permissions";
import { originError, originIsAllowed } from "@/lib/http";

const permissionKeys = Object.keys(PERMISSIONS) as [keyof typeof PERMISSIONS, ...(keyof typeof PERMISSIONS)[]];
const schema = z.object({ name: z.string().trim().min(2).max(100), permissions: z.array(z.enum(permissionKeys)).max(permissionKeys.length) }).strict();

export async function GET() {
  try {
    const context = await requireTenantContext("employees.view");
    const roles = await prisma.role.findMany({ where: { businessId: context.businessId }, select: { id: true, name: true, key: true, isSystem: true, permissions: { select: { permissionKey: true } } }, orderBy: [{ isSystem: "desc" }, { name: "asc" }] });
    return NextResponse.json({ data: roles });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    return NextResponse.json({ error: "Roles could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!originIsAllowed(request)) return originError();
  try {
    const context = await requireTenantContext("roles.manage");
    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Check the role details.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    if (!parsed.data.permissions.includes("business.view")) return NextResponse.json({ error: "Every custom workspace role must include business viewing access." }, { status: 400 });
    const key = parsed.data.name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 60);
    if (!key) return NextResponse.json({ error: "Role name must include letters or numbers." }, { status: 400 });
    const role = await prisma.$transaction(async (tx) => {
      const created = await tx.role.create({ data: { businessId: context.businessId, name: parsed.data.name, key, permissions: { create: parsed.data.permissions.map((permissionKey) => ({ permission: { connect: { key: permissionKey } } })) } }, include: { permissions: true } });
      await tx.auditLog.create({ data: { businessId: context.businessId, userId: context.userId, action: "role.created", entity: "role", entityId: created.id } });
      return created;
    });
    return NextResponse.json({ data: role }, { status: 201 });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    if (error instanceof Error && "code" in error && error.code === "P2002") return NextResponse.json({ error: "A role with that name already exists." }, { status: 409 });
    console.error("Role creation failed", error);
    return NextResponse.json({ error: "Role could not be created." }, { status: 500 });
  }
}
