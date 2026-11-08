import { PrismaClient, PlatformRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { loadEnvConfig } from "@next/env";
import { configureDatabaseUrl } from "../src/lib/database-url";

loadEnvConfig(process.cwd());
configureDatabaseUrl();

const prisma = new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("Cannot seed the super-admin: DATABASE_URL is missing. Set it to a reachable MySQL 8 database, apply the foundation migration, and retry.");
  }
  const email = (process.env.SUPER_ADMIN_EMAIL ?? process.env.superadmin_email)?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD ?? process.env.superadmin_password;
  if (!email || !password) {
    console.info("Skipping super-admin bootstrap: SUPER_ADMIN_EMAIL/PASSWORD are not configured.");
    return;
  }
  if (password.length < 12) throw new Error("SUPER_ADMIN_PASSWORD must be at least 12 characters.");
  const passwordHash = await hash(password, 12);
  const emailVerified = new Date();

  await prisma.user.upsert({
    where: { email },
    update: {
      platformRole: PlatformRole.SUPER_ADMIN,
      passwordHash,
      emailVerified,
    },
    create: {
      email,
      name: "Platform Administrator",
      emailVerified,
      platformRole: PlatformRole.SUPER_ADMIN,
      passwordHash,
    },
  });
  console.info(`Super-admin account ensured for ${email}.`);
}

main().finally(async () => prisma.$disconnect());
