import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { originError, originIsAllowed } from "@/lib/http";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, email: true, emailVerified: true, createdAt: true } });
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  return NextResponse.json({ data: user });
}

export async function PATCH(request: Request) {
  if (!originIsAllowed(request)) return originError();
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = z.object({ name: z.string().trim().min(2).max(100) }).strict().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a name between 2 and 100 characters." }, { status: 400 });
  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({ where: { id: session.user.id }, data: { name: parsed.data.name }, select: { id: true, name: true, email: true } });
    await tx.auditLog.create({ data: { userId: session.user.id, action: "profile.updated", entity: "user", entityId: session.user.id } });
    return updated;
  });
  return NextResponse.json({ data: user });
}
