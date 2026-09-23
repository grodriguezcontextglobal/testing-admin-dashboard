import { Box, Grid, Paper, Typography } from "@mui/material";
import DevitrakLoading from "../../components/animation/DevitrakLoading";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import TextLink from "../../components/UX/buttons/TextLink";
import { useStatusNotification } from "../../components/notification/alerts/useStatusNotification";

/**
 * "You're already signed in somewhere else" — the page that ends the other session.
 *
 * It asks for nothing. The link carries the account email; when the address is
 * a valid one the revoke is sent as soon as the page opens, and the person is
 * returned to the login they were trying to reach.
 *
 * ## No password, because MFA is mandatory
 *
 * Fredrik's call, beta testing 2026-09-18 part 1 `5:15`. Whoever reaches "an
 * active session already exists" has already passed both factors — `loginUser`
 * runs the MFA check *before* it raises the session conflict — so a password
 * prompt here re-asks for something the sign-in just verified. With MFA
 * compulsory there is no account that can reach this page on a password alone,
 * which is what made the prompt redundant rather than merely annoying.
 *
 * The password used to arrive in the query string, because the email carried a
 * `<form method="GET">` with a password field in its body: the plaintext
 * password ended up in the URL, and therefore in browser history, server access
 * logs and any Referer this page emitted. Links from that era are still in
 * inboxes, so `cred` is still *read* — only to be stripped out of the URL. It is
 * never sent.
 *
 * ## The token
 *
 * The link is `/force-logout?email=<address>&timestamp=<ms>`. A single-use
 * `token` in it — asked for in FRONTEND_force_logout_token_2026-09-21.md — ties
 * the revoke to the inbox that received the mail rather than to the address
 * anyone can type. This page already reads one and posts it when it is there,
 * so the day the backend starts minting them nothing changes here. Ending a
 * session is the whole blast radius: it signs someone out elsewhere, it never
 * signs anyone in.
 *
 * A token that arrives is stripped from the URL the moment it is read, for the
 * same reason `cred` is.
 */

/* Deliberately loose: the server is the one that decides whether the address
   belongs to anybody. All this rules out is sending a request for a string
   that cannot be an email at all, so a mangled link says so instead of
   bouncing off the API. */
const LOOKS_LIKE_AN_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SECRETS_IN_THE_URL = ["cred", "x_cred", "token", "x_token"];

const ForceLogout = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [email, setEmail] = useState(null);
    const [failure, setFailure] = useState(null);
    const { notify, contextHolder } = useStatusNotification();
    const openNotificationWithIcon = useCallback(
        (type, msg) => {
            notify(type, msg);
        },
        [notify],
    );
    /* The link is read, and acted on, exactly once. Scrubbing the URL feeds a
       new `searchParams` back into this effect, and React 18 runs effects twice
       in development — neither should end a second session. */
    const linkHandled = useRef(false);
    /* Held from the first read rather than from the URL: by the time a retry is
       clicked the token is no longer in the address bar. */
    const revokeToken = useRef("");

    const revoke = useCallback(
        async (address, token) => {
            setFailure(null);
            try {
                await devitrakApi.post(
                    "/staff/force-logout",
                    token ? { email: address, token } : { email: address },
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
                setFailure(message);
            }
        },
        [navigate, openNotificationWithIcon],
    );

    useEffect(() => {
        if (linkHandled.current) return;
        const userEmail = searchParams.get("x_email") || searchParams.get("email");

        if (!userEmail || !LOOKS_LIKE_AN_EMAIL.test(userEmail)) {
            linkHandled.current = true;
            openNotificationWithIcon("error", "Invalid link. Please click the link from your email again.");
            return navigate("/login");
        }

        linkHandled.current = true;
        const token = searchParams.get("x_token") || searchParams.get("token");
        revokeToken.current = token || "";
        setEmail(userEmail);

        // Replace, not push: a URL carrying a secret — the old password or the
        // single-use token — should not be something the back button can return
        // to, or a Referer can carry onward.
        if (SECRETS_IN_THE_URL.some((key) => searchParams.has(key))) {
            const scrubbed = new URLSearchParams(searchParams);
            SECRETS_IN_THE_URL.forEach((key) => scrubbed.delete(key));
            setSearchParams(scrubbed, { replace: true });
        }

        revoke(userEmail, token);
    }, [searchParams, setSearchParams, navigate, openNotificationWithIcon, revoke]);

    if (!email || !failure) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                gap="1rem"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
            >
                {contextHolder}
                <DevitrakLoading />
                {email && (
                    <Typography align="center">
                        Ending your other active session for <strong>{email}</strong>…
                    </Typography>
                )}
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
                    We could not end the other active session for{" "}
                    <strong>{email}</strong>.
                </Typography>
                <Typography align="center" sx={{ mt: 1 }}>
                    {failure}
                </Typography>
                <Box sx={{ mt: 3, width: '100%' }}>
                    <BlueButtonComponent
                        buttonType="button"
                        title="Try again"
                        func={() => revoke(email, revokeToken.current)}
                        styles={{
                            width: '100%',
                        }}
                    />
                </Box>
                <TextLink
                    color="gray"
                    onClick={() => navigate("/login")}
                    style={{ marginTop: "12px" }}
                >
                    Back to login
                </TextLink>
            </Grid>
        </Grid>
    );
};

export default ForceLogout;
