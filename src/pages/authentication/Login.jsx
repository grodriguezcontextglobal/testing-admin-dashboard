import {
    FormControlLabel,
    FormLabel,
    Grid,
    OutlinedInput,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Checkbox, Typography, notification } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi, devitrakApiAdmin } from "../../api/devitrakApi";
import FooterComponent from "../../components/general/FooterComponent";
import { clearErrorMessage, onAddErrorMessage, onChecking, onLogin, onLogout } from "../../store/slices/adminSlice";
import CenteringGrid from "../../styles/global/CenteringGrid";
import '../../styles/global/OutlineInput.css';
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../styles/global/Subtitle";
import ForgotPassword from "./ForgotPassword";
import './style/authStyle.css'
import { useMediaQuery } from "@uidotdev/usehooks";
const Login = () => {
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm();
    const [updatePasswordModalState, setUpdatePasswordModalState] =
        useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const queryClient = useQueryClient()
    const [api, contextHolder] = notification.useNotification();
    const openNotificationWithIcon = (type, msg) => {
        api[type]({
            message: msg,
            duration: 0
        });
    };
    const onSubmitLogin = async (data) => {
        dispatch(onChecking());
        try {
            const respo = await devitrakApiAdmin.post("/login", {
                email: data.email,
                password: data.password,
            });
            if (respo.data) {
                localStorage.setItem("admin-token", respo.data.token);
                const updatingOnlineStatusResponse = await devitrakApiAdmin.patch(`/profile/${respo.data.uid}`, {
                    online: true
                });
                const respoFindMemberInfo = await devitrakApi.post("/db_staff/consulting-member", {
                    email: data.email,
                })
                const companyInfoTable = await devitrakApi.post("/db_company/consulting-company", {
                    company_name: respo?.data?.company
                })
                const stripeSQL = await devitrakApi.post('/db_stripe/consulting-stripe', {
                    company_id: companyInfoTable.data.company.at(-1).company_id
                })
                    dispatch(
                        onLogin({
                            data: { ...respo.data.entire, online: updatingOnlineStatusResponse.data.entire.online, },
                            name: respo.data.name,
                            lastName: respo.data.lastName,
                            uid: respo.data.uid,
                            email: respo.data.email,
                            role: respo.data.role,
                            phone: respo.data.phone,
                            company: respo.data.company,
                            token: respo.data.token,
                            online: updatingOnlineStatusResponse.data.entire.online,
                            sqlMemberInfo: respoFindMemberInfo.data.member.at(-1),
                            sqlInfo: { ...companyInfoTable.data.company.at(-1), stripeID: stripeSQL.data.stripe.at(-1) },
                        })
                    );

                dispatch(clearErrorMessage())
                queryClient.clear()
                openNotificationWithIcon('success', 'User logged in.')
                navigate('/')
            }

        } catch (error) {
            alert(`${error?.response?.data?.msg}`)
            dispatch(onLogout("Incorrect credentials"));
            dispatch(onAddErrorMessage(error?.response?.data?.msg));
        }
        setValue("email", "");
        setValue("password", "");
        return dispatch(clearErrorMessage());
    }
    const isSmallDevice = useMediaQuery('only screen abd (max-width: 768px)');
    const isMediumDevice = useMediaQuery('only screen and (min-width: 769px) and (max-width:992px)')
    return (
        <>
            {contextHolder}
            <Grid
                container
                // display={"flex"}
                // justifyContent={"space-between"}
                // alignItems={"center"}
                // margin={0}
                // padding={0}
                style={{ backgroundColor: "var(--whitebase)", height: "100dvh" }}
            >

                <Grid
                    display={"flex"}
                    flexDirection={'column'}
                    justifyContent={"flex-start"}
                    alignItems={"center"}
                    margin={'auto'}
                    // padding={'0 5rem 0 0'}
                    style={{
                        // background: 'transparent',
                        display: 'flex',
                        alignItems: "center",
                        justifyContent: "center",
                        alignSelf: 'stretch',
                    }}
                    item
                    xs={12} sm={12} md={6} lg={6}>
                    <Grid display={'flex'} flexDirection={'column'} justifyContent={'center'} alignSelf={'center'} margin={'auto'} item xs={12} sm={12} md={12} lg={12}>
                        <Typography style={{ width: "100%" }}>Welcome</Typography>
                        <Typography style={{ width: "100%" }}>Please enter your email</Typography>
                        <form onSubmit={handleSubmit(onSubmitLogin)} style={{ width: "100%" }}>
                            <Grid
                                marginY={"20px"}
                                marginX={0}
                                textAlign={"left"}
                                item
                                xs={12} sm={12} md={12} lg={12}
                            >
                                <FormLabel style={{ marginBottom: "0.5rem" }}>
                                    Email
                                </FormLabel>
                                <OutlinedInput
                                    {...register("email", { required: true, minLength: 10 })}
                                    aria-invalid={errors.email}
                                    type="email"
                                    style={{ ...OutlinedInputStyle, border: `${errors.email && "solid 0.5px #eb0000"}`, }}
                                    placeholder="Enter your email"
                                    fullWidth
                                />
                                {errors?.email && (
                                    <Typography>This field is required</Typography>
                                )}
                            </Grid>
                            <Grid
                                marginY={"20px"}
                                marginX={0}
                                textAlign={"left"}
                                item
                                xs={12}
                            >
                                <FormLabel style={{ marginBottom: "0.5rem" }}>
                                    Password
                                </FormLabel>
                                <OutlinedInput
                                    {...register("password", { required: true, minLength: 6 })}
                                    style={{ ...OutlinedInputStyle, border: `${errors.password && 'solid 0.5px #eb0000'}` }}
                                    placeholder="**********"
                                    type="password"
                                    fullWidth
                                />
                                {errors?.password && (
                                    <Typography>This field is required</Typography>
                                )}
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
                            >
                                <Grid
                                    item
                                    xs={6}
                                    display={"flex"}
                                    justifyContent={"flex-start"}
                                    alignItems={"center"}
                                    style={{ padding: "0rem 0rem 0rem 0.6rem" }}
                                >
                                    {" "}
                                    <FormControlLabel
                                        style={{
                                            color: "#var(--gray-700, #344054)",
                                            fontSize: "14px",
                                            fontFamily: "Inter",
                                            fontWeight: "500",
                                            lineHeight: "20px",
                                        }}
                                        labelPlacement="end"
                                        control={<Checkbox style={{ paddingRight: "0.5rem" }} />}
                                        label={`${" "}Remember for 30 days`}
                                    />
                                </Grid>

                                <Grid
                                    item
                                    xs={6}
                                    display={"flex"}
                                    justifyContent={"flex-end"}
                                    alignItems={"center"}
                                >
                                    <Typography
                                        style={{
                                            color: "#004EEB",
                                            fontSize: "14px",
                                            fontFamily: "Inter",
                                            fontWeight: "600",
                                            lineHeight: "20px",
                                            cursor: "pointer",
                                        }}
                                        onClick={() => setUpdatePasswordModalState(true)}
                                    >
                                        Forgot password?
                                    </Typography>
                                </Grid>
                            </Grid>
                            <OutlinedInput
                                style={{
                                    color: "#fff",
                                    width: "100%",
                                    border: "1px solid var(--blue-dark-600, #155EEF)",
                                    background: " var(--blue-dark-600, #155EEF)",
                                    borderRadius: "8px",
                                    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                                }}
                                type="submit"
                                value="Sign in"
                            />
                        </form>
                        <div style={{ ...CenteringGrid, margin: ".8rem auto" }}>
                            <Typography
                                style={Subtitle}
                                onClick={() => navigate('/register')}
                            >
                                Don&apos;t have an account? <span style={{ cursor: "pointer", color: "#155eef", fontWeight: 700 }}>Sign up</span>
                            </Typography>
                        </div>
                    </Grid>
                    <div style={{ position: "absolute", left: "50px", bottom: "25px", width: "100%" }}>
                        <FooterComponent />
                    </div>
                </Grid>
                <Grid
                    display={(isSmallDevice || isMediumDevice) && "none"}
                    id="section-img-login-component"
                    item
                    md={6} lg={6}
                ></Grid>
            </Grid>
            {updatePasswordModalState && <ForgotPassword
                open={updatePasswordModalState}
                close={setUpdatePasswordModalState}
            />}
        </>
    );
};

export default Login