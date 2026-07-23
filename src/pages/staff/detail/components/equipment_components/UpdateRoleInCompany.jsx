import { MenuItem, Select, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { Divider, message } from "antd";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { useRoleLabel } from "../../../../../hooks/useRoleLabel";
import renderingTitle from "../../../../../components/general/renderingTitle";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import ReusableCardWithHeaderAndFooter from "../../../../../components/UX/cards/ReusableCardWithHeaderAndFooter";
import ModalUX from "../../../../../components/UX/modal/ModalUX";
import { onLogin } from "../../../../../store/slices/adminSlice";
import {
  isCoordinatorLevel,
  LEGACY_ROLE_MAP,
  ROLE_LEVELS,
  resolveRoleType,
} from "../../../../../config/roles";
import { FEATURE_SCOPED_ROLES } from "../../../../../config/featureFlags";
import { onAddStaffProfile } from "../../../../../store/slices/staffDetailSlide";
import { extractStaffId } from "../../../../authentication/utils/loginUtils";
import { AntSelectorStyle } from "../../../../../styles/global/AntSelectorStyle";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import ScopeAssignmentSelect from "./ScopeAssignmentSelect";
import { buildScopePayload, validateScopeSelection } from "./utils/scopeUtils";

// Scoped roles — string-valued, level-less (R1 resolved: backend derives
// identity from the JWT and keys off role_type strings, so no numeric level is
// ever sent). Both dimensions (location + category) are wired to save via the
// scope endpoint; the correct dimension is chosen by buildScopePayload. Only
// listed as pickable options when FEATURE_SCOPED_ROLES is on; flag OFF keeps
// this file's behavior byte-for-byte identical to today.
const SCOPED_ROLE_VALUES = [
  "inventory_location_manager",
  "inventory_location_assistant",
  "category_manager",
  "category_assistant",
];
const UpdateRoleInCompany = () => {
  const { profile } = useSelector((state) => state.staffDetail);
  const { user } = useSelector((state) => state.admin);
  const roleLabel = useRoleLabel();
  const [newRole, setNewRole] = useState("");
  const [scopeSelection, setScopeSelection] = useState([]);
  const navigate = useNavigate();

  const isScopedRoleSelected = SCOPED_ROLE_VALUES.includes(newRole);
  const closeModal = () => {
    return navigate(`/staff/${profile.adminUserInfo.id}/main`);
  };
  const dispatch = useDispatch();
  const [messageApi, contextHolder] = message.useMessage();
  const messaging = () => {
    messageApi.open({
      type: "success",
      content: "Staff role updated.",
    });
  };
  const {
    mutate: updateRole,
    isLoading,
    isError,
    error,
  } = useMutation({
    mutationFn: async ({ role_level, roleType, employees }) => {
      // 1. Fetch staff_id by email from SQL staff table
      const staffResponse = await devitrakApi.post("/db_staff/consulting-member", {
        email: profile.user,
      });
      const staff_id = extractStaffId(staffResponse.data);
      if (!staff_id) throw new Error("Staff member not found in SQL database.");

      // 2. Update SQL company_staff table
      await devitrakApi.patch("/db_staff/company-staff", {
        company_id: user.sqlInfo.company_id,
        staff_id,
        role_level,
        role_type: roleType,
      });

      // 3. Keep MongoDB employees array in sync
      return devitrakApi.patch(`/company/update-company/${profile.companyData.id}`, {
        employees,
      });
    },
    onSuccess: (mongoResult) => {
      const roleType = LEGACY_ROLE_MAP[Number(newRole)] ?? "assistant";
      dispatch(
        onAddStaffProfile({
          ...profile,
          role: newRole,
          roleType,
          companyData: mongoResult.data.company,
        }),
      );
      if (user.email === profile.user) {
        dispatch(
          onLogin({
            ...user,
            role: String(newRole),
            roleType,
          }),
        );
      }
      messaging();
      closeModal();
    },
    onError: (error) => {
      messageApi.open({
        type: "error",
        content:
          error?.response?.data?.msg ||
          "Failed to update role. Please try again.",
      });
    },
  });

  // Category-scoped save (Phase B): change role by role_type string (no numeric
  // level — R1 (c)), then full-replace the category scope, then keep the Mongo
  // employees array in sync. Separate from `updateRole` so the legacy numeric
  // path is untouched.
  const { mutate: saveScopedRole, isLoading: isScopedSaving } = useMutation({
    mutationFn: async ({ roleType, selection }) => {
      // 1. Resolve staff_id (recipient) from email; actor comes from the JWT.
      const staffResponse = await devitrakApi.post("/db_staff/consulting-member", {
        email: profile.user,
      });
      const staff_id = extractStaffId(staffResponse.data);
      if (!staff_id) throw new Error("Staff member not found in SQL database.");

      // 2. Change role — role_type string only, never a numeric level.
      await devitrakApi.patch("/db_staff/company-staff/role", {
        company_id: user.sqlInfo.company_id,
        staff_id,
        role_type: roleType,
      });

      // 3. Assign the scope (full-replace; dimension chosen by role).
      await devitrakApi.put(
        "/db_staff/company-staff/scope",
        buildScopePayload(roleType, selection, {
          company_id: user.sqlInfo.company_id,
          staff_id,
        }),
      );

      // 4. Keep the MongoDB employees array in sync (scoped roles are
      //    string-only, so `role` mirrors the roleType string).
      const foundStaffIdx = profile.companyData.employees.findIndex(
        (el) => el.user === profile.user,
      );
      const employees =
        foundStaffIdx > -1
          ? profile.companyData.employees.toSpliced(foundStaffIdx, 1, {
              ...profile.companyData.employees[foundStaffIdx],
              role: roleType,
              roleType,
            })
          : profile.companyData.employees;

      return devitrakApi.patch(
        `/company/update-company/${profile.companyData.id}`,
        { employees },
      );
    },
    onSuccess: (mongoResult) => {
      dispatch(
        onAddStaffProfile({
          ...profile,
          role: newRole,
          roleType: newRole,
          companyData: mongoResult.data.company,
        }),
      );
      if (user.email === profile.user) {
        dispatch(onLogin({ ...user, role: newRole, roleType: newRole }));
      }
      messaging();
      closeModal();
    },
    onError: (mutationError) => {
      messageApi.open({
        type: "error",
        content:
          mutationError?.response?.data?.msg ||
          "Failed to update scoped role. Please try again.",
      });
    },
  });

  const handleSubmitNewRole = (e) => {
    e.preventDefault();
    if (!newRole && newRole !== 0) return;
    // Scoped roles: save via the string role_type + scope (dimension chosen by
    // buildScopePayload), guarded fail-closed (≥1 assignment).
    if (isScopedRoleSelected) {
      if (!scopeValidation.valid) return;
      return saveScopedRole({ roleType: newRole, selection: scopeSelection });
    }
    const roleType = LEGACY_ROLE_MAP[Number(newRole)] ?? "assistant";
    const foundStaffIdx = profile.companyData.employees.findIndex(
      (el) => el.user === profile.user,
    );
    const employees =
      foundStaffIdx > -1
        ? profile.companyData.employees.toSpliced(foundStaffIdx, 1, {
            ...profile.companyData.employees[foundStaffIdx],
            role: String(newRole),
            roleType,
          })
        : profile.companyData.employees;

    updateRole({ role_level: Number(newRole), roleType, employees });
  };

  const options = [0, 1, 2, 3, 4, 5].map((value) => ({
    label: roleLabel(value),
    value,
  }));

  // Scoped roles (Phase A) — string-valued options, only listed when the
  // feature flag is on. Flag OFF -> this array is empty and `options` below
  // is unchanged from today.
  const scopedRoleOptions = FEATURE_SCOPED_ROLES
    ? SCOPED_ROLE_VALUES.map((value) => ({ label: roleLabel(value), value }))
    : [];

  const optionsBasedOnCurrentRolePermission = [
    ...options.filter((option) => {
      const userLevel = ROLE_LEVELS[resolveRoleType(user)] ?? 99;
      if (userLevel === 0) return true;
      return option.value > userLevel;
    }),
    ...scopedRoleOptions,
  ];

  const scopeValidation = validateScopeSelection(newRole, scopeSelection);

  const bodyModal = () => {
    const role = roleLabel(profile.role)
    const saveButton = (
      <BlueButtonComponent
        form="update-role-form"
        key="save"
        buttonType="submit"
        title="Save"
        loadingState={isLoading || isScopedSaving}
        // Scoped roles require a valid (≥1) scope selection before saving.
        isDisabled={isScopedRoleSelected && !scopeValidation.valid}
        styles={{ margin: "0 0 0 24px" }}
      />
    );
    return (
      <ReusableCardWithHeaderAndFooter
        title={`Current role in company: ${role}`}
        actions={[saveButton]}
      >
        {isCoordinatorLevel(user.roleType) ? (
          <form
            style={{
              ...CenteringGrid,
              flexDirection: "column",
              width: "100%",
            }}
            onSubmit={(e) => handleSubmitNewRole(e)}
            id="update-role-form"
          >
            <Select
              className="custom-autocomplete"
              style={{ ...AntSelectorStyle, width: "100%" }}
              onChange={(e) => setNewRole(e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              {optionsBasedOnCurrentRolePermission.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Typography>{option.label}</Typography>
                </MenuItem>
              ))}
            </Select>
            {isScopedRoleSelected && (
              <div style={{ width: "100%", marginTop: "16px" }}>
                <ScopeAssignmentSelect
                  roleType={newRole}
                  value={scopeSelection}
                  onChange={setScopeSelection}
                />
                {!scopeValidation.valid && (
                  <Typography style={{ color: "red", marginTop: "8px" }}>
                    {scopeValidation.message}
                  </Typography>
                )}
              </div>
            )}
            {isError && (
              <Typography style={{ color: "red" }}>
                {error?.response?.data?.msg ||
                  "Failed to update role. Please try again."}
              </Typography>
            )}
          </form>
        ) : (
          <div>
            <Divider />
            {renderingTitle(
              "Need permission of Administrator for this function.",
            )}
          </div>
        )}
      </ReusableCardWithHeaderAndFooter>
    );
  };
  return (
    <>
      {contextHolder}
      <ModalUX
        title={renderingTitle(
          `Staff member: ${profile.firstName} ${profile.lastName}`,
        )}
        body={bodyModal()}
        openDialog={true}
        closeModal={() => closeModal()}
      />
    </>
  );
};

export default UpdateRoleInCompany;
