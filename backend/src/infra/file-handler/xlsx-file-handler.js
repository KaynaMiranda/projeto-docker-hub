import path from "node:path";

function createXlsxFileHandler() {
  return {
    type: "xlsx",
    extensions: [".xlsx", ".xls"],
    canEdit: false,
    canViewInline: false,

    validate(buffer) {
      if (buffer.length < 4) {
        return { valid: false, error: "Arquivo muito pequeno para ser XLSX." };
      }
      const header = buffer.slice(0, 4).toString("ascii");
      if (header !== "PK\u0003\u0004") {
        return { valid: false, error: "O arquivo não é um XLSX válido." };
      }
      return { valid: true };
    },

    async extractText(buffer) {
      try {
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const parts = [];

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          const rows = json.filter((row) => row.some((cell) => cell !== undefined && cell !== null && cell !== ""));
          if (rows.length > 0) {
            parts.push(`--- Sheet: ${sheetName} ---`);
            parts.push(
              rows
                .map((row) => row.map((cell) => String(cell ?? "")).join("\t"))
                .join("\n"),
            );
          }
        }

        const text = parts.join("\n\n");
        return {
          text,
          metadata: {
            sheets: workbook.SheetNames,
            sheetCount: workbook.SheetNames.length,
          },
        };
      } catch (error) {
        console.error("Erro ao extrair texto de XLSX:", error.message);
        return null;
      }
    },

    getViewMimeType() {
      return "text/plain; charset=utf-8";
    },

    getDownloadMimeType(originalName) {
      const ext = path.extname(originalName).toLowerCase();
      if (ext === ".xls") {
        return "application/vnd.ms-excel";
      }
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    },
  };
}

export { createXlsxFileHandler };
