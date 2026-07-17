import { ArrowRight } from "lucide-react";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../../components/UX/modal/ModalUX";
import { ROLE_SUMMARIES } from "../utils/roleScopeUtils";

/**
 * Confirmation dialog shown before a drag-and-drop role reassignment runs.
 * Shows the staff member, the current -> target role label transition, and what
 * the target role can do. Nothing mutates until "Confirm change" is clicked.
 */
const ReassignConfirmModal = ({
  pending,
  roleLabel,
  isReassigning,
  onConfirm,
  onCancel,
}) => {
  if (!pending) return null;

  const { employee, fromGroupKey, toGroupKey } = pending;
  const fullName =
    `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim() ||
    employee.user;
  const fromLabel = roleLabel(fromGroupKey);
  const toLabel = roleLabel(toGroupKey);

  const body = (
    <div style={{ display: "grid", gap: "16px", padding: "8px 0" }}>
      <p style={{ margin: 0, fontSize: "14px", color: "var(--gray-700, #484d47)" }}>
        You are about to change the role of{" "}
        <strong>{fullName}</strong> ({employee.user}).
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            padding: "4px 10px",
            borderRadius: "16px",
            background: "var(--gray-100, #f0f1ec)",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--gray-700, #484d47)",
          }}
        >
          {fromLabel}
        </span>
        <ArrowRight size={16} aria-hidden />
        <span
          style={{
            padding: "4px 10px",
            borderRadius: "16px",
            background: "var(--blue-50, #eff6ff)",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--blue-700, #1d4ed8)",
          }}
        >
          {toLabel}
        </span>
      </div>

      <div
        style={{
          fontSize: "13px",
          lineHeight: "18px",
          color: "var(--gray-600, #5d615a)",
        }}
      >
        This person will be able to: {ROLE_SUMMARIES[toGroupKey]}
      </div>
    </div>
  );

  const footer = [
    <GrayButtonComponent
      key="cancel"
      title="Cancel"
      func={onCancel}
      disabled={isReassigning}
    />,
    <BlueButtonComponent
      key="confirm"
      title="Confirm change"
      func={onConfirm}
      loadingState={isReassigning}
      styles={{ margin: "0 0 0 12px" }}
    />,
  ];

  return (
    <ModalUX
      title="Change staff role"
      body={body}
      openDialog={true}
      closeModal={onCancel}
      width={520}
      footer={footer}
    />
  );
};

export default ReassignConfirmModal;
