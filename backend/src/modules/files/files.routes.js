import { Router } from "express";
import multer from "multer";

import { asyncHandler } from "../../shared/middleware/async-handler.js";
import { createFilesController } from "./files.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
});

function createFilesRouter({ filesService, sharesService }) {
  const controller = createFilesController({ filesService, sharesService });
  const router = Router();

  router.post("/", upload.single("file"), asyncHandler(controller.upload));
  router.get("/", asyncHandler(controller.list));
  router.get("/:id", asyncHandler(controller.getById));
  router.get("/:id/content", asyncHandler(controller.getContent));
  router.put("/:id/content", asyncHandler(controller.updateContent));
  router.post("/:id/share", asyncHandler(controller.createShare));
  router.get("/:id/download", asyncHandler(controller.download));
  router.get("/:id/view", asyncHandler(controller.viewContent));

  return router;
}

export { createFilesRouter };
