import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useMutation } from "@tanstack/react-query";
import { message, notification } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import SectionHeader from "../../../components/documents/new_form_components/SectionHeader";
import {
  ROLE_LABEL_GROUPS,
  getRoleLabel,
  getRoleLabelGroupKey,
} from "../../../config/roles";
import { useRoleLabel } from "../../../hooks/useRoleLabel";
import { onLogin } from "../../../store/slices/adminSlice";
import ReassignConfirmModal from "./components/ReassignConfirmModal";
import RoleColumn from "./components/RoleColumn";
import { useRoleReassignment } from "./hooks/useRoleReassignment";
import {
  canReassign,
  getRowLockReason,
  groupEmployeesByRoleConcept,
} from "./utils/staffByRoleUtils";

const ROLE_CONCEPT_KEYS = Object.keys(ROLE_LABEL_GROUPS);

/**
 * Dedicated "Roles" tab under /profile. Lets root_admin / admin:
 *  - rename each role's display label (single PATCH, no logout — preserves the
 *    behavior of the former company_info RoleLabelsForm), and
 *  - reassign staff between roles via drag-and-drop (canonical 3-call sequence).
 * Permissions themselves are fixed per role and never change here.
 */
const RolesManagementMainPage = () => {
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const roleLabel = useRoleLabel();
  const { reassign, isReassigning } = useRoleReassignment();
  const [pending, setPending] = useState(null);

  // Drag only starts after a small movement so a click on a row doesn't fire.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // ── Label editing (moved from company_info/RoleLabelsForm.jsx) ─────────────
  const defaultValues = Object.fromEntries(
    ROLE_CONCEPT_KEYS.map((groupKey) => [
      groupKey,
      user?.companyData?.roleLabels?.[groupKey] || getRoleLabel(groupKey),
    ])
  );
  const { register, handleSubmit, reset } = useForm({ defaultValues });

  const updateRoleLabelsMutation = useMutation({
    mutationFn: async (data) => {
      const roleLabels = Object.fromEntries(
        ROLE_CONCEPT_KEYS.map((groupKey) => [
          groupKey,
          data[groupKey]?.trim() ?? "",
        ])
      );
      await devitrakApi.patch(`/company/update-company/${user.companyData.id}`, {
        roleLabels,
      });
      return roleLabels;
    },
    onSuccess: (roleLabels) => {
      dispatch(
        onLogin({
          ...user,
          companyData: { ...user.companyData, roleLabels },
        })
      );
      notification.success({
        message: "Role labels updated",
        description:
          "The new names are in effect for everyone in your company.",
      });
    },
    onError: () => {
      message.error("Failed to update role labels. Please try again.");
    },
  });

  const handleCancel = () => reset();
  const handleSaveLabels = handleSubmit((data) =>
    updateRoleLabelsMutation.mutate(data)
  );

  // ── Staff board (grouped from Redux — never local optimistic state) ────────
  const grouped = groupEmployeesByRoleConcept(user?.companyData?.employees);
  const getLockReason = (employee) =>
    getRowLockReason({ actorUser: user, targetEmployee: employee });

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    const toGroupKey = over.id;
    const employee = active?.data?.current?.employee;
    if (!employee) return;

    const fromGroupKey = getRoleLabelGroupKey(
      employee.roleType ?? employee.role
    );
    if (fromGroupKey === toGroupKey) return; // dropped back in place

    const verdict = canReassign({
      actorUser: user,
      targetEmployee: employee,
      toGroupKey,
    });
    if (!verdict.allowed) {
      message.warning(verdict.reason);
      return;
    }
    setPending({ employee, fromGroupKey, toGroupKey });
  };

  const handleConfirm = () => {
    if (!pending) return;
    reassign(
      { employee: pending.employee, toGroupKey: pending.toGroupKey },
      { onSettled: () => setPending(null) }
    );
  };

  return (
    <div style={{ width: "100%", padding: 0 }}>
      <SectionHeader
        title="Roles"
        subtitle="Rename roles for your company and manage which staff members hold each role. Permissions are fixed per role — renaming never changes what a role can do."
        cancelButton={handleCancel}
        saveButton={handleSaveLabels}
        loading={updateRoleLabelsMutation.isLoading}
      />

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            padding: "16px 0",
          }}
        >
          {ROLE_CONCEPT_KEYS.map((groupKey) => (
            <RoleColumn
              key={groupKey}
              groupKey={groupKey}
              currentLabel={roleLabel(groupKey)}
              register={register}
              employees={grouped[groupKey] ?? []}
              getLockReason={getLockReason}
            />
          ))}
        </div>
      </DndContext>

      {grouped.unknown?.length ? (
        <div
          style={{
            padding: "16px",
            borderRadius: "var(--radius-md, 8px)",
            border: "1px dashed var(--gray-300, #cbd5c8)",
            background: "var(--gray-50, #f7f7f4)",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--gray-600, #5d615a)",
              marginBottom: "8px",
            }}
          >
            Staff with an unrecognized role ({grouped.unknown.length})
          </div>
          {grouped.unknown.map((employee) => (
            <div
              key={employee.user}
              style={{
                fontSize: "13px",
                color: "var(--gray-700, #484d47)",
              }}
            >
              {`${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim() ||
                employee.user}{" "}
              — {employee.user}
            </div>
          ))}
        </div>
      ) : null}

      <ReassignConfirmModal
        pending={pending}
        roleLabel={roleLabel}
        isReassigning={isReassigning}
        onConfirm={handleConfirm}
        onCancel={() => setPending(null)}
      />
    </div>
  );
};

export default RolesManagementMainPage;
