import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Typography } from "@mui/material";
import PropTypes from "prop-types";
import { useState } from "react";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import { isFileDrag } from "./utils/documentAssignment";
import { isExpiredDocument } from "../../../Profile/Documents/utils/documentLibrary";

/**
 * Available documents on the left, the event's on the right (meeting
 * 2026-09-29 `33:01`–`42:18`). Three things he ran into:
 *
 * - The drop zone read "Drop here to assign", so he dropped a PDF from his
 *   desktop on it. It now says where documents come from, points files on the
 *   computer to the upload, and catches such a drop instead of letting the
 *   browser open the file and leave the wizard.
 * - "Here I can drag it, but I cannot click it": each card has an Assign
 *   button. Dragging starts after 5 px of movement, so the click is a click.
 * - The dragged card was drawn behind the drop zone — it only had a transform
 *   inside the left panel, and the zone comes later in the page. It now rides
 *   in a DragOverlay, above everything, while the card stays in place.
 *
 * These pieces used to be defined inside FormDocuments, which re-created them
 * on every render — mid-drag included.
 */

const cardStyle = {
  background: "var(--gray-50, #f9fafb)",
  border: "1px solid var(--gray-200, #e5e7eb)",
  borderRadius: "6px",
  padding: "8px 10px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "8px",
};

const DocumentCard = ({ doc, onAssign, dragging = false, expired = false }) => (
  <div
    style={{
      ...cardStyle,
      ...(expired ? { opacity: 0.7, cursor: "not-allowed" } : {}),
      ...(dragging
        ? { background: "#fff", boxShadow: "0 8px 24px rgba(16, 24, 40, 0.18)", cursor: "grabbing" }
        : {}),
    }}
  >
    <span style={{ font: "500 14px/20px Inter, sans-serif", overflowWrap: "anywhere" }}>
      {doc.title}
    </span>
    {expired && (
      <span
        title="Expired documents cannot be assigned. Update its expiration date in Profile → Documents."
        style={{
          padding: "2px 8px",
          borderRadius: "16px",
          background: "var(--warning-50, #fffaeb)",
          color: "var(--warning-700, #b54708)",
          font: "500 12px/18px Inter, sans-serif",
          whiteSpace: "nowrap",
        }}
      >
        Expired
      </span>
    )}
    {onAssign && !expired && (
      <BlueButtonComponent
        title="Assign"
        buttonType="button"
        size="sm"
        ariaLabel={`Assign ${doc.title}`}
        func={() => onAssign(doc)}
      />
    )}
  </div>
);

const DraggableDocument = ({ doc, onAssign }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: doc._id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      title="Drag to the right, or use Assign"
      // The overlay is what moves; the card stays put, faded, so the list does
      // not jump while dragging.
      style={{ cursor: "grab", opacity: isDragging ? 0.4 : 1 }}
    >
      <DocumentCard doc={doc} onAssign={onAssign} />
    </div>
  );
};

const AssignedDropZone = ({ children, onFileDropAttempt }) => {
  const { isOver, setNodeRef } = useDroppable({ id: "assigned-dropzone" });

  // Native file drags only. Moving a card between the lists is dnd-kit's
  // pointer handling and never raises these events.
  const guardFileDrop = (event) => {
    if (!isFileDrag(event.dataTransfer)) return;
    event.preventDefault();
    if (event.type === "drop") onFileDropAttempt();
  };

  return (
    <div
      ref={setNodeRef}
      data-testid="assigned-dropzone"
      onDragOver={guardFileDrop}
      onDrop={guardFileDrop}
      style={{
        border: `2px dashed ${isOver ? "#2563eb" : "#cbd5e1"}`,
        backgroundColor: isOver ? "#eff6ff" : "#fafafa",
        transition: "all 160ms ease",
        borderRadius: "8px",
        padding: "12px",
        minHeight: "260px",
      }}
    >
      {children}
    </div>
  );
};

const DocumentAssignmentBoard = ({ available, assigned, loading, onAssign, assignedTable }) => {
  const [draggingId, setDraggingId] = useState(null);
  const [fileDropNotice, setFileDropNotice] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const draggingDoc = available.find((doc) => doc._id === draggingId) ?? null;

  const handleDragEnd = ({ active, over }) => {
    setDraggingId(null);
    if (!over || over.id !== "assigned-dropzone") return;
    const doc = available.find((entry) => entry._id === active.id);
    if (doc) onAssign(doc);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => setDraggingId(active.id)}
      onDragCancel={() => setDraggingId(null)}
      onDragEnd={handleDragEnd}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px",
          alignItems: "start",
        }}
      >
        <div
          style={{
            border: "1px solid var(--gray-200, #e5e7eb)",
            borderRadius: "8px",
            padding: "12px",
            minHeight: "260px",
            backgroundColor: "var(--base-white, #fff)",
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Available documents ({available.length})
          </Typography>
          <div style={{ display: "grid", gap: "8px" }}>
            {loading ? (
              <Typography variant="body2">Loading…</Typography>
            ) : available.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No documents available. Upload one below.
              </Typography>
            ) : (
              available.map((doc) =>
                // Listed so nobody wonders where it went, but not draggable
                // and with no Assign: an expired document is not handed out.
                isExpiredDocument(doc) ? (
                  <DocumentCard key={doc._id} doc={doc} expired />
                ) : (
                  <DraggableDocument key={doc._id} doc={doc} onAssign={onAssign} />
                )
              )
            )}
          </div>
        </div>

        <AssignedDropZone onFileDropAttempt={() => setFileDropNotice(true)}>
          <Typography variant="subtitle2">Assigned to this event ({assigned.length})</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Drag a document here from the list on the left, or use Assign. To add a file
            from your computer, use “Upload a new document” below.
          </Typography>
          {fileDropNotice && (
            <div
              role="status"
              style={{
                padding: "8px 12px",
                marginBottom: "8px",
                borderRadius: "6px",
                border: "1px solid var(--warn-200, #fedf89)",
                background: "var(--warn-50, #fffaeb)",
                color: "#93370d",
                font: "400 13px/18px Inter, sans-serif",
              }}
            >
              Files from your computer cannot be dropped here. Use “Upload a new document”
              below, and it will appear in the list on the left.
            </div>
          )}
          {assignedTable}
        </AssignedDropZone>
      </div>

      {/* Above every panel, so the card is never drawn behind the drop zone. */}
      <DragOverlay>{draggingDoc ? <DocumentCard doc={draggingDoc} dragging /> : null}</DragOverlay>
    </DndContext>
  );
};

const docShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  title: PropTypes.string,
  document_url: PropTypes.string,
});

DocumentCard.propTypes = {
  doc: docShape.isRequired,
  onAssign: PropTypes.func,
  dragging: PropTypes.bool,
  expired: PropTypes.bool,
};
DraggableDocument.propTypes = { doc: docShape.isRequired, onAssign: PropTypes.func.isRequired };
AssignedDropZone.propTypes = { children: PropTypes.node, onFileDropAttempt: PropTypes.func.isRequired };
DocumentAssignmentBoard.propTypes = {
  available: PropTypes.arrayOf(docShape).isRequired,
  assigned: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool,
  onAssign: PropTypes.func.isRequired,
  assignedTable: PropTypes.node,
};

export default DocumentAssignmentBoard;
