import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import { AlertCircleIcon } from "../../components/icons/AlertCircleIcon";
import { LeftArrowIcon } from "../../components/icons/LeftArrowIcon";
import { LockUnlock01Icon } from "../../components/icons/LockUnlock01";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../components/UX/buttons/GrayButton";
import Input from "../../components/UX/inputs/Input";
import PasswordRequirements from "../../components/UX/password/PasswordRequirements";
import PasswordVisibilityToggle from "../../components/UX/password/PasswordVisibilityToggle";
import { FormHelperText, FormLabel } from "@mui/material";
import MfaEnrollmentModal from "./mfa/MfaEnrollmentModal";
import PasswordMfaStep from "./password/PasswordMfaStep";
import {
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    buildPasswordUpdatePayload,
    newPasswordSchema,
    readPasswordMfaOutcome,
} from "./utils/passwordPolicy";

const DEFAULT_CODE_HINT = "Enter the 6-digit code from your authenticator app to confirm the change.";

const FeaturedIcon = ({ children, color = "gray" }) => {
    const colorStyles = {
        gray: { border: "1px solid #e4e7ec", background: "var(--base-white, #fff)", color: "var(--gray-700, #344054)" },
        warning: { border: "1px solid #fec84b", background: "#fffcf5", color: "var(--warning-700, #b54708)" },
    };
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "56px",
                height: "56px",
                borderRadius: "12px",
                boxShadow: "0px 1px 2px rgba(16,24,40,0.06), 0px 1px 3px rgba(16,24,40,0.1)",
                position: "relative",
                zIndex: 10,
                ...colorStyles[color],
            }}
        >
            {children}
        </div>
    );
};

const BackgroundPattern = () => (
    <svg
        style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none", userSelect: "none", zIndex: 0 }}
        width="400"
        height="400"
        viewBox="0 0 400 400"
        fill="none"
        aria-hidden="true"
    >
        {Array.from({ length: 9 }).map((_, i) => (
            <circle key={i} cx="200" cy="200" r={28 + i * 32} stroke="#f2f4f7" strokeWidth="1" />
        ))}
    </svg>
);

const ResetPassword = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [step, setStep] = useState("password");
    const [newPassword, setNewPassword] = useState("");
    const [mfaError, setMfaError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    /* `{ setupToken }` while the MFA setup is open, for an account without MFA. */
    const [enrollment, setEnrollment] = useState(null);
    const [codeHint, setCodeHint] = useState(DEFAULT_CODE_HINT);
    const [formError, setFormError] = useState("");
    const [linkRejected, setLinkRejected] = useState(false);
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({ resolver: yupResolver(newPasswordSchema), defaultValues: { password: "", password2: "" } });
    const navigate = useNavigate();

    /* The server writes and signs the link (FRONTEND_password_reset_sin_mfa_
       2026-10-13.md): its `token` names the account and proves the mailbox,
       lasts an hour and is used once. The server checks all of that, so a
       signed link is not timed here.
       Links sent before that carry only `uid`, `email` and `stamp-time`; for
       those `stamp-time` is still the courtesy notice it always was — it can
       be edited in the URL, so it protects nothing; the MFA code does. */
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get("token");
    const stampTime = params.get("stamp-time");
    const adminUid = params.get("uid");
    /* Read from the link and sent back in the PATCH, never shown on the page. */
    const adminEmail = params.get("email");
    const isLinkValid = resetToken
        ? true
        : Boolean(adminEmail || adminUid) && new Date(stampTime).getTime() - new Date().getTime() > -400000;

    const passwordPayload = (password, mfaCode) =>
        buildPasswordUpdatePayload({ resetToken, uid: adminUid, email: adminEmail, password, mfaCode });

    const finishReset = () => {
        setSuccessMessage("Password updated. Redirecting to login...");
        setTimeout(() => navigate("/login"), 5000);
    };

    /* Every refusal, from either step, ends up here. An account without MFA is
       never asked for a code it cannot have: it sets MFA up first, with the
       `mfaSetupToken` the server hands to a signed link, and comes back to the
       code step afterwards. */
    const handleRefusal = (error, showError) => {
        const outcome = readPasswordMfaOutcome(error);
        if (outcome.action === "enroll") {
            setEnrollment({ setupToken: outcome.setupToken });
        } else if (outcome.action === "enterCode") {
            setStep("mfa");
        } else if (outcome.action === "linkInvalid") {
            setLinkRejected(true);
        } else if (outcome.action === "setupUnavailable") {
            showError(
                "Your account needs two-step verification before its password can be reset. Request a new reset email and open the link in it."
            );
        } else {
            showError(outcome.message);
        }
    };

    /* First send, without a code: nothing is saved, and the server says what
       the account still needs — the code (`mfaRequired`) or the MFA setup
       (`mfaSetupRequired`). */
    const submitPassword = async (data) => {
        setNewPassword(data.password);
        setFormError("");
        setMfaError("");
        setCodeHint(DEFAULT_CODE_HINT);
        setIsLoading(true);
        try {
            await devitrakApi.patch(`/admin/update-password`, passwordPayload(data.password));
            finishReset();
        } catch (error) {
            handleRefusal(error, setFormError);
        } finally {
            setIsLoading(false);
        }
    };

    /* Not a session: the setup only turned MFA on, and the password has not
       changed yet. So no trip to /login (`reloginRequired` does not apply
       here) — the code step sends the change. */
    const finishMfaSetup = () => {
        setEnrollment(null);
        setMfaError("");
        setCodeHint("Two-step verification is on. Enter the code your app shows now to reset your password.");
        setStep("mfa");
    };

    /* The server checks the code before it saves anything, so a reset link on
       its own is no longer enough to change somebody's password. */
    const submitNewPassword = async (mfaCode) => {
        setIsLoading(true);
        setMfaError("");
        try {
            await devitrakApi.patch(`/admin/update-password`, passwordPayload(newPassword, mfaCode));
            finishReset();
            return true;
        } catch (error) {
            handleRefusal(error, setMfaError);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const pageStyle = {
        minHeight: "100vh",
        overflow: "hidden",
        background: "var(--base-white, #fff)",
        padding: "48px 16px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
    };

    const containerStyle = {
        display: "flex",
        flexDirection: "column",
        gap: "32px",
        width: "100%",
        maxWidth: "360px",
    };

    const headerStyle = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
        textAlign: "center",
    };

    if (!isLinkValid || linkRejected) {
        return (
            <section style={pageStyle}>
                <div style={containerStyle}>
                    <div style={headerStyle}>
                        <div style={{ position: "relative" }}>
                            <FeaturedIcon color="warning">
                                <AlertCircleIcon />
                            </FeaturedIcon>
                            <BackgroundPattern />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", position: "relative", zIndex: 10 }}>
                            <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--gray-900, #101828)", lineHeight: "32px", margin: 0 }}>
                                Link expired
                            </h1>
                            <p style={{ fontSize: "16px", color: "var(--gray-500, #667085)", lineHeight: "24px", margin: 0 }}>
                                This password reset link has expired or was already used. Please request a new one.
                            </p>
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", position: "relative", zIndex: 10 }}>
                        <GrayButtonComponent href="/login" title="Back to log in" iconLeading={<LeftArrowIcon />} />
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section style={pageStyle}>
            <div style={containerStyle}>
                <div style={headerStyle}>
                    <div style={{ position: "relative" }}>
                        <FeaturedIcon color="gray">
                            <LockUnlock01Icon />
                        </FeaturedIcon>
                        <BackgroundPattern />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", position: "relative", zIndex: 10 }}>
                        <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--gray-900, #101828)", lineHeight: "32px", margin: 0 }}>
                            Set new password
                        </h1>
                        <p style={{ fontSize: "16px", color: "var(--gray-500, #667085)", lineHeight: "24px", margin: 0 }}>
                            {step === "mfa"
                                ? "Enter the code from your authenticator app to confirm the change."
                                : `Use ${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters. A few words in a row make a strong one.`}
                        </p>
                    </div>
                </div>

                {successMessage ? (
                    <p style={{ textAlign: "center", fontSize: "16px", color: "var(--success-700, #027a48)", position: "relative", zIndex: 10 }}>
                        {successMessage}
                    </p>
                ) : step === "mfa" ? (
                    <div style={{ position: "relative", zIndex: 10 }}>
                        <PasswordMfaStep
                            onConfirm={submitNewPassword}
                            onBack={() => setStep("password")}
                            isLoading={isLoading}
                            error={mfaError}
                            confirmLabel="Reset password"
                            hint={codeHint}
                        />
                    </div>
                ) : (
                    <form
                        onSubmit={handleSubmit(submitPassword)}
                        style={{ display: "flex", flexDirection: "column", gap: "24px", position: "relative", zIndex: 10 }}
                    >
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <FormLabel htmlFor="password" style={{ width: "100%", textAlign: "left" }}>New password
                                <Input
                                    // label="New password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    endAdornment={
                                        <PasswordVisibilityToggle
                                            visible={showPassword}
                                            onToggle={() => setShowPassword((shown) => !shown)}
                                            controls="password"
                                        />
                                    }
                                    {...register("password")}
                                    error={!!errors?.password}
                                    helperText={errors?.password?.message}
                                />
                            </FormLabel>
                            <PasswordRequirements password={watch("password")} id="reset-password-requirements" />
                            <FormLabel htmlFor="password2" style={{ width: "100%", textAlign: "left" }}>Confirm password
                                <Input
                                    // label="Confirm password"
                                    type={showConfirmation ? "text" : "password"}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    endAdornment={
                                        <PasswordVisibilityToggle
                                            visible={showConfirmation}
                                            onToggle={() => setShowConfirmation((shown) => !shown)}
                                            controls="password2"
                                        />
                                    }
                                    {...register("password2")}
                                    error={!!errors?.password2}
                                />
                            </FormLabel>
                            <FormHelperText>{errors?.password2?.message}</FormHelperText>
                        </div>
                        {formError ? (
                            <FormHelperText error role="alert" style={{ margin: 0 }}>
                                {formError}
                            </FormHelperText>
                        ) : null}
                        <BlueButtonComponent
                            buttonType="submit"
                            size="lg"
                            isLoading={isLoading}
                            title="Continue"
                            styles={{ width: "100%" }}
                        />
                    </form>
                )}

                <div style={{ display: "flex", justifyContent: "center", position: "relative", zIndex: 10 }}>
                    <GrayButtonComponent href="/login" title="Back to log in" iconLeading={<LeftArrowIcon />} />
                </div>
            </div>
            {/* No `email`: the address in the link is never shown on this page. */}
            <MfaEnrollmentModal
                open={Boolean(enrollment)}
                setupToken={enrollment?.setupToken}
                onEnrolled={finishMfaSetup}
                onDismiss={() => setEnrollment(null)}
                dismissLabel="Cancel"
                dismissHint="Your password can't be reset until two-step verification is set up."
            />
        </section>
    );
};

export default ResetPassword;
