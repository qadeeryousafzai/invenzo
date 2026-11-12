import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, TenantAuthorizationError } from "@/lib/tenant-context";
import { originError, originIsAllowed } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!originIsAllowed(request)) return originError();
  try {
    await requireSuperAdmin();
    const url = new URL(request.url);
    const sourceKey = url.searchParams.get("sourceKey");
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "25") || 25, 100);

    const jobs = await prisma.medicineImportJob.findMany({
      where: sourceKey ? { source: { key: sourceKey } } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { source: { select: { key: true, name: true } } },
    });

    return NextResponse.json({
      data: jobs.map((job) => ({
        id: job.id,
        status: job.status,
        sourceKey: job.source.key,
        sourceName: job.source.name,
        datasetLabel: job.datasetLabel,
        totalRecords: job.totalRecords,
        processedRecords: job.processedRecords,
        importedRecords: job.importedRecords,
        duplicateRecords: job.duplicateRecords,
        failedRecords: job.failedRecords,
        cursor: job.cursor,
        errorMessage: job.errorMessage,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        createdAt: job.createdAt,
      })),
    });
  } catch (error) {
    if (error instanceof TenantAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.message === "Authentication required." ? 401 : 403 });
    }
    console.error("[catalog/jobs] failed", error);
    return NextResponse.json({ error: "Import jobs could not be loaded." }, { status: 500 });
  }
}