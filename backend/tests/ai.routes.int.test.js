import request from "supertest";
import { describe, expect, it } from "vitest";

import { createMockAIProvider } from "../src/infra/ai-provider/mock-ai-provider.js";
import { createApp } from "../src/app.js";
import { createInMemoryAIResultsRepository } from "./helpers/in-memory-ai-results-repository.js";
import { createInMemoryFileRepository } from "./helpers/in-memory-file-repository.js";
import { createInMemoryFileStorage } from "./helpers/in-memory-file-storage.js";
import { createInMemoryShareRepository } from "./helpers/in-memory-share-repository.js";

function createTestApp() {
  const filesRepository = createInMemoryFileRepository();

  return createApp({
    filesRepository,
    sharesRepository: createInMemoryShareRepository(filesRepository),
    aiResultsRepository: createInMemoryAIResultsRepository(),
    fileStorage: createInMemoryFileStorage(),
    aiProvider: createMockAIProvider(),
  });
}

describe("ai routes integration", () => {
  it("gera resumo e consulta o resultado por id", async () => {
    const app = createTestApp();
    const uploadResponse = await request(app)
      .post("/files")
      .attach(
        "file",
        Buffer.from("Primeira frase. Segunda frase. Terceira frase."),
        "resumo.txt",
      );

    const fileId = uploadResponse.body.file.id;
    const generateResponse = await request(app).post(
      `/files/${fileId}/ai/summary`,
    );

    expect(generateResponse.status).toBe(201);
    expect(generateResponse.body.aiResult.type).toBe("SUMMARY");
    expect(generateResponse.body.aiResult.status).toBe("DONE");

    const resultId = generateResponse.body.aiResult.id;
    const fetchResponse = await request(app).get(`/ai-results/${resultId}`);

    expect(fetchResponse.status).toBe(200);
    expect(fetchResponse.body.aiResult.id).toBe(resultId);
  });

  it("gera tarefas e lista resultados por arquivo", async () => {
    const app = createTestApp();
    const uploadResponse = await request(app)
      .post("/files")
      .attach(
        "file",
        Buffer.from("Texto com conceitos sobre arquitetura distribuida e containers."),
        "tarefas.txt",
      );

    const fileId = uploadResponse.body.file.id;

    await request(app).post(`/files/${fileId}/ai/tasks`);
    await request(app).post(`/files/${fileId}/ai/university-work`);

    const listResponse = await request(app).get(`/files/${fileId}/ai/results`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.aiResults).toHaveLength(2);
  });

  it("retorna 404 para arquivo inexistente", async () => {
    const app = createTestApp();

    const response = await request(app).post("/files/arquivo-inexistente/ai/summary");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Arquivo nao encontrado.");
  });

  it("retorna 404 para resultado inexistente", async () => {
    const app = createTestApp();

    const response = await request(app).get("/ai-results/resultado-inexistente");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Resultado de IA nao encontrado.");
  });

  it("atualiza o texto de um resultado de IA", async () => {
    const app = createTestApp();
    const uploadResponse = await request(app)
      .post("/files")
      .attach("file", Buffer.from("Conteudo de teste para edicao de IA."), "edicao.txt");

    const fileId = uploadResponse.body.file.id;
    const generateResponse = await request(app).post(`/files/${fileId}/ai/summary`);
    const resultId = generateResponse.body.aiResult.id;

    const updateResponse = await request(app)
      .put(`/ai-results/${resultId}`)
      .send({ resultText: "Resumo editado manualmente pelo usuario." });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.aiResult.resultText).toBe("Resumo editado manualmente pelo usuario.");
    expect(updateResponse.body.aiResult.id).toBe(resultId);
  });

  it("rejeita atualizacao de resultado com payload invalido", async () => {
    const app = createTestApp();
    const uploadResponse = await request(app)
      .post("/files")
      .attach("file", Buffer.from("Texto qualquer."), "invalido.txt");

    const fileId = uploadResponse.body.file.id;
    const generateResponse = await request(app).post(`/files/${fileId}/ai/summary`);
    const resultId = generateResponse.body.aiResult.id;

    const response = await request(app)
      .put(`/ai-results/${resultId}`)
      .send({ resultText: 99 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("O campo resultText deve ser uma string.");
  });

  it("retorna 404 ao atualizar resultado inexistente", async () => {
    const app = createTestApp();

    const response = await request(app)
      .put("/ai-results/nao-existe")
      .send({ resultText: "texto" });

    expect(response.status).toBe(404);
  });
});
