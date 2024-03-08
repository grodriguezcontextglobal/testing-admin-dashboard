import { Button, FormLabel, Grid, OutlinedInput, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { AutoComplete, notification } from "antd";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { devitrakApi, devitrakApiAdmin } from "../../api/devitrakApi";
import FooterComponent from "../../components/general/FooterComponent";
import { onLogin } from "../../store/slices/adminSlice";
import { AntSelectorStyle } from "../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../styles/global/BlueButton";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import InfrmationCard from "./components/InfrmationCard";

const RegisterCompany = () => {
    const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
    const isMediumDevice = useMediaQuery(
        "only screen and (min-width : 769px) and (max-width : 992px)"
    );
    const { user } = useSelector((state) => state.admin)
    const [phoneNumberCompany, setPhoneNumberCompany] = useState('')
    const [websiteUrl, setWebsiteUrl] = useState('')
    const [industry, setIndustry] = useState('')
    const [loadingStatus, setLoadingStatus] = useState(false)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [api, contextHolder] = notification.useNotification();
    const openNotificationWithIcon = (type, title, msg, time) => {
        api[type]({
            message: title,
            description: msg,
            duration: time,
            key: `${type}`
        });
    };

    const industryListQuery = useQuery({
        queryKey: ['companyInfoList'],
        queryFn: () => devitrakApi.post('/db_company/industry')
    })

    const retrieveIndustryOptions = () => {
        const result = new Set()
        if (industryListQuery.data) {
            const industryData = industryListQuery.data.data.industry
            for (let data of industryData) {
                result.add(data.industry)
            }
        }
        return Array.from(result)
    }
    const onSubmitRegister = async (e) => {
        e.preventDefault()
        openNotificationWithIcon('info', "Processing", "We're processing your request", 0)
        try {
            setLoadingStatus(true)
            const newAdminUserTemplate = {
                name: user.name,
                lastName: user.lastName,
                email: user.email,
                password: user.password,
                company: user.company,
                question: "What's your company name",
                answer: String(user.company).toLowerCase(),
                role: "Administrator"
            };
            const resp = await devitrakApi.post(
                "/admin/new_admin_user",
                newAdminUserTemplate
            );
            if (resp.data) {
                localStorage.setItem("admin-token", resp.data.token);
                const insertingCompanyInfo = await devitrakApi.post('/db_company/new_company', {
                    company_name: user.company,
                    street_address: "unknown",
                    city_address: "unknown",
                    state_address: "unknown",
                    zip_address: "unknown",
                    phone_number: phoneNumberCompany,
                    email_company: websiteUrl,
                    industry: industry
                })
                if (insertingCompanyInfo.data.ok) {
                    const companyInfo = await devitrakApi.post('/db_company/consulting-company', {
                        company_id: insertingCompanyInfo.data.company.insertId
                    })
                    const insertingNewMemberInCompany = await devitrakApi.post('/db_staff/new_member', {
                        first_name: user.name,
                        last_name: user.lasName,
                        email: user.email,
                        phone_number: "000-000-0000",
                    })
                    const onlineStatus = await devitrakApiAdmin.patch(`/profile/${resp.data.uid}`, {
                        online: true
                    })
                    if (insertingNewMemberInCompany.data) {
                        const consultingNewStaffMember = await devitrakApi.post('/db_staff/consulting-member', { staff_id: insertingNewMemberInCompany.data.member.insertId })
                        if (consultingNewStaffMember.data) {
                            dispatch(
                                onLogin({
                                    data: onlineStatus.data.entire,
                                    name: resp.data.name,
                                    lastName: resp.data.lastName,
                                    uid: resp.data.uid,
                                    email: resp.data.email,
                                    role: resp.data.role,
                                    affiliate: resp.data.affiliate,
                                    company: resp.data.company,
                                    sqlInfo: companyInfo.data.result.at(-1),
                                    sqlMemberInfo: consultingNewStaffMember.data.membe.at(-1),
                                })
                            );
                            queryClient.clear()
                            const newCompanyAccountTemplate = {
                                companyName: newAdminUserTemplate.company,
                                ownerFirstName: newAdminUserTemplate.name,
                                ownerLastName: newAdminUserTemplate.lastName,
                                ownerEmail: newAdminUserTemplate.email,
                            };
                            const creatingStripeCustomer = await devitrakApi.post(
                                "/stripe/new-company-account",
                                newCompanyAccountTemplate
                            );
                            if (creatingStripeCustomer.data) {
                                const insertingStripeCompanyInfo = await devitrakApi.post('/db_stripe/new_stripe', {
                                    stripe_id: creatingStripeCustomer.data.companyCustomer.stripeID,
                                    company_id: insertingCompanyInfo.data.company.insertId
                                })
                                dispatch(
                                    onLogin({
                                        ...user,
                                        sqlStripe: insertingStripeCompanyInfo.data.stripe.insertId
                                    })
                                );
                                setLoadingStatus(false)
                                notification.destroy("info")
                                openNotificationWithIcon(
                                    "success",
                                    "Action done",
                                    "You're set up and ready to start using Devitrak!",
                                    2.5
                                );
                                setTimeout(() => {
                                    return navigate('/')
                                }, 5000);
                                return;
                            }
                        }
                    }
                }
            }
        } catch (error) {
            notification.destroy('info')
            openNotificationWithIcon(
                "error",
                "Action failed",
                "Please try again later.", `${error.response.data.msg}`,
                3
            );
            setLoadingStatus(false)
            setTimeout(() => {
                return navigate('/')
            }, 2500);
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
                        overflow={"auto"}
                        paddingBottom={0}
                        style={{
                            overflow: "auto",
                            height: "90dvh",
                        }}
                    >

                        <Grid
                            marginX={0}
                            className="register-container"
                            style={{ padding: `${isSmallDevice ? "1rem" : "2rem"}` }}
                            container
                        > <form
                            className="register-form-container"
                            onSubmit={onSubmitRegister}
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
                                    Register your company
                                </Typography>
                                <Typography
                                    style={{
                                        color: "var(--gray-500, #667085)",
                                        fontSize: "16px",
                                        fontFamily: "Inter",
                                        lineHeight: "24px",
                                    }}
                                >
                                    To set up a new company please complete the steps below.
                                </Typography>
                                <Grid margin={'2rem auto'} item xs={12} sm={12} md={12} lg={12}><InfrmationCard props={user} /></Grid>
                                <Grid
                                    marginY={"20px"}
                                    marginX={0}
                                    textAlign={"left"}
                                    item
                                    xs={12} sm={12} md={12} lg={12}
                                >
                                    <FormLabel style={{ marginBottom: "0.5rem" }}>
                                        Phone number <span style={{ fontWeight: 800 }}>*</span>
                                    </FormLabel>
                                    <OutlinedInput
                                        disabled={loadingStatus}
                                        value={phoneNumberCompany}
                                        onChange={(e) => setPhoneNumberCompany(e.target.value)}
                                        style={OutlinedInputStyle}
                                        placeholder=""
                                        type="text"
                                        fullWidth
                                    />

                                </Grid>
                                <Grid
                                    marginY={"20px"}
                                    marginX={0}
                                    textAlign={"left"}
                                    item
                                    xs={12}
                                >
                                    <FormLabel style={{ marginBottom: "0.5rem" }}>
                                        Website <span style={{ fontWeight: 800 }}>*</span>
                                    </FormLabel>
                                    <OutlinedInput
                                        disabled={loadingStatus}
                                        value={websiteUrl}
                                        onChange={(e) => setWebsiteUrl(e.target.value)}
                                        style={OutlinedInputStyle}
                                        placeholder=""
                                        type="text"
                                        fullWidth
                                    />
                                </Grid>
                                <Grid
                                    marginY={"20px"}
                                    marginX={0}
                                    textAlign={"left"}
                                    item
                                    xs={12}
                                >
                                    <FormLabel style={{ marginBottom: "0.5rem" }}>
                                        Industry <span style={{ fontWeight: 800 }}>*</span>
                                    </FormLabel>
                                    <AutoComplete
                                        disabled={loadingStatus}
                                        variant="outlined"
                                        style={{
                                            ...AntSelectorStyle, border: "solid 0.3 var(--gray600)", fontFamily: 'Inter', fontSize: "14px", width: "100%"
                                        }}
                                        value={industry}
                                        onChange={(value) => setIndustry(value)}
                                        options={retrieveIndustryOptions().map(item => { return ({ value: item }) })}
                                        placeholder="Type your industry area"
                                        filterOption={(inputValue, option) =>
                                            option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                        }
                                    />
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
                                    <Button disabled={loadingStatus} type="submit" style={{ ...BlueButton, width: "100%" }}>
                                        <Typography style={BlueButtonText}>{!loadingStatus ? "Register" : "Loading"}</Typography>
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
                    <div style={{
                        position: 'absolute',
                        bottom: '0px',
                        width: "100%",
                        textAlign: "left"
                    }}>
                        <FooterComponent />
                    </div>
                </Grid>
                <Grid
                    display={(isSmallDevice || isMediumDevice) && "none"}
                    id="section-img-login-component"
                    item
                    xs={6} sm={6}
                ></Grid>
            </Grid>{" "}
        </>
    );
};
export default RegisterCompany