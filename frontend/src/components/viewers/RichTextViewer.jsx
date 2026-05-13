import { memo } from "react";

function RichTextViewer({ content, fileCategory, fileName }) {
  const badgeLabel =
    fileCategory === "docx" ? "DOCX" : fileCategory === "xlsx" ? "XLSX" : "DOC";

  return (
    <div className="viewer-panel">
      <div className="viewer-toolbar">
        <span className={`viewer-badge badge-${fileCategory}`}>{badgeLabel}</span>
        <span className="viewer-label">Conteudo extraido — somente leitura</span>
      </div>
      <pre className="rich-text-content">{content}</pre>
    </div>
  );
}

export default memo(RichTextViewer);
