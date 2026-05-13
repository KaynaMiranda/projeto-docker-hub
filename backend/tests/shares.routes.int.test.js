import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { createInMemoryFileRepository } from "./helpers/in-memory-file-repository.js";
import { createInMemoryFileStorage } from "./helpers/in-memory-file-storage.js";
import { createInMemoryShareRepository } from "./helpers/in-memory-share-repository.js";

function createTestApp() {
  const filesRepository = createInMemoryFileRepository();
  const sharesRepository = createInMemoryShareRepository(filesRepository);

  return createApp({
    filesRepository,
    sharesRepository,
    fileStorage: createInMemoryFileStorage(),
  });
}

describe("shares routes integration", () => {
  it("cria link compartilhado e permite visualizar conteudo", async () => {
    const app = createTestApp();
    const uploadResponse = await request(app)
      .post("/files")
      .attach("file", Buffer.from("arquivo publico"), "publico.txt");

    const fileId = uploadResponse.body.file.id;
    const shareResponse = await request(app).post(`/files/${fileId}/share`).send({});

    expect(shareResponse.status).toBe(201);
    expect(shareResponse.body.share.token).toBeTruthy();
    expect(shareResponse.body.share.shareUrl).toContain("/shares/");

    const sharedContentResponse = await request(app).get(
      `/shares/${shareResponse.body.share.token}`,
    );

    expect(sharedContentResponse.status).toBe(200);
    expect(sharedContentResponse.body.content).toBe("arquivo publico");
    expect(sharedContentResponse.body.file.originalName).toBe("publico.txt");
  });

  it("permite baixar o arquivo compartilhado", async () => {
    const app = createTestApp();
    const uploadResponse = await request(app)
      .post("/files")
      .attach("file", Buffer.from("download compartilhado"), "baixar.txt");

    const fileId = uploadResponse.body.file.id;
    const shareResponse = await request(app).post(`/files/${fileId}/share`).send({});
    const downloadResponse = await request(app).get(
      `/shares/${shareResponse.body.share.token}/download`,
    );

    expect(downloadResponse.status).toBe(200);
    expect(downloadResponse.text).toBe("download compartilhado");
    expect(downloadResponse.header["content-disposition"]).toContain("baixar.txt");
  });

  it("rejeita visualizacao quando o link nao permite view", async () => {
    const app = createTestApp();
    const uploadResponse = await request(app)
      .post("/files")
      .attach("file", Buffer.from("somente download"), "somente-download.txt");

    const fileId = uploadResponse.body.file.id;
    const shareResponse = await request(app)
      .post(`/files/${fileId}/share`)
      .send({
        allowView: false,
        allowDownload: true,
      });

    const response = await request(app).get(`/shares/${shareResponse.body.share.token}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe(
      "Este link nao permite visualizacao do arquivo.",
    );
  });

  it("rejeita link compartilhado invalido", async () => {
    const app = createTestApp();

    const response = await request(app).get("/shares/token-inexistente");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Link compartilhado nao encontrado.");
  });

  it("rejeita criacao de link para arquivo inexistente", async () => {
    const app = createTestApp();

    const response = await request(app).post("/files/arquivo-inexistente/share").send({});

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Arquivo nao encontrado.");
  });

  it("rejeita expiresAt invalido na criacao do link", async () => {
    const app = createTestApp();
    const uploadResponse = await request(app)
      .post("/files")
      .attach("file", Buffer.from("arquivo publico"), "publico-2.txt");

    const fileId = uploadResponse.body.file.id;
    const response = await request(app)
      .post(`/files/${fileId}/share`)
      .send({
        expiresAt: "data-invalida",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("expiresAt deve ser uma data valida.");
  });
});
