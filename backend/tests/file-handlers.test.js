import { describe, expect, it } from "vitest";
import { createFileHandlerRegistry, createDefaultHandlerRegistry } from "../src/infra/file-handler/create-file-handler-registry.js";

describe("file handler registry", () => {
  const registry = createDefaultHandlerRegistry();

  it("reconhece extensões suportadas", () => {
    expect(registry.isAllowedFile("documento.txt")).toBe(true);
    expect(registry.isAllowedFile("planilha.csv")).toBe(true);
    expect(registry.isAllowedFile("livro.pdf")).toBe(true);
    expect(registry.isAllowedFile("relatorio.docx")).toBe(true);
    expect(registry.isAllowedFile("dados.xlsx")).toBe(true);
    expect(registry.isAllowedFile("velho.xls")).toBe(true);
    expect(registry.isAllowedFile("config.json")).toBe(true);
    expect(registry.isAllowedFile("readme.md")).toBe(true);
  });

  it("rejeita extensões não suportadas", () => {
    expect(registry.isAllowedFile("foto.png")).toBe(false);
    expect(registry.isAllowedFile("script.exe")).toBe(false);
    expect(registry.isAllowedFile("archive.zip")).toBe(false);
    expect(registry.isAllowedFile("noext")).toBe(false);
  });

  it("retorna handler correto para cada formato", () => {
    const textHandler = registry.getHandler("notas.txt");
    expect(textHandler.type).toBe("text");
    expect(textHandler.canEdit).toBe(true);
    expect(textHandler.canViewInline).toBe(true);

    const pdfHandler = registry.getHandler("doc.pdf");
    expect(pdfHandler.type).toBe("pdf");
    expect(pdfHandler.canEdit).toBe(false);
    expect(pdfHandler.canViewInline).toBe(true);

    const docxHandler = registry.getHandler("doc.docx");
    expect(docxHandler.type).toBe("docx");
    expect(docxHandler.canEdit).toBe(false);
    expect(docxHandler.canViewInline).toBe(false);

    const xlsxHandler = registry.getHandler("plan.xlsx");
    expect(xlsxHandler.type).toBe("xlsx");
    expect(xlsxHandler.canEdit).toBe(false);
    expect(xlsxHandler.canViewInline).toBe(false);
  });

  it("listAll retorna todos os handlers únicos", () => {
    const all = registry.getAllHandlers();
    expect(all.length).toBe(4);
    const types = all.map((h) => h.type).sort();
    expect(types).toEqual(["docx", "pdf", "text", "xlsx"]);
  });
});

describe("text file handler", () => {
  const registry = createDefaultHandlerRegistry();

  it("valida arquivo de texto como válido", () => {
    const handler = registry.getHandler("dados.txt");
    const result = handler.validate(Buffer.from("conteúdo"), "dados.txt");
    expect(result.valid).toBe(true);
  });

  it("não possui extractText", () => {
    const handler = registry.getHandler("dados.txt");
    expect(typeof handler.extractText).toBe("undefined");
  });

  it("retorna MIME types corretos", () => {
    const handler = registry.getHandler("dados.txt");
    expect(handler.getDownloadMimeType("dados.txt")).toBe("text/plain");
    expect(handler.getDownloadMimeType("dados.csv")).toBe("text/csv");
    expect(handler.getDownloadMimeType("dados.json")).toBe("application/json");
    expect(handler.getDownloadMimeType("dados.md")).toBe("text/markdown");
  });
});

describe("pdf file handler", () => {
  const registry = createDefaultHandlerRegistry();

  it("rejeita arquivo que não é PDF", () => {
    const handler = registry.getHandler("falso.pdf");
    const result = handler.validate(Buffer.from("não é pdf"), "falso.pdf");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("PDF");
  });

  it("possui extractText function", () => {
    const handler = registry.getHandler("doc.pdf");
    expect(typeof handler.extractText).toBe("function");
  });

  it("retorna MIME type correto", () => {
    const handler = registry.getHandler("doc.pdf");
    expect(handler.getViewMimeType()).toBe("application/pdf");
    expect(handler.getDownloadMimeType()).toBe("application/pdf");
  });
});

describe("docx file handler", () => {
  const registry = createDefaultHandlerRegistry();

  it("rejeita arquivo que não é DOCX", () => {
    const handler = registry.getHandler("falso.docx");
    const result = handler.validate(Buffer.from("texto puro"), "falso.docx");
    expect(result.valid).toBe(false);
  });

  it("possui extractText function", () => {
    const handler = registry.getHandler("doc.docx");
    expect(typeof handler.extractText).toBe("function");
  });

  it("retorna MIME type de download correto", () => {
    const handler = registry.getHandler("doc.docx");
    expect(handler.getDownloadMimeType()).toContain("wordprocessingml");
  });
});

describe("xlsx file handler", () => {
  const registry = createDefaultHandlerRegistry();

  it("rejeita arquivo que não é XLSX", () => {
    const handler = registry.getHandler("falso.xlsx");
    const result = handler.validate(Buffer.from("texto puro"), "falso.xlsx");
    expect(result.valid).toBe(false);
  });

  it("possui extractText function", () => {
    const handler = registry.getHandler("plan.xlsx");
    expect(typeof handler.extractText).toBe("function");
  });

  it("diferencia MIME type entre xlsx e xls", () => {
    const handler = registry.getHandler("plan.xlsx");
    expect(handler.getDownloadMimeType("plan.xlsx")).toContain("spreadsheetml");
    expect(handler.getDownloadMimeType("plan.xls")).toContain("ms-excel");
  });
});
