import type { PlatformRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    platformRole?: PlatformRole;
    tokenVersion?: number;
  }
  interface Session {
    user: DefaultSession["user"] & { id: string; platformRole: PlatformRole };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    platformRole?: PlatformRole;
    tokenVersion?: number;
  }
}
