import { memo } from "react";
import { getViewUrl } from "../api";
import {
  getAITypeLabel,
  getAIResultSnippet,
  getFileStatusLabel,
  formatDate,
  formatFileSize,
} from "../utils";
import FileViewer from "./FileViewer.jsx";

const aiActions = [
  { type: "SUMMARY", label: "Gerar resumo" },
  { type: "TASKS", label: "Gerar tarefas" },
  { type: "UNIVERSITY_WORK", label: "Gerar trabalho" },
];

function FileWorkspace({
  selectedFile,
  content,
  aiResults,
  busyAction,
  onSaveContent,
  onDownload,
  onGenerateAI,
  onOpenAIResult,
}) {
  if (!selectedFile) {
    return (
      <section className="panel main-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Arquivo selecionado</p>
            <h2>Workspace do arquivo</h2>
          </div>
        </div>
        <p className="empty-state">
          Selecione um arquivo na lateral para visualizar e editar o
          conteudo.
        </p>
      </section>
    );
  }

  return (
    <section className="panel main-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Arquivo selecionado</p>
          <h2>Workspace do arquivo</h2>
        </div>
        <div className="header-actions">
          <a
            className="link-button"
            href={getViewUrl(selectedFile.id)}
            rel="noopener noreferrer"
            target="_blank"
          >
            Visualizar
          </a>
          <button
            disabled={busyAction === "download"}
            onClick={onDownload}
            type="button"
          >
            {busyAction === "download" ? "Baixando..." : "Download"}
          </button>
        </div>
      </div>

      <div className="metadata-grid">
        <article className="meta-card">
          <span>Nome</span>
          <strong>{selectedFile.originalName}</strong>
        </article>
        <article className="meta-card">
          <span>Tipo</span>
          <strong className={`file-type-badge type-${selectedFile.fileCategory || "other"}`}>
            {(selectedFile.fileCategory || "other").toUpperCase()}
          </strong>
        </article>
        <article className="meta-card">
          <span>Tamanho</span>
          <strong>{formatFileSize(selectedFile.size)}</strong>
        </article>
        <article className="meta-card">
          <span>Criado em</span>
          <strong>{formatDate(selectedFile.createdAt)}</strong>
        </article>
      </div>

      <FileViewer
        busyAction={busyAction}
        content={content}
        file={selectedFile}
        onSaveContent={onSaveContent}
      />

      <div className="section-block">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Processamento por IA</p>
            <h3>Geracao de conteudo assistido</h3>
          </div>
        </div>

        <div className="action-grid">
          {aiActions.map((action) => (
            <button
              key={action.type}
              onClick={() => onGenerateAI(action.type)}
              type="button"
            >
              {busyAction === action.type
                ? "Processando..."
                : action.label}
            </button>
          ))}
        </div>

        <div className="results-grid">
          {aiResults.length === 0 ? (
            <p className="empty-state">
              Nenhum resultado gerado ainda para este arquivo.
            </p>
          ) : (
            aiResults.map((result) => (
              <article className="result-card" key={result.id}>
                <div className="result-card-top">
                  <strong>{getAITypeLabel(result.type)}</strong>
                  <span>{result.status}</span>
                </div>
                <p>{getAIResultSnippet(result.resultText)}</p>
                <small>{formatDate(result.updatedAt)}</small>
                {result.metadataJson?.keywords?.length ? (
                  <div className="tag-row">
                    {result.metadataJson.keywords.map((keyword) => (
                      <span className="tag" key={keyword}>
                        {keyword}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="result-card-actions">
                  <button
                    className="secondary-button"
                    onClick={() => onOpenAIResult(result)}
                    type="button"
                  >
                    Abrir e editar
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default memo(FileWorkspace);
