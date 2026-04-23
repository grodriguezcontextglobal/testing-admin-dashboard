import { Box, Grid, Paper, Typography } from "@mui/material";
import { notification, Spin } from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";

const ForceLogout = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [email, setEmail] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const {
        register,
        handleSubmit,
        setValue,
    } = useForm();
    useEffect(() => {
        const userEmail = searchParams.get("x_email") || searchParams.get("email");
        const password = searchParams.get("x_cred") || searchParams.get("cred");
        // const timestamp = searchParams.get("x_timestamp") || searchParams.get("timestamp");
        // const linkTime = parseInt(timestamp, 10);
        // const currentTime = new Date().getTime();
        // const minutesDifference = (currentTime - linkTime) / (1000 * 60);
        // if (isNaN(linkTime) || minutesDifference > 5) {
        //     openNotificationWithIcon("Error", "This link has expired. Please try logging in again to generate a new one.");
        //     return navigate("/login");
        // }

        if (userEmail && password) {
            setEmail(userEmail);
            setValue("email", userEmail);
            setValue("password", password);
        } else {
            openNotificationWithIcon("Error", "Invalid link. Please click the link from your email again.");
            return navigate("/login");
        }
    }, [searchParams, navigate, setValue]);

    const openNotificationWithIcon = (message, description) => {
        notification.open({
            message: message,
            description: description,
        });
    };

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            await devitrakApi.post("/staff/force-logout", data);
            openNotificationWithIcon(
                "Success",
                "Your previous session has been revoked. You can now log in."
            );
            navigate("/login");
        } catch (error) {
            const message =
                error.response?.data?.msg || "Failed to revoke session. Please try again.";
            openNotificationWithIcon("Error", message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!email) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <Spin size="large" />
            </Box>
        );
    }

    return (
        <Grid container component="main" sx={{ height: '100vh', backgroundColor: '#f0f2f5' }}>
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
                    Click the button below to confirm and end your other active session for <strong>{email}</strong>.
                </Typography>
                <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3, width: '100%' }}>
                    <input type="hidden" {...register("email")} />
                    <input type="hidden" {...register("password")} />
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
