import path from "node:path";

const TEXT_EXTENSIONS = [".txt", ".csv", ".json", ".md", ".xml", ".log", ".yaml", ".yml"];

function createTextFileHandler() {
  return {
    type: "text",
    extensions: TEXT_EXTENSIONS,
    canEdit: true,
    canViewInline: true,

    validate(buffer, originalName) {
      const ext = path.extname(originalName).toLowerCase();
      if (!TEXT_EXTENSIONS.includes(ext)) {
        return { valid: false, error: `Extensão .${ext} não é texto.` };
      }
      return { valid: true };
    },

    getViewMimeType() {
      return "text/plain; charset=utf-8";
    },

    getDownloadMimeType(originalName) {
      const ext = path.extname(originalName).toLowerCase();
      const mimeMap = {
        ".txt": "text/plain",
        ".csv": "text/csv",
        ".json": "application/json",
        ".md": "text/markdown",
        ".xml": "application/xml",
        ".log": "text/plain",
        ".yaml": "text/yaml",
        ".yml": "text/yaml",
      };
      return mimeMap[ext] || "text/plain";
    },
  };
}

export { createTextFileHandler };
