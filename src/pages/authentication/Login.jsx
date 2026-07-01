/* eslint-disable no-unused-vars */
import {
  // FormControlLabel,
  FormLabel,
  Grid,
  InputAdornment,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Checkbox, notification, Typography } from "antd";
import { jwtDecode } from "jwt-decode";
import PropTypes from "prop-types";
import { lazy, Suspense, useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi, devitrakApiAdmin } from "../../api/devitrakApi";
import Loading from "../../components/animation/Loading";
import FooterComponent from "../../components/general/FooterComponent";
// import HidenIcon from "../../components/icons/HidenIcon";
// import VisibleIcon from "../../components/icons/VisibleIcon";
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
import { setPermissions } from "../../store/slices/permissions";
import {
  buildActiveCompaniesFromSQL,
  buildSetPermissionsPayload,
  extractStaffId,
} from "./utils/loginUtils";
// import devitrakLoginLogo from "../../assets/devitrak_login.svg";
import { DevitrakLogo } from "../../components/icons/DevitrakLogo";
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
      if (props.roleType === "assistant") {
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
      const _decoded = jwtDecode(props.respo.token);
      if (_decoded?.sqlStaffId) localStorage.setItem("sqlStaffId", String(_decoded.sqlStaffId));
      const updatingOnlineStatusResponse = await devitrakApiAdmin.patch(
        `/profile/${props.respo.uid}`,
        {
          online: true,
        },
      );
      const companyInfoTable = await devitrakApi.post(
        "/db_company/consulting-company",
        {
          company_name: props.company_name,
        },
      );
      const rawCompanyData = companyInfoTable.data.companies;
      const companyRecord = Array.isArray(rawCompanyData)
        ? rawCompanyData.at(-1)
        : checkArray(rawCompanyData?.company);
      if (!companyRecord?.company_id) {
        throw new Error("Company SQL record not found. Please contact support.");
      }
      const stripeSQL = await devitrakApi.post("/db_stripe/consulting-stripe", {
        company_id: companyRecord.company_id,
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
          roleType: props.roleType,
          phone: props.respo.phone,
          company: props.company_name,
          token: props.respo.token,
          online: updatingOnlineStatusResponse.data.entire.online,
          companyData: props.company_data[0],
          sqlMemberInfo: props.sqlMemberInfo,
          sqlInfo: {
            ...companyRecord,
            stripeID: checkArray(stripeSQL.data.stripe),
          },
          preference: props.respo.entire.preference,
          subscription: {},
        }),
      );
      dispatch(setPermissions(buildSetPermissionsPayload({
        company: props.company_name,
        role: props.role,
        roleType: props.roleType,
        locations: props.locations,
      })));
      dispatch(onAddSubscription({}));
      dispatch(clearErrorMessage());
      queryClient.clear();
      openNotificationWithIcon("Success", "User logged in.");
      await navigateUserBasedOnRole({
        roleType: props.roleType,
        email: props.email,
      });
    } catch (error) {
      console.error("loginIntoOneCompanyAccount", error);
      const errorMsg = error?.response?.data?.msg ?? error.message;
      localStorage.removeItem("sqlStaffId");
      localStorage.removeItem("s-token-lq");
      openNotificationWithIcon("error", errorMsg);
      dispatch(onLogout("Incorrect credentials"));
      dispatch(onAddErrorMessage(errorMsg));
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

      const [loginResponse, mongoCompanyResponse] = await Promise.all([
        devitrakApiAdmin.post("/login", {
          email: loginData.email,
          password: loginData.password,
          rememberMe,
          forceLogin: forceLogin,
          mfaCode: loginData.mfaCode,
        }),
        devitrakApi.post("/company/search-company", { "employees.user": loginData.email }),
      ]);

      if (!loginResponse.data) {
        throw new Error("Authentication failed");
      }

      if (!mongoCompanyResponse.data || mongoCompanyResponse.data.company.length === 0) {
        throw new Error("Email not found in any company");
      }


      const tokenHeaders = {
        headers: {
          "x-token": loginResponse.data.token,
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      };

      // 1. Get staff_id first — this endpoint does NOT need sqlStaffId
      const staffMemberResponse = await devitrakApi.post(
        "/db_staff/consulting-member",
        { email: loginData.email });
      const staffId = extractStaffId(staffMemberResponse.data);
      if (staffId) localStorage.setItem("s-token-lq", String(staffId));

      // 2. Now call companies with sqlStaffId available
      const sqlCompaniesResponse = await devitrakApi.get("/db_staff/companies", {
        headers: {
          ...tokenHeaders.headers,
          ...(staffId ? { sqlStaffId: String(staffId) } : {}),
        },
      });

      const activeCompanies = buildActiveCompaniesFromSQL(
        sqlCompaniesResponse.data.companies ?? [],
      );

      if (activeCompanies.length > 1) {
        await handleMulitpleCompanyLogin({
          ...loginData,
          companyInfo: activeCompanies,
          company_data: mongoCompanyResponse.data.company,
          sqlMemberInfo: checkArray(staffMemberResponse.data.member),
          respo: loginResponse.data,
        });
      } else if (activeCompanies.length === 1) {
        await loginIntoOneCompanyAccount({
          props: {
            email: loginData.email,
            password: loginData.password,
            company_name: activeCompanies[0].company,
            role: activeCompanies[0].role,
            roleType: activeCompanies[0].roleType,
            locations: activeCompanies[0].locations,
            company_data: mongoCompanyResponse.data.company,
            sqlMemberInfo: checkArray(staffMemberResponse.data.member),
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

      // 401 on the companies endpoint means the token lacks sqlStaffId (legacy token).
      // Skip this handler if it's an MFA-required 401 from the login endpoint itself.
      if (error.response?.status === 401 && !isMfaRequired) {
        localStorage.removeItem("admin-token");
        localStorage.removeItem("sqlStaffId");
        localStorage.removeItem("s-token-lq");
        dispatch(onLogout());
        setCurrentStep("email");
        openNotificationWithIcon(
          "error",
          "Session expired or token is outdated. Please log in again.",
        );
        return;
      }

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

      localStorage.removeItem("sqlStaffId");
      localStorage.removeItem("s-token-lq");
      dispatch(onLogout("Incorrect credentials"));
      dispatch(onAddErrorMessage(error?.response?.data?.msg));

      // Reset form and go back to email step on error
      setValue("password", "");
      setCurrentStep("email");
      // setUserEmail("");
      setValue("email", "");
    } finally {
      setIsLoading(false);
      dispatch(clearErrorMessage());
    }
  };

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
  const isMobile = isSmallDevice || isMediumDevice;
  const formFittingTrigger = () => "100%";

  const handleSendForceLogoutEmail = async () => {
    try {
      const staffEmail = userEmail || null;
      if (!staffEmail) {
        openNotificationWithIcon("error", "Please enter your email address first.");
        return;
      }

      setIsLoading(true);
      await devitrakApi.post("/nodemailer/forcing-revoking-active-session", {
        email: staffEmail,
      });

      openNotificationWithIcon(
        "success",
        "An email has been sent to you to revoke the active session."
      );
      setForceLogin(false); // Close the modal
    } catch (error) {
      console.log(error)
      openNotificationWithIcon(
        "error",
        "Failed to send force logout email. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const forceEndActiveSession = () => {
    return (
      <div style={{ width: "100%", margin: "auto", flexDirection: "column" }}>
        <Typography style={{ width: "100%", marginBottom: "20px" }}>
          An active session already exists for this account. To continue, please
          send an email to end the previous session.
        </Typography>
        <BlueButtonComponent
          buttonType="button"
          func={handleSendForceLogoutEmail}
          title="Send email to revoke session"
          styles={{ width: "100%" }}
        />
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
      <section
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          minHeight: "100dvh",
          backgroundColor: "var(--basewhite)",
        }}
      >
        {/* Left column — form */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: "var(--basewhite)",
          }}
        >
          {/* Logo header — hidden on mobile */}
          {/* {!isMobile && (
            <header style={{ padding: "32px" }}>
              <DevitrakLogo />
            </header>
          )} */}

          {/* Centered form content */}
          <div
            style={{
              display: "flex",
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: isMobile ? "48px 16px" : "0 32px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "32px",
                width: "100%",
                maxWidth: "360px",
              }}
            >
              {/* Logo shown only on mobile */}
              {/* {isMobile && (
                <DevitrakLogo />
              )} */}

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

              <div style={{ ...CenteringGrid }}>
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
            </div>
          </div>

          {/* Footer — hidden on mobile */}
          {!isMobile && (
            <footer
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "32px",
              }}
            >
              <FooterComponent />
            </footer>
          )}
        </div>

        {/* Right column — image panel */}
        {!isMobile && (
          <div
            id="section-img-login-component"
            style={{ borderRadius: "80px 0 0 80px" }}
          />
        )}
      </section>

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
