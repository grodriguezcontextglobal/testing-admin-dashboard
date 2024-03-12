import {
    Button,
    FormLabel,
    Grid,
    OutlinedInput,
    Typography
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { AutoComplete, notification } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { devitrakApi, devitrakApiAdmin } from "../../api/devitrakApi";
import FooterComponent from "../../components/general/FooterComponent";
import { onLogin } from "../../store/slices/adminSlice";
import { AntSelectorStyle } from "../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../styles/global/BlueButton";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../styles/global/Subtitle";
import './style/authStyle.css';
const Registration = () => {
    const [listCompany, setListCompany] = useState([]);
    const [companyValue, setCompanyValue] = useState("")
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [password2, setPassword2] = useState('')
    const dispatch = useDispatch();
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const callAPiUserCompany = useCallback(async () => {
        const resp = await devitrakApi.post("/event/event-list");
        if (resp) {
            return setListCompany(resp.data.list);
        }
    }, []);

    const [api, contextHolder] = notification.useNotification();
    const openNotificationWithIcon = (type, title, msg) => {
        api[type]({
            message: title,
            description: msg,
        });
    };
    useEffect(() => {
        const controller = new AbortController();
        callAPiUserCompany();
        return () => {
            controller.abort();
        };
    }, [listCompany.length, callAPiUserCompany]);

    const companies = useCallback(() => {
        let result = new Set();

        for (let data of listCompany) {
            result.add(data.company);
        }
        return Array.from(result);
    }, [listCompany]);

    companies();

    const matchCompany = useCallback(() => {
        const foundCompany = companies()?.find(
            (company) =>
                String(company).toLowerCase() === String(companyValue).toLowerCase()
        );
        if (foundCompany) return false;
        return true;
    }, [companyValue]);

    const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
    const isMediumDevice = useMediaQuery(
        "only screen and (min-width : 769px) and (max-width : 992px)"
    );

    const onSubmitRegister = async () => {
        try {
            const newAdminUserTemplate = {
                name: firstName,
                lastName: lastName,
                email: email,
                password: password,
                company: companyValue,
                role: `${matchCompany() ? "Administrator" : "Editor"}`,
            };
            if (matchCompany()) {
                dispatch(
                    onLogin(newAdminUserTemplate)
                );
                navigate('/register/company-setup')
            } else {
                const resp = await devitrakApi.post(
                    "/admin/new_admin_user",
                    newAdminUserTemplate
                );
                if (resp.data) {
                    localStorage.setItem("admin-token", resp.data.token);
                    const companyInfo = await devitrakApi.post('/db_company/consulting-company', {
                        company_name: companyValue
                    })
                    const insertingNewMemberInCompany = await devitrakApi.post('/db_staff/new_member', {
                        first_name: firstName,
                        last_name: lastName,
                        email: email,
                        phone_number: "000-000-0000",
                    })


                    if (companyInfo.data && insertingNewMemberInCompany.data) {
                        await devitrakApiAdmin.patch(`/profile/${resp.data.uid}`, {
                            online: true
                        })
                        dispatch(
                            onLogin({
                                data: resp.data.entire,
                                name: resp.data.name,
                                lastName: resp.data.lastName,
                                uid: resp.data.uid,
                                email: resp.data.email,
                                role: resp.data.role,
                                affiliate: resp.data.affiliate,
                                company: resp.data.company,
                                sqlInfo: companyInfo.data.result
                            })
                        );
                        queryClient.clear()
                    }
                }
            }

        } catch (error) {
            openNotificationWithIcon(
                "error",
                "Action was not accepted. Please try again later.", `${error.response.data.msg}`
            );
        }
    };

    return (
        <>
            {contextHolder}
            <Grid
                style={{ backgroundColor: "var(--basewhite)", height: "100dvh" }}
                container
            >
                <Grid
                    display={"flex"}
                    flexDirection={"column"}
                    item xs={12} sm={12} md={6} lg={6}>
                    <Grid
                        container
                        display={"flex"}
                        flexDirection={"column"}
                        justifyContent={"space-around"}
                        alignItems={"center"}
                        overflow={"auto"}
                        paddingBottom={0}
                        style={{
                            overflow: "auto",
                            height: "90dvh",
                        }}
                    >
                        <Grid
                            className="register-container"
                            display={"flex"}
                            flexDirection={"column"}
                            style={{ padding: `${isSmallDevice ? "1rem" : "2rem"}` }}
                            container
                        >


                            <form
                                className="register-form-container"
                                onSubmit={onSubmitRegister}
                            >
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
                                    >
                                        Please enter your information
                                    </Typography>
                                </Grid>
                                <Grid
                                    marginY={"20px"}
                                    marginX={0}
                                    textAlign={"left"}
                                    item
                                    xs={12}
                                >
                                    <FormLabel style={{ marginBottom: "0.5rem" }}>
                                        Email <span style={{ fontWeight: 800 }}>*</span>
                                    </FormLabel>
                                    <OutlinedInput
                                        // {...register("email", { required: true, minLength: 6 })}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={OutlinedInputStyle}
                                        placeholder="Enter your email"
                                        type="email"
                                        fullWidth
                                    />
                                    {/* {errors?.email?.message} */}
                                    <FormLabel style={{ marginBottom: "0.5rem" }}>
                                        <Typography style={Subtitle}> You need to enter a company email if you are creating a new company.</Typography>
                                    </FormLabel>
                                </Grid>
                                <Grid
                                    marginY={"20px"}
                                    marginX={0}
                                    textAlign={"left"}
                                    item
                                    xs={12}
                                >
                                    <FormLabel style={{ marginBottom: "0.5rem" }}>
                                        Password <span style={{ fontWeight: 800 }}>*</span>
                                    </FormLabel>
                                    <OutlinedInput
                                        // {...register("password", { required: true, minLength: 6 })}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={OutlinedInputStyle}
                                        placeholder="******"
                                        type="password"
                                        fullWidth
                                    />
                                    {/* {errors?.password?.message} */}
                                </Grid>
                                <Grid
                                    marginY={"20px"}
                                    marginX={0}
                                    textAlign={"left"}
                                    item
                                    xs={12}
                                >
                                    <FormLabel style={{ marginBottom: "0.5rem" }}>
                                        Repeat password <span style={{ fontWeight: 800 }}>*</span>
                                    </FormLabel>
                                    <OutlinedInput
                                        // {...register("password2")}
                                        value={password2}
                                        onChange={(e) => setPassword2(e.target.value)}
                                        style={OutlinedInputStyle}
                                        placeholder="******"
                                        type="password"
                                        fullWidth
                                    />
                                    {/* {errors?.password2 && <p>Password must match</p>} */}
                                </Grid>
                                <Grid
                                    marginY={"20px"}
                                    marginX={0}
                                    textAlign={"left"}
                                    item
                                    xs={12}
                                >
                                    <FormLabel style={{ marginBottom: "0.5rem" }}>Name <span style={{ fontWeight: 800 }}>*</span></FormLabel>
                                    <OutlinedInput
                                        type="text"
                                        // {...register("name")}
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        // aria-invalid={errors.name}
                                        style={{
                                            ...OutlinedInputStyle,
                                            // border: `${errors.name && "solid 1px #004EEB"}` 
                                        }}
                                        placeholder="Enter your name"
                                        fullWidth
                                    />
                                    {/* {errors?.name?.message} */}
                                </Grid>
                                <Grid
                                    marginY={"20px"}
                                    marginX={0}
                                    textAlign={"left"}
                                    item
                                    xs={12}
                                >
                                    <FormLabel style={{ marginBottom: "0.5rem" }}>
                                        Last name <span style={{ fontWeight: 800 }}>*</span>
                                    </FormLabel>
                                    <OutlinedInput
                                        type="text"
                                        // {...register("lastName")}
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        // aria-invalid={errors.lastName}
                                        style={{
                                            ...OutlinedInputStyle,
                                            // border: `${errors.lastName && "solid 1px #004EEB"}`,
                                        }}
                                        placeholder="Enter your last name"
                                        fullWidth
                                    />
                                    {/* {errors?.lastName?.message} */}
                                </Grid>

                                <Grid
                                    marginY={"20px"}
                                    marginX={0}
                                    textAlign={"left"}
                                    item
                                    xs={12}
                                >
                                    <FormLabel style={{ marginBottom: "0.5rem" }}>
                                        Type to select your company <span style={{ fontWeight: 800 }}>*</span>
                                    </FormLabel>
                                    <Grid
                                        item
                                        xs={12}
                                        display={"flex"}
                                        alignItems={"center"}
                                        justifyContent={"space-between"}
                                    >
                                        <AutoComplete
                                            variant="outlined"
                                            style={{
                                                ...AntSelectorStyle, border: "solid 0.3 var(--gray600)", fontFamily: 'Inter', fontSize: "14px", width: "100%"
                                            }}
                                            value={companyValue}
                                            onChange={(value) => setCompanyValue(value)}
                                            options={companies().map(item => { return ({ value: item }) })}
                                            placeholder="Type your company name"
                                            filterOption={(inputValue, option) =>
                                                option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                            }
                                        />
                                    </Grid>
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
                                    <Button type="submit" style={{ ...BlueButton, width: "100%" }}>
                                        <Typography style={BlueButtonText}>{matchCompany() ? 'Set up new company' : 'Register'}</Typography>
                                    </Button>
                                </Grid>
                                <Grid
                                    item
                                    xs={12}
                                    justifyContent={"center"}
                                    alignItems={"center"}
                                >
                                    <Typography
                                        style={{
                                            color: "var(--gray-600, #475467)",
                                            fontSize: "14px",
                                            fontFamily: "Inter",
                                            lineHeight: "20px",
                                        }}
                                    >
                                        Do you have an account already?{" "}
                                        <Link to="/login">
                                            <span
                                                style={{
                                                    color: "#004EEB",
                                                    fontSize: "14px",
                                                    fontFamily: "Inter",
                                                    fontWeight: "600",
                                                    lineHeight: "20px",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                Sign in
                                            </span>
                                        </Link>
                                    </Typography>
                                </Grid>
                            </form>
                        </Grid>
                    </Grid>
                    <div style={{position:"absolute", left:"50px", bottom:"25px", width:"100%"}}>
                        <FooterComponent />
                    </div>
                </Grid>
                <Grid
                    display={(isSmallDevice || isMediumDevice) && "none"}
                    id="section-img-login-component"
                    item
                    md={6} lg={6}
                ></Grid>
            </Grid>{" "}
        </>
    );
};


export default Registration