import { useState, useEffect, memo } from "react";

function TextViewer({ content, onSave, busyAction }) {
  const [draft, setDraft] = useState(content);

  useEffect(() => {
    setDraft(content);
  }, [content]);

  return (
    <div className="editor-panel">
      <textarea
        aria-label="Conteudo do arquivo"
        onChange={(e) => setDraft(e.target.value)}
        value={draft}
      />
      <div className="editor-actions">
        <button
          disabled={busyAction === "save" || draft === content}
          onClick={() => onSave(draft)}
          type="button"
        >
          {busyAction === "save" ? "Salvando..." : "Salvar alteracoes"}
        </button>
        <button
          className="secondary-button"
          onClick={() => setDraft(content)}
          type="button"
        >
          Desfazer rascunho
        </button>
      </div>
    </div>
  );
}

export default memo(TextViewer);
