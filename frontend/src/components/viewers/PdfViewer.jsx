import { memo } from "react";
import { getViewUrl } from "../../api";

function PdfViewer({ fileId, fileName }) {
  return (
    <div className="viewer-panel">
      <div className="viewer-toolbar">
        <span className="viewer-badge badge-pdf">PDF</span>
        <span className="viewer-label">Visualizacao nativa do navegador</span>
      </div>
      <iframe
        className="pdf-iframe"
        src={getViewUrl(fileId)}
        title={fileName}
        type="application/pdf"
      />
    </div>
  );
}

export default memo(PdfViewer);
