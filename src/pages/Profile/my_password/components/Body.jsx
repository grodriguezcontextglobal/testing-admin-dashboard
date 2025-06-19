import { useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { compareSync } from "bcryptjs";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import { checkArray } from "../../../../components/utils/checkArray";
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
      reference.current = checkArray(adminUsersStaffQuery.data.data.adminUsers);
      return checkArray(adminUsersStaffQuery.data.data.adminUsers);
    };
    foundAdminInfo();
    const triggerRoutes = () => {
      if (Number(user.role) === Number("4")) {
        return navigate("/events");
      }
      return navigate("/");
    };

    const handleUpdatePersonalInfo = async (data) => {
      try {
        const isValid = compareSync(
          data.current_password,
          foundAdminInfo().password
        );
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
            "Passwords length must be between 6 digits and 1 digits"
          );
        }
        if (data.password1.length > 12 || data.password1.length < 6) {
          return openNotificationWithIcon(
            "error",
            "Passwords length must be between 6 digits and 1 digits"
          );
        }
        const resp = devitrakApi.patch(`/admin/update-password`, {
          email: foundAdminInfo().email,
          password: data.password1,
        });
        if ((await resp).data) {
          openNotificationWithIcon("Success", "Password updated!");
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
};

export default Body;
