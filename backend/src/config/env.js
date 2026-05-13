import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 3000),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  storageDir: process.env.STORAGE_DIR || "/app/uploads",
  filesRepositoryMode: process.env.FILES_REPOSITORY_MODE || "prisma",
  aiProvider: process.env.AI_PROVIDER || "mock",
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@db:5432/filehub?schema=public",
};
