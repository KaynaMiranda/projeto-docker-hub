function createAIController({ aiService }) {
  return {
    async generateSummary(request, response) {
      const aiResult = await aiService.generate(request.params.fileId, "SUMMARY");

      response.status(201).json({
        aiResult,
      });
    },

    async generateTasks(request, response) {
      const aiResult = await aiService.generate(request.params.fileId, "TASKS");

      response.status(201).json({
        aiResult,
      });
    },

    async generateUniversityWork(request, response) {
      const aiResult = await aiService.generate(
        request.params.fileId,
        "UNIVERSITY_WORK",
      );

      response.status(201).json({
        aiResult,
      });
    },

    async listByFileId(request, response) {
      const aiResults = await aiService.listByFileId(request.params.fileId);

      response.json({
        aiResults,
      });
    },
  };
}

export { createAIController };
