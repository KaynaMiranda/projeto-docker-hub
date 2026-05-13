import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createShare,
  downloadFile,
  fetchFiles,
  generateAIResult,
  getDownloadUrl,
  getSharedDownloadUrl,
  getSharedViewUrl,
  getViewUrl,
  updateAIResult,
  updateFileContent,
  uploadFiles,
} from "./api.js";

describe("api helpers", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("busca arquivos com sucesso", async () => {
    fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ files: [{ id: "1" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await fetchFiles();

    expect(result.files).toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith("/files", {});
  });

  it("envia atualizacao de conteudo como json", async () => {
    fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await updateFileContent("abc", "novo conteudo");

    expect(fetch).toHaveBeenCalledWith("/files/abc/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "novo conteudo" }),
    });
  });

  it("propaga a mensagem de erro da api", async () => {
    fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Arquivo nao encontrado." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(createShare("404")).rejects.toThrow("Arquivo nao encontrado.");
  });

  it("mapeia corretamente a rota de geracao de ia", async () => {
    fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ aiResult: { type: "TASKS" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await generateAIResult("file-1", "TASKS");

    expect(fetch).toHaveBeenCalledWith(
      "/files/file-1/ai/tasks",
      { method: "POST" },
    );
  });

  it("gera urls derivadas corretamente", () => {
    expect(getDownloadUrl("10")).toBe("/files/10/download");
    expect(getViewUrl("10")).toBe("/files/10/view");
    expect(getSharedViewUrl("tok")).toBe("/shares/tok");
    expect(getSharedDownloadUrl("tok")).toBe("/shares/tok/download");
  });

  it("uploadFiles envia cada arquivo individualmente", async () => {
    fetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ file: { id: "1", originalName: "a.txt" } }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ file: { id: "2", originalName: "b.txt" } }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const fileA = new File(["conteudo a"], "a.txt", { type: "text/plain" });
    const fileB = new File(["conteudo b"], "b.txt", { type: "text/plain" });
    const results = await uploadFiles([fileA, fileB]);

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(results).toHaveLength(2);
    expect(results[0].file.originalName).toBe("a.txt");
    expect(results[1].file.originalName).toBe("b.txt");
  });

  it("updateAIResult envia PUT com resultText", async () => {
    fetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ aiResult: { id: "r1", resultText: "novo texto" } }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await updateAIResult("r1", "novo texto");

    expect(fetch).toHaveBeenCalledWith("/ai-results/r1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultText: "novo texto" }),
    });
  });

  it("downloadFile chama fetch na rota de download", async () => {
    const mockBlob = new Blob(["conteudo"], { type: "text/plain" });
    fetch.mockResolvedValueOnce(
      new Response(mockBlob, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      }),
    );

    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:fake"),
      revokeObjectURL: vi.fn(),
    });

    const anchor = { href: "", download: "", click: vi.fn() };
    vi.spyOn(document.body, "appendChild").mockImplementation(() => {});
    vi.spyOn(document.body, "removeChild").mockImplementation(() => {});
    vi.spyOn(document, "createElement").mockReturnValue(anchor);

    await downloadFile("file-1", "meu.txt");

    expect(fetch).toHaveBeenCalledWith("/files/file-1/download");
    expect(anchor.download).toBe("meu.txt");
    expect(anchor.click).toHaveBeenCalled();
  });
});