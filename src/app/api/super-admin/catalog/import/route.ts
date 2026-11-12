import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";
import { startCatalogImport } from "@/modules/catalog/runner";
import { getSourceDefinition } from "@/modules/catalog/sources";

const schema = z
  .object({
    sourceKey: z.string().trim().min(1).max(64),
    datasetLabel: z.string().trim().max(191).nullable().optional(),
    batchSize: z.number().int().min(50).max(5000).optional(),
    resumeFromJobId: z.string().trim().max(64).nullable().optional(),
  })
  .strict();

export async function POST(request: Request) {
  if (!originIsAllowed(request)) return originError();
  try {
    const admin = await requireSuperAdmin();
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid import request.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const definition = getSourceDefinition(parsed.data.sourceKey);
    if (!definition) return NextResponse.json({ error: "Unknown catalog source." }, { status: 404 });
    if (!definition.enabled) {
      return NextResponse.json(
        { error: `${definition.name} is disabled. ${definition.notes}` },
        { status: 409 },
      );
    }

    const running = await prisma.medicineImportJob.findFirst({
      where: { status: "RUNNING", source: { key: parsed.data.sourceKey } },
      select: { id: true, processedRecords: true, startedAt: true },
    });
    if (running) {
      return NextResponse.json(
        { error: "An import for this source is already running.", data: { jobId: running.id, processedRecords: running.processedRecords } },
        { status: 409 },
      );
    }

    const result = await startCatalogImport({
      sourceKey: parsed.data.sourceKey,
      datasetLabel: parsed.data.datasetLabel ?? null,
      batchSize: parsed.data.batchSize,
      createdById: admin.id ?? null,
      resumeFromJobId: parsed.data.resumeFromJobId ?? null,
    });

    return NextResponse.json({ data: result }, { status: 202 });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    }
    console.error("[catalog/import] failed to start", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "The import could not be started." }, { status: 500 });
  }
}