import { Button, Chip, FormLabel, Grid, OutlinedInput, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { AutoComplete, Space, Tooltip, notification } from "antd";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { devitrakApi, devitrakApiAdmin } from "../../api/devitrakApi";
import FooterComponent from "../../components/general/FooterComponent";
import { onAddErrorMessage, onLogin } from "../../store/slices/adminSlice";
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
    const [websiteUrl, setWebsiteUrl] = useState('')
    const [industry, setIndustry] = useState('')
    const [loadingStatus, setLoadingStatus] = useState(false)
    const [locationList, setLocationList] = useState([])
    const [newlocation, setNewlocation] = useState('')
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { register, handleSubmit } = useForm()
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
        queryFn: () => devitrakApi.post('/db_company/industry'),
        enabled: false,
        refetchOnMount: false
    })

    useEffect(() => {
        const controller = new AbortController()
        industryListQuery.refetch()
        return () => {
            controller.abort()
        }
    }, [])


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
    const handleAddLocation = async () => {
        let result = [...locationList, newlocation]
        await setLocationList(result)
        await setNewlocation('')
        return
    }
    const handleDeleteLocation = (location) => {
        const result = locationList.filter(element => element !== location)
        return setLocationList(result)
    }
    const ref = useRef({})
    const userRegistrationProcess = async () => {
        try {
            const newAdminUserTemplate = {
                name: user.name,
                lastName: user.lastName,
                email: user.email,
                password: user.password,
                company: user.company,
                question: "What's your company name",
                answer: String(user.company).toLowerCase(),
                role: "Administrator",
                super_user: true,
                online: true
            };
            const resp = await devitrakApi.post(
                "/admin/new_admin_user",
                newAdminUserTemplate
            );

            localStorage.setItem("admin-token", resp.data.token);
            dispatch(
                onLogin({
                    data: resp.data.entire,
                    uid: resp.data.uid,
                    name: resp.data.name,
                    lastName: resp.data.lastName,
                    email: resp.data.email,
                    phone: resp.data.phone,
                    role: resp.data.role,
                    company: user.company,
                    token: resp.data.token
                })
            )
            ref.current = {
                ...ref.current,
                userRegistration: {
                    data: resp.data.entire,
                    uid: resp.data.uid,
                    name: resp.data.name,
                    lastName: resp.data.lastName,
                    email: resp.data.email,
                    phone: resp.data.phone,
                    role: resp.data.role,
                    company: user.company,
                    token: resp.data.token
                }
            }
            return resp.data
        } catch (error) {
            return error
        }

    }

    const createStripeAccount = async () => {
        const newCompanyAccountTemplate = {
            companyName: user.company,
            ownerFirstName: user.name,
            ownerLastName: user.lastName,
            ownerEmail: user.email,
        };
        const creatingStripeCustomer = await devitrakApi.post(
            "/stripe/new-company-account",
            newCompanyAccountTemplate
        );
        if (creatingStripeCustomer.data) {
            ref.current = {
                ...ref.current,
                stripeAccount: creatingStripeCustomer.data.companyCustomer.stripeID
            }
            return creatingStripeCustomer.data
        }

    }

    const createCompany = async (props) => {
        const companyTemplate = {
            company_name: user.company,
            address: {
                street: props.street,
                city: props.city,
                state: props.state,
                postal_code: props.postal_code
            },
            location: locationList,
            phone: {
                main: props.main_phone,
                alternative: props.alternative_phone,
            },
            owner: {
                first_name: user.name,
                last_name: user.lastName,
                email: user.email
            },
            website: websiteUrl,
            main_email: props.main_email,
            industry: industry,
            stripe_customer_id: ref.current.stripeAccount,
            employees: [{
                user: user.email,
                super_user: true,
                role: "Administrator"
            }]
        };
        const resp = await devitrakApi.post("/company/new", companyTemplate);
        if (resp.data) {
            ref.current = {
                ...ref.current,
                companyRegistration: resp.data.company
            }
            dispatch(
                onLogin({
                    companyInfo: resp.data.company
                })
            );
            return resp.data
        }
    }

    const insertingUserMemberInSqlDb = async (props) => {
        const insertingNewMemberInCompany = await devitrakApi.post('/db_staff/new_member', {
            first_name: user.name,
            last_name: user.lasName,
            email: user.email,
            phone_number: props.main_phone,
        })
        if (insertingNewMemberInCompany.data) {
            ref.current = {
                ...ref.current,
                userSQL: insertingNewMemberInCompany.data
            }
            console.log(ref.current)
            return insertingNewMemberInCompany.data
        }
    }

    const insertingNewCompanyInSqlDb = async (props) => {
        const insertingCompanyInfo = await devitrakApi.post('/db_company/new_company', {
            company_name: user.company,
            street_address: props.street,
            city_address: props.city,
            state_address: props.state,
            zip_address: props.postal_code,
            phone_number: props.main_phone,
            email_company: websiteUrl,
            industry: industry
        })
        if (insertingCompanyInfo.data) {
            ref.current = {
                ...ref.current,
                companySQL: insertingCompanyInfo.data
            }
            return insertingCompanyInfo.data
        }
    }
    const insertingStripeAccountInSqlDb = async () => {
        const insertingStripeCompanyInfo = await devitrakApi.post('/db_stripe/new_stripe', {
            stripe_id: ref.current.stripeAccount,
            company_id: ref.current.companySQL.company.insertId
        })
        if (insertingStripeCompanyInfo.data) {
            ref.current = {
                ...ref.current,
                stripeSQL: insertingStripeCompanyInfo.data
            }
            return insertingStripeCompanyInfo.data
        }
    }

    const updatingOnlineStatusUser = async () => {
        const onlineStatus = await devitrakApiAdmin.patch(`/profile/${ref.current.userRegistration.uid}`, { online: true })
        if (onlineStatus.data) {
            dispatch(
                onLogin({
                    data: onlineStatus.data.entire,
                    name: onlineStatus.data.name,
                    lastName: onlineStatus.data.lastName,
                    uid: onlineStatus.data.uid,
                    email: onlineStatus.data.email,
                    role: onlineStatus.data.role,
                    phone: onlineStatus.data.phone,
                    company: onlineStatus.data.company,
                    token: onlineStatus.data.token,
                    online: onlineStatus.data.entire.online,
                })
            );
            ref.current = {
                ...ref.current,
                userRegistration: {
                    data: onlineStatus.data.entire,
                    name: onlineStatus.data.name,
                    lastName: onlineStatus.data.lastName,
                    uid: onlineStatus.data.uid,
                    email: onlineStatus.data.email,
                    role: onlineStatus.data.role,
                    phone: onlineStatus.data.phone,
                    company: onlineStatus.data.company,
                    token: onlineStatus.data.token,
                    online: onlineStatus.data.entire.online,
                }
            }
            return onlineStatus
        }
    }

    const consultingUserMemberInSqlDb = async () => {
        const consultingNewStaffMember = await devitrakApi.post('/db_staff/consulting-member', { staff_id: ref.current.userSQL.member.insertId })
        if (consultingNewStaffMember.data) {
            dispatch(
                onLogin({
                    ...ref.current.userRegistration,
                    sqlMemberInfo: consultingNewStaffMember.data.member.at(-1),
                })
            );
            return ref.current = {
                ...ref.current,
                sqlMemberInfo: consultingNewStaffMember.data.member.at(-1) ?? undefined,
            }
        }
    }

    const consultingCompanyInSqlDb = async () => {
        const companyInfo = await devitrakApi.post('/db_company/consulting-company', {
            company_id: ref.current.companySQL.company.insertId
        })
        if (companyInfo.data) {
            const stripe_db = await devitrakApi.post('/db_stripe/consulting-stripe', {
                company_id: companyInfo.data.company.at(-1).company_id
            })
            dispatch(
                onLogin({
                    ...ref.current.userRegistration,
                    sqlMemberInfo: { ...ref.current.sqlMemberInfo },
                    sqlInfo: companyInfo.data.company.at(-1) ?? undefined,
                })
            );
            return ref.current = {
                ...ref.current,
                sqlMemberInfo: { ...ref.current.sqlMemberInfo },
                sqlInfo: {...companyInfo.data.result?.at(-1), stripeID: stripe_db.data.stripe.at(-1)},
            }
        }
    }


    const onSubmitRegister = async (data) => {
        if (locationList.length < 1) { return alert("Please provide at least one location. Go to locations field, type a location where your inventory will be located and then click button Add, then you can proceed to complete the registration process.") }
        else {
            try {
                setLoadingStatus(true)
                openNotificationWithIcon('info', "Processing", "We're processing your request", 0)
                await createStripeAccount()
                await createCompany({ ...data })
                await userRegistrationProcess()
                await insertingUserMemberInSqlDb(data.main_phone)
                await insertingNewCompanyInSqlDb(data)
                await insertingStripeAccountInSqlDb()
                await updatingOnlineStatusUser()
                await consultingUserMemberInSqlDb()
                await consultingCompanyInSqlDb()
                queryClient.clear()
                setLoadingStatus(false)
                return setTimeout(() => {
                    if (loadingStatus === false) return window.location.replace('/')
                }, 5000);
            } catch (error) {
                notification.destroy('info')
                openNotificationWithIcon(
                    "error",
                    "Action failed",
                    "Please try again later.", `${error.response}`,
                    3
                );
                dispatch(onAddErrorMessage(error))
                setLoadingStatus(false)
                setTimeout(() => {
                    return navigate('/login')
                }, 2500);
            }
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
                            onSubmit={handleSubmit(onSubmitRegister)}
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
                                <Grid margin={'2rem auto'} item xs={12} sm={12} md={12} lg={12}>
                                    <InfrmationCard props={user} />
                                </Grid>
                                <Grid
                                    marginY={"20px"}
                                    marginX={0}
                                    textAlign={"left"}
                                    item
                                    xs={12} sm={12} md={12} lg={12}
                                >
                                    <FormLabel style={{ marginBottom: "0.5rem" }}>
                                        Main phone number <span style={{ fontWeight: 800 }}>*</span>
                                        <OutlinedInput
                                            disabled={loadingStatus}
                                            {...register('main_phone', { required: true })}
                                            // value={phoneNumberCompany}
                                            // onChange={(e) => setPhoneNumberCompany(e.target.value)}
                                            style={OutlinedInputStyle}
                                            placeholder=""
                                            type="text"
                                            fullWidth
                                        /></FormLabel>

                                </Grid>
                                <Grid
                                    marginY={"20px"}
                                    marginX={0}
                                    textAlign={"left"}
                                    item
                                    xs={12} sm={12} md={12} lg={12}
                                >
                                    <FormLabel style={{ marginBottom: "0.5rem" }}>
                                        Alternative phone number <span style={{ fontWeight: 800 }}></span>
                                    </FormLabel>
                                    <OutlinedInput
                                        disabled={loadingStatus}
                                        {...register('alternative_phone', { required: true })}
                                        // value={phoneNumberCompany}
                                        // onChange={(e) => setPhoneNumberCompany(e.target.value)}
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
                                    display={'flex'}
                                    flexDirection={'column'}
                                    item
                                    xs={12} sm={12} md={12} lg={12}
                                >
                                    <FormLabel style={{ marginBottom: "0.5rem", width: "100%" }}>
                                        Street <span style={{ fontWeight: 800 }}>*</span>

                                        <OutlinedInput
                                            disabled={loadingStatus}
                                            {...register('street', { required: true })} style={OutlinedInputStyle}
                                            placeholder=""
                                            type="text"
                                            fullWidth
                                        />
                                    </FormLabel>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", gap: "5px" }}>
                                        <FormLabel style={{ marginBottom: "0.5rem", width: "50%" }}>
                                            City <span style={{ fontWeight: 800 }}>*</span>
                                            <OutlinedInput
                                                disabled={loadingStatus}
                                                {...register('city', { required: true })} style={OutlinedInputStyle}
                                                placeholder=""
                                                type="text"
                                                fullWidth
                                            />
                                        </FormLabel>

                                        <FormLabel style={{ marginBottom: "0.5rem", width: "50%" }}>
                                            State <span style={{ fontWeight: 800 }}>*</span>
                                            <OutlinedInput
                                                disabled={loadingStatus}
                                                {...register('state', { required: true })} style={OutlinedInputStyle}
                                                placeholder=""
                                                type="text"
                                                fullWidth
                                            />
                                        </FormLabel>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: "5px" }}>
                                        <FormLabel style={{ marginBottom: "0.5rem", width: "50%" }}>
                                            Zip code <span style={{ fontWeight: 800 }}>*</span>
                                            <OutlinedInput
                                                disabled={loadingStatus}
                                                {...register('postal_code', { required: true })} style={OutlinedInputStyle}
                                                placeholder=""
                                                type="text"
                                                fullWidth
                                            />
                                        </FormLabel>
                                        <FormLabel style={{ marginBottom: "0.5rem", borderRadius: "8px", width: "100%" }}>
                                            Industry <span style={{ fontWeight: 800 }}>*</span>
                                            <AutoComplete
                                                className="custom-autocomplete" // Add a custom className here
                                                disabled={loadingStatus}
                                                variant="outlined"
                                                style={{
                                                    ...AntSelectorStyle,
                                                    border: "solid 0.3 var(--gray600)",
                                                    fontFamily: 'Inter',
                                                    fontSize: "14px",
                                                    width: "100%"
                                                }}
                                                value={industry}
                                                onChange={(value) => setIndustry(value)}
                                                options={retrieveIndustryOptions().map(item => { return ({ value: item }) })}
                                                placeholder="Type your industry area"
                                                filterOption={(inputValue, option) =>
                                                    option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                                }
                                            />
                                        </FormLabel>
                                    </div>
                                </Grid>
                                <Grid marginY={'20px'} marginX={0} textAlign={'left'} item xs={12}>
                                    <FormLabel style={{ marginBotton: "0.5rem" }}>
                                        Locations
                                    </FormLabel>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap:"5px" }}>
                                        <Tooltip style={{ width: "95%" }} title="Please click button Add to add your location, otherwise, it will not be added.">
                                            <OutlinedInput name="newLocation" value={newlocation} onChange={(e) => setNewlocation(e.target.value)} style={{ ...OutlinedInputStyle }} fullWidth/>
                                        </Tooltip>
                                        <Button onClick={() => handleAddLocation()} style={BlueButton}><Typography style={BlueButtonText}>Add</Typography></Button>
                                    </div>
                                </Grid>
                                <Grid display={'flex'} justifyContent={'flex-start'} alignItems={'center'} item xs>
                                    <Space size={[8, 16]} wrap>
                                        {
                                            locationList.map(location => {
                                                return (
                                                    <Chip key={location} label={`${location}`} onDelete={() => handleDeleteLocation(location)} />
                                                )
                                            })
                                        }
                                    </Space>

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
                                        Email for information <span style={{ fontWeight: 800 }}>*</span>
                                    </FormLabel>
                                    <OutlinedInput
                                        disabled={loadingStatus}
                                        {...register('main_email', { required: true })}
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
                    <div style={{ position: "absolute", left: "50px", bottom: "25px", width: "100%" }}>
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