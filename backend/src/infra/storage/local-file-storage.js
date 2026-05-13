import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

function createLocalFileStorage(baseDir) {
  async function ensureBaseDir() {
    await mkdir(baseDir, { recursive: true });
  }

  return {
    async saveFile({ originalName, buffer }) {
      await ensureBaseDir();

      const ext = path.extname(originalName).toLowerCase() || ".bin";
      const storedName = `${randomUUID()}${ext}`;
      const absolutePath = path.join(baseDir, storedName);

      await writeFile(absolutePath, buffer);

      return {
        storedName,
        path: absolutePath,
        size: buffer.length,
      };
    },

    async readTextFile(filePath) {
      return readFile(filePath, "utf-8");
    },

    async readFileBuffer(filePath) {
      return readFile(filePath);
    },

    async overwriteTextFile(filePath, content) {
      await writeFile(filePath, content, "utf-8");

      return {
        size: Buffer.byteLength(content, "utf-8"),
      };
    },
  };
}

export { createLocalFileStorage };
