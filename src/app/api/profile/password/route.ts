import { compare, hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { originError, originIsAllowed } from "@/lib/http";
import { rateLimit, requestIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!originIsAllowed(request)) return originError();
  const limit = rateLimit(`password-change:${requestIp(request)}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(12).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/) }).strict().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Use a 12+ character password with uppercase, lowercase, and a number." }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { passwordHash: true } });
  if (!user?.passwordHash || !(await compare(parsed.data.currentPassword, user.passwordHash))) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: session.user.id }, data: { passwordHash: await hash(parsed.data.newPassword, 12), tokenVersion: { increment: 1 } } });
    await tx.auditLog.create({ data: { userId: session.user.id, action: "auth.password_changed", entity: "user", entityId: session.user.id } });
  });
  return NextResponse.json({ message: "Password updated. Sign in again with your new password." });
}
