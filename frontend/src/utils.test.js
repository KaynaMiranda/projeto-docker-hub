import { describe, expect, it } from "vitest";

import {
  formatFileSize,
  getAIResultSnippet,
  getAITypeLabel,
  getFileStatusLabel,
} from "./utils.js";

describe("utils", () => {
  it("formata tamanho do arquivo", () => {
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
  });

  it("retorna labels amigaveis", () => {
    expect(getFileStatusLabel("DONE")).toBe("Processado");
    expect(getAITypeLabel("TASKS")).toBe("Tarefas");
  });

  it("encurta resultado longo de ia", () => {
    const text = "a".repeat(300);

    expect(getAIResultSnippet(text, 20)).toBe(`${"a".repeat(20)}...`);
  });
});
