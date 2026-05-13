function createSharesController({ sharesService }) {
  return {
    async getSharedContent(request, response) {
      const sharedContent = await sharesService.getSharedContent(request.params.token);

      response.json(sharedContent);
    },

    async downloadSharedFile(request, response) {
      const downloadFile = await sharesService.download(request.params.token);

      response.setHeader("Content-Type", "text/plain; charset=utf-8");
      response.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(downloadFile.originalName)}"`,
      );
      response.send(downloadFile.buffer);
    },
  };
}

export { createSharesController };
