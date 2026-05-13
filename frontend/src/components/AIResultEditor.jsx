import { useState, useEffect, memo } from "react";
import { getAITypeLabel } from "../utils";

function AIResultEditor({ editingAIResult, onBack, onSave, busyAction }) {
  const [draft, setDraft] = useState(editingAIResult?.text || "");

  useEffect(() => {
    setDraft(editingAIResult?.text || "");
  }, [editingAIResult?.text]);

  if (!editingAIResult) return null;

  return (
    <>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Resultado de IA — {getAITypeLabel(editingAIResult.type)}</p>
          <h2>Editor do resultado</h2>
        </div>
        <button
          className="secondary-button"
          onClick={onBack}
          type="button"
        >
          Voltar ao arquivo
        </button>
      </div>

      <div className="editor-panel">
        <textarea
          aria-label="Conteudo do resultado de IA"
          onChange={(e) => setDraft(e.target.value)}
          value={draft}
        />
        <div className="editor-actions">
          <button
            disabled={busyAction === "save-ai" || draft === editingAIResult.text}
            onClick={() => onSave(editingAIResult.id, draft)}
            type="button"
          >
            {busyAction === "save-ai" ? "Salvando..." : "Salvar alteracoes"}
          </button>
          <button
            className="secondary-button"
            onClick={() => setDraft(editingAIResult.text)}
            type="button"
          >
            Desfazer rascunho
          </button>
        </div>
      </div>
    </>
  );
}

export default memo(AIResultEditor);
