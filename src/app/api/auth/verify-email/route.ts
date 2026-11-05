import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, requestIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limit = rateLimit(`verify:${requestIp(request)}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const body = await request.json().catch(() => null);
  const parsed = z.object({ token: z.string().min(20).max(200) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Verification link is invalid or expired." }, { status: 400 });
  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  let record;
  try {
    record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash }, select: { id: true, userId: true, expiresAt: true } });
  } catch (error) {
    console.error("Email verification database lookup failed", error);
    return NextResponse.json({ error: "Email verification is temporarily unavailable." }, { status: 503 });
  }
  if (!record || record.expiresAt <= new Date()) return NextResponse.json({ error: "Verification link is invalid or expired." }, { status: 400 });
  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.emailVerificationToken.deleteMany({ where: { id: record.id, expiresAt: { gt: new Date() } } });
      if (claimed.count !== 1) throw new Error("INVALID_VERIFICATION_TOKEN");
      await tx.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } });
      await tx.emailVerificationToken.deleteMany({ where: { userId: record.userId } });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_VERIFICATION_TOKEN") return NextResponse.json({ error: "Verification link is invalid or expired." }, { status: 400 });
    console.error("Email verification failed", error);
    return NextResponse.json({ error: "Email could not be verified." }, { status: 500 });
  }
  return NextResponse.json({ message: "Email verified. You can now sign in." });
}
