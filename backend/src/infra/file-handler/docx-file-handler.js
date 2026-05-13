import path from "node:path";

function createDocxFileHandler() {
  return {
    type: "docx",
    extensions: [".docx"],
    canEdit: false,
    canViewInline: false,

    validate(buffer) {
      if (buffer.length < 4) {
        return { valid: false, error: "Arquivo muito pequeno para ser DOCX." };
      }
      const header = buffer.slice(0, 4).toString("ascii");
      if (header !== "PK\u0003\u0004") {
        return { valid: false, error: "O arquivo não é um DOCX válido." };
      }
      return { valid: true };
    },

    async extractText(buffer) {
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        const text = result.value || "";
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        return {
          text,
          metadata: {
            wordCount,
            warnings: result.messages.filter((m) => m.type === "warning").length,
          },
        };
      } catch (error) {
        console.error("Erro ao extrair texto de DOCX:", error.message);
        return null;
      }
    },

    getViewMimeType() {
      return "text/plain; charset=utf-8";
    },

    getDownloadMimeType() {
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    },
  };
}

export { createDocxFileHandler };
