import { useDraggable } from "@dnd-kit/core";
import { Tooltip } from "antd";
import { GripVertical, Lock } from "lucide-react";

/**
 * A single staff member row inside a role column. Movable rows expose a drag
 * handle wired to @dnd-kit; locked rows (self / owner / pending / insufficient
 * authority) render statically with a tooltip explaining why.
 */
const DraggableStaffRow = ({ employee, lockReason }) => {
  const isLocked = Boolean(lockReason);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: employee.user,
      data: { employee },
      disabled: isLocked,
    });

  const fullName =
    `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim() ||
    employee.user;

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.6 : 1,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 10px",
    borderRadius: "var(--radius-sm, 6px)",
    border: "1px solid var(--gray-200, #ddded6)",
    background: isLocked
      ? "var(--gray-50, #f7f7f4)"
      : "var(--base-white, #fff)",
    cursor: isLocked ? "not-allowed" : "grab",
  };

  const row = (
    <div ref={setNodeRef} style={style} {...(!isLocked ? listeners : {})} {...attributes}>
      <span
        aria-hidden
        style={{
          display: "inline-flex",
          color: "var(--gray-400, #a2a49c)",
          flexShrink: 0,
        }}
      >
        {isLocked ? <Lock size={14} /> : <GripVertical size={14} />}
      </span>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--gray-900, #171d1a)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {fullName}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "var(--gray-500, #777b73)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {employee.user}
        </div>
      </div>
    </div>
  );

  if (isLocked) {
    return (
      <Tooltip title={lockReason} placement="top">
        {row}
      </Tooltip>
    );
  }
  return row;
};

export default DraggableStaffRow;
