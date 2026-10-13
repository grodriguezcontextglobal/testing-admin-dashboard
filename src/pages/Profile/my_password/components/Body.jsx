import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import { useStatusNotification } from "../../../../components/notification/alerts/useStatusNotification";
import { isAssistant } from "../../../../config/roles";
import useLogout from "../../../../hooks/useLogout";
import {
  buildPasswordUpdatePayload,
  describePasswordUpdateError,
  newPasswordSchema,
} from "../../../authentication/utils/passwordPolicy";
import "./Body.css";
import BodyForm from "./BodyForm";

/**
 * Changing the password of the signed-in account: the new password, which has
 * to meet the shared rule, and then the MFA code, which the server checks.
 *
 * It no longer asks for the current password. That was compared in the
 * browser against the bcrypt hash fetched from `/staff/admin-users`; the code
 * is what proves the request comes from the account holder now.
 */
const Body = () => {
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const logout = useLogout();
  const [step, setStep] = useState("password");
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [mfaError, setMfaError] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(newPasswordSchema),
    defaultValues: { password: "", password2: "" },
  });
  const { notify, contextHolder } = useStatusNotification();

  const triggerRoutes = () => {
    if (isAssistant(user.roleType)) {
      return navigate("/events");
    }
    return navigate("/");
  };

  const goToMfaStep = (data) => {
    setNewPassword(data.password);
    setMfaError("");
    setStep("mfa");
  };

  const updatePassword = async (mfaCode) => {
    setIsSaving(true);
    setMfaError("");
    try {
      await devitrakApi.patch(
        "/admin/update-password",
        buildPasswordUpdatePayload({ email: user.email, password: newPassword, mfaCode }),
      );
      notify("success", "Password updated. Sign in again with your new password.");
      await logout();
      return true;
    } catch (error) {
      setMfaError(describePasswordUpdateError(error));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {contextHolder}
      <BodyForm
        step={step}
        onSubmitPassword={handleSubmit(goToMfaStep)}
        onConfirmCode={updatePassword}
        onBack={() => setStep("password")}
        triggerRoutes={triggerRoutes}
        register={register}
        errors={errors}
        password={watch("password")}
        isSaving={isSaving}
        mfaError={mfaError}
      />
    </>
  );
};

export default Body;
