import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";

const schema = z.object({
  action: z.enum(["suspend", "restore", "archive", "unarchive", "grant_admin", "revoke_admin", "delete"]),
  confirmation: z.string().email().optional(),
}).strict();

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
  if (!originIsAllowed(request)) return originError();
  try {
    const admin = await requireSuperAdmin();
    const { userId } = await context.params;
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Choose a valid account management action." }, { status: 400 });

    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, platformRole: true, disabledAt: true, deletedAt: true, _count: { select: { memberships: true } } },
      });
      if (!current) throw new Error("USER_NOT_FOUND");

      const action = parsed.data.action;
      if (current.id === admin.id && ["suspend", "archive", "revoke_admin", "delete"].includes(action)) throw new Error("CANNOT_CHANGE_SELF");

      if (
        current.platformRole === PlatformRole.SUPER_ADMIN
        && ["suspend", "archive", "revoke_admin"].includes(action)
        && !(await tx.user.count({ where: { platformRole: PlatformRole.SUPER_ADMIN, disabledAt: null, deletedAt: null, id: { not: current.id } } }))
      ) {
        throw new Error("LAST_SUPER_ADMIN");
      }

      if (action === "delete") {
        if (current.platformRole === PlatformRole.SUPER_ADMIN) throw new Error("CANNOT_DELETE_SUPER_ADMIN");
        if (current._count.memberships > 0) throw new Error("USER_HAS_MEMBERSHIPS");
        if (parsed.data.confirmation !== current.email) throw new Error("CONFIRMATION_MISMATCH");
        await tx.auditLog.create({
          data: {
            userId: admin.id,
            action: "user.permanently_deleted",
            entity: "user",
            entityId: userId,
            metadata: { email: current.email, dataRetained: false },
          },
        });
        await tx.user.delete({ where: { id: userId } });
        return { id: userId, email: current.email, deleted: true };
      }

      const now = new Date();
      let data;
      let auditAction: string;
      switch (action) {
        case "suspend":
          if (current.deletedAt) throw new Error("USER_ARCHIVED");
          if (current.disabledAt) throw new Error("USER_ALREADY_SUSPENDED");
          data = { disabledAt: now, tokenVersion: { increment: 1 } };
          auditAction = "user.suspended";
          break;
        case "restore":
          if (current.deletedAt) throw new Error("USER_ARCHIVED");
          if (!current.disabledAt) throw new Error("USER_NOT_SUSPENDED");
          data = { disabledAt: null, tokenVersion: { increment: 1 } };
          auditAction = "user.restored";
          break;
        case "archive":
          if (current.deletedAt) throw new Error("USER_ALREADY_ARCHIVED");
          data = { disabledAt: now, deletedAt: now, tokenVersion: { increment: 1 } };
          auditAction = "user.archived";
          break;
        case "unarchive":
          if (!current.deletedAt) throw new Error("USER_NOT_ARCHIVED");
          data = { disabledAt: null, deletedAt: null, tokenVersion: { increment: 1 } };
          auditAction = "user.unarchived";
          break;
        case "grant_admin":
          if (current.deletedAt || current.disabledAt) throw new Error("USER_INACTIVE");
          if (current.platformRole === PlatformRole.SUPER_ADMIN) throw new Error("ALREADY_SUPER_ADMIN");
          data = { platformRole: PlatformRole.SUPER_ADMIN };
          auditAction = "user.super_admin_granted";
          break;
        case "revoke_admin":
          if (current.platformRole !== PlatformRole.SUPER_ADMIN) throw new Error("NOT_SUPER_ADMIN");
          data = { platformRole: PlatformRole.USER };
          auditAction = "user.super_admin_revoked";
          break;
      }

      const user = await tx.user.update({
        where: { id: userId },
        data,
        select: { id: true, name: true, email: true, platformRole: true, disabledAt: true, deletedAt: true, createdAt: true },
      });
      await tx.auditLog.create({ data: { userId: admin.id, action: auditAction, entity: "user", entityId: userId } });
      return user;
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    if (error instanceof Error && error.message === "USER_NOT_FOUND") return NextResponse.json({ error: "Account not found." }, { status: 404 });
    if (error instanceof Error && error.message === "CANNOT_CHANGE_SELF") return NextResponse.json({ error: "You cannot suspend, archive, or demote your own superadmin account." }, { status: 409 });
    if (error instanceof Error && error.message === "LAST_SUPER_ADMIN") return NextResponse.json({ error: "The last active superadmin cannot be suspended, archived, or demoted." }, { status: 409 });
    if (error instanceof Error && error.message === "USER_ARCHIVED") return NextResponse.json({ error: "Unarchive this account before changing its suspension status." }, { status: 409 });
    if (error instanceof Error && error.message === "USER_ALREADY_SUSPENDED") return NextResponse.json({ error: "Account is already suspended." }, { status: 409 });
    if (error instanceof Error && error.message === "USER_NOT_SUSPENDED") return NextResponse.json({ error: "Account is not suspended." }, { status: 409 });
    if (error instanceof Error && error.message === "USER_ALREADY_ARCHIVED") return NextResponse.json({ error: "Account is already archived." }, { status: 409 });
    if (error instanceof Error && error.message === "USER_NOT_ARCHIVED") return NextResponse.json({ error: "Account is not archived." }, { status: 409 });
    if (error instanceof Error && error.message === "USER_INACTIVE") return NextResponse.json({ error: "Restore the account before granting superadmin access." }, { status: 409 });
    if (error instanceof Error && error.message === "ALREADY_SUPER_ADMIN") return NextResponse.json({ error: "This account is already a superadmin." }, { status: 409 });
    if (error instanceof Error && error.message === "NOT_SUPER_ADMIN") return NextResponse.json({ error: "This account is not a superadmin." }, { status: 409 });
    if (error instanceof Error && error.message === "CANNOT_DELETE_SUPER_ADMIN") return NextResponse.json({ error: "Superadmin accounts cannot be permanently deleted here; revoke privileges and archive the account instead." }, { status: 409 });
    if (error instanceof Error && error.message === "USER_HAS_MEMBERSHIPS") return NextResponse.json({ error: "This account still belongs to a workspace. Archive it or remove its memberships before permanent deletion." }, { status: 409 });
    if (error instanceof Error && error.message === "CONFIRMATION_MISMATCH") return NextResponse.json({ error: "The email confirmation did not match." }, { status: 400 });
    console.error("User account management action failed", error);
    return NextResponse.json({ error: "Account could not be updated." }, { status: 500 });
  }
}