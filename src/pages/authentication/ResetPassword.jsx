import { FormLabel, Grid, OutlinedInput, Typography } from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Space, notification } from "antd";
import { useNavigate } from "react-router-dom";
import { Footer } from "antd/es/layout/layout";
import _ from 'lodash'
import { devitrakApi } from "../../api/devitrakApi";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import './style/authStyle.css'
const schema = yup.object().shape({
    password: yup.string().min(6).max(20).required("Password is required"),
    password2: yup.string().oneOf([yup.ref("password"), null]),
});

const STATUS = {
    idle: false,
    loading: true,
    success: false,
    error: true,
};
const ResetPassword = () => {
    const [loadingStatus, setLoadingStatus] = useState(STATUS.idle);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
    });
    const navigate = useNavigate();
    const [api, contextHolder] = notification.useNotification();
    const openNotificationWithIcon = (type, message, description) => {
        api.open({
            message: message,
            description: description,
        });
    };
    const adminStaffQuery = useQuery({
        queryKey: ["staffMember"],
        queryFn: () => devitrakApi.get("/staff/admin-users"),
    });

    if (adminStaffQuery.isLoading) return <Typography>Loading...</Typography>;
    if (adminStaffQuery.data) {
        const stampTime = new URLSearchParams(window.location.search).get(
            "stamp-time"
        );
        const timeRef = new Date();
        const groupAdminPerEmail = _.groupBy(
            adminStaffQuery.data.data.adminUsers,
            "id"
        );
        const adminUid = new URLSearchParams(window.location.search).get("uid");
        const foundAdminStaffData = groupAdminPerEmail[adminUid];
        const submitNewPassword = async (data) => {
            setLoadingStatus(STATUS.loading);
            const resp = await devitrakApi.patch(`/admin/update-password`, {
                email: foundAdminStaffData.at(-1).email,
                password: data.password,
            });
            if (resp) {
                setLoadingStatus(STATUS.success);
                openNotificationWithIcon(
                    "success",
                    "Password updated.",
                    "Please log in with your new password. You will be redirected to login page in a moment."
                );
                setTimeout(() => {
                    navigate("/login");
                }, 5000);
            }
        };
        return (
            <>
                {contextHolder}
                <Grid
                    style={{ backgroundColor: "var(--basewhite)", height: "100dvh" }}
                    container
                >
                    <Grid item xs={12} sm={12} md={6} lg={6}>
                        <Grid
                            container
                            display={"flex"}
                            flexDirection={"column"}
                            justifyContent={"space-around"}
                            alignItems={"center"}
                        >
                            <Grid marginX={0} className="register-container" container>
                                <Grid
                                    item
                                    xs={12}
                                    display={"flex"}
                                    flexDirection={"column"}
                                    justifyContent={"space-around"}
                                    alignItems={"center"}
                                >
                                    <Typography
                                        style={{
                                            color: "var(--gray900, #101828)",
                                            fontSize: "30px",
                                            fontFamily: "Inter",
                                            fontWeight: "600",
                                            lineHeight: "38px",
                                            marginBottom: "1rem",
                                        }}
                                        variant="h1"
                                    >
                                        Welcome to devitrak App
                                    </Typography>
                                    <Typography
                                        style={{
                                            color: "var(--gray-500, #667085)",
                                            fontSize: "16px",
                                            fontFamily: "Inter",
                                            lineHeight: "24px",
                                        }}
                                        variant="subtitle1"
                                    >
                                        Please enter your info
                                    </Typography>
                                </Grid>
                                {new Date(
                                    stampTime
                                ).getTime() -
                                    timeRef.getTime() >
                                    -400000 ? (
                                    <form
                                        className="register-form-container"
                                        onSubmit={handleSubmit(submitNewPassword)}
                                    >
                                        <Grid
                                            marginY={"20px"}
                                            marginX={0}
                                            textAlign={"left"}
                                            item
                                            xs={12} sm={12} md
                                        >
                                            <FormLabel style={{ marginBottom: "0.5rem" }}>
                                                Password
                                            </FormLabel>
                                            <OutlinedInput
                                                {...register("password", {
                                                    required: true,
                                                    minLength: 6,
                                                })}
                                                style={OutlinedInputStyle}
                                                placeholder="******"
                                                type="password"
                                                fullWidth
                                            />
                                            {errors?.password?.message}
                                        </Grid>
                                        <Grid
                                            marginY={"20px"}
                                            marginX={0}
                                            textAlign={"left"}
                                            item
                                            xs={12}
                                        >
                                            <FormLabel style={{ marginBottom: "0.5rem" }}>
                                                Repeat password
                                            </FormLabel>
                                            <OutlinedInput
                                                {...register("password2")}
                                                style={OutlinedInputStyle}
                                                placeholder="******"
                                                type="password"
                                                fullWidth
                                            />
                                            {errors?.password2 && <p>Password must match</p>}
                                        </Grid>

                                        <Grid
                                            marginY={"20px"}
                                            marginX={0}
                                            textAlign={"left"}
                                            display={"flex"}
                                            justifyContent={"space-between"}
                                            alignItems={"center"}
                                            item
                                            xs={12}
                                            style={{
                                                position: "sticky",
                                                bottom: "0px",
                                                opacity: "1",
                                            }}
                                        >
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                loading={loadingStatus}
                                            >
                                                Submit
                                            </Button>
                                        </Grid>
                                    </form>
                                ) : (
                                    <Grid
                                        display={"flex"}
                                        alignItems={"center"}
                                        justifyContent={"center"}
                                        margin={"40% auto"}
                                        container
                                    >
                                        <Grid
                                            display={"flex"}
                                            alignItems={"center"}
                                            justifyContent={"center"}
                                            item
                                            xs={12}
                                        >
                                            <Space
                                                direction="vertical"
                                                style={{
                                                    width: "100%",
                                                }}
                                            >
                                                <Alert
                                                    banner
                                                    message="Link is expired."
                                                    type="warning"
                                                    showIcon
                                                />
                                            </Space>
                                        </Grid>
                                    </Grid>
                                )}
                            </Grid>
                        </Grid>
                        <Footer
                            style={{
                                height: "5dvh",
                                padding: "2rem",
                                backgroundColor: "var(--basewhite)",
                            }}
                        >
                            <Grid
                                item
                                xs={2}
                                display={"flex"}
                                justifyContent={"flex-start"}
                                alignItems={"center"}
                            >
                                <Typography
                                    style={{
                                        fontSize: "14px",
                                        fontFamily: "Inter",
                                        lineHeight: "20px",
                                    }}
                                >
                                    @ devitrak 2023
                                </Typography>
                            </Grid>
                        </Footer>
                    </Grid>
                    <Grid id="section-img-login-component" item md={6} lg={6}></Grid>
                </Grid>
            </>
        );
    }
};

export default ResetPassword;