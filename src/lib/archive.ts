import { createReadStream, createWriteStream, mkdirSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Unzip, UnzipInflate, UnzipPassThrough, type UnzipFile } from "fflate";

export type ExtractResult = {
  files: string[];
  skipped: number;
};

export type ZipEntryHandler = (file: UnzipFile, relativePath: string) => void;

/**
 * Stream a ZIP archive and invoke `onEntry` for every file entry.
 *
 * Entries are decoded incrementally, so archives much larger than available
 * memory can be processed without extracting them to disk. The handler decides
 * what to do with the data by assigning `file.ondata` and calling `file.start()`.
 */
export async function streamZip(archivePath: string, onEntry: ZipEntryHandler): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let settled = false;

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    const unzip = new Unzip((file: UnzipFile) => {
      const relative = file.name.replace(/\\/g, "/").replace(/^\/+/, "");
      if (!relative || relative.endsWith("/")) {
        file.ondata = () => undefined;
        file.start();
        return;
      }
      try {
        onEntry(file, relative);
      } catch (error) {
        fail(error as Error);
      }
    });

    unzip.register(UnzipInflate);
    unzip.register(UnzipPassThrough);

    const source = createReadStream(archivePath);
    source.on("error", fail);
    source.on("data", (chunk: string | Buffer) => {
      if (settled) return;
      try {
        unzip.push(new Uint8Array(typeof chunk === "string" ? Buffer.from(chunk) : chunk));
      } catch (error) {
        fail(error as Error);
      }
    });
    source.on("end", () => {
      try {
        unzip.push(new Uint8Array(0), true);
      } catch (error) {
        fail(error as Error);
        return;
      }
      if (!settled) {
        settled = true;
        resolve();
      }
    });
  });
}

/**
 * Extract a ZIP archive to `destDir`, streaming entries to disk so archives
 * much larger than available memory can be processed safely.
 *
 * `include` filters which entries are written (paths are relative, POSIX-style).
 * When omitted, every regular file entry is extracted.
 */
export async function extractZip(
  archivePath: string,
  destDir: string,
  include?: (relativePath: string) => boolean,
): Promise<ExtractResult> {
  await mkdir(destDir, { recursive: true });

  const files: string[] = [];
  let skipped = 0;
  const pendingWrites = new Set<Promise<void>>();

  const waitForWrites = async () => {
    while (pendingWrites.size) {
      await Promise.all(Array.from(pendingWrites));
    }
  };

  await streamZip(archivePath, (file, relative) => {
    if (include && !include(relative)) {
      skipped += 1;
      file.ondata = () => undefined;
      file.start();
      return;
    }

    const target = path.join(destDir, relative);
    try {
      mkdirSync(path.dirname(target), { recursive: true });
    } catch (error) {
      throw error;
    }

    const output = createWriteStream(target);
    files.push(target);

    file.ondata = (error, chunk, final) => {
      if (error) {
        output.destroy(error instanceof Error ? error : new Error(String(error)));
        return;
      }
      if (chunk.length) output.write(chunk);
      if (final) {
        const done = new Promise<void>((resolve, reject) => {
          output.on("error", reject);
          output.on("close", () => resolve());
        });
        pendingWrites.add(done);
        output.end();
        void done.finally(() => pendingWrites.delete(done));
      }
    };
    file.start();
  });

  await waitForWrites();
  return { files, skipped };
}