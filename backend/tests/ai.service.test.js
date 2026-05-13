import { describe, expect, it } from "vitest";

import { createMockAIProvider } from "../src/infra/ai-provider/mock-ai-provider.js";
import { createAIService } from "../src/modules/ai/ai.service.js";
import { createFilesService } from "../src/modules/files/files.service.js";
import { createInMemoryAIResultsRepository } from "./helpers/in-memory-ai-results-repository.js";
import { createInMemoryFileRepository } from "./helpers/in-memory-file-repository.js";
import { createInMemoryFileStorage } from "./helpers/in-memory-file-storage.js";

function createSubject() {
  const filesRepository = createInMemoryFileRepository();
  const aiResultsRepository = createInMemoryAIResultsRepository();
  const fileStorage = createInMemoryFileStorage();
  const filesService = createFilesService({
    filesRepository,
    fileStorage,
  });
  const aiService = createAIService({
    filesRepository,
    aiResultsRepository,
    fileStorage,
    aiProvider: createMockAIProvider(),
  });

  return {
    filesService,
    aiService,
  };
}

describe("ai service", () => {
  it("gera resumo e persiste resultado", async () => {
    const { filesService, aiService } = createSubject();
    const createdFile = await filesService.create({
      uploadedFile: {
        originalname: "resumo.txt",
        mimetype: "text/plain",
        buffer: Buffer.from(
          "Primeira frase importante. Segunda frase complementar. Terceira frase final.",
        ),
      },
    });

    const result = await aiService.generate(createdFile.id, "SUMMARY");

    expect(result.type).toBe("SUMMARY");
    expect(result.status).toBe("DONE");
    expect(result.resultText).toContain("Primeira frase importante.");
    expect(result.metadataJson.provider).toBe("mock");
  });

  it("lista resultados por arquivo", async () => {
    const { filesService, aiService } = createSubject();
    const createdFile = await filesService.create({
      uploadedFile: {
        originalname: "lista-ai.txt",
        mimetype: "text/plain",
        buffer: Buffer.from("Texto para gerar resumo e tarefas."),
      },
    });

    await aiService.generate(createdFile.id, "SUMMARY");
    await aiService.generate(createdFile.id, "TASKS");

    const results = await aiService.listByFileId(createdFile.id);

    expect(results).toHaveLength(2);
    expect(results.map((item) => item.type)).toEqual(["TASKS", "SUMMARY"]);
  });

  it("atualiza o mesmo tipo em vez de criar duplicado", async () => {
    const { filesService, aiService } = createSubject();
    const createdFile = await filesService.create({
      uploadedFile: {
        originalname: "regerar.txt",
        mimetype: "text/plain",
        buffer: Buffer.from("Texto para gerar duas vezes."),
      },
    });

    const first = await aiService.generate(createdFile.id, "SUMMARY");
    const second = await aiService.generate(createdFile.id, "SUMMARY");
    const results = await aiService.listByFileId(createdFile.id);

    expect(second.id).toBe(first.id);
    expect(results).toHaveLength(1);
  });

  it("rejeita arquivo vazio para processamento", async () => {
    const { filesService, aiService } = createSubject();
    const createdFile = await filesService.create({
      uploadedFile: {
        originalname: "vazio.txt",
        mimetype: "text/plain",
        buffer: Buffer.from("   "),
      },
    });

    await expect(aiService.generate(createdFile.id, "SUMMARY")).rejects.toMatchObject(
      {
        message: "O arquivo nao possui conteudo valido para processamento.",
        statusCode: 400,
      },
    );
  });
});
