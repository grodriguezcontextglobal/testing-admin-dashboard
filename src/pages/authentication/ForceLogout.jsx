import { Box, FormLabel, Grid, Paper, Typography } from "@mui/material";
import DevitrakLoading from "../../components/animation/DevitrakLoading";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import HidenIcon from "../../components/icons/HidenIcon";
import VisibleIcon from "../../components/icons/VisibleIcon";
import Input from "../../components/UX/inputs/Input";
import { useStatusNotification } from "../../components/notification/alerts/useStatusNotification";

/**
 * "You're already signed in somewhere else" — the page that ends the other session.
 *
 * The password is typed here and posted to /staff/force-logout. It used to
 * arrive in the query string instead, because the notification email carried a
 * `<form method="GET">` with a password field inside the email body: the
 * plaintext password ended up in the URL, and therefore in browser history,
 * server access logs and any Referer header the page emitted.
 *
 * The email now links here with the account email only. `cred` is still read,
 * because links sent before that change are sitting in inboxes and should keep
 * working — but it is stripped out of the URL the moment it is read, so it does
 * not survive in history or leak onward from this page.
 */
const ForceLogout = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [email, setEmail] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { notify, contextHolder } = useStatusNotification();
    const openNotificationWithIcon = useCallback(
        (type, msg) => {
            notify(type, msg);
        },
        [notify],
    );
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm();
    useEffect(() => {
        const userEmail = searchParams.get("x_email") || searchParams.get("email");
        const legacyPassword = searchParams.get("x_cred") || searchParams.get("cred");
        // const timestamp = searchParams.get("x_timestamp") || searchParams.get("timestamp");
        // const linkTime = parseInt(timestamp, 10);
        // const currentTime = new Date().getTime();
        // const minutesDifference = (currentTime - linkTime) / (1000 * 60);
        // if (isNaN(linkTime) || minutesDifference > 5) {
        //     openNotificationWithIcon("Error", "This link has expired. Please try logging in again to generate a new one.");
        //     return navigate("/login");
        // }

        if (!userEmail) {
            openNotificationWithIcon("error", "Invalid link. Please click the link from your email again.");
            return navigate("/login");
        }

        setEmail(userEmail);
        setValue("email", userEmail);

        if (legacyPassword) {
            setValue("password", legacyPassword);
            // Replace, not push: the URL carrying the password should not be
            // something the back button can return to.
            const scrubbed = new URLSearchParams(searchParams);
            scrubbed.delete("cred");
            scrubbed.delete("x_cred");
            setSearchParams(scrubbed, { replace: true });
        }
    }, [searchParams, setSearchParams, navigate, setValue, openNotificationWithIcon]);

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            await devitrakApi.post("/staff/force-logout", data);
            openNotificationWithIcon(
                "success",
                "Your previous session has been revoked. You can now log in."
            );
            navigate("/login");
        } catch (error) {
            const message =
                error.response?.data?.msg || "Failed to revoke session. Please try again.";
            openNotificationWithIcon("error", message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!email) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                {contextHolder}
                <DevitrakLoading />
            </Box>
        );
    }

    return (
        <Grid container component="main" sx={{ height: '100vh', backgroundColor: '#f0f2f5' }}>
            {contextHolder}
            <Grid
                item
                xs={11}
                sm={8}
                md={5}
                lg={4}
                component={Paper}
                elevation={3}
                sx={{
                    margin: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: { xs: 2, sm: 4 },
                    borderRadius: '12px'
                }}
            >
                <Typography component="h1" variant="h5">
                    Revoke Active Session
                </Typography>
                <Typography align="center" sx={{ mt: 2 }}>
                    Confirm your password to end your other active session for <strong>{email}</strong>.
                </Typography>
                <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3, width: '100%' }}>
                    <input type="hidden" {...register("email")} />
                    <FormLabel htmlFor="force-logout-password" style={{ marginBottom: "0.9rem" }}>
                        Password
                    </FormLabel>
                    <Input
                        id="force-logout-password"
                        required
                        autoFocus
                        {...register("password", { required: true })}
                        type={showPassword ? "text" : "password"}
                        placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;"
                        error={Boolean(errors.password)}
                        helperText={errors.password ? "Enter your password to continue." : undefined}
                        style={{ marginTop: "6px", marginBottom: "16px" }}
                        endAdornment={
                            <button
                                type="button"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                style={{
                                    padding: 0,
                                    backgroundColor: "transparent",
                                    outline: "none",
                                    margin: 0,
                                    width: "fit-content",
                                    aspectRatio: "1",
                                    borderRadius: "50%",
                                }}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <VisibleIcon fill={"var(--blue-dark-600)"} />
                                ) : (
                                    <HidenIcon stroke={"var(--blue-dark-600)"} />
                                )}
                            </button>
                        }
                        fullWidth
                    />
                    <BlueButtonComponent
                        loadingState={isLoading}
                        buttonType="submit"
                        title="Revoke and Continue to Login"
                        styles={{
                            width: '100%',
                        }}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};

export default ForceLogout;
