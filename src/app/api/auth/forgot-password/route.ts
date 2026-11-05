import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail, safeEmailHtml } from "@/lib/email";
import { rateLimit, requestIp } from "@/lib/rate-limit";

const genericResponse = { message: "If an account exists for that email, password reset instructions will be sent." };

export async function POST(request: Request) {
  const limit = rateLimit(`forgot:${requestIp(request)}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  const body = await request.json().catch(() => null);
  const parsed = z.object({ email: z.email().max(191) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  let user;
  try {
    user = await prisma.user.findUnique({ where: { email }, select: { id: true, emailVerified: true } });
  } catch (error) {
    console.error("Password recovery database lookup failed", error);
    return NextResponse.json({ error: "Password recovery is temporarily unavailable." }, { status: 503 });
  }
  if (!user?.emailVerified) return NextResponse.json(genericResponse);

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  try {
    await prisma.passwordResetToken.create({ data: { tokenHash, userId: user.id, expiresAt: new Date(Date.now() + 30 * 60 * 1000) } });
  } catch (error) {
    console.error("Password recovery token creation failed", error);
    return NextResponse.json({ error: "Password recovery is temporarily unavailable." }, { status: 503 });
  }
  try {
    const link = new URL("/reset-password", process.env.APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000");
    link.searchParams.set("token", token);
    await sendTransactionalEmail(email, "Reset your Invenzo password", safeEmailHtml("Reset your password", link.toString(), "Choose a new password"));
  } catch (error) {
    await prisma.passwordResetToken.deleteMany({ where: { tokenHash } }).catch(() => undefined);
    console.error("Password reset email delivery failed", error);
    return NextResponse.json(genericResponse);
  }
  return NextResponse.json(genericResponse);
}
