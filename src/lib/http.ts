import { NextResponse } from "next/server";

export function originIsAllowed(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function originError() {
  return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
}
