/* eslint-disable no-unused-vars */
import {
  FormControlLabel,
  FormLabel,
  Grid,
  InputAdornment,
  OutlinedInput,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Checkbox, notification, Typography } from "antd";
import PropTypes from "prop-types";
import { lazy, Suspense, useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi, devitrakApiAdmin } from "../../api/devitrakApi";
import Loading from "../../components/animation/Loading";
import FooterComponent from "../../components/general/FooterComponent";
import { checkArray } from "../../components/utils/checkArray";
import {
  clearErrorMessage,
  onAddErrorMessage,
  onChecking,
  onLogin,
  onLogout,
} from "../../store/slices/adminSlice";
import {
  onAddEventData,
  onAddListEventPermitPerAdmin,
  onAddQRCodeLink,
  onSelectCompany,
  onSelectEvent,
} from "../../store/slices/eventSlice";
import { onAddSubscription } from "../../store/slices/subscriptionSlice";
import CenteringGrid from "../../styles/global/CenteringGrid";
import "../../styles/global/OutlineInput.css";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../styles/global/Subtitle";
import "./style/authStyle.css";
import VisibleIcon from "../../components/icons/VisibleIcon";
import HidenIcon from "../../components/icons/HidenIcon";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import LightBlueButtonComponent from "../../components/UX/buttons/LigthBlueButton";
const ForgotPassword = lazy(() => import("./ForgotPassword"));
const ModalMultipleCompanies = lazy(() => import("./multipleCompanies/Modal"));

const Login = () => {
  const { register, handleSubmit, setValue } = useForm();
  const [rememberMe, setRememberMe] = useState(false);
  const [updatePasswordModalState, setUpdatePasswordModalState] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openMultipleCompanies, setOpenMultipleCompanies] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [forceLogin, setForceLogin] = useState(false);
  const [currentStep, setCurrentStep] = useState("email"); // "email" or "password"
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [api, contextHolder] = notification.useNotification();

  const openNotificationWithIcon = useCallback(
    (type, msg) => {
      api.open({
        message: (
          <div style={{ display: "flex", alignItems: "center" }}>{msg}</div>
        ),
        duration: 3000,
      });
    },
    [api]
  );

  const dataPassed = useRef(null);

  const addingEventState = async (props) => {
    const sqpFetchInfo = await devitrakApi.post(
      "/db_event/events_information",
      {
        zip_address: props.eventInfoDetail.address.split(" ").at(-1),
        event_name: props.eventInfoDetail.eventName,
      }
    );
    if (sqpFetchInfo.data.ok) {
      dispatch(onSelectEvent(props.eventInfoDetail.eventName));
      dispatch(onSelectCompany(props.company));
      dispatch(
        onAddEventData({ ...props, sql: sqpFetchInfo.data.events.at(-1) })
      );
      dispatch(onAddSubscription(props.subscription));
      dispatch(
        onAddQRCodeLink(
          props.qrCodeLink ??
            `https://app.devitrak.net/?event=${encodeURI(
              props.eventInfoDetail.eventName
            )}&company=${encodeURI(props.company)}`
        )
      );
      dispatch(
        onAddListEventPermitPerAdmin({
          active: [{ ...props }],
          completed: [],
        })
      );
      return navigate("/events/event-quickglance");
    }
    dispatch(onSelectEvent(props.eventInfoDetail.eventName));
    dispatch(onSelectCompany(props.company));
    dispatch(onAddEventData(props));
    dispatch(onAddSubscription(props.subscription));
    dispatch(
      onAddQRCodeLink(
        props.qrCodeLink ??
          `https://app.devitrak.net/?event=${encodeURI(
            props.eventInfoDetail.eventName
          )}&company=${encodeURI(props.company)}`
      )
    );
    dispatch(
      onAddListEventPermitPerAdmin({
        active: [{ ...props }],
        completed: [],
      })
    );

    return navigate("/events/event-quickglance");
  };

  const navigateUserBasedOnRole = useCallback(
    async (props) => {
      if (Number(props.role) === 4) {
        try {
          const response = await devitrakApi.post("/event/event-list", {
            "staff.headsetAttendees.email": props.email,
            active: true,
          });

          if (response.data.ok && response.data.list.length > 0) {
            await addingEventState(response.data.list[0]);
            return;
          }

          openNotificationWithIcon(
            "error",
            "Event is ended. Please contact event administrator."
          );
        } catch (error) {
          openNotificationWithIcon("error", "Failed to fetch event data.");
        }
      } else {
        navigate("/");
      }
    },
    [navigate, addingEventState, openNotificationWithIcon]
  );

  const loginIntoOneCompanyAccount = async ({ props }) => {
    try {
      localStorage.setItem("admin-token", props.respo.token);
      const updatingOnlineStatusResponse = await devitrakApiAdmin.patch(
        `/profile/${props.respo.uid}`,
        {
          online: true,
        }
      );
      const respoFindMemberInfo = await devitrakApi.post(
        "/db_staff/consulting-member",
        {
          email: props.email,
        }
      );
      const companyInfoTable = await devitrakApi.post(
        "/db_company/consulting-company",
        {
          company_name: props.company_name,
        }
      );
      const stripeSQL = await devitrakApi.post("/db_stripe/consulting-stripe", {
        company_id: checkArray(companyInfoTable.data.company).company_id,
      });
      dispatch(
        onLogin({
          data: {
            ...props.respo.entire,
            online: updatingOnlineStatusResponse.data.entire.online,
          },
          name: props.respo.name,
          lastName: props.respo.lastName,
          uid: props.respo.uid,
          email: props.respo.email,
          role: props.role,
          phone: props.respo.phone,
          company: props.company_name,
          token: props.respo.token,
          online: updatingOnlineStatusResponse.data.entire.online,
          companyData: props.company_data[0],
          sqlMemberInfo: checkArray(respoFindMemberInfo.data.member),
          sqlInfo: {
            ...checkArray(companyInfoTable.data.company),
            stripeID: checkArray(stripeSQL.data.stripe),
          },
          subscription: {},
        })
      );
      dispatch(onAddSubscription({}));
      dispatch(clearErrorMessage());
      queryClient.clear();
      openNotificationWithIcon("Success", "User logged in.");
      await navigateUserBasedOnRole({
        role: props.role,
        email: props.email,
      });
    } catch (error) {
      console.log("loginIntoOneCompanyAccount", error);
    }
  };

  const handleMulitpleCompanyLogin = async (props) => {
    setOpenMultipleCompanies(true);
    return (dataPassed.current = props);
  };

  // New function to verify email exists
  // Simplified function to just collect email and move to password step
  const onSubmitEmail = async (data) => {
    // Simply collect email and move to password step without verification
    setUserEmail(data.email);
    setCurrentStep("password");
  };

  const onSubmitLogin = async (data) => {
    try {
      setIsLoading(true);
      dispatch(onChecking());

      // Use the collected email from the first step
      // If we are in password step, save the password
      if (currentStep === "password") {
        setUserPassword(data.password);
      }

      const loginData = {
        email: userEmail,
        password: currentStep === "password" ? data.password : userPassword,
        mfaCode: data.mfaCode,
      };

      // Parallel API calls for better performance
      const [loginResponse, companyResponse] = await Promise.all([
        devitrakApiAdmin.post("/login", {
          email: loginData.email,
          password: loginData.password,
          rememberMe,
          forceLogin: forceLogin,
          mfaCode: loginData.mfaCode,
        }),
        devitrakApi.post("/company/search-company", {
          "employees.user": loginData.email,
        }),
      ]);

      if (!loginResponse.data || !companyResponse.data) {
        throw new Error("Authentication failed");
      }

      // Check if email exists in company employees
      if (!companyResponse.data || companyResponse.data.company.length === 0) {
        throw new Error("Email not found in any company");
      }

      const activeCompanies = await processCompanyData(
        loginData.email,
        companyResponse.data.company
      );

      if (activeCompanies.length > 1) {
        await handleMulitpleCompanyLogin({
          ...loginData,
          companyInfo: activeCompanies,
          company_data: companyResponse.data.company,
          respo: loginResponse.data,
        });
      } else if (activeCompanies.length === 1) {
        await loginIntoOneCompanyAccount({
          props: {
            email: loginData.email,
            password: loginData.password,
            company_name: activeCompanies[0].company,
            role: activeCompanies[0].role,
            company_data: companyResponse.data.company,
            respo: loginResponse.data,
          },
        });
      } else {
        openNotificationWithIcon(
          "error",
          "No active company assignments found."
        );
      }
    } catch (error) {
      // Check for MFA requirement with flexible property naming and status codes
      const responseData = error.response?.data;
      const isMfaRequired =
        responseData?.mfaRequired ||
        responseData?.mfa_required ||
        responseData?.error === "mfa_required" ||
        responseData?.msg === "mfa_required";

      if (
        (error.response?.status === 403 || error.response?.status === 401) &&
        isMfaRequired
      ) {
        if (currentStep === "mfa") {
          openNotificationWithIcon(
            "error",
            responseData?.msg || "Invalid MFA Code"
          );
        } else {
          setCurrentStep("mfa");
          dispatch(clearErrorMessage());
        }
        return;
      }

      const message = () => {
        switch (error.response?.data?.msg) {
          case "User is not found":
            return "You have entered an invalid username or password";
          case "Incorrect password":
            return "You have entered an invalid username or password";
          case "Active session already exists for this account. If this is you, please use 'Force Login' to end the previous session.":
            return forceEndActiveSession(error.response?.data?.msg);
          default:
            return error.response?.data?.msg;
        }
      };
      openNotificationWithIcon("error", message());
      dispatch(onLogout("Incorrect credentials"));
      dispatch(onAddErrorMessage(error?.response?.data?.msg));

      // Reset form and go back to email step on error
      setValue("password", "");
      setCurrentStep("email");
      setUserEmail("");
      setValue("email", "");
    } finally {
      setIsLoading(false);
      dispatch(clearErrorMessage());
    }
  };

  const processCompanyData = useCallback(async (email, companies) => {
    const activeCompanies = companies.reduce((acc, item) => {
      const userInfo = item.employees.find(
        (element) => element.user === email && element.active
      );
      if (userInfo) {
        acc.push({
          company: item.company_name,
          role: userInfo.role,
        });
      }
      return acc;
    }, []);

    return activeCompanies;
  }, []);

  // Function to go back to email step
  const handleBackToEmail = () => {
    setCurrentStep("email");
    setEmailVerified(false);
    setUserEmail("");
    setValue("email", "");
    setValue("password", "");
  };

  const isSmallDevice = useMediaQuery("only screen and (max-width: 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width: 769px) and (max-width:992px)"
  );
  const isLargeDevice = useMediaQuery(
    "only screen and (min-width : 993px) and (max-width : 1200px)"
  );
  const isExtraLargeDevice = useMediaQuery(
    "only screen and (min-width : 1201px)"
  );
  const formFittingTrigger = () => {
    if (isSmallDevice || isMediumDevice) {
      return "55vw";
    } else if (isLargeDevice) {
      return "40vw";
    } else if (isExtraLargeDevice) {
      return "30vw";
    }
  };

  const forceEndActiveSession = () => {
    return (
      <div style={{ width: "100%", margin: "auto", flexDirection: "column" }}>
        <Typography style={{ width: "100%" }}>
          Active session already exists for this account. If this is you, please
          re submit password and click Force Login button to end the previous
          session.
        </Typography>
        <form onSubmit={handleSubmit(onSubmitLogin)} style={{ width: "100%" }}>
          <Grid marginY={"20px"} marginX={0} textAlign={"left"} item xs={12}>
            <FormLabel style={{ marginBottom: "0.9rem" }}>Password</FormLabel>
            <OutlinedInput
              required
              {...register("password", { required: true, minLength: 6 })}
              style={{
                ...OutlinedInputStyle,
                marginTop: "6px",
              }}
              placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;"
              type={showPassword ? "text" : "password"}
              fullWidth
              endAdornment={
                <InputAdornment position="end">
                  <button
                    type="button"
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
                </InputAdornment>
              }
            />
          </Grid>

          <div style={{ display: "flex", gap: "12px", width: "100%" }}>
            <BlueButtonComponent
              disabled={false}
              loadingState={isLoading}
              buttonType="submit"
              title="Force login"
              styles={{ flex: "1" }}
              func={() => setForceLogin(true)}
            />
          </div>
        </form>
      </div>
    );
  };

  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
        </div>
      }
    >
      {contextHolder}
      <Grid
        container
        style={{
          backgroundColor: "var(--basewhite)",
          height: "100dvh",
          margin: "auto",
        }}
      >
        <Grid
          display={"flex"}
          flexDirection={"column"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          margin={"auto"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "stretch",
          }}
          item
          xs={12}
          sm={12}
          md={6}
          lg={6}
        >
          <Grid
            display={"flex"}
            flexDirection={"column"}
            justifyContent={"center"}
            alignSelf={"center"}
            margin={"auto"}
            id="checking"
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            <p
              style={{
                color: "var(--gray900, #101828)",
                fontSize: "30px",
                fontFamily: "Inter",
                fontWeight: "600",
                lineHeight: "38px",
                marginBottom: "1rem",
                width: "100%",
              }}
            >
              Welcome
            </p>
            <p
              style={{
                width: "100%",
                color: "var(--gray-500, #667085)",
                fontSize: "16px",
                fontFamily: "Inter",
                lineHeight: "24px",
              }}
            >
              {currentStep === "email"
                ? "Please enter your email"
                : `Welcome back, ${userEmail}`}
            </p>

            {/* Email Step */}
            {currentStep === "email" && (
              <form
                onSubmit={handleSubmit(onSubmitEmail)}
                style={{ width: formFittingTrigger() }}
              >
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
                  <FormLabel style={{ marginBottom: "0.9rem" }}>
                    Email
                  </FormLabel>
                  <OutlinedInput
                    required={!forceLogin}
                    {...register("email", {
                      required: !forceLogin,
                      minLength: 10,
                    })}
                    type="email"
                    style={{
                      ...OutlinedInputStyle,
                      marginTop: "6px",
                    }}
                    placeholder="Enter your email"
                    fullWidth
                  />
                </Grid>
                <BlueButtonComponent
                  disabled={false}
                  loadingState={isLoading}
                  buttonType="submit"
                  title="Continue"
                  styles={{ width: "100%" }}
                />
              </form>
            )}

            {/* Password Step */}
            {currentStep === "password" && (
              <form
                onSubmit={handleSubmit(onSubmitLogin)}
                style={{ width: formFittingTrigger() }}
              >
                <Grid
                  marginY={"20px"}
                  marginX={0}
                  textAlign={"left"}
                  item
                  xs={12}
                >
                  <FormLabel style={{ marginBottom: "0.9rem" }}>
                    Password
                  </FormLabel>
                  <OutlinedInput
                    required={!forceLogin}
                    {...register("password", {
                      required: !forceLogin,
                      minLength: 6,
                    })}
                    style={{
                      ...OutlinedInputStyle,
                      marginTop: "6px",
                    }}
                    placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;"
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    endAdornment={
                      <InputAdornment position="end">
                        <button
                          type="button"
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
                      </InputAdornment>
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
                  <Grid
                    item
                    xs={6}
                    display={"flex"}
                    justifyContent={"flex-start"}
                    alignItems={"center"}
                    style={{ padding: "0rem 0rem 0rem 0.6rem" }}
                  >
                    <FormControlLabel
                      style={{
                        color: "#var(--gray-700, #344054)",
                        fontSize: "14px",
                        fontFamily: "Inter",
                        fontWeight: "500",
                        lineHeight: "20px",
                      }}
                      labelPlacement="end"
                      control={
                        <Checkbox
                          onChange={(e) => setRememberMe(e.target.checked)}
                          style={{ paddingRight: "0.5rem" }}
                        />
                      }
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
                    <button
                      type="button"
                      style={{
                        backgroundColor: "transparent",
                        outline: "none",
                        margin: 0,
                        padding: 0,
                      }}
                      onClick={() => setUpdatePasswordModalState(true)}
                    >
                      <p
                        style={{
                          color: "#004EEB",
                          fontSize: "14px",
                          fontFamily: "Inter",
                          fontWeight: "600",
                          lineHeight: "20px",
                          cursor: "pointer",
                        }}
                      >
                        Forgot password?
                      </p>
                    </button>
                  </Grid>
                </Grid>

                <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                  <LightBlueButtonComponent
                    disabled={false}
                    loadingState={false}
                    buttonType="button"
                    title="Back"
                    func={handleBackToEmail}
                    styles={{ flex: "1" }}
                  />
                  <BlueButtonComponent
                    disabled={false}
                    loadingState={isLoading}
                    buttonType="submit"
                    title="Sign in"
                    styles={{ flex: "1" }}
                  />
                </div>
              </form>
            )}

            {/* MFA Step */}
            {currentStep === "mfa" && (
              <form
                onSubmit={handleSubmit(onSubmitLogin)}
                style={{ width: formFittingTrigger() }}
              >
                <Grid
                  marginY={"20px"}
                  marginX={0}
                  textAlign={"left"}
                  item
                  xs={12}
                >
                  <FormLabel style={{ marginBottom: "0.9rem" }}>
                    MFA Code
                  </FormLabel>
                  <OutlinedInput
                    required
                    {...register("mfaCode", {
                      required: true,
                      minLength: 6,
                      maxLength: 6,
                    })}
                    style={{
                      ...OutlinedInputStyle,
                      marginTop: "6px",
                    }}
                    placeholder="000000"
                    fullWidth
                    autoFocus
                  />
                </Grid>

                <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                  <LightBlueButtonComponent
                    disabled={false}
                    loadingState={false}
                    buttonType="button"
                    title="Back"
                    func={() => setCurrentStep("password")}
                    styles={{ flex: "1" }}
                  />
                  <BlueButtonComponent
                    disabled={false}
                    loadingState={isLoading}
                    buttonType="submit"
                    title="Verify"
                    styles={{ flex: "1" }}
                  />
                </div>
              </form>
            )}

            <div style={{ ...CenteringGrid, margin: ".8rem auto" }}>
              <Typography
                style={Subtitle}
                onClick={() => navigate("/register")}
              >
                Don&apos;t have an account?{" "}
                <span
                  style={{
                    cursor: "pointer",
                    color: "#155eef",
                    fontWeight: 700,
                  }}
                >
                  Sign up
                </span>
              </Typography>
            </div>
            <div
              style={{
                position: "relative",
                bottom: "-10dvh",
              }}
            >
              <FooterComponent />
            </div>
          </Grid>
        </Grid>
        <Grid
          display={(isSmallDevice || isMediumDevice) && "none"}
          id="section-img-login-component"
          item
          md={6}
          lg={6}
        ></Grid>
      </Grid>
      {openMultipleCompanies && (
        <ModalMultipleCompanies
          data={dataPassed.current}
          openMultipleCompanies={openMultipleCompanies}
          setOpenMultipleCompanies={setOpenMultipleCompanies}
        />
      )}
      {updatePasswordModalState && (
        <ForgotPassword
          open={updatePasswordModalState}
          close={setUpdatePasswordModalState}
        />
      )}
    </Suspense>
  );
};

Login.propTypes = {
  eventInfoDetail: PropTypes.shape({
    address: PropTypes.string,
    eventName: PropTypes.string,
  }),
  company: PropTypes.string,
  subscription: PropTypes.string,
  qrCodeLink: PropTypes.string,
  email: PropTypes.string,
  password: PropTypes.string,
  company_name: PropTypes.string,
  company_data: PropTypes.object,
  role: PropTypes.string,
};

export default Login;
