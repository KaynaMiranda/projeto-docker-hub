import { Router } from "express";

import { asyncHandler } from "../../shared/middleware/async-handler.js";
import { createAIResultsController } from "./ai-results.controller.js";

function createAIResultsRouter({ aiService }) {
  const controller = createAIResultsController({ aiService });
  const router = Router();

  router.get("/:id", asyncHandler(controller.getById));
  router.put("/:id", asyncHandler(controller.update));

  return router;
}

export { createAIResultsRouter };
