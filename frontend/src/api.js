const RAW_API_URL = import.meta.env.VITE_API_URL;
const API_URL = RAW_API_URL !== undefined && RAW_API_URL !== null && RAW_API_URL !== ""
  ? RAW_API_URL
  : "";

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data?.error
        ? data.error
        : "Nao foi possivel concluir a operacao.";
    throw new Error(message);
  }

  return data;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);

  return parseResponse(response);
}

async function fetchHealth() {
  return request("/health");
}

async function fetchFiles() {
  return request("/files");
}

async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  return request("/files", {
    method: "POST",
    body: formData,
  });
}

async function uploadFiles(files) {
  const results = [];

  for (const file of files) {
    const result = await uploadFile(file);
    results.push(result);
  }

  return results;
}

async function fetchFileContent(fileId) {
  return request(`/files/${fileId}/content`);
}

async function updateFileContent(fileId, content) {
  return request(`/files/${fileId}/content`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });
}

async function createShare(fileId, payload = {}) {
  return request(`/files/${fileId}/share`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

async function fetchAIResults(fileId) {
  return request(`/files/${fileId}/ai/results`);
}

async function generateAIResult(fileId, type) {
  const routeByType = {
    SUMMARY: "summary",
    TASKS: "tasks",
    UNIVERSITY_WORK: "university-work",
  };

  return request(`/files/${fileId}/ai/${routeByType[type]}`, {
    method: "POST",
  });
}

async function downloadFile(fileId, filename) {
  const response = await fetch(`${API_URL}/files/${fileId}/download`);

  if (!response.ok) {
    throw new Error("Nao foi possivel fazer o download do arquivo.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

async function updateAIResult(id, resultText) {
  return request(`/ai-results/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resultText }),
  });
}

function getDownloadUrl(fileId) {
  return `${API_URL}/files/${fileId}/download`;
}

function getViewUrl(fileId) {
  return `${API_URL}/files/${fileId}/view`;
}

function getSharedDownloadUrl(token) {
  return `${API_URL}/shares/${token}/download`;
}

function getSharedViewUrl(token) {
  return `${API_URL}/shares/${token}`;
}

export {
  API_URL,
  createShare,
  downloadFile,
  fetchAIResults,
  fetchFileContent,
  fetchFiles,
  fetchHealth,
  generateAIResult,
  getDownloadUrl,
  getSharedDownloadUrl,
  getSharedViewUrl,
  getViewUrl,
  updateAIResult,
  updateFileContent,
  uploadFile,
  uploadFiles,
};
