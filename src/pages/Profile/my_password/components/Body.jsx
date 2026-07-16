import { useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { compareSync } from "bcryptjs";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import { checkArray } from "../../../../components/utils/checkArray";
import { isAssistant } from "../../../../config/roles";
import { onLogout } from "../../../../store/slices/adminSlice";
import "./Body.css";
import BodyForm from "./BodyForm";
const Body = () => {
  const { user } = useSelector((state) => state.admin);
  const reference = useRef("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { register, handleSubmit } = useForm();
  const adminUsersStaffQuery = useQuery({
    queryKey: ["adminUser"],
    queryFn: () =>
      devitrakApi.post("/staff/admin-users", { email: user.email }),
  });
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, msg) => {
    api.open({
      message: msg,
    });
  };
  if (adminUsersStaffQuery.data) {
    const foundAdminInfo = () => {
      reference.current = checkArray(
        adminUsersStaffQuery?.data?.data?.adminUsers ?? []
      );
      return reference.current;
    };
    foundAdminInfo();
    const triggerRoutes = () => {
      if (isAssistant(user.roleType)) {
        return navigate("/events");
      }
      return navigate("/");
    };

    const handleUpdatePersonalInfo = async (data) => {
      try {
        const adminInfo = foundAdminInfo();
        if (!adminInfo?.password) {
          return openNotificationWithIcon(
            "error",
            "We could not verify your account. Please try again later."
          );
        }
        const isValid = compareSync(data.current_password, adminInfo.password);
        if (!isValid) {
          return openNotificationWithIcon(
            "error",
            "Information does not match in our records."
          );
        }
        if (data.password1 !== data.password2) {
          return openNotificationWithIcon("error", "Passwords must match!");
        }
        if (data.password2.length > 12 || data.password2.length < 6) {
          return openNotificationWithIcon(
            "error",
            "Password length must be between 6 and 12 characters."
          );
        }
        if (data.password1.length > 12 || data.password1.length < 6) {
          return openNotificationWithIcon(
            "error",
            "Password length must be between 6 and 12 characters."
          );
        }
        const resp = await devitrakApi.patch(`/admin/update-password`, {
          email: adminInfo.email,
          password: data.password1,
        });
        if (resp.data) {
          openNotificationWithIcon("success", "Password updated!");
          dispatch(onLogout());
          return window.location.reload(true);
        }
      } catch (error) {
        openNotificationWithIcon("error", error.message);
        return triggerRoutes();
      }
    };
    return (
      <>
        {contextHolder}
        <BodyForm
          handleUpdatePersonalInfo={handleUpdatePersonalInfo}
          handleSubmit={handleSubmit}
          triggerRoutes={triggerRoutes}
          register={register}
        />
      </>
    );
  }
  return null;
};

export default Body;
