import cors from "cors";
import express from "express";
import morgan from "morgan";

import { env } from "./config/env.js";
import { createAIResultsRouter } from "./modules/ai/ai-results.routes.js";
import { createFileAIRouter } from "./modules/ai/file-ai.routes.js";
import { createAIService } from "./modules/ai/ai.service.js";
import { createFilesRouter } from "./modules/files/files.routes.js";
import { createFilesService } from "./modules/files/files.service.js";
import { createSharesRouter } from "./modules/shares/shares.routes.js";
import { createSharesService } from "./modules/shares/shares.service.js";
import { createAIProvider } from "./infra/ai-provider/create-ai-provider.js";
import { createDefaultHandlerRegistry } from "./infra/file-handler/create-file-handler-registry.js";
import { createRuntimeAIResultsRepository } from "./infra/repositories/runtime-ai-results-repository.js";
import { createLocalFileStorage } from "./infra/storage/local-file-storage.js";
import { createRuntimeFilesRepository } from "./infra/repositories/runtime-files-repository.js";
import { createRuntimeSharesRepository } from "./infra/repositories/runtime-shares-repository.js";
import { errorHandler } from "./shared/middleware/error-handler.js";
import { router } from "./routes/index.js";

function createApp(dependencies = {}) {
  const app = express();
  const filesRepository =
    dependencies.filesRepository || createRuntimeFilesRepository();
  const sharesRepository =
    dependencies.sharesRepository || createRuntimeSharesRepository(filesRepository);
  const aiResultsRepository =
    dependencies.aiResultsRepository ||
    createRuntimeAIResultsRepository(filesRepository);
  const fileStorage =
    dependencies.fileStorage || createLocalFileStorage(env.storageDir);
  const aiProvider = dependencies.aiProvider || createAIProvider(env.aiProvider);
  const fileHandlerRegistry =
    dependencies.fileHandlerRegistry || createDefaultHandlerRegistry();
  const filesService =
    dependencies.filesService ||
    createFilesService({
      filesRepository,
      fileStorage,
      fileHandlerRegistry,
    });
  const sharesService =
    dependencies.sharesService ||
    createSharesService({
      filesRepository,
      sharesRepository,
      fileStorage,
    });
  const aiService =
    dependencies.aiService ||
    createAIService({
      filesRepository,
      aiResultsRepository,
      fileStorage,
      aiProvider,
    });

  app.use(
    cors({
      origin: env.corsOrigin,
    }),
  );
  app.use(express.json());
  app.use(morgan("dev"));

  app.use(router);
  app.use("/files", createFilesRouter({ filesService, sharesService }));
  app.use("/files/:fileId/ai", createFileAIRouter({ aiService }));
  app.use("/ai-results", createAIResultsRouter({ aiService }));
  app.use("/shares", createSharesRouter({ sharesService }));
  app.use(errorHandler);

  return app;
}

const app = createApp();

export { app, createApp };
