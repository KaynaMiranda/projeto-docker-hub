import { prisma } from "../database/prisma.js";
import { createAIResultsRepository } from "../../modules/ai/ai.repository.js";
import { env } from "../../config/env.js";
import { createInMemoryRuntimeAIResultsRepository } from "./runtime/in-memory-runtime-ai-results-repository.js";

function createRuntimeAIResultsRepository(filesRepository) {
  if (env.filesRepositoryMode === "memory") {
    return createInMemoryRuntimeAIResultsRepository(filesRepository);
  }

  return createAIResultsRepository(prisma);
}

export { createRuntimeAIResultsRepository };
