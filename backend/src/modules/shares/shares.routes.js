import { Router } from "express";

import { asyncHandler } from "../../shared/middleware/async-handler.js";
import { createSharesController } from "./shares.controller.js";

function createSharesRouter({ sharesService }) {
  const controller = createSharesController({ sharesService });
  const router = Router();

  router.get("/:token", asyncHandler(controller.getSharedContent));
  router.get("/:token/download", asyncHandler(controller.downloadSharedFile));

  return router;
}

export { createSharesRouter };
