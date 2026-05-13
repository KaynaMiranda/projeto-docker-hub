import { Router } from "express";

const router = Router();

router.get("/", (_request, response) => {
  response.json({
    name: "filehub-backend",
    message: "API base pronta para upload e consulta de arquivos.",
    docs: {
      health: "/health",
      files: "/files",
      shares: "/shares/:token",
      aiResults: "/ai-results/:id",
    },
  });
});

router.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "backend",
    timestamp: new Date().toISOString(),
  });
});

export { router };
