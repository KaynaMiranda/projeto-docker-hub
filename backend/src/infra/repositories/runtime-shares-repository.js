import { env } from "../../config/env.js";
import { prisma } from "../database/prisma.js";
import { createSharesRepository } from "../../modules/shares/shares.repository.js";
import { createInMemoryRuntimeSharesRepository } from "./runtime/in-memory-runtime-shares-repository.js";

function createRuntimeSharesRepository(filesRepository) {
  if (env.filesRepositoryMode === "memory") {
    return createInMemoryRuntimeSharesRepository(filesRepository);
  }

  return createSharesRepository(prisma);
}

export { createRuntimeSharesRepository };
