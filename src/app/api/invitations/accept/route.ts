import { createHash } from "node:crypto";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { originError, originIsAllowed } from "@/lib/http";
import { rateLimit, requestIp } from "@/lib/rate-limit";
import { getWorkspaceAccessStatus } from "@/modules/businesses/subscription";

export async function POST(request: Request) {
  if (!originIsAllowed(request)) return originError();
  const limit = rateLimit(`invite-accept:${requestIp(request)}`, 15, 15 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const session = await auth();
  const body = await request.json().catch(() => null);
  const parsed = z.object({ token: z.string().min(20).max(200), name: z.string().trim().min(2).max(100).optional(), password: z.string().min(12).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/).optional() }).strict().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invitation is invalid or expired." }, { status: 400 });
  if ((!session?.user?.id || !session.user.email) && (!parsed.data.name || !parsed.data.password)) return NextResponse.json({ error: "Enter your name and a strong password to create your invited account." }, { status: 400 });
  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const passwordHash = parsed.data.password ? await hash(parsed.data.password, 12) : undefined;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const invite = await tx.membershipInvite.findUnique({ where: { tokenHash }, include: { business: { select: { deletedAt: true, accountStatus: true, statusUntil: true, subscriptionExpiresAt: true } } } });
      if (!invite || invite.acceptedAt || invite.expiresAt <= new Date() || invite.business.deletedAt) throw new Error("INVALID_INVITATION");
      if (getWorkspaceAccessStatus(invite.business) !== "ACTIVE") throw new Error("WORKSPACE_INACTIVE");
      if (session?.user?.id && session.user.email?.toLowerCase() !== invite.email) throw new Error("INVITATION_EMAIL_MISMATCH");
      const claimed = await tx.membershipInvite.updateMany({ where: { id: invite.id, acceptedAt: null, expiresAt: { gt: new Date() } }, data: { acceptedAt: new Date() } });
      if (claimed.count !== 1) throw new Error("INVALID_INVITATION");
      const invitedUser = session?.user?.id
        ? { id: session.user.id }
        : await tx.user.create({ data: { name: parsed.data.name, email: invite.email, passwordHash, emailVerified: new Date() }, select: { id: true } });
      await tx.membership.create({ data: { businessId: invite.businessId, userId: invitedUser.id, roleId: invite.roleId } });
      await tx.auditLog.create({ data: { businessId: invite.businessId, userId: invitedUser.id, action: "employee.invitation_accepted", entity: "membership", entityId: invitedUser.id } });
      return { businessId: invite.businessId, userId: invitedUser.id, email: invite.email, createdAccount: !session?.user?.id };
    });
    const response = NextResponse.json({ message: "Invitation accepted.", businessId: result.businessId, email: result.email, createdAccount: result.createdAccount });
    if (!result.createdAccount) response.cookies.set("active-business-id", result.businessId, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_INVITATION") return NextResponse.json({ error: "Invitation is invalid, expired, already used, or belongs to a different email." }, { status: 400 });
    if (error instanceof Error && error.message === "WORKSPACE_INACTIVE") return NextResponse.json({ error: "This workspace is not currently accepting invitations." }, { status: 403 });
    if (error instanceof Error && error.message === "INVITATION_EMAIL_MISMATCH") return NextResponse.json({ error: "Sign in using the invited email address." }, { status: 403 });
    if (error instanceof Error && "code" in error && error.code === "P2002") return NextResponse.json({ error: "This account already has access to that workspace, or the email is already registered. Sign in to accept the invitation." }, { status: 409 });
    console.error("Invitation acceptance failed", error);
    return NextResponse.json({ error: "Invitation could not be accepted." }, { status: 500 });
  }
}
