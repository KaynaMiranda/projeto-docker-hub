import { Router } from "express";

import { asyncHandler } from "../../shared/middleware/async-handler.js";
import { createAIController } from "./ai.controller.js";

function createFileAIRouter({ aiService }) {
  const controller = createAIController({ aiService });
  const router = Router({ mergeParams: true });

  router.post("/summary", asyncHandler(controller.generateSummary));
  router.post("/tasks", asyncHandler(controller.generateTasks));
  router.post(
    "/university-work",
    asyncHandler(controller.generateUniversityWork),
  );
  router.get("/results", asyncHandler(controller.listByFileId));

  return router;
}

export { createFileAIRouter };
