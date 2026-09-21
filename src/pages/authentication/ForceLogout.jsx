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
 *
 * ## The passwordless path
 *
 * With MFA mandatory, a visitor who reaches the "a session is already open"
 * message has already proved their password *and* their authenticator code —
 * `loginUser` runs the MFA check before it raises the session conflict. Asking
 * for the password again here proves nothing new, which is what Fredrik argued
 * at part 1 `5:15`.
 *
 * What it does still stand in for is *possession of the link*. Today the link
 * is `/force-logout?email=<address>&timestamp=<ms>` and carries no secret, so
 * anyone able to type an email address could reach this page; the password is
 * the only thing between that URL and ending someone's session. Dropping it
 * without replacing it would turn the flow into "type an address, kick that
 * person out".
 *
 * So the page reads a `token` from the link. When one is there it asks for
 * nothing and posts the token; when it is not, it falls back to the password,
 * which is what every link in an inbox today needs. The token is stripped from
 * the URL the moment it is read, for the same reason `cred` is.
 * See FRONTEND_force_logout_token_2026-09-21.md.
 */
const ForceLogout = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [email, setEmail] = useState(null);
    /* Held in state rather than read from the URL at submit time: it is removed
       from the URL as soon as it arrives. */
    const [revokeToken, setRevokeToken] = useState("");
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

        const token = searchParams.get("x_token") || searchParams.get("token");
        if (token) setRevokeToken(token);

        if (legacyPassword || token) {
            if (legacyPassword) setValue("password", legacyPassword);
            // Replace, not push: a URL carrying a secret — the old password or
            // the single-use token — should not be something the back button
            // can return to, or a Referer can carry onward.
            const scrubbed = new URLSearchParams(searchParams);
            scrubbed.delete("cred");
            scrubbed.delete("x_cred");
            scrubbed.delete("token");
            scrubbed.delete("x_token");
            setSearchParams(scrubbed, { replace: true });
        }
    }, [searchParams, setSearchParams, navigate, setValue, openNotificationWithIcon]);

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            /* With a token there is nothing to type: the link is the proof.
               Without one the password is, which is every link already sent. */
            await devitrakApi.post(
                "/staff/force-logout",
                revokeToken ? { email, token: revokeToken } : data,
            );
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
                    {revokeToken ? (
                        <>
                            End the other active session for <strong>{email}</strong> and
                            sign in on this device.
                        </>
                    ) : (
                        <>
                            Confirm your password to end your other active session for{" "}
                            <strong>{email}</strong>.
                        </>
                    )}
                </Typography>
                <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3, width: '100%' }}>
                    <input type="hidden" {...register("email")} />
                    {!revokeToken && (
                      <>
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
                      </>
                    )}
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
