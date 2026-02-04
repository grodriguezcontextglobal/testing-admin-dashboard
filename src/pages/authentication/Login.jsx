/* eslint-disable no-unused-vars */
import {
  // FormControlLabel,
  FormLabel,
  Grid,
  InputAdornment
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
import HidenIcon from "../../components/icons/HidenIcon";
import VisibleIcon from "../../components/icons/VisibleIcon";
import { checkArray } from "../../components/utils/checkArray";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import Input from "../../components/UX/inputs/Input";
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
import { Subtitle } from "../../styles/global/Subtitle";
import { TextFontSize30LineHeight38 } from "../../styles/global/TextFontSize30LineHeight38";
import Header from "./login/Header";
import Email from "./login/sections/Email";
import MFA from "./login/sections/MFA";
import Password from "./login/sections/Password";
import "./style/authStyle.css";
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
    [api],
  );

  const dataPassed = useRef(null);

  const addingEventState = useCallback(async (props) => {
    const sqpFetchInfo = await devitrakApi.post(
      "/db_event/events_information",
      {
        zip_address: props.eventInfoDetail.address.split(" ").at(-1),
        event_name: props.eventInfoDetail.eventName,
      },
    );
    if (sqpFetchInfo.data.ok) {
      dispatch(onSelectEvent(props.eventInfoDetail.eventName));
      dispatch(onSelectCompany(props.company));
      dispatch(
        onAddEventData({ ...props, sql: sqpFetchInfo.data.events.at(-1) }),
      );
      dispatch(onAddSubscription(props.subscription));
      dispatch(
        onAddQRCodeLink(
          props.qrCodeLink ??
            `https://app.devitrak.net/?event=${encodeURI(
              props.eventInfoDetail.eventName,
            )}&company=${encodeURI(props.company)}`,
        ),
      );
      dispatch(
        onAddListEventPermitPerAdmin({
          active: [{ ...props }],
          completed: [],
        }),
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
            props.eventInfoDetail.eventName,
          )}&company=${encodeURI(props.company)}`,
      ),
    );
    dispatch(
      onAddListEventPermitPerAdmin({
        active: [{ ...props }],
        completed: [],
      }),
    );

    return navigate("/events/event-quickglance");
  }, []);

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
            "Event is ended. Please contact event administrator.",
          );
        } catch (error) {
          openNotificationWithIcon("error", "Failed to fetch event data.");
        }
      } else {
        navigate("/");
      }
    },
    [navigate, addingEventState, openNotificationWithIcon],
  );

  const loginIntoOneCompanyAccount = async ({ props }) => {
    try {
      localStorage.setItem("admin-token", props.respo.token);
      const updatingOnlineStatusResponse = await devitrakApiAdmin.patch(
        `/profile/${props.respo.uid}`,
        {
          online: true,
        },
      );
      const respoFindMemberInfo = await devitrakApi.post(
        "/db_staff/consulting-member",
        {
          email: props.email,
        },
      );
      const companyInfoTable = await devitrakApi.post(
        "/db_company/consulting-company",
        {
          company_name: props.company_name,
        },
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
          preference: props.respo.entire.preference,
          subscription: {},
        }),
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

  /**
   * Handles login submission including MFA verification.
   *
   * Refactored MFA Error Handling:
   * - If an error occurs during MFA verification (currentStep === 'mfa'), the component
   *   checks if it's a standard authentication failure (e.g., "Invalid MFA Code").
   * - In these cases, it PREVENTS the default behavior of resetting the form to the email step.
   * - Instead, it clears the MFA input and allows the user to retry immediately.
   * - Route navigation/reset only occurs for critical errors (e.g., session conflict) or
   *   if the user explicitly chooses to go back.
   */
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
        companyResponse.data.company,
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
          "No active company assignments found.",
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
            responseData?.msg || "Invalid MFA Code",
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
            return error.response?.data?.msg || "An error occurred";
        }
      };
      openNotificationWithIcon("error", message());

      // If we are in MFA step and the error is not a session conflict, allow retry
      if (
        currentStep === "mfa" &&
        error.response?.data?.msg !==
          "Active session already exists for this account. If this is you, please use 'Force Login' to end the previous session."
      ) {
        setValue("mfaCode", ""); // Clear invalid code
        return; // Stay on MFA step
      }

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
        (element) => element.user === email && element.active,
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
    "only screen and (min-width: 769px) and (max-width:992px)",
  );
  const isLargeDevice = useMediaQuery(
    "only screen and (min-width : 993px) and (max-width : 1200px)",
  );
  const isExtraLargeDevice = useMediaQuery(
    "only screen and (min-width : 1201px)",
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
            <Input
              required
              {...register("password", { required: true, minLength: 6 })}
              placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;"
              type={showPassword ? "text" : "password"}
              label="Password"
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
              func={() => {
                setForceLogin(true);
                setTimeout(() => {
                  openNotificationWithIcon(
                    "success",
                    "Force login success. Close all pop up to continue and log in with the regular login process.",
                  );
                }, 900);
              }}
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
            <Header
              currentStep={currentStep}
              userEmail={userEmail}
              TextFontSize30LineHeight38={TextFontSize30LineHeight38}
            />
            {/* Email Step */}
            {currentStep === "email" && (
              <Email
                Checkbox={Checkbox}
                handleSubmit={handleSubmit}
                onSubmitEmail={onSubmitEmail}
                formFittingTrigger={formFittingTrigger}
                Grid={Grid}
                FormLabel={FormLabel}
                Input={Input}
                BlueButtonComponent={BlueButtonComponent}
                isLoading={isLoading}
                forceLogin={forceLogin}
                register={register}
              />
            )}

            {/* Password Step */}
            {currentStep === "password" && (
              <Password 
                Checkbox={Checkbox}
                handleSubmit={handleSubmit}
                onSubmitLogin={onSubmitLogin}
                formFittingTrigger={formFittingTrigger}
                Grid={Grid}
                FormLabel={FormLabel}
                Input={Input}
                BlueButtonComponent={BlueButtonComponent}
                isLoading={isLoading}
                forceLogin={forceLogin}
                register={register}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                setUpdatePasswordModalState={setUpdatePasswordModalState}
                setRememberMe={setRememberMe}
                handleBackToEmail={handleBackToEmail}
              />
            )}

            {/* MFA Step */}
            {currentStep === "mfa" && (
              <MFA
                handleSubmit={handleSubmit}
                onSubmitLogin={onSubmitLogin}
                formFittingTrigger={formFittingTrigger}
                Grid={Grid}
                FormLabel={FormLabel}

                Input={Input}
                BlueButtonComponent={BlueButtonComponent}
                isLoading={isLoading} 
                forceLogin={forceLogin}
                register={register}
              />
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
                // bottom: "-10dvh",
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
