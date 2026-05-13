import path from "node:path";

const TEXT_EXTENSIONS = new Set([
  ".txt", ".csv", ".json", ".md", ".xml", ".log", ".yaml", ".yml",
]);

const VIEW_INLINE_EXTENSIONS = new Set([
  ".txt", ".csv", ".json", ".md", ".xml", ".log", ".yaml", ".yml",
  ".pdf",
]);

function isTextBasedFile(fileName) {
  return TEXT_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

function canViewInline(fileName) {
  return VIEW_INLINE_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

function canEditFile(fileName) {
  return isTextBasedFile(fileName);
}

function getFileCategory(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const categoryMap = {
    ".txt": "text",
    ".csv": "text",
    ".json": "text",
    ".md": "text",
    ".xml": "text",
    ".log": "text",
    ".yaml": "text",
    ".yml": "text",
    ".pdf": "pdf",
    ".docx": "docx",
    ".xlsx": "xlsx",
    ".xls": "xlsx",
  };
  return categoryMap[ext] || "other";
}

function createContentPreview(content, limit = 180) {
  if (!content) return null;

  const normalizedContent = content.replace(/\s+/g, " ").trim();

  if (normalizedContent.length <= limit) {
    return normalizedContent;
  }

  return `${normalizedContent.slice(0, limit)}...`;
}

export {
  canEditFile,
  canViewInline,
  createContentPreview,
  getFileCategory,
  isTextBasedFile,
};
