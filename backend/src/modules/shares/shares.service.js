import { randomUUID } from "node:crypto";

import { AppError } from "../../shared/errors/app-error.js";

function sanitizeShare(shareRecord) {
  return {
    id: shareRecord.id,
    fileId: shareRecord.fileId,
    token: shareRecord.token,
    allowDownload: shareRecord.allowDownload,
    allowView: shareRecord.allowView,
    expiresAt: shareRecord.expiresAt,
    createdAt: shareRecord.createdAt,
  };
}

function sanitizeSharedFile(fileRecord) {
  return {
    id: fileRecord.id,
    originalName: fileRecord.originalName,
    mimeType: fileRecord.mimeType,
    size: fileRecord.size,
    contentPreview: fileRecord.contentPreview,
    processingStatus: fileRecord.processingStatus,
    createdAt: fileRecord.createdAt,
    updatedAt: fileRecord.updatedAt,
  };
}

function ensureActiveShare(share) {
  if (!share) {
    throw new AppError("Link compartilhado nao encontrado.", 404);
  }

  if (share.expiresAt && new Date(share.expiresAt).getTime() < Date.now()) {
    throw new AppError("Link compartilhado expirado.", 410);
  }
}

function parseExpiresAt(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const expiresAt = new Date(value);

  if (Number.isNaN(expiresAt.getTime())) {
    throw new AppError("expiresAt deve ser uma data valida.", 400);
  }

  return expiresAt;
}

function normalizeShareInput(input) {
  const allowView =
    input.allowView === undefined ? true : Boolean(input.allowView);
  const allowDownload =
    input.allowDownload === undefined ? true : Boolean(input.allowDownload);
  const expiresAt = parseExpiresAt(input.expiresAt);

  if (!allowView && !allowDownload) {
    throw new AppError(
      "O link compartilhado precisa permitir visualizacao ou download.",
      400,
    );
  }

  return {
    allowView,
    allowDownload,
    expiresAt,
  };
}

function createSharesService({ filesRepository, sharesRepository, fileStorage }) {
  return {
    async create(fileId, input) {
      const file = await filesRepository.findById(fileId);

      if (!file) {
        throw new AppError("Arquivo nao encontrado.", 404);
      }

      const share = await sharesRepository.create({
        fileId: file.id,
        token: randomUUID(),
        ...normalizeShareInput(input),
      });

      return sanitizeShare(share);
    },

    async getSharedContent(token) {
      const share = await sharesRepository.findByToken(token);

      ensureActiveShare(share);

      if (!share.allowView) {
        throw new AppError("Este link nao permite visualizacao do arquivo.", 403);
      }

      const content = await fileStorage.readTextFile(share.file.path);

      return {
        share: sanitizeShare(share),
        file: sanitizeSharedFile(share.file),
        content,
      };
    },

    async download(token) {
      const share = await sharesRepository.findByToken(token);

      ensureActiveShare(share);

      if (!share.allowDownload) {
        throw new AppError("Este link nao permite download do arquivo.", 403);
      }

      const buffer = await fileStorage.readFileBuffer(share.file.path);

      return {
        originalName: share.file.originalName,
        buffer,
      };
    },
  };
}

export { createSharesService };
