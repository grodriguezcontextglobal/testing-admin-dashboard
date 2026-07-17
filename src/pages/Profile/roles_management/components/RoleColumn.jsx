import { useDroppable } from "@dnd-kit/core";
import { Collapse } from "antd";
import Input from "../../../../components/UX/inputs/Input";
import { getRoleLabel } from "../../../../config/roles";
import {
  DOMAIN_LABELS,
  getReadableActionLabel,
  getRoleScope,
  ROLE_SUMMARIES,
} from "../utils/roleScopeUtils";
import DraggableStaffRow from "./DraggableStaffRow";

/**
 * One card per role concept: editable display label, default-name hint, the
 * derived summary sentence, an expandable capability list (grouped by domain),
 * and the droppable staff list for drag-and-drop reassignment.
 */
const RoleColumn = ({
  groupKey,
  currentLabel,
  register,
  employees = [],
  getLockReason,
  dropDisabled = false,
}) => {
  // Scoped-role columns (Phase A, v1 decision) never accept drops.
  const { isOver, setNodeRef } = useDroppable({
    id: groupKey,
    disabled: dropDisabled,
  });
  const defaultLabel = getRoleLabel(groupKey);
  const summary = ROLE_SUMMARIES[groupKey];
  const scope = getRoleScope(groupKey);

  // Domains where this role has at least one allowed action, for the detail list.
  const allowedByDomain = Object.entries(scope)
    .map(([domain, { allowed }]) => ({ domain, allowed }))
    .filter(({ allowed }) => allowed.length > 0);

  const showsDefaultHint =
    currentLabel && currentLabel.trim() !== defaultLabel;

  const capabilityItems = [
    {
      key: "capabilities",
      label: "What this role can do",
      children: (
        <div style={{ display: "grid", gap: "12px" }}>
          {allowedByDomain.map(({ domain, allowed }) => (
            <div key={domain}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--gray-500, #777b73)",
                  marginBottom: "4px",
                }}
              >
                {DOMAIN_LABELS[domain] ?? domain}
              </div>
              <ul style={{ margin: 0, paddingLeft: "18px" }}>
                {allowed.map((actionKey) => (
                  <li
                    key={actionKey}
                    style={{
                      fontSize: "13px",
                      color: "var(--gray-700, #484d47)",
                    }}
                  >
                    {getReadableActionLabel(actionKey)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div
      ref={setNodeRef}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "16px",
        borderRadius: "var(--radius-md, 8px)",
        border: `1px solid ${
          isOver ? "var(--blue-500, #2563eb)" : "var(--gray-200, #ddded6)"
        }`,
        background: isOver
          ? "var(--blue-50, #eff6ff)"
          : "var(--base-white, #fff)",
        transition: "border 160ms ease, background 160ms ease",
        minHeight: "220px",
      }}
    >
      <Input
        // label="Role label"
        id={`role-label-${groupKey}`}
        placeholder={defaultLabel}
        {...register(groupKey)}
      />
      {showsDefaultHint ? (
        <div style={{ fontSize: "12px", color: "var(--gray-500, #777b73)" }}>
          Default: {defaultLabel}
        </div>
      ) : null}

      <p
        style={{
          margin: 0,
          fontSize: "13px",
          lineHeight: "18px",
          color: "var(--gray-600, #5d615a)",
        }}
      >
        {summary}
      </p>

      <Collapse
        size="small"
        ghost
        items={capabilityItems}
        style={{ background: "transparent" }}
      />

      <div style={{ display: "grid", gap: "8px" }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--gray-500, #777b73)",
          }}
        >
          Staff in this role ({employees.length})
        </div>
        {employees.length === 0 ? (
          <div
            style={{
              fontSize: "13px",
              color: "var(--gray-400, #a2a49c)",
              fontStyle: "italic",
            }}
          >
            No staff members. Drag someone here to assign this role.
          </div>
        ) : (
          employees.map((employee) => (
            <DraggableStaffRow
              key={employee.user}
              employee={employee}
              lockReason={getLockReason(employee)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default RoleColumn;
