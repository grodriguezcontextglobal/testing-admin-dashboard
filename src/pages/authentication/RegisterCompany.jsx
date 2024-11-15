import { Icon } from "@iconify/react/dist/iconify.js";
import {
  Chip,
  FormLabel,
  Grid,
  OutlinedInput,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import {
  AutoComplete,
  Avatar,
  Button,
  Space,
  Tooltip,
  notification,
} from "antd";
import { PropTypes } from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import FooterComponent from "../../components/general/FooterComponent";
import { CompanyIcon } from "../../components/icons/CompanyIcon";
import { convertToBase64 } from "../../components/utils/convertToBase64";
import { onAddErrorMessage, onLogin, onLogout } from "../../store/slices/adminSlice";
import { AntSelectorStyle } from "../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../styles/global/BlueButton";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import CenteringGrid from "../../styles/global/CenteringGrid";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../styles/global/Subtitle";
import consultingCompanyInSqDb from "./actions/consultingCompanyInSqDb";
import consultingUserMemberInSqlDb from "./actions/consultingUserMemberInSqlDb";
import createCompany from "./actions/createCompany";
import createStripeAccount from "./actions/createStripeAccount";
import insertingNewCompanyInSqlDb from "./actions/insertingNewCompanyInSqlDb";
import insertingStripeAccountInSqlDb from "./actions/insertingStripeAccountInSqlDb";
import insertingUserMemberInSqlBd from "./actions/insertingUserMemberInSqlBd";
import userRegistrationProcess from "./actions/userRegistrationProcess";
import InfrmationCard from "./components/InfrmationCard";
const RegisterCompany = () => {
  const isSmallDevice = useMediaQuery("only screen abd (max-width: 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width: 769px) and (max-width:992px)"
  );
  const isLargeDevice = useMediaQuery(
    "only screen and (min-width : 993px) and (max-width : 1200px)"
  );
  const isExtraLargeDevice = useMediaQuery(
    "only screen abd (min-width: 1201px)"
  );

  const adjustingFormWidth = (arg1, arg2, arg3, arg4) => {
    if (isSmallDevice) return arg1; //"90vw";
    if (isMediumDevice) return arg2; //"50vw";
    if (isLargeDevice) return arg3; //"40vw";
    if (isExtraLargeDevice) return arg4; //"50vw";
  };
  const { user } = useSelector((state) => state.admin);
  const [listCompany, setListCompany] = useState([]);
  const [companyValue, setCompanyValue] = useState();
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [locationList, setLocationList] = useState([]);
  const [newlocation, setNewlocation] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, handleSubmit } = useForm();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, title, msg, time) => {
    api.open({
      message: title,
      description: msg,
      duration: time,
      key: `${type}`,
    });
  };

  const industryListQuery = useQuery({
    queryKey: ["companyInfoList"],
    queryFn: () => devitrakApi.post("/db_company/industry"),
    refetchOnMount: false,
  });
  const checkUserInfo = useQuery({
    queryKey: ["checkUserInfoQuery"],
    queryFn: () =>
      devitrakApi.post("/staff/admin-users", {
        email: user.email,
      }),
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    industryListQuery.refetch();
    checkUserInfo.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  const callAPiUserCompany = useCallback(async () => {
    const resp = await devitrakApi.post("/company/companies");
    if (resp) {
      return setListCompany(resp.data.company);
    }
  }, []);

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
      result.add(data.company_name);
    }
    return Array.from(result);
  }, [listCompany]);

  companies();

  const matchCompany = useCallback(() => {
    const foundCompany = companies()?.find(
      (company) =>
        String(company).toLowerCase() === String(companyValue).toLowerCase()
    );
    if (foundCompany) {
      openNotificationWithIcon(
        "error",
        "Company exists!",
        "Company already exists in our records.",
        0
      );
      return true;
    }
    return false;
  }, [companyValue]);

  const retrieveIndustryOptions = () => {
    const result = new Set();
    if (industryListQuery.data) {
      const industryData = industryListQuery.data.data.industry;
      for (let data of industryData) {
        result.add(data.industry);
      }
    }
    return Array.from(result);
  };
  const handleAddLocation = async () => {
    if (newlocation.length > 0) {
      let result = [...locationList, newlocation];
      setLocationList(result);
      setNewlocation("");
      return null;
    }
  };
  const handleDeleteLocation = (location) => {
    const result = locationList.filter((element) => element !== location);
    return setLocationList(result);
  };
  const ref = useRef({});

  const onSubmitRegister = async (data) => {
    let base64 = "";
    if (locationList.length < 1) {
      return alert(
        "Please provide at least one location. Go to locations field, type a location where your inventory will be located and then click button Add, then you can proceed to complete the registration process."
      );
    } else {
      if (data.photo.length > 0 && data.photo[0].size > 1048576) {
        setLoadingStatus(false);
        return alert(
          "Image is bigger than allow. Please resize the image or select a new one."
        );
      } else if (data.photo.length > 0) {
        setLoadingStatus(true);
        base64 = await convertToBase64(data.photo[0]);
      }
      try {
        setLoadingStatus(true);
        openNotificationWithIcon(
          "info",
          "Processing",
          "We're processing your request",
          0
        );
        if (user.existing) {
          await createStripeAccount({ companyValue, user, ref });
          await createCompany({
            props: { ...data, company_logo: base64 },
            ref,
            companyValue,
            locationList,
            websiteUrl,
            industry,
            user,
          });
          await insertingNewCompanyInSqlDb({
            props: { ...data },
            companyValue,
            ref,
            industry,
            websiteUrl,
          });
          await insertingStripeAccountInSqlDb(ref);
          await consultingUserMemberInSqlDb({ ref, user });
          await consultingCompanyInSqDb(ref);
          queryClient.clear();
          setLoadingStatus(false);
          api.destroy()
          dispatch(onLogin({
            ...ref.current.userRegistration,
            companyData:{...ref.current.companyData},
            sqlMemberInfo:{...ref.current.sqlMemberInfo},
            sqlInfo: {...ref.current.sqlInfo},

          }))
          openNotificationWithIcon(
            "success",
            "Account created.",
            "Your new account was created. Please log in.",
            3
          );
          return navigate("/register/connected-account");
        } else {
          await createStripeAccount({ companyValue, user, ref });
          await userRegistrationProcess({ user, companyValue, ref });
          await createCompany({
            props: { ...data, company_logo: base64 },
            ref,
            companyValue,
            locationList,
            websiteUrl,
            industry,
            user,
          });
          await insertingNewCompanyInSqlDb({
            props: { ...data },
            companyValue,
            ref,
            industry,
            websiteUrl,
          });
          await insertingStripeAccountInSqlDb(ref);
          await insertingUserMemberInSqlBd({ props: { ...data }, user, ref });
          await consultingUserMemberInSqlDb({ ref, user });
          await consultingCompanyInSqDb(ref);
          dispatch(onLogin({
            ...ref.current.userRegistration,
            companyData:{...ref.current.companyData},
            sqlMemberInfo:{...ref.current.sqlMemberInfo},
            sqlInfo: {...ref.current.sqlInfo},

          }))
          queryClient.clear();
          setLoadingStatus(false);
          api.destroy()
          openNotificationWithIcon(
            "success",
            "Account created.",
            "Your new account was created. Please log in.",
            3
          );
          return navigate("/register/connected-account");
        }
      } catch (error) {
        notification.destroy("info");
        console.log(error);
        openNotificationWithIcon(
          "error",
          "Action failed",
          `Please try again later. ${error}`,
          3
        );
        dispatch(onAddErrorMessage(error));
        setLoadingStatus(false);
      }
    }
  };

  return (
    <>
      {contextHolder}
      <Grid
        style={{
          backgroundColor: "var(--basewhite)",
          height: "100dvh",
          margin: 0,
          width: "100vw",
        }}
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
            }}
          >
            <Grid
              marginX={0}
              className="register-container"
              style={{
                padding: `${isSmallDevice ? "1rem" : "0 2rem"}`,
                margin: "4dvh auto 0",
              }}
              container
            >
              <form
                className="register-form-container"
                onSubmit={handleSubmit(onSubmitRegister)}
                style={{
                  width: adjustingFormWidth("90vw", "90vw", "45vw", "90vw"),
                }}
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
                <Grid margin={"2rem auto"} item xs={12} sm={12} md={12} lg={12}>
                  <InfrmationCard props={user} />
                </Grid>
                <Grid
                  marginY={"20px"}
                  marginX={0}
                  textAlign={"left"}
                  item
                  xs={12}
                >
                  <FormLabel style={{ marginBottom: "0.5rem" }}>
                    Company name <span style={{ fontWeight: 800 }}>*</span>
                  </FormLabel>
                  <Grid
                    item
                    xs={12}
                    display={"flex"}
                    alignItems={"center"}
                    justifyContent={"space-between"}
                  >
                    <OutlinedInput
                      required
                      type="text"
                      value={companyValue}
                      onChange={(e) => setCompanyValue(e.target.value)}
                      style={{
                        ...OutlinedInputStyle,
                      }}
                      placeholder="Enter your company name"
                      fullWidth
                    />
                  </Grid>
                </Grid>

                <Grid
                  marginY={"20px"}
                  marginX={0}
                  textAlign={"left"}
                  item
                  xs={12}
                  sm={12}
                  md={12}
                  lg={12}
                >
                  <FormLabel style={{ marginBottom: "0.5rem" }}>
                    Main phone number <span style={{ fontWeight: 800 }}>*</span>
                    <OutlinedInput
                      required
                      disabled={loadingStatus || matchCompany()}
                      {...register("main_phone", { required: true })}
                      style={OutlinedInputStyle}
                      placeholder="+1 (123) 456-7890"
                      type="text"
                      fullWidth
                    />
                  </FormLabel>
                </Grid>
                <Grid
                  marginY={"20px"}
                  marginX={0}
                  textAlign={"left"}
                  item
                  xs={12}
                  sm={12}
                  md={12}
                  lg={12}
                >
                  <FormLabel style={{ marginBottom: "0.5rem" }}>
                    Alternative phone number{" "}
                    <span style={{ fontWeight: 800 }}></span>
                  </FormLabel>
                  <OutlinedInput
                    disabled={loadingStatus || matchCompany()}
                    {...register("alternative_phone", { required: false })}
                    style={OutlinedInputStyle}
                    placeholder=""
                    type="text"
                    fullWidth
                  />
                </Grid>
                <Grid marginX={0} textAlign={"left"} item xs={12}>
                  <FormLabel style={{ marginBottom: "0.5rem" }}>
                    Website <span style={{ fontWeight: 800 }}>*</span>
                  </FormLabel>
                  <OutlinedInput
                    required
                    disabled={loadingStatus || matchCompany()}
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
                  display={"flex"}
                  flexDirection={"column"}
                  item
                  xs={12}
                  sm={12}
                  md={12}
                  lg={12}
                >
                  <FormLabel style={{ marginBottom: "0.5rem", width: "100%" }}>
                    Country <span style={{ fontWeight: 800 }}>*</span>
                    <OutlinedInput
                      required
                      disabled={loadingStatus || matchCompany()}
                      {...register("country", { required: true })}
                      style={OutlinedInputStyle}
                      placeholder="Country name"
                      type="text"
                      fullWidth
                    />
                  </FormLabel>
                </Grid>
                <Grid
                  marginY={"20px"}
                  marginX={0}
                  textAlign={"left"}
                  display={"flex"}
                  flexDirection={"column"}
                  item
                  xs={12}
                  sm={12}
                  md={12}
                  lg={12}
                >
                  <FormLabel style={{ marginBottom: "0.5rem", width: "100%" }}>
                    Address for company headquarters{" "}
                    <span style={{ fontWeight: 800 }}>*</span>
                    <OutlinedInput
                      required
                      disabled={loadingStatus || matchCompany()}
                      {...register("street", { required: true })}
                      style={{ ...OutlinedInputStyle, margin: "0 0 20px" }}
                      placeholder="Address line 1"
                      type="text"
                      fullWidth
                    />
                    <OutlinedInput
                      disabled={loadingStatus || matchCompany()}
                      {...register("street2")}
                      style={OutlinedInputStyle}
                      placeholder="Address line 2"
                      type="text"
                      fullWidth
                    />
                  </FormLabel>
                </Grid>
                <Grid
                  marginY={"20px"}
                  marginX={0}
                  textAlign={"left"}
                  display={"flex"}
                  justifyContent={"space-between"}
                  alignItems={"center"}
                  gap={1}
                  item
                  xs={12}
                  sm={12}
                  md={12}
                  lg={12}
                >
                  <FormLabel style={{ marginBottom: "0.5rem", width: "100%" }}>
                    City <span style={{ fontWeight: 800 }}>*</span>
                    <OutlinedInput
                      required
                      disabled={loadingStatus || matchCompany()}
                      {...register("city", { required: true })}
                      style={OutlinedInputStyle}
                      placeholder="City name"
                      type="text"
                      fullWidth
                    />
                  </FormLabel>
                </Grid>

                <Grid
                  marginY={"20px"}
                  marginX={0}
                  textAlign={"left"}
                  display={"flex"}
                  justifyContent={"space-between"}
                  alignItems={"center"}
                  gap={1}
                  item
                  xs={12}
                  sm={12}
                  md={12}
                  lg={12}
                >
                  {" "}
                  <FormLabel style={{ marginBottom: "0.5rem", width: "50%" }}>
                    State <span style={{ fontWeight: 800 }}>*</span>
                    <OutlinedInput
                      required
                      disabled={loadingStatus || matchCompany()}
                      {...register("state", { required: true })}
                      style={OutlinedInputStyle}
                      placeholder=""
                      type="text"
                      fullWidth
                    />
                  </FormLabel>
                  <FormLabel style={{ marginBottom: "0.5rem", width: "50%" }}>
                    Zip code <span style={{ fontWeight: 800 }}>*</span>
                    <OutlinedInput
                      required
                      disabled={loadingStatus || matchCompany()}
                      {...register("postal_code", { required: true })}
                      style={OutlinedInputStyle}
                      placeholder=""
                      type="text"
                      fullWidth
                    />
                  </FormLabel>
                </Grid>
                <Grid
                  marginY={"20px"}
                  marginX={0}
                  textAlign={"left"}
                  display={"flex"}
                  justifyContent={"space-between"}
                  alignItems={"center"}
                  gap={1}
                  item
                  xs={12}
                  sm={12}
                  md={12}
                  lg={12}
                >
                  <FormLabel
                    style={{
                      marginBottom: "0.5rem",
                      borderRadius: "8px",
                      width: "100%",
                    }}
                  >
                    Industry <span style={{ fontWeight: 800 }}>*</span>
                    <AutoComplete
                      className="custom-autocomplete" // Add a custom className here
                      disabled={loadingStatus || matchCompany()}
                      variant="outlined"
                      style={{
                        ...AntSelectorStyle,
                        border: "solid 0.3 var(--gray600)",
                        fontFamily: "Inter",
                        fontSize: "14px",
                        width: "100%",
                      }}
                      value={industry}
                      onChange={(value) => setIndustry(value)}
                      options={retrieveIndustryOptions().map((item) => {
                        return { value: item };
                      })}
                      placeholder="Type your industry area"
                      filterOption={(inputValue, option) =>
                        option.value
                          .toUpperCase()
                          .indexOf(inputValue.toUpperCase()) !== -1
                      }
                    />
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
                    Your company locations <span style={{ fontWeight: 800 }}>*</span>
                  </FormLabel>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <Tooltip
                      style={{ width: "95%" }}
                      title="Please click the 'Add' button to include your location. Otherwise, it will not be added."
                    >
                      <OutlinedInput
                        name="newLocation"
                        value={newlocation}
                        onChange={(e) => setNewlocation(e.target.value)}
                        style={{ ...OutlinedInputStyle }}
                        fullWidth
                      />
                    </Tooltip>
                    <Button
                      htmlType="button"
                      onClick={() => handleAddLocation()}
                      style={{
                        ...BlueButton,
                        background: `${
                          matchCompany()
                            ? "var(--disabled-blue-button)"
                            : BlueButton.background
                        }`,
                      }}
                    >
                      <p
                        style={{
                          ...BlueButtonText,
                          ...CenteringGrid,
                          color: `${
                            matchCompany() ? "" : BlueButtonText.color
                          }`,
                        }}
                      >
                        Add
                      </p>
                    </Button>
                  </div>
                </Grid>
                <Grid
                  marginY={"20px"}
                  display={"flex"}
                  justifyContent={"flex-start"}
                  alignItems={"center"}
                  item
                  xs
                >
                  <Space size={[8, 16]} wrap>
                    {locationList.map((location) => {
                      return (
                        <Chip
                          key={location}
                          label={`${location}`}
                          onDelete={() => handleDeleteLocation(location)}
                        />
                      );
                    })}
                  </Space>
                </Grid>
                <Grid
                  marginY={"20px"}
                  marginX={0}
                  textAlign={"left"}
                  display={"flex"}
                  flexDirection={"column"}
                  justifyContent={"space-between"}
                  alignItems={"center"}
                  gap={1}
                  item
                  xs={12}
                  sm={12}
                  md={12}
                  lg={12}
                >
                  <FormLabel style={{ marginBottom: "0.5rem", width: "100%" }}>
                    Upload your company logo
                  </FormLabel>
                  <Grid
                    marginY={"20px"}
                    marginX={0}
                    textAlign={"left"}
                    display={"flex"}
                    justifyContent={"space-between"}
                    alignItems={"center"}
                    gap={1}
                    item
                    xs={12}
                    sm={12}
                    md={12}
                    lg={12}
                  >
                    <Grid
                      display={"flex"}
                      justifyContent={"flex-start"}
                      alignSelf={"stretch"}
                      marginY={0}
                      gap={2}
                      item
                      xs={12}
                      sm={12}
                      md={12}
                    >
                      <Grid
                        display={"flex"}
                        justifyContent={"flex-start"}
                        alignSelf={"stretch"}
                        marginY={0}
                        gap={2}
                        item
                        xs={4}
                        sm={4}
                        md={4}
                      >
                        <Avatar
                          size={{
                            xs: 24,
                            sm: 32,
                            md: 40,
                            lg: 64,
                            xl: 80,
                            xxl: 100,
                          }}
                          src={
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <CompanyIcon />
                            </div>
                          }
                          style={{
                            background: "var(--Gray-100, #F2F4F7)",
                          }}
                        />
                      </Grid>
                      <Grid
                        display={"flex"}
                        flexDirection={"column"}
                        justifyContent={"center"}
                        alignItems={"center"}
                        marginBottom={2}
                        style={{
                          width: "100%",
                          borderRadius: "12px",
                          border: "1px solid var(--gray-200, #EAECF0)",
                          background: "var(--base-white, #FFF)",
                        }}
                        item
                        xs={12}
                      >
                        <Grid
                          display={"flex"}
                          justifyContent={"center"}
                          alignItems={"center"}
                          marginTop={2}
                          item
                          xs={12}
                        >
                          <Avatar
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              border: "6px solid var(--gray-50, #F9FAFB)",
                              background: "6px solid var(--gray-50, #F9FAFB)",
                              borderRadius: "28px",
                            }}
                          >
                            {" "}
                            <Icon
                              icon="tabler:cloud-upload"
                              color="#475467"
                              width={20}
                              height={20}
                            />
                          </Avatar>
                        </Grid>
                        <Grid
                          display={"flex"}
                          justifyContent={"center"}
                          alignItems={"center"}
                          item
                          xs={12}
                          sm={10}
                        >
                          <TextField
                            {...register("photo")}
                            id="file-upload"
                            type="file"
                            accept=".jpeg, .png, .jpg"
                            style={{
                              outline: "none",
                              border: "transparent",
                            }}
                          />
                        </Grid>
                        <Grid
                          display={"flex"}
                          justifyContent={"center"}
                          alignItems={"center"}
                          marginBottom={2}
                          item
                          xs={12}
                        >
                          <p style={{ ...Subtitle, fontWeight: 400 }}>
                            SVG, PNG, JPG or GIF (max. 1MB)
                          </p>
                        </Grid>
                      </Grid>
                    </Grid>
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
                  <Button
                    loading={loadingStatus}
                    disabled={loadingStatus || matchCompany()}
                    htmlType="submit"
                    style={{
                      ...BlueButton,
                      ...CenteringGrid,
                      width: "100%",
                      background: `${
                        matchCompany()
                          ? "var(--disabled-blue-button)"
                          : BlueButton.background
                      }`,
                    }}
                  >
                    <p
                      style={{
                        ...BlueButtonText,
                        color: `${matchCompany() ? "" : BlueButtonText.color}`,
                      }}
                    >
                      {!loadingStatus ? "Register" : "Loading"}
                    </p>
                  </Button>
                </Grid>
                <Grid
                  item
                  xs={12}
                  justifyContent={"center"}
                  alignItems={"center"}
                >
                  <p
                    style={{
                      color: "var(--gray-600, #475467)",
                      fontSize: "14px",
                      fontFamily: "Inter",
                      lineHeight: "20px",
                    }}
                  >
                    Do you have an account already?{" "}
                    <Link to="/login">
                      <button
                        onClick={() => dispatch(onLogout())}
                        style={{
                          backgroundColor: "transparent",
                          outline: "none",
                          padding: 0,
                          color: "#004EEB",
                          fontSize: "14px",
                          fontFamily: "Inter",
                          fontWeight: "600",
                          lineHeight: "20px",
                          cursor: "pointer",
                        }}
                      >
                        Sign in
                      </button>
                    </Link>
                  </p>
                </Grid>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    width: "100%",
                    margin: "0 0 0px -20px",
                  }}
                >
                  <FooterComponent />
                </div>
              </form>
            </Grid>
          </Grid>
        </Grid>
        <Grid
          display={(isSmallDevice || isMediumDevice) && "none"}
          id="section-img-login-component"
          item
          xs={6}
          sm={6}
        ></Grid>
      </Grid>{" "}
    </>
  );
};

RegisterCompany.propTypes = {
  street: PropTypes.string,
  street2: PropTypes.string,
  city: PropTypes.string,
  state: PropTypes.string,
  postal_code: PropTypes.string,
  main_phone: PropTypes.string,
  alternative_phone: PropTypes.string,
  company_logo: PropTypes.string,
};
export default RegisterCompany;
