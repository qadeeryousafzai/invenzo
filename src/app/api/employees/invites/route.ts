import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail, safeEmailHtml } from "@/lib/email";
import { requireTenantContext, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";
import { rateLimit, requestIp } from "@/lib/rate-limit";

export async function GET() {
  try {
    const context = await requireTenantContext("employees.view");
    const employees = await prisma.membership.findMany({ where: { businessId: context.businessId }, select: { id: true, status: true, joinedAt: true, user: { select: { id: true, name: true, email: true } }, role: { select: { id: true, name: true, key: true } } }, orderBy: { joinedAt: "asc" } });
    const invitations = await prisma.membershipInvite.findMany({ where: { businessId: context.businessId, acceptedAt: null, expiresAt: { gt: new Date() } }, select: { id: true, email: true, expiresAt: true, role: { select: { name: true } } }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ data: { employees, invitations } });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    return NextResponse.json({ error: "Employees could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!originIsAllowed(request)) return originError();
  const limit = rateLimit(`invite:${requestIp(request)}`, 20, 60 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many invitations. Try again later." }, { status: 429 });
  try {
    const context = await requireTenantContext("employees.manage");
    const body = await request.json().catch(() => null);
    const parsed = z.object({ email: z.email().max(191), roleId: z.string().min(1).max(191) }).strict().safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address and role." }, { status: 400 });
    const email = parsed.data.email.trim().toLowerCase();
    const [role, user] = await Promise.all([
      prisma.role.findFirst({ where: { id: parsed.data.roleId, businessId: context.businessId }, select: { id: true, key: true, name: true } }),
      prisma.user.findUnique({ where: { email }, select: { id: true } }),
    ]);
    if (!role || role.key === "OWNER") return NextResponse.json({ error: "Choose a valid non-owner role from this workspace." }, { status: 400 });
    if (user && await prisma.membership.findFirst({ where: { userId: user.id, businessId: context.businessId }, select: { id: true } })) return NextResponse.json({ error: "This user already has a workspace membership." }, { status: 409 });

    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const invite = await prisma.$transaction(async (tx) => {
      await tx.membershipInvite.deleteMany({ where: { businessId: context.businessId, email, acceptedAt: null } });
      return tx.membershipInvite.create({ data: { businessId: context.businessId, roleId: role.id, invitedById: context.userId, email, tokenHash, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, include: { business: { select: { name: true } } } });
    });
    try {
      const link = new URL("/invite/accept", process.env.APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000");
      link.searchParams.set("token", token);
      await sendTransactionalEmail(email, `Invitation to ${invite.business.name}`, safeEmailHtml(`Join ${invite.business.name} on Invenzo`, link.toString(), "Accept invitation", "7 days"));
    } catch (error) {
      await prisma.membershipInvite.delete({ where: { id: invite.id } }).catch(() => undefined);
      console.error("Invitation email delivery failed", error);
      return NextResponse.json({ error: "Invitation email could not be delivered. Check email configuration." }, { status: 503 });
    }
    await prisma.auditLog.create({ data: { businessId: context.businessId, userId: context.userId, action: "employee.invited", entity: "membership_invite", entityId: invite.id } });
    return NextResponse.json({ message: "Invitation email sent." }, { status: 201 });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    console.error("Employee invitation failed", error);
    return NextResponse.json({ error: "Invitation could not be created." }, { status: 500 });
  }
}
