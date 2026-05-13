import { useEffect, useState, useCallback } from "react";

import {
  downloadFile,
  fetchAIResults,
  fetchFileContent,
  fetchFiles,
  fetchHealth,
  generateAIResult,
  updateAIResult,
  updateFileContent,
  uploadFiles,
} from "./api.js";
import { getErrorMessage, getAITypeLabel } from "./utils.js";
import FileSidebar from "./components/FileSidebar.jsx";
import FileWorkspace from "./components/FileWorkspace.jsx";
import AIResultEditor from "./components/AIResultEditor.jsx";

export default function App() {
  const [health, setHealth] = useState({
    status: "checking",
    message: "Conferindo backend...",
  });
  const [files, setFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [content, setContent] = useState("");
  const [aiResults, setAIResults] = useState([]);
  const [editingAIResult, setEditingAIResult] = useState(null);
  const [busyAction, setBusyAction] = useState("");
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const [healthData, filesData] = await Promise.all([
          fetchHealth(),
          fetchFiles(),
        ]);

        if (active) {
          setHealth({
            status: healthData.status,
            message: `Backend online em ${new Date(healthData.timestamp).toLocaleString("pt-BR")}`,
          });
          setFiles(filesData.files);

          if (filesData.files.length > 0) {
            await loadWorkspace(filesData.files[0].id, filesData.files);
          }
        }
      } catch (error) {
        if (active) {
          setHealth({
            status: "error",
            message: "Nao foi possivel conectar ao backend.",
          });
          setErrorMessage(getErrorMessage(error));
        }
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  async function loadWorkspace(fileId, currentFiles = files) {
    const fileReference = currentFiles.find((item) => item.id === fileId) || null;
    const [contentData, aiResultsData] = await Promise.all([
      fetchFileContent(fileId),
      fetchAIResults(fileId),
    ]);

    setSelectedFileId(fileId);
    setSelectedFile(contentData.file || fileReference);
    setContent(contentData.content);
    setAIResults(aiResultsData.aiResults);
    setEditingAIResult(null);
    setErrorMessage("");
  }

  const handleSelectFile = useCallback(
    (fileId) => {
      loadWorkspace(fileId);
    },
    [files],
  );

  async function refreshFiles(nextSelectedId = selectedFileId) {
    const filesData = await fetchFiles();

    setFiles(filesData.files);

    if (!nextSelectedId && filesData.files.length > 0) {
      await loadWorkspace(filesData.files[0].id, filesData.files);
      return;
    }

    if (nextSelectedId) {
      const stillExists = filesData.files.find((item) => item.id === nextSelectedId);

      if (stillExists) {
        await loadWorkspace(nextSelectedId, filesData.files);
        return;
      }
    }

    if (filesData.files.length === 0) {
      setSelectedFileId(null);
      setSelectedFile(null);
      setContent("");
      setAIResults([]);
    }
  }

  async function handleUploadSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setNotice("");

    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("files");
    const selectedFiles =
      fileInput instanceof HTMLInputElement
        ? Array.from(fileInput.files || [])
        : [];

    if (selectedFiles.length === 0) {
      setErrorMessage("Selecione ao menos um arquivo antes de enviar.");
      return;
    }

    try {
      setBusyAction("upload");
      const results = await uploadFiles(selectedFiles);
      const lastName = results[results.length - 1].file.originalName;
      const lastId = results[results.length - 1].file.id;

      setNotice(
        results.length === 1
          ? `Arquivo ${lastName} enviado com sucesso.`
          : `${results.length} arquivos enviados com sucesso.`,
      );
      form.reset();
      await refreshFiles(lastId);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setBusyAction("");
    }
  }

  const handleSaveContent = useCallback(async (newContent) => {
    if (!selectedFileId) return;

    try {
      setBusyAction("save");
      const response = await updateFileContent(selectedFileId, newContent);

      setSelectedFile(response.file);
      setContent(response.content);
      setNotice("Conteudo atualizado com sucesso.");
      await refreshFiles(selectedFileId);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setBusyAction("");
    }
  }, [selectedFileId]);

  const handleDownload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setBusyAction("download");
      await downloadFile(selectedFile.id, selectedFile.originalName);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setBusyAction("");
    }
  }, [selectedFile]);

  const handleGenerateAI = useCallback(async (type) => {
    if (!selectedFileId) return;

    try {
      setBusyAction(type);
      const response = await generateAIResult(selectedFileId, type);

      setNotice(`${getAITypeLabel(type)} gerado com sucesso.`);
      setAIResults((current) => {
        const withoutSameType = current.filter((item) => item.type !== type);
        return [response.aiResult, ...withoutSameType];
      });
      await refreshFiles(selectedFileId);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setBusyAction("");
    }
  }, [selectedFileId]);

  const handleOpenAIResult = useCallback((result) => {
    setEditingAIResult({
      id: result.id,
      type: result.type,
      text: result.resultText || "",
    });
  }, []);

  const handleSaveAIResult = useCallback(async (id, draft) => {
    try {
      setBusyAction("save-ai");
      const response = await updateAIResult(id, draft);

      setEditingAIResult((prev) => ({
        ...prev,
        text: response.aiResult.resultText,
      }));
      setAIResults((current) =>
        current.map((r) => (r.id === response.aiResult.id ? response.aiResult : r)),
      );
      setNotice("Resultado de IA atualizado com sucesso.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setBusyAction("");
    }
  }, []);

  const handleBackFromAIEditor = useCallback(() => {
    setEditingAIResult(null);
  }, []);

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Sistemas Distribuidos</p>
        <h1>File Hub Distribuido</h1>
        <p className="hero-copy">
          Interface integrada para upload, visualizacao e
          processamento de arquivos, conectada ao backend distribuido do
          projeto.
        </p>

        <div className={`health health-${health.status}`}>
          <span className="health-dot" />
          <strong>Status da API:</strong>
          <span>{health.message}</span>
        </div>

        <form className="upload-form" onSubmit={handleUploadSubmit}>
          <label className="upload-field">
            <span>Selecionar arquivos</span>
            <input
              accept=".txt,.csv,.json,.md,.xml,.log,.yaml,.pdf,.docx,.xlsx,.xls,.pptx"
              multiple
              name="files"
              type="file"
            />
          </label>
          <button disabled={busyAction === "upload"} type="submit">
            {busyAction === "upload" ? "Enviando..." : "Fazer upload"}
          </button>
        </form>

        {notice ? <p className="feedback success">{notice}</p> : null}
        {errorMessage ? <p className="feedback error">{errorMessage}</p> : null}
      </section>

      <section className="workspace-grid">
        <FileSidebar
          files={files}
          selectedFileId={selectedFileId}
          onSelectFile={handleSelectFile}
        />

        {editingAIResult ? (
          <AIResultEditor
            editingAIResult={editingAIResult}
            busyAction={busyAction}
            onBack={handleBackFromAIEditor}
            onSave={handleSaveAIResult}
          />
        ) : (
          <FileWorkspace
            aiResults={aiResults}
            busyAction={busyAction}
            content={content}
            selectedFile={selectedFile}
            onDownload={handleDownload}
            onGenerateAI={handleGenerateAI}
            onOpenAIResult={handleOpenAIResult}
            onSaveContent={handleSaveContent}
          />
        )}
      </section>
    </main>
  );
}
