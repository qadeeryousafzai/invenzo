import { createWriteStream } from "node:fs";
import { mkdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export type DownloadResult = {
  path: string;
  bytes: number;
  contentType: string | null;
};

function configuredMaxBytes(): number {
  const configured = Number(process.env.CATALOG_MAX_DOWNLOAD_MB ?? "");
  if (Number.isFinite(configured) && configured > 0) return Math.round(configured * 1024 * 1024);
  return 4 * 1024 * 1024 * 1024; // 4 GB safety cap
}

/**
 * Download a dataset to `destPath` with redirect following and a size cap.
 * Streams to disk so large archives never sit fully in memory.
 */
export async function downloadFile(
  url: string,
  destPath: string,
  options: { maxBytes?: number; userAgent?: string; timeoutMs?: number } = {},
): Promise<DownloadResult> {
  const maxBytes = options.maxBytes ?? configuredMaxBytes();
  const timeoutMs = options.timeoutMs ?? 10 * 60 * 1000;
  await mkdir(path.dirname(destPath), { recursive: true });
  await unlink(destPath).catch(() => undefined);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let currentUrl = url;
    let response: Response | null = null;

    for (let redirect = 0; redirect < 5; redirect += 1) {
      response = await fetch(currentUrl, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": options.userAgent ?? "Invenzo-Catalog-Importer/1.0 (+https://invenzoapp.com)",
          Accept: "*/*",
        },
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) break;
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }
      break;
    }

    if (!response) throw new Error(`No response from ${url}`);
    if (!response.ok) throw new Error(`Download failed (${response.status} ${response.statusText}) for ${currentUrl}`);
    if (!response.body) throw new Error(`Empty response body for ${currentUrl}`);

    const declaredLength = Number(response.headers.get("content-length") ?? "0");
    if (declaredLength && declaredLength > maxBytes) {
      throw new Error(`Dataset is ${Math.round(declaredLength / 1024 / 1024)} MB, exceeding the ${Math.round(maxBytes / 1024 / 1024)} MB limit.`);
    }

    let received = 0;
    const nodeStream = Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]);
    nodeStream.on("data", (chunk: Buffer) => {
      received += chunk.length;
      if (received > maxBytes) {
        controller.abort();
      }
    });

    await pipeline(nodeStream, createWriteStream(destPath));

    const info = await stat(destPath);
    return {
      path: destPath,
      bytes: info.size,
      contentType: response.headers.get("content-type"),
    };
  } finally {
    clearTimeout(timer);
  }
}