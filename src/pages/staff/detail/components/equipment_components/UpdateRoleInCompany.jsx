import { MenuItem, Select, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { Divider, message } from "antd";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import dicRole from "../../../../../components/general/dicRole";
import renderingTitle from "../../../../../components/general/renderingTitle";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import ReusableCardWithHeaderAndFooter from "../../../../../components/UX/cards/ReusableCardWithHeaderAndFooter";
import ModalUX from "../../../../../components/UX/modal/ModalUX";
import { onLogin } from "../../../../../store/slices/adminSlice";
import { isCoordinatorLevel, LEGACY_ROLE_MAP, ROLE_LEVELS, resolveRoleType } from "../../../../../config/roles";
import { onAddStaffProfile } from "../../../../../store/slices/staffDetailSlide";
import { extractStaffId } from "../../../../authentication/utils/loginUtils";
import { AntSelectorStyle } from "../../../../../styles/global/AntSelectorStyle";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
const UpdateRoleInCompany = () => {
  const { profile } = useSelector((state) => state.staffDetail);
  const { user } = useSelector((state) => state.admin);
  const [newRole, setNewRole] = useState("");
  const navigate = useNavigate();
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

  const handleSubmitNewRole = (e) => {
    e.preventDefault();
    if (!newRole && newRole !== 0) return;
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

  const options = [
    { label: "Root Administrator",  value: 0 },
    { label: "Administrator",       value: 1 },
    { label: "Sale Manager",        value: 2 },
    { label: "Event Manager",       value: 3 },
    { label: "Inventory Manager",   value: 4 },
    { label: "Assistant",           value: 5 },
  ];

  const optionsBasedOnCurrentRolePermission = options.filter((option) => {
    const userLevel = ROLE_LEVELS[resolveRoleType(user)] ?? 99;
    if (userLevel === 0) return true;
    return option.value > userLevel;
  });

  const bodyModal = () => {
    const role = dicRole[profile.role]
    return (
      <ReusableCardWithHeaderAndFooter
        title={`Current role in company: ${role}`}
        actions={[
          <BlueButtonComponent
            form="update-role-form"
            key="save"
            buttonType="submit"
            title="Save"
            loadingState={isLoading}
            styles={{ margin: "0 0 0 24px" }}
          />,
        ]}
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
