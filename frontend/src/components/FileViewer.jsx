import { memo } from "react";
import TextViewer from "./viewers/TextViewer.jsx";
import PdfViewer from "./viewers/PdfViewer.jsx";
import RichTextViewer from "./viewers/RichTextViewer.jsx";
import FallbackViewer from "./viewers/FallbackViewer.jsx";

function FileViewer({ file, content, busyAction, onSaveContent }) {
  const category = file.fileCategory || "other";

  if (category === "text") {
    return (
      <TextViewer
        busyAction={busyAction}
        content={content}
        onSave={onSaveContent}
      />
    );
  }

  if (category === "pdf") {
    return (
      <PdfViewer
        fileId={file.id}
        fileName={file.originalName}
      />
    );
  }

  if (category === "docx" || category === "xlsx") {
    return (
      <RichTextViewer
        content={content}
        fileCategory={category}
        fileName={file.originalName}
      />
    );
  }

  return (
    <FallbackViewer fileName={file.originalName} />
  );
}

export default memo(FileViewer);
