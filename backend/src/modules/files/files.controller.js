function createFilesController({ filesService, sharesService }) {
  return {
    async upload(request, response) {
      const createdFile = await filesService.create({
        uploadedFile: request.file,
      });

      response.status(201).json({
        file: createdFile,
      });
    },

    async list(_request, response) {
      const files = await filesService.list();

      response.json({
        files,
      });
    },

    async getById(request, response) {
      const file = await filesService.getById(request.params.id);

      response.json({
        file,
      });
    },

    async getContent(request, response) {
      const fileWithContent = await filesService.getContent(request.params.id);

      response.json(fileWithContent);
    },

    async updateContent(request, response) {
      const updatedFile = await filesService.updateContent(request.params.id, {
        content: request.body?.content,
      });

      response.json(updatedFile);
    },

    async createShare(request, response) {
      const share = await sharesService.create(request.params.id, request.body || {});
      const shareUrl = `${request.protocol}://${request.get("host")}/shares/${share.token}`;

      response.status(201).json({
        share: {
          ...share,
          shareUrl,
        },
      });
    },

    async download(request, response) {
      const downloadFile = await filesService.download(request.params.id);

      response.setHeader("Content-Type", downloadFile.mimeType);
      response.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(downloadFile.originalName)}"`,
      );
      response.send(downloadFile.buffer);
    },

    async viewContent(request, response) {
      const viewResult = await filesService.viewContent(request.params.id);

      response.setHeader("Content-Type", viewResult.mimeType);
      response.setHeader(
        "Content-Disposition",
        `${viewResult.disposition}; filename="${encodeURIComponent(viewResult.originalName)}"`,
      );
      response.send(viewResult.buffer);
    },
  };
}

export { createFilesController };
