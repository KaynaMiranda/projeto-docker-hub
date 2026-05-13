import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App.jsx";

function makeJsonResponse(data, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

function setupFetchMock(files = []) {
  vi.spyOn(global, "fetch").mockImplementation((url) => {
    const u = String(url);

    if (u.endsWith("/health"))
      return makeJsonResponse({ status: "ok", timestamp: "2026-05-06T12:00:00.000Z" });

    if (u.endsWith("/files") && !u.includes("/files/"))
      return makeJsonResponse({ files });

    if (u.includes("/content"))
      return makeJsonResponse({ file: files[0] || null, content: "conteudo" });

    if (u.includes("/ai/results"))
      return makeJsonResponse({ aiResults: [] });

    return makeJsonResponse({});
  });
}

const baseFile = {
  id: "1",
  originalName: "teste.txt",
  size: 120,
  createdAt: "2026-05-06T12:00:00.000Z",
  processingStatus: "IDLE",
  contentPreview: "preview",
  fileCategory: "text",
  canEdit: true,
};

describe("App", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza status da api e lista arquivos carregados", async () => {
    setupFetchMock([baseFile]);
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText("teste.txt").length).toBeGreaterThan(0);
    });

    expect(screen.getByText("Workspace do arquivo")).toBeInTheDocument();
  });

  it("filtra arquivos pelo campo de pesquisa", async () => {
    const files = [
      { ...baseFile, id: "1", originalName: "relatorio.txt" },
      { ...baseFile, id: "2", originalName: "resumo.txt" },
      { ...baseFile, id: "3", originalName: "contrato.txt" },
    ];

    setupFetchMock(files);
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText("relatorio.txt").length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByPlaceholderText("Pesquisar por nome...");
    await userEvent.type(searchInput, "rel");

    expect(screen.getAllByText("relatorio.txt").length).toBeGreaterThan(0);
    const sidebar = document.querySelector(".file-list");
    expect(sidebar).not.toBeNull();
    expect(sidebar.textContent).not.toContain("resumo.txt");
    expect(sidebar.textContent).not.toContain("contrato.txt");
  });

  it("mostra mensagem adequada quando pesquisa nao tem resultados", async () => {
    setupFetchMock([baseFile]);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("teste.txt")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Pesquisar por nome...");
    await userEvent.type(searchInput, "zzznaoexiste");

    expect(
      screen.getByText("Nenhum arquivo encontrado para essa pesquisa."),
    ).toBeInTheDocument();
  });

  it("input de upload aceita multiplos arquivos", () => {
    setupFetchMock([]);
    render(<App />);

    const input = document.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
    expect(input.hasAttribute("multiple")).toBe(true);
  });
});