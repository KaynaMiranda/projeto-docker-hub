import { memo } from "react";

function FallbackViewer({ fileName }) {
  return (
    <div className="viewer-panel">
      <div className="viewer-toolbar">
        <span className="viewer-badge badge-other">OUTRO</span>
        <span className="viewer-label">Previa nao disponivel</span>
      </div>
      <p className="empty-state">
        O arquivo <strong>{fileName}</strong> nao pode ser visualizado no
        navegador. Utilize o botao Download para baixar o arquivo original.
      </p>
    </div>
  );
}

export default memo(FallbackViewer);
