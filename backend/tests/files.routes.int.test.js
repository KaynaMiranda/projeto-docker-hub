import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { createInMemoryFileRepository } from "./helpers/in-memory-file-repository.js";
import { createInMemoryFileStorage } from "./helpers/in-memory-file-storage.js";

function createTestApp() {
  return createApp({
    filesRepository: createInMemoryFileRepository(),
    fileStorage: createInMemoryFileStorage(),
  });
}

describe("files routes integration", () => {
  it("faz upload e lista arquivos enviados", async () => {
    const app = createTestApp();

    const uploadResponse = await request(app)
      .post("/files")
      .attach("file", Buffer.from("primeiro arquivo de teste"), "teste.txt");

    expect(uploadResponse.status).toBe(201);
    expect(uploadResponse.body.file.originalName).toBe("teste.txt");
    expect(uploadResponse.body.file.contentPreview).toContain("primeiro arquivo");

    const listResponse = await request(app).get("/files");

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.files).toHaveLength(1);
    expect(listResponse.body.files[0].originalName).toBe("teste.txt");
  });

  it("retorna o conteudo e permite download do arquivo", async () => {
    const app = createTestApp();
    const uploadResponse = await request(app)
      .post("/files")
      .attach("file", Buffer.from("conteudo para baixar"), "download.txt");

    const fileId = uploadResponse.body.file.id;

    const contentResponse = await request(app).get(`/files/${fileId}/content`);

    expect(contentResponse.status).toBe(200);
    expect(contentResponse.body.content).toBe("conteudo para baixar");
    expect(contentResponse.body.file.id).toBe(fileId);

    const downloadResponse = await request(app).get(`/files/${fileId}/download`);

    expect(downloadResponse.status).toBe(200);
    expect(downloadResponse.header["content-type"]).toContain("text/plain");
    expect(downloadResponse.header["content-disposition"]).toContain("download.txt");
    expect(downloadResponse.text).toBe("conteudo para baixar");
  });

  it("retorna os detalhes do arquivo por id", async () => {
    const app = createTestApp();
    const uploadResponse = await request(app)
      .post("/files")
      .attach("file", Buffer.from("detalhes do arquivo"), "detalhes.txt");

    const fileId = uploadResponse.body.file.id;
    const response = await request(app).get(`/files/${fileId}`);

    expect(response.status).toBe(200);
    expect(response.body.file.id).toBe(fileId);
    expect(response.body.file.originalName).toBe("detalhes.txt");
  });

  it("atualiza o conteudo do arquivo txt", async () => {
    const app = createTestApp();
    const uploadResponse = await request(app)
      .post("/files")
      .attach("file", Buffer.from("versao original"), "editar.txt");

    const fileId = uploadResponse.body.file.id;
    const updateResponse = await request(app)
      .put(`/files/${fileId}/content`)
      .send({
        content: "versao editada com novos dados",
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.content).toBe("versao editada com novos dados");
    expect(updateResponse.body.file.contentPreview).toContain("versao editada");

    const contentResponse = await request(app).get(`/files/${fileId}/content`);

    expect(contentResponse.status).toBe(200);
    expect(contentResponse.body.content).toBe("versao editada com novos dados");
  });

  it("rejeita upload de formatos nao suportados", async () => {
    const app = createTestApp();

    const response = await request(app)
      .post("/files")
      .attach("file", Buffer.from("falso png"), "imagem.png");

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("Formato nao suportado");
  });

  it("retorna 404 quando o arquivo nao existe", async () => {
    const app = createTestApp();

    const response = await request(app).get("/files/arquivo-inexistente/content");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Arquivo nao encontrado.");
  });

  it("serve conteudo do arquivo como texto plano na rota view", async () => {
    const app = createTestApp();
    const uploadResponse = await request(app)
      .post("/files")
      .attach("file", Buffer.from("conteudo para visualizar"), "view.txt");

    const fileId = uploadResponse.body.file.id;
    const viewResponse = await request(app).get(`/files/${fileId}/view`);

    expect(viewResponse.status).toBe(200);
    expect(viewResponse.header["content-type"]).toContain("text/plain");
    expect(viewResponse.header["content-disposition"]).toContain("inline");
    expect(viewResponse.header["content-disposition"]).toContain("view.txt");
    expect(viewResponse.text).toBe("conteudo para visualizar");
  });

  it("rejeita edicao com payload invalido", async () => {
    const app = createTestApp();
    const uploadResponse = await request(app)
      .post("/files")
      .attach("file", Buffer.from("conteudo"), "invalido.txt");

    const fileId = uploadResponse.body.file.id;
    const response = await request(app).put(`/files/${fileId}/content`).send({
      content: 123,
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("O campo content deve ser uma string.");
  });
});
