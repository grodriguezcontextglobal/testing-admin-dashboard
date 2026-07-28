import { InputLabel } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { Divider, notification } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { devitrakApi } from "../../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import Input from "../../../../../components/UX/inputs/Input";
import { saveGuardian, searchGuardians } from "../../../utils/guardianConsentApi";
import {
  buildExistingGuardianLinkPayload,
  buildGuardianSearchPayload,
  buildNewGuardianLinkPayload,
  normalizeGuardianEmail,
  selectGuardianByEmail,
} from "../../../utils/guardianConsentUtils";
import { StudentConsentPanel } from "./StudentConsentPanel";

/**
 * Guardian-only half of the member edit page (Education, minors only) —
 * search-or-create a single guardian by email, then the consent panel.
 * Dual-writes the embedded parent_guardian_* member fields (read by
 * StudentConsentPanel / the assignment consent gate) alongside the
 * normalized guardians table.
 */
const GuardianInfoSection = ({
  memberId,
  companyId,
  initialGuardian,
  memberData,
  representative,
  policyType = "AUP",
  requiredPolicyVersion = null,
  onSaved,
}) => {
  const [errors, setErrors] = useState([]);
  const [matchedGuardianId, setMatchedGuardianId] = useState(null);
  const [api, contextHolder] = notification.useNotification();
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      first_name: initialGuardian?.first_name || "",
      last_name: initialGuardian?.last_name || "",
      email: initialGuardian?.email || "",
      phone_number: initialGuardian?.phone_number || "",
    },
  });

  const saveGuardianMutation = useMutation({
    mutationFn: async (data) => {
      const email = normalizeGuardianEmail(data.email);

      await devitrakApi.patch("/db_member/update-member-info", {
        company_id: companyId,
        member_id: memberId,
        parent_guardian_first_name: data.first_name,
        parent_guardian_last_name: data.last_name,
        parent_guardian_email: email,
        parent_guardian_phone_number: data.phone_number,
      });

      const guardianPayload = matchedGuardianId
        ? buildExistingGuardianLinkPayload({
            companyId,
            memberId,
            guardianId: matchedGuardianId,
          })
        : buildNewGuardianLinkPayload({
            companyId,
            memberId,
            firstName: data.first_name,
            lastName: data.last_name,
            email,
            phoneNumber: data.phone_number,
          });

      return saveGuardian(guardianPayload);
    },
    onSuccess: () => {
      api.success({ message: "Guardian information updated successfully" });
      onSaved?.();
    },
    onError: (error) => {
      setErrors([`Failed to update guardian: ${error?.message || String(error)}`]);
    },
  });

  const handleGuardianEmailBlur = async () => {
    const email = normalizeGuardianEmail(watch("email"));
    if (!email) return;

    try {
      const searchResponse = await searchGuardians(
        buildGuardianSearchPayload({ companyId, email })
      );
      const existingGuardian = selectGuardianByEmail(searchResponse?.guardians, email);

      if (existingGuardian) {
        setMatchedGuardianId(existingGuardian.id);
        setValue("first_name", existingGuardian.first_name || watch("first_name"));
        setValue("last_name", existingGuardian.last_name || watch("last_name"));
        setValue("phone_number", existingGuardian.phone_number || watch("phone_number"));
      } else {
        setMatchedGuardianId(null);
      }
    } catch {
      // Silently fail — staff can still enter guardian info manually.
      setMatchedGuardianId(null);
    }
  };

  const handleSave = (data) => {
    saveGuardianMutation.mutate(data);
  };

  const label = representative?.label || "Guardian";

  return (
    <>
      {contextHolder}
      <form
        onSubmit={handleSubmit(handleSave)}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <InputLabel style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ width: "100%", textAlign: "left" }}>{label} first name</span>
            <Input {...register("first_name")} />
          </InputLabel>
          <InputLabel style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ width: "100%", textAlign: "left" }}>{label} last name</span>
            <Input {...register("last_name")} />
          </InputLabel>
          <InputLabel style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ width: "100%", textAlign: "left" }}>{label} email</span>
            <Input
              {...register("email")}
              type="email"
              onBlur={handleGuardianEmailBlur}
            />
          </InputLabel>
          <InputLabel style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ width: "100%", textAlign: "left" }}>{label} phone</span>
            <Input {...register("phone_number")} />
          </InputLabel>
        </div>

        {errors.length ? (
          <div style={{ color: "crimson" }}>
            {errors.map((e, i) => (
              <div key={i}>{e}</div>
            ))}
          </div>
        ) : null}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <BlueButtonComponent
            title="Save guardian"
            loadingState={saveGuardianMutation.isLoading}
            disabled={saveGuardianMutation.isLoading}
            buttonType="submit"
          />
        </div>
      </form>

      <Divider />

      <StudentConsentPanel
        memberId={memberId}
        memberData={memberData}
        policyType={policyType}
        requiredPolicyVersion={requiredPolicyVersion}
      />
    </>
  );
};

export default GuardianInfoSection;
