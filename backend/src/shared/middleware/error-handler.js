import { AppError } from "../errors/app-error.js";

function errorHandler(error, _request, response, _next) {
  console.error(error);

  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      error: error.message,
    });
  }

  if (error.type === "entity.parse.failed") {
    return response.status(400).json({
      error: "JSON invalido.",
    });
  }

  return response.status(500).json({
    error: "Erro interno do servidor.",
  });
}

export { errorHandler };
