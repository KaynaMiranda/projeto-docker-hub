const AI_TYPE_LABEL = {
  SUMMARY: "Resumo",
  TASKS: "Tarefas",
  UNIVERSITY_WORK: "Trabalho universitario",
};

const FILE_STATUS_LABEL = {
  IDLE: "Pronto",
  PROCESSING: "Processando",
  DONE: "Processado",
  ERROR: "Erro",
};

function formatFileSize(size) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  return new Date(value).toLocaleString("pt-BR");
}

function getFileStatusLabel(status) {
  return FILE_STATUS_LABEL[status] || status;
}

function getAITypeLabel(type) {
  return AI_TYPE_LABEL[type] || type;
}

function getAIResultSnippet(resultText, limit = 240) {
  if (!resultText) {
    return "Resultado ainda indisponivel.";
  }

  if (resultText.length <= limit) {
    return resultText;
  }

  return `${resultText.slice(0, limit)}...`;
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Nao foi possivel concluir a operacao.";
}

export {
  formatDate,
  formatFileSize,
  getAIResultSnippet,
  getAITypeLabel,
  getErrorMessage,
  getFileStatusLabel,
};
