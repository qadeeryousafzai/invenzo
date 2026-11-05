import { createHash } from "node:crypto";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, requestIp } from "@/lib/rate-limit";

const schema = z.object({ token: z.string().min(20).max(200), password: z.string().min(12).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/) });

export async function POST(request: Request) {
  const limit = rateLimit(`reset:${requestIp(request)}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Use a valid reset link and a password with at least 12 characters, including uppercase, lowercase, and a number." }, { status: 400 });
  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const passwordHash = await hash(parsed.data.password, 12);
  try {
    await prisma.$transaction(async (tx) => {
      const token = await tx.passwordResetToken.findUnique({ where: { tokenHash } });
      if (!token || token.usedAt || token.expiresAt <= new Date()) throw new Error("INVALID_RESET_TOKEN");
      const claimed = await tx.passwordResetToken.updateMany({ where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
      if (claimed.count !== 1) throw new Error("INVALID_RESET_TOKEN");
      await tx.user.update({ where: { id: token.userId }, data: { passwordHash, tokenVersion: { increment: 1 } } });
      await tx.passwordResetToken.deleteMany({ where: { userId: token.userId, id: { not: token.id } } });
      await tx.auditLog.create({ data: { userId: token.userId, action: "auth.password_reset", entity: "user", entityId: token.userId } });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_RESET_TOKEN") return NextResponse.json({ error: "Reset link is invalid or expired." }, { status: 400 });
    console.error("Password reset failed", error);
    return NextResponse.json({ error: "Password could not be reset." }, { status: 500 });
  }
  return NextResponse.json({ message: "Password updated. All existing sessions have been invalidated; sign in with your new password." });
}
