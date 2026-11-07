import { readdir, unlink } from "node:fs/promises";

const temporaryConfigPattern = /^.+\.next\.config\.(?:js|ts|mjs|cjs)$/;
const files = await readdir(process.cwd(), { withFileTypes: true });

for (const file of files) {
  if (!file.isFile()) continue;

  if (temporaryConfigPattern.test(file.name) || file.name === "next.config.compiled.js") {
    await unlink(file.name);
    console.info(`Removed stale Next.js config artifact: ${file.name}`);
  }
}
