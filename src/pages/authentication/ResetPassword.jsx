import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { groupBy } from "lodash";
import { devitrakApi } from "../../api/devitrakApi";
import { AlertCircleIcon } from "../../components/icons/AlertCircleIcon";
import { LeftArrowIcon } from "../../components/icons/LeftArrowIcon";
import { LockUnlock01Icon } from "../../components/icons/LockUnlock01";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../components/UX/buttons/GrayButton";
import Input from "../../components/UX/inputs/Input";
import { FormHelperText, FormLabel } from "@mui/material";

const schema = yup.object().shape({
    password: yup.string().min(6).max(20).required("Password is required"),
    password2: yup.string().oneOf([yup.ref("password"), null], "Passwords must match").required("Please confirm your password"),
});

const FeaturedIcon = ({ children, color = "gray" }) => {
    const colorStyles = {
        gray: { border: "1px solid #e4e7ec", background: "#fff", color: "#344054" },
        warning: { border: "1px solid #fec84b", background: "#fffcf5", color: "#b54708" },
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
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ resolver: yupResolver(schema) });
    const navigate = useNavigate();

    const adminStaffQuery = useQuery({
        queryKey: ["staffMember"],
        queryFn: () => devitrakApi.get("/staff/__staff-search"),
    });

    if (adminStaffQuery.isLoading) {
        return (
            <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
                <p style={{ color: "#667085", fontSize: "16px" }}>Loading...</p>
            </section>
        );
    }

    if (!adminStaffQuery.data) return null;

    const stampTime = new URLSearchParams(window.location.search).get("stamp-time");
    const adminUid = new URLSearchParams(window.location.search).get("uid");
    const groupAdminPerEmail = groupBy(adminStaffQuery.data.data.adminUsers, "id");
    const foundAdminStaffData = groupAdminPerEmail[adminUid];
    const isLinkValid = new Date(stampTime).getTime() - new Date().getTime() > -400000;

    const submitNewPassword = async (data) => {
        setIsLoading(true);
        try {
            await devitrakApi.patch(`/admin/update-password`, {
                email: foundAdminStaffData.at(-1).email,
                password: data.password,
            });
            setSuccessMessage("Password updated. Redirecting to login...");
            setTimeout(() => navigate("/login"), 5000);
        } finally {
            setIsLoading(false);
        }
    };

    const pageStyle = {
        minHeight: "100vh",
        overflow: "hidden",
        background: "#fff",
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
                            <h1 style={{ fontSize: "24px", fontWeight: 600, color: "#101828", lineHeight: "32px", margin: 0 }}>
                                Link expired
                            </h1>
                            <p style={{ fontSize: "16px", color: "#667085", lineHeight: "24px", margin: 0 }}>
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
                        <h1 style={{ fontSize: "24px", fontWeight: 600, color: "#101828", lineHeight: "32px", margin: 0 }}>
                            Set new password
                        </h1>
                        <p style={{ fontSize: "16px", color: "#667085", lineHeight: "24px", margin: 0 }}>
                            Your new password must be at least 6 characters.
                        </p>
                    </div>
                </div>

                {successMessage ? (
                    <p style={{ textAlign: "center", fontSize: "16px", color: "#027a48", position: "relative", zIndex: 10 }}>
                        {successMessage}
                    </p>
                ) : (
                    <form
                        onSubmit={handleSubmit(submitNewPassword)}
                        style={{ display: "flex", flexDirection: "column", gap: "24px", position: "relative", zIndex: 10 }}
                    >
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <FormLabel htmlFor="password" style={{ width: "100%", textAlign: "left" }}>New password
                                <Input
                                    // label="New password"
                                    type="password"
                                    placeholder="••••••••"
                                    {...register("password")}
                                    error={!!errors?.password}
                                    helperText={errors?.password?.message}
                                />
                            </FormLabel>
                            <FormLabel htmlFor="password2" style={{ width: "100%", textAlign: "left" }}>Confirm password
                                <Input
                                    // label="Confirm password"
                                    type="password"
                                    placeholder="••••••••"
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
                            title="Reset password"
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
