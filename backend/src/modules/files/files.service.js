import { AppError } from "../../shared/errors/app-error.js";
import { createDefaultHandlerRegistry } from "../../infra/file-handler/create-file-handler-registry.js";
import {
  canEditFile,
  canViewInline,
  createContentPreview,
  getFileCategory,
  isTextBasedFile,
} from "./files.utils.js";

function sanitizeFile(file) {
  const category = getFileCategory(file.originalName);
  return {
    id: file.id,
    originalName: file.originalName,
    storedName: file.storedName,
    mimeType: file.mimeType,
    size: file.size,
    contentPreview: file.contentPreview,
    processingStatus: file.processingStatus,
    fileCategory: category,
    canEdit: canEditFile(file.originalName),
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
  };
}

function createFilesService({ filesRepository, fileStorage, fileHandlerRegistry }) {
  const registry = fileHandlerRegistry || createDefaultHandlerRegistry();

  return {
    async create({ uploadedFile }) {
      if (!uploadedFile) {
        throw new AppError("Arquivo obrigatorio.", 400);
      }

      if (!registry.isAllowedFile(uploadedFile.originalname)) {
        const exts = registry.getAllowedExtensions().join(", ");
        throw new AppError(
          `Formato nao suportado. Formatos aceitos: ${exts}`,
          400,
        );
      }

      const handler = registry.getHandler(uploadedFile.originalname);
      const validation = handler.validate(uploadedFile.buffer, uploadedFile.originalname);

      if (!validation.valid) {
        throw new AppError(validation.error, 400);
      }

      const storageResult = await fileStorage.saveFile({
        originalName: uploadedFile.originalname,
        buffer: uploadedFile.buffer,
      });

      let contentPreview = null;
      let extractedText = null;

      if (typeof handler.extractText === "function") {
        const result = await handler.extractText(uploadedFile.buffer);
        if (result) {
          extractedText = result.text;
          contentPreview = createContentPreview(result.text);
        }
      }

      if (!extractedText && isTextBasedFile(uploadedFile.originalname)) {
        const textContent = uploadedFile.buffer.toString("utf-8");
        contentPreview = createContentPreview(textContent);
      }

      const fileData = {
        originalName: uploadedFile.originalname,
        storedName: storageResult.storedName,
        path: storageResult.path,
        mimeType: uploadedFile.mimetype || "application/octet-stream",
        size: storageResult.size,
      };

      if (contentPreview) {
        fileData.contentPreview = contentPreview;
      }

      if (extractedText) {
        fileData.extractedText = extractedText;
      }

      const createdFile = await filesRepository.create(fileData);

      return sanitizeFile(createdFile);
    },

    async list() {
      const files = await filesRepository.findMany();
      return files.map(sanitizeFile);
    },

    async getById(id) {
      const file = await filesRepository.findById(id);

      if (!file) {
        throw new AppError("Arquivo nao encontrado.", 404);
      }

      return sanitizeFile(file);
    },

    async getContent(id) {
      const file = await filesRepository.findById(id);

      if (!file) {
        throw new AppError("Arquivo nao encontrado.", 404);
      }

      const content = file.extractedText
        || await fileStorage.readTextFile(file.path);

      return {
        file: sanitizeFile(file),
        content,
      };
    },

    async updateContent(id, { content }) {
      if (typeof content !== "string") {
        throw new AppError("O campo content deve ser uma string.", 400);
      }

      const file = await filesRepository.findById(id);

      if (!file) {
        throw new AppError("Arquivo nao encontrado.", 404);
      }

      if (!isTextBasedFile(file.originalName)) {
        throw new AppError(
          "Este tipo de arquivo nao pode ser editado no navegador.",
          400,
        );
      }

      const storageResult = await fileStorage.overwriteTextFile(file.path, content);
      const updatedFile = await filesRepository.updateById(id, {
        size: storageResult.size,
        contentPreview: createContentPreview(content),
        updatedAt: new Date(),
      });

      return {
        file: sanitizeFile(updatedFile),
        content,
      };
    },

    async download(id) {
      const file = await filesRepository.findById(id);

      if (!file) {
        throw new AppError("Arquivo nao encontrado.", 404);
      }

      const buffer = await fileStorage.readFileBuffer(file.path);

      return {
        originalName: file.originalName,
        mimeType: file.mimeType || "application/octet-stream",
        buffer,
      };
    },

    async viewContent(id) {
      const file = await filesRepository.findById(id);

      if (!file) {
        throw new AppError("Arquivo nao encontrado.", 404);
      }

      const handler = registry.getHandler(file.originalName);

      if (handler && canViewInline(file.originalName)) {
        const buffer = await fileStorage.readFileBuffer(file.path);
        return {
          originalName: file.originalName,
          mimeType: handler.getViewMimeType(file.originalName),
          buffer,
          disposition: "inline",
        };
      }

      const content = file.extractedText
        || await fileStorage.readTextFile(file.path);

      return {
        originalName: `${file.originalName}.txt`,
        mimeType: "text/plain; charset=utf-8",
        buffer: Buffer.from(content || "Prévia não disponível para este formato.", "utf-8"),
        disposition: "inline",
      };
    },
  };
}

export { createFilesService };
