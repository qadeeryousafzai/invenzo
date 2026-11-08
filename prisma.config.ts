import { defineConfig, env } from "prisma/config";
import { loadEnvConfig } from "@next/env";
import { configureDatabaseUrl } from "./src/lib/database-url";

loadEnvConfig(process.cwd());
configureDatabaseUrl();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { seed: "tsx prisma/seed.ts" },
  datasource: {
    url: env("DATABASE_URL"),
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL || undefined,
  },
});
