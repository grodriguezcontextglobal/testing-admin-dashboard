import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import { useStatusNotification } from "../../../../components/notification/alerts/useStatusNotification";
import { isAssistant } from "../../../../config/roles";
import useLogout from "../../../../hooks/useLogout";
import MfaEnrollmentModal from "../../../authentication/mfa/MfaEnrollmentModal";
import {
  buildPasswordUpdatePayload,
  newPasswordSchema,
  readPasswordMfaOutcome,
} from "../../../authentication/utils/passwordPolicy";

const DEFAULT_CODE_HINT = "Enter the 6-digit code from your authenticator app to confirm the change.";
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
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(false);
  const [codeHint, setCodeHint] = useState(DEFAULT_CODE_HINT);
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
    setCodeHint(DEFAULT_CODE_HINT);
    setStep("mfa");
  };

  /* Signed in, the setup runs on the open session, so an account without MFA
     can always turn it on here before the change is sent. */
  const handleRefusal = (error) => {
    const outcome = readPasswordMfaOutcome(error, { hasSession: true });
    if (outcome.action === "enroll") {
      setMfaError("");
      setIsEnrolling(true);
    } else if (outcome.action === "enterCode") {
      setMfaError("");
      setCodeHint("Your account already has two-step verification. Enter the code your app shows now.");
    } else {
      setMfaError(outcome.message);
    }
  };

  const passwordPayload = (mfaCode) =>
    buildPasswordUpdatePayload({ email: user.email, password: newPassword, mfaCode });

  const finishPasswordChange = async () => {
    notify("success", "Password updated. Sign in again with your new password.");
    await logout();
  };

  /* Asks the server, without a code, whether the account has MFA. */
  const startMfaSetup = async () => {
    setIsCheckingSetup(true);
    setMfaError("");
    try {
      await devitrakApi.patch("/admin/update-password", passwordPayload());
      await finishPasswordChange();
    } catch (error) {
      handleRefusal(error);
    } finally {
      setIsCheckingSetup(false);
    }
  };

  const finishMfaSetup = () => {
    setIsEnrolling(false);
    setMfaError("");
    setCodeHint("Two-step verification is on. Enter the code your app shows now to change your password.");
  };

  const updatePassword = async (mfaCode) => {
    setIsSaving(true);
    setMfaError("");
    try {
      await devitrakApi.patch("/admin/update-password", passwordPayload(mfaCode));
      await finishPasswordChange();
      return true;
    } catch (error) {
      handleRefusal(error);
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
        codeHint={codeHint}
        setupPrompt={{ onClick: startMfaSetup, isLoading: isCheckingSetup }}
      />
      <MfaEnrollmentModal
        open={isEnrolling}
        email={user.email}
        onEnrolled={finishMfaSetup}
        onDismiss={() => setIsEnrolling(false)}
        dismissLabel="Cancel"
        dismissHint="Your password can't be changed until two-step verification is set up."
      />
    </>
  );
};

export default Body;
