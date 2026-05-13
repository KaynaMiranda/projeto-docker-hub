import { AppError } from "../../shared/errors/app-error.js";

function sanitizeAIResult(record) {
  return {
    id: record.id,
    fileId: record.fileId,
    type: record.type,
    status: record.status,
    promptVersion: record.promptVersion,
    resultText: record.resultText,
    metadataJson: record.metadataJson,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function createAIService({
  filesRepository,
  aiResultsRepository,
  fileStorage,
  aiProvider,
}) {
  return {
    async generate(fileId, type) {
      const file = await filesRepository.findById(fileId);

      if (!file) {
        throw new AppError("Arquivo nao encontrado.", 404);
      }

      const content = file.extractedText
        || await fileStorage.readTextFile(file.path);

      if (!content || !content.trim()) {
        throw new AppError(
          "O arquivo nao possui conteudo valido para processamento.",
          400,
        );
      }

      await filesRepository.updateById(fileId, {
        processingStatus: "PROCESSING",
        updatedAt: new Date(),
      });

      const existingResult = await aiResultsRepository.findByFileIdAndType(fileId, type);
      const baseResult = existingResult
        ? await aiResultsRepository.updateById(existingResult.id, {
            status: "PENDING",
            updatedAt: new Date(),
          })
        : await aiResultsRepository.create({
            fileId,
            type,
            status: "PENDING",
            promptVersion: aiProvider.promptVersion,
          });

      try {
        const generated = await aiProvider.generate({
          type,
          content,
          file,
        });

        const finalizedResult = await aiResultsRepository.updateById(baseResult.id, {
          status: "DONE",
          promptVersion: generated.promptVersion,
          resultText: generated.resultText,
          metadataJson: generated.metadataJson,
          updatedAt: new Date(),
        });

        await filesRepository.updateById(fileId, {
          processingStatus: "DONE",
          updatedAt: new Date(),
        });

        return sanitizeAIResult(finalizedResult);
      } catch (error) {
        await aiResultsRepository.updateById(baseResult.id, {
          status: "ERROR",
          updatedAt: new Date(),
        });
        await filesRepository.updateById(fileId, {
          processingStatus: "ERROR",
          updatedAt: new Date(),
        });

        throw error;
      }
    },

    async listByFileId(fileId) {
      const file = await filesRepository.findById(fileId);

      if (!file) {
        throw new AppError("Arquivo nao encontrado.", 404);
      }

      const results = await aiResultsRepository.findManyByFileId(fileId);

      return results.map(sanitizeAIResult);
    },

    async getById(id) {
      const result = await aiResultsRepository.findById(id);

      if (!result) {
        throw new AppError("Resultado de IA nao encontrado.", 404);
      }

      return sanitizeAIResult(result);
    },

    async updateResultText(id, resultText) {
      if (typeof resultText !== "string") {
        throw new AppError("O campo resultText deve ser uma string.", 400);
      }

      const result = await aiResultsRepository.findById(id);

      if (!result) {
        throw new AppError("Resultado de IA nao encontrado.", 404);
      }

      const updated = await aiResultsRepository.updateById(id, {
        resultText,
        updatedAt: new Date(),
      });

      return sanitizeAIResult(updated);
    },
  };
}

export { createAIService };
