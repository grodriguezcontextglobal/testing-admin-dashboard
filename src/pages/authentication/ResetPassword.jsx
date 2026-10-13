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
import PasswordMfaStep from "./password/PasswordMfaStep";
import {
    buildPasswordUpdatePayload,
    describePasswordUpdateError,
    newPasswordSchema,
} from "./utils/passwordPolicy";

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
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({ resolver: yupResolver(newPasswordSchema), defaultValues: { password: "", password2: "" } });
    const navigate = useNavigate();

    /* The link carries the account's email (and its `uid`, for links sent
       before the email was added): the page no longer downloads the staff list
       to look the email up. `stamp-time` is
       only a courtesy notice that the link is old — it can be edited in the
       URL, so it protects nothing; the MFA code does. */
    const stampTime = new URLSearchParams(window.location.search).get("stamp-time");
    const adminUid = new URLSearchParams(window.location.search).get("uid");
    /* Read from the link and sent back in the PATCH, never shown on the page. */
    const adminEmail = new URLSearchParams(window.location.search).get("email");
    const isLinkValid = Boolean(adminEmail || adminUid) && new Date(stampTime).getTime() - new Date().getTime() > -400000;

    const goToMfaStep = (data) => {
        setNewPassword(data.password);
        setMfaError("");
        setStep("mfa");
    };

    /* The server checks the code before it saves anything, so a reset link on
       its own is no longer enough to change somebody's password. */
    const submitNewPassword = async (mfaCode) => {
        setIsLoading(true);
        setMfaError("");
        try {
            await devitrakApi.patch(
                `/admin/update-password`,
                buildPasswordUpdatePayload({
                    uid: adminUid,
                    email: adminEmail,
                    password: newPassword,
                    mfaCode,
                })
            );
            setSuccessMessage("Password updated. Redirecting to login...");
            setTimeout(() => navigate("/login"), 5000);
            return true;
        } catch (error) {
            setMfaError(describePasswordUpdateError(error));
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

    if (!isLinkValid) {
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
                                This password reset link has expired. Please request a new one.
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
                                : "Use at least 8 characters, with an uppercase and a lowercase letter, a number and a symbol."}
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
                        />
                    </div>
                ) : (
                    <form
                        onSubmit={handleSubmit(goToMfaStep)}
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
        </section>
    );
};

export default ResetPassword;
