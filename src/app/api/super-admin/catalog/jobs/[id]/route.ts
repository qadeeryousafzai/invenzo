import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!originIsAllowed(request)) return originError();
  const { id } = await params;
  try {
    await requireSuperAdmin();
    const job = await prisma.medicineImportJob.findUnique({
      where: { id },
      include: { source: { select: { key: true, name: true } }, errors: { orderBy: { createdAt: "desc" }, take: 50 } },
    });
    if (!job) return NextResponse.json({ error: "Import job not found." }, { status: 404 });

    return NextResponse.json({
      data: {
        id: job.id,
        status: job.status,
        sourceKey: job.source.key,
        sourceName: job.source.name,
        datasetUrl: job.datasetUrl,
        datasetLabel: job.datasetLabel,
        totalRecords: job.totalRecords,
        processedRecords: job.processedRecords,
        importedRecords: job.importedRecords,
        duplicateRecords: job.duplicateRecords,
        failedRecords: job.failedRecords,
        lastBatchSize: job.lastBatchSize,
        cursor: job.cursor,
        errorMessage: job.errorMessage,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        createdAt: job.createdAt,
        errors: job.errors.map((error) => ({
          id: error.id,
          stage: error.stage,
          message: error.message,
          createdAt: error.createdAt,
        })),
      },
    });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    }
    console.error("[catalog/job] failed", error);
    return NextResponse.json({ error: "Import job could not be loaded." }, { status: 500 });
  }
}