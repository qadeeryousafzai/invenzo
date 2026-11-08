import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { originError, originIsAllowed } from "@/lib/http";
import { rateLimit, requestIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!originIsAllowed(request)) return originError();
  const limit = rateLimit(`switch:${requestIp(request)}`, 60, 60 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = z.object({ businessId: z.string().min(1).max(191) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid workspace." }, { status: 400 });
  const membership = await prisma.membership.findFirst({ where: { userId: session.user.id, businessId: parsed.data.businessId, status: "ACTIVE", business: { deletedAt: null, accessPausedAt: null, verificationStatus: "VERIFIED", subscriptionExpiresAt: { gt: new Date() } } }, select: { businessId: true } });
  if (!membership) return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
  const response = NextResponse.json({ message: "Workspace switched." });
  response.cookies.set("active-business-id", membership.businessId, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return response;
}
