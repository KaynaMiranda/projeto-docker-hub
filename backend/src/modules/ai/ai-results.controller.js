function createAIResultsController({ aiService }) {
  return {
    async getById(request, response) {
      const aiResult = await aiService.getById(request.params.id);

      response.json({
        aiResult,
      });
    },

    async update(request, response) {
      const aiResult = await aiService.updateResultText(
        request.params.id,
        request.body?.resultText,
      );

      response.json({
        aiResult,
      });
    },
  };
}

export { createAIResultsController };
