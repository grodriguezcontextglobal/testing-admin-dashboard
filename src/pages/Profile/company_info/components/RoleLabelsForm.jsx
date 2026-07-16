import { useMutation } from "@tanstack/react-query";
import { message, notification } from "antd";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import Input from "../../../../components/UX/inputs/Input";
import SectionFooter from "../../../../components/documents/new_form_components/SectionFooter";
import SectionHeader from "../../../../components/documents/new_form_components/SectionHeader";
import { ROLE_LABEL_GROUPS, getRoleLabel } from "../../../../config/roles";
import { onLogin } from "../../../../store/slices/adminSlice";

const ROLE_CONCEPT_KEYS = Object.keys(ROLE_LABEL_GROUPS);

/**
 * Lets a company customize the display label of each role concept (e.g.
 * "Root Administrator" -> "President") without touching the permissions
 * those roles carry — see ROLE_LABEL_GROUPS / useRoleLabel.
 */
const RoleLabelsForm = () => {
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();

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
        ROLE_CONCEPT_KEYS.map((groupKey) => [groupKey, data[groupKey]?.trim() ?? ""])
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
        description: "The new names are in effect for everyone in your company.",
      });
    },
    onError: () => {
      message.error("Failed to update role labels. Please try again.");
    },
  });

  const handleCancel = () => reset();
  const handleUpdate = (data) => updateRoleLabelsMutation.mutate(data);

  return (
    <div style={{ width: "100%", padding: 0 }}>
      <form onSubmit={handleSubmit(handleUpdate)} className="company-form">
        <SectionHeader
          title="Role labels"
          subtitle="Rename how each role appears across the app for your company. Permissions stay the same — only the displayed name changes."
          cancelButton={handleCancel}
          saveButton={handleSubmit(handleUpdate)}
          loading={updateRoleLabelsMutation.isLoading}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            padding: "16px 0",
          }}
        >
          {ROLE_CONCEPT_KEYS.map((groupKey) => (
            <Input
              key={groupKey}
              label={getRoleLabel(groupKey)}
              id={`role-label-${groupKey}`}
              placeholder={getRoleLabel(groupKey)}
              {...register(groupKey)}
            />
          ))}
        </div>
        <SectionFooter
          cancelButton={handleCancel}
          saveButton={handleSubmit(handleUpdate)}
          loading={updateRoleLabelsMutation.isLoading}
        />
      </form>
    </div>
  );
};

export default RoleLabelsForm;
