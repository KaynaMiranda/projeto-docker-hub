import { env } from "../../config/env.js";
import { prisma } from "../database/prisma.js";
import { createFilesRepository } from "../../modules/files/files.repository.js";
import { createInMemoryRuntimeFileRepository } from "./runtime/in-memory-runtime-file-repository.js";

const inMemoryFilesRepository = createInMemoryRuntimeFileRepository();

function createRuntimeFilesRepository() {
  if (env.filesRepositoryMode === "memory") {
    return inMemoryFilesRepository;
  }

  return createFilesRepository(prisma);
}

export { createRuntimeFilesRepository };
