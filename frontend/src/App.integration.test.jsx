import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App.jsx";

function createJsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function createMockBackend() {
  let fileCounter = 2;
  let aiCounter = 1;

  const files = [
    {
      id: "1",
      originalName: "base.txt",
      storedName: "base.txt",
      mimeType: "text/plain",
      size: 18,
      contentPreview: "conteudo inicial",
      processingStatus: "IDLE",
      fileCategory: "text",
      canEdit: true,
      createdAt: "2026-05-06T12:00:00.000Z",
      updatedAt: "2026-05-06T12:00:00.000Z",
      content: "conteudo inicial",
    },
  ];

  const aiResultsByFileId = {
    "1": [],
  };

  return vi.fn(async (url, options = {}) => {
    const method = options.method || "GET";
    const requestUrl = String(url);
    const pathname = new URL(requestUrl).pathname;

    if (pathname === "/health" && method === "GET") {
      return createJsonResponse({
        status: "ok",
        timestamp: "2026-05-06T12:00:00.000Z",
      });
    }

    if (pathname === "/files" && method === "GET") {
      return createJsonResponse({
        files: files.map(({ content, ...file }) => file),
      });
    }

    if (pathname === "/files" && method === "POST") {
      const body = options.body;
      const file = body.get("file");
      const fileName = file?.name || "novo.txt";
      const mimeType = file?.type || "text/plain";
      const content =
        file && typeof file.text === "function"
          ? await file.text()
          : "novo conteudo";
      const id = String(fileCounter++);
      const createdAt = "2026-05-06T12:10:00.000Z";

      const createdFile = {
        id,
        originalName: fileName,
        storedName: `${id}.txt`,
        mimeType,
        size: content.length,
        contentPreview: content,
        processingStatus: "IDLE",
        fileCategory: "text",
        canEdit: true,
        createdAt,
        updatedAt: createdAt,
        content,
      };

      files.unshift(createdFile);
      aiResultsByFileId[id] = [];

      return createJsonResponse({
        file: { ...createdFile, content: undefined },
      }, 201);
    }

    const fileContentMatch = pathname.match(/^\/files\/([^/]+)\/content$/);
    if (fileContentMatch && method === "GET") {
      const file = files.find((item) => item.id === fileContentMatch[1]);
      return createJsonResponse({
        file: { ...file, content: undefined },
        content: file.content,
      });
    }

    if (fileContentMatch && method === "PUT") {
      const file = files.find((item) => item.id === fileContentMatch[1]);
      const { content } = JSON.parse(options.body);
      file.content = content;
      file.contentPreview = content;
      file.size = content.length;
      file.updatedAt = "2026-05-06T12:20:00.000Z";

      return createJsonResponse({
        file: { ...file, content: undefined },
        content,
      });
    }

    const aiResultsMatch = pathname.match(/^\/files\/([^/]+)\/ai\/results$/);
    if (aiResultsMatch && method === "GET") {
      return createJsonResponse({
        aiResults: aiResultsByFileId[aiResultsMatch[1]] || [],
      });
    }

    const aiGenerateMatch = pathname.match(/^\/files\/([^/]+)\/ai\/(summary|tasks|university-work)$/);
    if (aiGenerateMatch && method === "POST") {
      const fileId = aiGenerateMatch[1];
      const routeType = aiGenerateMatch[2];
      const type =
        routeType === "summary"
          ? "SUMMARY"
          : routeType === "tasks"
            ? "TASKS"
            : "UNIVERSITY_WORK";
      const resultText =
        type === "SUMMARY"
          ? "Resumo gerado para o documento."
          : type === "TASKS"
            ? "1. Pergunta: ...\nResposta esperada: ..."
            : "Titulo sugerido: Trabalho gerado.";
      const result = {
        id: `ai-${aiCounter++}`,
        fileId,
        type,
        status: "DONE",
        promptVersion: "mock-v1",
        resultText,
        metadataJson: {
          provider: "mock",
          keywords: ["arquitetura", "conteudo"],
        },
        createdAt: "2026-05-06T12:40:00.000Z",
        updatedAt: "2026-05-06T12:40:00.000Z",
      };

      aiResultsByFileId[fileId] = [
        result,
        ...(aiResultsByFileId[fileId] || []).filter((item) => item.type !== type),
      ];

      return createJsonResponse({ aiResult: result }, 201);
    }

    return createJsonResponse({}, 200);
  });
}

describe("App integration", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", createMockBackend());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("executa upload, edicao e geracao de ia na interface", async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText("Workspace do arquivo");
    expect(screen.getAllByText("base.txt").length).toBeGreaterThan(0);

    const input = screen.getByLabelText("Selecionar arquivos");
    const uploadFile = new File(["novo conteudo"], "novo.txt", {
      type: "text/plain",
    });

    fireEvent.change(input, {
      target: {
        files: [uploadFile],
      },
    });
    await user.click(screen.getByRole("button", { name: "Fazer upload" }));

    await screen.findByText("Arquivo novo.txt enviado com sucesso.");
    expect(
      screen.queryByText("Cannot read properties of null (reading 'reset')"),
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText("novo.txt").length).toBeGreaterThan(0);
    });

    const textarea = screen.getByLabelText("Conteudo do arquivo");
    await user.clear(textarea);
    await user.type(textarea, "conteudo revisado na interface");
    await user.click(screen.getByRole("button", { name: "Salvar alteracoes" }));

    await screen.findByText("Conteudo atualizado com sucesso.");
    expect(screen.getByDisplayValue("conteudo revisado na interface")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Gerar resumo" }));
    await screen.findByText("Resumo gerado com sucesso.");
    expect(screen.getByText("Resumo")).toBeInTheDocument();
    expect(
      screen.getAllByText("Resumo gerado para o documento.").length,
    ).toBeGreaterThan(0);
  });
});
