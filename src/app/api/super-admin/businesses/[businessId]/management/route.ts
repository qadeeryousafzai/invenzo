import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";

const schema = z.object({
  action: z.enum(["pause", "resume", "archive", "restore", "delete"]),
  reason: z.string().trim().max(500).optional(),
  confirmation: z.string().max(191).optional(),
}).strict();

export async function PATCH(request: Request, context: { params: Promise<{ businessId: string }> }) {
  if (!originIsAllowed(request)) return originError();
  try {
    const admin = await requireSuperAdmin();
    const { businessId } = await context.params;
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Choose a valid workspace management action." }, { status: 400 });

    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.business.findUnique({
        where: { id: businessId },
        select: { name: true, deletedAt: true, accessPausedAt: true },
      });
      if (!current) throw new Error("BUSINESS_NOT_FOUND");

      const now = new Date();
      let data;
      let auditAction: string;
      let metadata: Record<string, string | boolean> | undefined;

      switch (parsed.data.action) {
        case "pause":
          if (current.deletedAt) throw new Error("BUSINESS_ARCHIVED");
          if (current.accessPausedAt) throw new Error("BUSINESS_ALREADY_PAUSED");
          data = { accessPausedAt: now, accessPausedReason: parsed.data.reason || null };
          auditAction = "business.access.paused";
          metadata = parsed.data.reason ? { reason: parsed.data.reason } : undefined;
          break;
        case "resume":
          if (current.deletedAt) throw new Error("BUSINESS_ARCHIVED");
          if (!current.accessPausedAt) throw new Error("BUSINESS_NOT_PAUSED");
          data = { accessPausedAt: null, accessPausedReason: null };
          auditAction = "business.access.resumed";
          break;
        case "archive":
          if (current.deletedAt) throw new Error("BUSINESS_ALREADY_ARCHIVED");
          data = { deletedAt: now };
          auditAction = "business.archived";
          metadata = { dataRetained: true };
          break;
        case "restore":
          if (!current.deletedAt) throw new Error("BUSINESS_NOT_ARCHIVED");
          data = { deletedAt: null };
          auditAction = "business.restored";
          break;
        case "delete":
          if (parsed.data.confirmation !== current.name) throw new Error("CONFIRMATION_MISMATCH");
          await tx.business.delete({ where: { id: businessId } });
          await tx.auditLog.create({
            data: {
              userId: admin.id,
              action: "business.permanently_deleted",
              entity: "business",
              entityId: businessId,
              metadata: { name: current.name, dataRetained: false },
            },
          });
          return { id: businessId, name: current.name, deleted: true };
      }

      const business = await tx.business.update({
        where: { id: businessId },
        data,
        select: { id: true, name: true, deletedAt: true, accessPausedAt: true, accessPausedReason: true, verificationStatus: true, subscriptionExpiresAt: true },
      });
      await tx.auditLog.create({ data: { businessId, userId: admin.id, action: auditAction, entity: "business", entityId: businessId, metadata } });
      return business;
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    if (error instanceof Error && error.message === "BUSINESS_NOT_FOUND") return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    if (error instanceof Error && error.message === "BUSINESS_ARCHIVED") return NextResponse.json({ error: "Restore the archived workspace before pausing or resuming access." }, { status: 409 });
    if (error instanceof Error && error.message === "BUSINESS_ALREADY_PAUSED") return NextResponse.json({ error: "Workspace access is already paused." }, { status: 409 });
    if (error instanceof Error && error.message === "BUSINESS_NOT_PAUSED") return NextResponse.json({ error: "Workspace access is not paused." }, { status: 409 });
    if (error instanceof Error && error.message === "BUSINESS_ALREADY_ARCHIVED") return NextResponse.json({ error: "Workspace is already archived." }, { status: 409 });
    if (error instanceof Error && error.message === "BUSINESS_NOT_ARCHIVED") return NextResponse.json({ error: "Workspace is not archived." }, { status: 409 });
    if (error instanceof Error && error.message === "CONFIRMATION_MISMATCH") return NextResponse.json({ error: "The workspace name confirmation did not match." }, { status: 400 });
    console.error("Workspace management action failed", error);
    return NextResponse.json({ error: "Workspace could not be updated." }, { status: 500 });
  }
}