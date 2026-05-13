import { useState, useMemo, memo } from "react";
import { formatFileSize, getFileStatusLabel } from "../utils";

function getFileBadge(originalName) {
  const ext = originalName.split(".").pop().toLowerCase();
  const map = {
    txt: "TXT",
    csv: "CSV",
    json: "JSON",
    md: "MD",
    xml: "XML",
    log: "LOG",
    yaml: "YAML",
    yml: "YML",
    pdf: "PDF",
    docx: "DOCX",
    xlsx: "XLSX",
    xls: "XLS",
    pptx: "PPTX",
  };
  return map[ext] || ext.toUpperCase();
}

function getBadgeClass(originalName) {
  const ext = originalName.split(".").pop().toLowerCase();
  const map = {
    txt: "text",
    csv: "text",
    json: "text",
    md: "text",
    xml: "text",
    log: "text",
    yaml: "text",
    yml: "text",
    pdf: "pdf",
    docx: "docx",
    xlsx: "xlsx",
    xls: "xlsx",
    pptx: "pptx",
  };
  return map[ext] || "other";
}

function FileSidebar({ files, selectedFileId, onSelectFile }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFiles = useMemo(
    () =>
      files.filter((f) =>
        f.originalName.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [files, searchQuery],
  );

  return (
    <aside className="panel sidebar-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Arquivos</p>
          <h2>Lista de uploads</h2>
        </div>
        <span className="pill">{filteredFiles.length} itens</span>
      </div>

      <input
        aria-label="Pesquisar arquivos"
        className="search-input"
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Pesquisar por nome..."
        type="search"
        value={searchQuery}
      />

      {filteredFiles.length === 0 ? (
        <p className="empty-state">
          {files.length === 0
            ? "Nenhum arquivo enviado ainda. Use o upload acima para iniciar."
            : "Nenhum arquivo encontrado para essa pesquisa."}
        </p>
      ) : (
        <div className="file-list">
          {filteredFiles.map((file) => (
            <button
              className={`file-card ${selectedFileId === file.id ? "is-active" : ""}`}
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              type="button"
            >
              <div className="file-card-top">
                <strong>{file.originalName}</strong>
                <span className={`file-badge badge-${getBadgeClass(file.originalName)}`}>
                  {getFileBadge(file.originalName)}
                </span>
              </div>
              <span>{getFileStatusLabel(file.processingStatus)}</span>
              <small>{formatFileSize(file.size)}</small>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}

export default memo(FileSidebar);
