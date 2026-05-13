import path from "node:path";

function createPdfFileHandler() {
  return {
    type: "pdf",
    extensions: [".pdf"],
    canEdit: false,
    canViewInline: true,

    validate(buffer) {
      const header = buffer.slice(0, 5).toString("ascii");
      if (header !== "%PDF-") {
        return { valid: false, error: "O arquivo não é um PDF válido." };
      }
      return { valid: true };
    },

    async extractText(buffer) {
      try {
        const pdfParse = (await import("pdf-parse")).default;
        const data = await pdfParse(buffer);
        return {
          text: data.text,
          metadata: {
            pages: data.numpages,
            author: data.info?.Author || null,
            title: data.info?.Title || null,
          },
        };
      } catch (error) {
        console.error("Erro ao extrair texto de PDF:", error.message);
        return null;
      }
    },

    getViewMimeType() {
      return "application/pdf";
    },

    getDownloadMimeType() {
      return "application/pdf";
    },
  };
}

export { createPdfFileHandler };
