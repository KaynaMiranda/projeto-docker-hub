import { describe, expect, it } from "vitest";

import { createFilesService } from "../src/modules/files/files.service.js";
import { createSharesService } from "../src/modules/shares/shares.service.js";
import { createInMemoryFileRepository } from "./helpers/in-memory-file-repository.js";
import { createInMemoryFileStorage } from "./helpers/in-memory-file-storage.js";
import { createInMemoryShareRepository } from "./helpers/in-memory-share-repository.js";

function createSubject() {
  const filesRepository = createInMemoryFileRepository();
  const sharesRepository = createInMemoryShareRepository(filesRepository);
  const fileStorage = createInMemoryFileStorage();
  const filesService = createFilesService({
    filesRepository,
    fileStorage,
  });
  const sharesService = createSharesService({
    filesRepository,
    sharesRepository,
    fileStorage,
  });

  return {
    filesService,
    sharesService,
  };
}

describe("shares service", () => {
  it("cria compartilhamento e permite visualizar o conteudo", async () => {
    const { filesService, sharesService } = createSubject();
    const createdFile = await filesService.create({
      uploadedFile: {
        originalname: "compartilhar.txt",
        mimetype: "text/plain",
        buffer: Buffer.from("conteudo compartilhado"),
      },
    });

    const share = await sharesService.create(createdFile.id, {});
    const sharedContent = await sharesService.getSharedContent(share.token);

    expect(share.token).toBeTruthy();
    expect(sharedContent.content).toBe("conteudo compartilhado");
    expect(sharedContent.file.id).toBe(createdFile.id);
  });

  it("bloqueia download quando o link nao permite baixar", async () => {
    const { filesService, sharesService } = createSubject();
    const createdFile = await filesService.create({
      uploadedFile: {
        originalname: "restrito.txt",
        mimetype: "text/plain",
        buffer: Buffer.from("conteudo restrito"),
      },
    });

    const share = await sharesService.create(createdFile.id, {
      allowDownload: false,
    });

    await expect(sharesService.download(share.token)).rejects.toMatchObject({
      message: "Este link nao permite download do arquivo.",
      statusCode: 403,
    });
  });

  it("bloqueia link expirado", async () => {
    const { filesService, sharesService } = createSubject();
    const createdFile = await filesService.create({
      uploadedFile: {
        originalname: "expira.txt",
        mimetype: "text/plain",
        buffer: Buffer.from("conteudo com validade"),
      },
    });

    const share = await sharesService.create(createdFile.id, {
      expiresAt: "2000-01-01T00:00:00.000Z",
    });

    await expect(sharesService.getSharedContent(share.token)).rejects.toMatchObject(
      {
        message: "Link compartilhado expirado.",
        statusCode: 410,
      },
    );
  });

  it("rejeita criacao de link sem visualizacao e sem download", async () => {
    const { filesService, sharesService } = createSubject();
    const createdFile = await filesService.create({
      uploadedFile: {
        originalname: "invalido.txt",
        mimetype: "text/plain",
        buffer: Buffer.from("conteudo"),
      },
    });

    await expect(
      sharesService.create(createdFile.id, {
        allowView: false,
        allowDownload: false,
      }),
    ).rejects.toMatchObject({
      message: "O link compartilhado precisa permitir visualizacao ou download.",
      statusCode: 400,
    });
  });

  it("rejeita data invalida de expiracao", async () => {
    const { filesService, sharesService } = createSubject();
    const createdFile = await filesService.create({
      uploadedFile: {
        originalname: "data-invalida.txt",
        mimetype: "text/plain",
        buffer: Buffer.from("conteudo"),
      },
    });

    await expect(
      sharesService.create(createdFile.id, {
        expiresAt: "nao-e-data",
      }),
    ).rejects.toMatchObject({
      message: "expiresAt deve ser uma data valida.",
      statusCode: 400,
    });
  });
});
