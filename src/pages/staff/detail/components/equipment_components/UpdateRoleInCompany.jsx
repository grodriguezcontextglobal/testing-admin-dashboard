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
import { onAddStaffProfile } from "../../../../../store/slices/staffDetailSlide";
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
    mutationFn: (data) =>
      devitrakApi.patch(`/company/update-company/${data.id}`, data),
    onSuccess: (result) => {
      dispatch(
        onAddStaffProfile({
          ...profile,
          role: newRole,
          companyData: result.data.company,
        }),
      );
      if (user.email === profile.user) {
        dispatch(
          onLogin({
            ...user,
            role: newRole,
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
    const foundStaffToUpdate = profile.companyData.employees.findIndex(
      (element) => element.user === profile.user,
    );

    if (foundStaffToUpdate > -1) {
      const updatedEmployees = profile.companyData.employees.toSpliced(
        foundStaffToUpdate,
        1,
        { ...profile.companyData.employees[foundStaffToUpdate], role: newRole },
      );

      updateRole({
        id: profile.companyData.id,
        employees: updatedEmployees,
      });
    }
  };

  const options = [
    { label: "Root administrator", value: 0 },
    { label: "Administrator", value: 1 },
    { label: "Manager", value: 2 },
    { label: "Support", value: 3 },
    { label: "Staff event assistant", value: 4 },
  ];

  const optionsBasedOnCurrentRolePermission = options.filter((option) => {
    const currentUserRole = Number(user.role);
    const optionRoleValue = Number(option.value);
    if (currentUserRole === 0) return true; // Root admin can assign all roles
    if (currentUserRole === 1) return optionRoleValue >= 2; // Admin can assign roles 2 and up
    return false; // Other roles cannot assign
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
        {Number(user.role) < 2 ? (
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
