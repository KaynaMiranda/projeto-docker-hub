import path from "node:path";
import { randomUUID } from "node:crypto";

function createInMemoryFileStorage() {
  const files = new Map();

  return {
    async saveFile({ originalName, buffer }) {
      const ext = path.extname(originalName).toLowerCase() || ".bin";
      const storedName = `${randomUUID()}${ext}`;
      const filePath = path.posix.join("/virtual-storage", storedName);

      files.set(filePath, buffer);

      return {
        storedName,
        path: filePath,
        size: buffer.length,
      };
    },

    async readTextFile(filePath) {
      const buffer = files.get(filePath);
      return buffer ? buffer.toString("utf-8") : null;
    },

    async readFileBuffer(filePath) {
      return files.get(filePath) || null;
    },

    async overwriteTextFile(filePath, content) {
      files.set(filePath, Buffer.from(content, "utf-8"));

      return {
        size: Buffer.byteLength(content, "utf-8"),
      };
    },
  };
}

export { createInMemoryFileStorage };
