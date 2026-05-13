import { describe, expect, it } from "vitest";

import { createFilesService } from "../src/modules/files/files.service.js";
import { createContentPreview } from "../src/modules/files/files.utils.js";
import { createInMemoryFileRepository } from "./helpers/in-memory-file-repository.js";
import { createInMemoryFileStorage } from "./helpers/in-memory-file-storage.js";

function createSubject() {
  const filesRepository = createInMemoryFileRepository();
  const fileStorage = createInMemoryFileStorage();

  return createFilesService({
    filesRepository,
    fileStorage,
  });
}

describe("files service", () => {
  it("cria arquivo txt e gera preview normalizado", async () => {
    const service = createSubject();
    const uploadedFile = {
      originalname: "anotacoes.txt",
      mimetype: "text/plain",
      buffer: Buffer.from("linha 1\n\nlinha 2   com espacos"),
    };

    const result = await service.create({ uploadedFile });

    expect(result.originalName).toBe("anotacoes.txt");
    expect(result.contentPreview).toBe("linha 1 linha 2 com espacos");
    expect(result.processingStatus).toBe("IDLE");
  });

  it("falha quando o formato nao e suportado", async () => {
    const service = createSubject();
    const uploadedFile = {
      originalname: "imagem.png",
      mimetype: "image/png",
      buffer: Buffer.from("PNG"),
    };

    await expect(service.create({ uploadedFile })).rejects.toThrow(
      /Formato nao suportado/,
    );
  });

  it("gera reticencias em preview maior que o limite", () => {
    const longText = "a".repeat(220);

    const preview = createContentPreview(longText, 20);

    expect(preview).toBe(`${"a".repeat(20)}...`);
  });

  it("atualiza o conteudo do arquivo e recalcula metadata", async () => {
    const service = createSubject();
    const created = await service.create({
      uploadedFile: {
        originalname: "edicao.txt",
        mimetype: "text/plain",
        buffer: Buffer.from("conteudo inicial"),
      },
    });

    const updated = await service.updateContent(created.id, {
      content: "conteudo atualizado com mais texto",
    });

    expect(updated.content).toBe("conteudo atualizado com mais texto");
    expect(updated.file.size).toBe(
      Buffer.byteLength("conteudo atualizado com mais texto", "utf-8"),
    );
    expect(updated.file.contentPreview).toBe("conteudo atualizado com mais texto");
  });

  it("rejeita edicao quando o campo content nao e string", async () => {
    const service = createSubject();

    await expect(
      service.updateContent("qualquer-id", {
        content: null,
      }),
    ).rejects.toMatchObject({
      message: "O campo content deve ser uma string.",
      statusCode: 400,
    });
  });
});
