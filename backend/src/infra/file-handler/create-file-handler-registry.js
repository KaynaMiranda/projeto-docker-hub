import path from "node:path";
import { createTextFileHandler } from "./text-file-handler.js";
import { createPdfFileHandler } from "./pdf-file-handler.js";
import { createDocxFileHandler } from "./docx-file-handler.js";
import { createXlsxFileHandler } from "./xlsx-file-handler.js";

const ALL_EXTENSIONS = new Set();

function createFileHandlerRegistry(handlers) {
  const registry = new Map();

  for (const handler of handlers) {
    for (const ext of handler.extensions) {
      registry.set(ext, handler);
      ALL_EXTENSIONS.add(ext);
    }
  }

  return {
    getHandler(originalName) {
      const ext = path.extname(originalName).toLowerCase();
      return registry.get(ext) || null;
    },

    hasHandler(originalName) {
      return this.getHandler(originalName) !== null;
    },

    getAllowedExtensions() {
      return [...ALL_EXTENSIONS];
    },

    isAllowedFile(originalName) {
      return this.hasHandler(originalName);
    },

    getAllHandlers() {
      return [...new Set(registry.values())];
    },
  };
}

function createDefaultHandlerRegistry() {
  return createFileHandlerRegistry([
    createTextFileHandler(),
    createPdfFileHandler(),
    createDocxFileHandler(),
    createXlsxFileHandler(),
  ]);
}

export { createFileHandlerRegistry, createDefaultHandlerRegistry };
