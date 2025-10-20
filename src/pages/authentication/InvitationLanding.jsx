/* eslint-disable react/prop-types */
import {
  FormLabel,
  Grid,
  InputAdornment,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { message, Progress } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import FooterComponent from "../../components/general/FooterComponent";
import HidenIcon from "../../components/icons/HidenIcon";
import VisibleIcon from "../../components/icons/VisibleIcon";
import { onLogin } from "../../store/slices/adminSlice";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../styles/global/Subtitle";
import "../../styles/global/ant-select.css";
import DevitrakTermsAndConditions from "./actions/DevitrakTermsAndConditions";
import "./style/authStyle.css";

const InvitationLanding = () => {
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [first, setFirst] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMatch, setPasswordMatch] = useState(true);

  // URL parameters
  const firstName = new URLSearchParams(window.location.search).get("first");
  const lastName = new URLSearchParams(window.location.search).get("last");
  const email = new URLSearchParams(window.location.search).get("email");
  const company = new URLSearchParams(window.location.search).get("company");
  const role = new URLSearchParams(window.location.search).get("role");
  const [
    acceptanceTermsAndPoliciesResult,
    setAcceptanceTermsAndPoliciesResult,
  ] = useState(null);
  // Form setup with proper destructuring
  const {
    register,
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName,
      lastName,
      email,
      role,
      password: "",
      password2: "",
    },
  });

  // Watch password fields for validation
  const watchPassword = watch("password");
  const watchPassword2 = watch("password2");

  // Media queries
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );

  // Hooks
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const newUser = useRef(null);
  const [messageApi, contextHolder] = message.useMessage();

  // API queries
  const allStaffSavedQuery = useQuery({
    queryKey: ["staff"],
    queryFn: () => devitrakApi.post("/staff/admin-users", { email: email }),
    enabled: !!email,
    staleTime: 60 * 60,
  });

  const sqlSavedStaffQuery = useQuery({
    queryKey: ["sqlStaffMember"],
    queryFn: () =>
      devitrakApi.post("/db_staff/consulting-member", { email: email }),
    enabled: !!email,
    staleTime: 60 * 60,
  });

  const companiesQuery = useQuery({
    queryKey: ["companyListQuery"],
    queryFn: () =>
      devitrakApi.post("/company/search-company", {
        _id: company,
      }),
    enabled: !!email,
    staleTime: 60 * 60,
  });

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    if (!password) return 0;

    let strength = 0;
    const checks = [
      password.length >= 8, // Length check
      /[a-z]/.test(password), // Lowercase
      /[A-Z]/.test(password), // Uppercase
      /\d/.test(password), // Numbers
      /[!@#$%^&*(),.?":{}|<>]/.test(password), // Special characters
    ];

    strength = (checks.filter(Boolean).length / checks.length) * 100;
    return Math.round(strength);
  };

  // Password strength info
  const getStrengthInfo = (strength) => {
    if (strength < 40) {
      return { text: "Weak", color: "#ff4d4f" };
    } else if (strength < 70) {
      return { text: "Fair", color: "#faad14" };
    } else if (strength < 90) {
      return { text: "Good", color: "#52c41a" };
    } else {
      return { text: "Strong", color: "#389e0d" };
    }
  };

  const strengthInfo = getStrengthInfo(passwordStrength);

  // Update password strength when password changes
  useEffect(() => {
    if (watchPassword) {
      const strength = calculatePasswordStrength(watchPassword);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [watchPassword]);

  // Update password match when passwords change
  useEffect(() => {
    if (watchPassword && watchPassword2) {
      setPasswordMatch(watchPassword === watchPassword2);
    } else {
      setPasswordMatch(true);
    }
  }, [watchPassword, watchPassword2]);

  // Determine if drawer should show
  const shouldShowDrawer = useMemo(() => {
    if (!allStaffSavedQuery.data || !companiesQuery.data) {
      return false;
    }

    const userExistsInOtherCompany =
      allStaffSavedQuery.data.data.adminUsers &&
      allStaffSavedQuery.data.data.adminUsers.length > 0;

    return first && !userExistsInOtherCompany;
  }, [first, allStaffSavedQuery.data, companiesQuery.data]);

  // Warning message function
  const warning = (type, content) => {
    messageApi.open({
      type: type,
      content: content,
      onClose: () => {
        setValue("password", "");
        setValue("password2", "");
      },
    });
  };

  // Helper functions
  const displayMaskedPassword = (password) => {
    return "*".repeat(password.length);
  };

  const checkIfUserExistsInOtherCompany = () => {
    if (
      allStaffSavedQuery.data?.data?.adminUsers &&
      allStaffSavedQuery.data.data.adminUsers.length > 0
    ) {
      const existingUser = allStaffSavedQuery.data.data.adminUsers.at(-1);
      newUser.current = existingUser;
      return existingUser;
    }
    return null;
  };

  // Set password values for existing users - moved to useEffect to prevent infinite re-renders
  useEffect(() => {
    const existingUser = checkIfUserExistsInOtherCompany();
    if (existingUser) {
      setValue("password", displayMaskedPassword(existingUser.password));
      setValue("password2", displayMaskedPassword(existingUser.password));
    }
  }, [allStaffSavedQuery.data, setValue]);

  const createNewStaffSQL = async () => {
    return await devitrakApi.post("/db_staff/new_member", {
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone_number: "000-000-0000",
    });
  };

  const checkStaffInSQLDatabase = () => {
    if (sqlSavedStaffQuery.data?.data?.member?.length === 0) {
      return createNewStaffSQL();
    }
  };

  const updateExistingUser = async () => {
    if (!companiesQuery.data?.data?.company) return;

    const hostCompanyInfo = companiesQuery.data.data.company.at(-1);
    const resp = await devitrakApi.patch(
      `/staff/edit-admin/${newUser.current.id}`,
      {
        multipleCompanies: true,
        companiesAssigned: [
          ...newUser.current.companiesAssigned,
          {
            company: hostCompanyInfo.company_name,
            active: true,
            super_user: false,
            role: role,
          },
        ],
      }
    );

    if (resp.data.ok) {
      const findInvitedStaff = hostCompanyInfo.employees.findIndex(
        (element) => element.user === email
      );
      const employeesInCompany = [...hostCompanyInfo.employees];
      employeesInCompany[findInvitedStaff] = {
        ...employeesInCompany[findInvitedStaff],
        status: "Confirmed",
      };
      await devitrakApi.patch(`/company/update-company/${hostCompanyInfo.id}`, {
        employees: employeesInCompany,
      });
      return;
    }
  };

  const createNewUser = async (props) => {
    if (!companiesQuery.data?.data?.company) return;

    const hostCompanyInfo = companiesQuery.data.data.company.at(-1);
    const templateNewUser = {
      name: firstName,
      lastName: lastName,
      email: email,
      password: props.password,
      question: "What is the name of the company",
      answer: hostCompanyInfo.company_name,
      role: role,
      company: hostCompanyInfo.company_name,
      companiesAssigned: [
        {
          company: hostCompanyInfo.company_name,
          active: true,
          super_user: false,
          role: role,
        },
      ],
    };

    const resp = await devitrakApi.post(
      "/admin/new_admin_user",
      templateNewUser
    );

    if (resp.data.ok) {
      await devitrakApi.patch(
        `/devitrak/${acceptanceTermsAndPoliciesResult.acceptanceInfo.id}`,
        {
          staff_id: resp.data.uid,
          email: email,
        }
      );
      const findInvitedStaff = hostCompanyInfo.employees.findIndex(
        (element) => element.user === email
      );
      const employeesInCompany = [...hostCompanyInfo.employees];
      employeesInCompany[findInvitedStaff] = {
        ...employeesInCompany[findInvitedStaff],
        status: "Confirmed",
      };
      await devitrakApi.patch(`/company/update-company/${hostCompanyInfo.id}`, {
        employees: employeesInCompany,
      });
      await createNewStaffSQL();
    }
  };

  const completeSubmitInfo = async (data) => {
    try {
      setLoadingStatus(true);

      if (checkIfUserExistsInOtherCompany()) {
        await updateExistingUser();
      } else {
        if (data.password !== data.password2) {
          setLoadingStatus(false);
          return warning("error", "Passwords must match.");
        }
        await createNewUser(data);
      }

      await checkStaffInSQLDatabase();
      warning(
        "success",
        "Process completed successfully. Please go to log in to log in into your account."
      );
      return navigate("/login", { replace: true });
    } catch (error) {
      console.error("Registration error:", error);
      warning("error", "Something went wrong. Please try later.");
      setLoadingStatus(false);
    }
  };

  const closingModal = () => {
    return setFirst(false);
  };

  // Loading state
  if (!allStaffSavedQuery.data || !companiesQuery.data) {
    return (
      <>
        {contextHolder}
        <Grid
          style={{ backgroundColor: "var(--basewhite)", height: "100dvh" }}
          container
        >
          <Grid
            item
            xs={12}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Typography>Loading...</Typography>
          </Grid>
        </Grid>
      </>
    );
  }

  const hostCompanyInfo = companiesQuery.data.data.company.at(-1);

  return (
    <>
      {contextHolder}
      {shouldShowDrawer && (
        <DevitrakTermsAndConditions
          open={shouldShowDrawer}
          setOpen={() => closingModal()}
          navigate={navigate}
          company_id={company}
          staffMember={`${firstName} ${lastName}`}
          setAcceptanceTermsAndPoliciesResult={
            setAcceptanceTermsAndPoliciesResult
          }
          staffEmail={email}
        />
      )}
      <Grid
        style={{ backgroundColor: "var(--basewhite)", height: "100dvh" }}
        container
      >
        <Grid
          display={"flex"}
          flexDirection={"column"}
          item
          xs={12}
          sm={12}
          md={6}
          lg={6}
        >
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
              height: "auto",
            }}
          >
            <Grid
              className="register-container"
              display={"flex"}
              flexDirection={"column"}
              style={{ padding: `${isSmallDevice ? "0.5rem" : "0.5rem 2rem"}` }}
              container
            >
              <form
                className="register-form-container"
                onSubmit={handleSubmit(completeSubmitInfo)}
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
                    {checkIfUserExistsInOtherCompany() !== null
                      ? `Welcome back to devitrak App`
                      : `Welcome to devitrak App`}
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
                    Email
                  </FormLabel>
                  <OutlinedInput
                    disabled
                    value={email}
                    style={OutlinedInputStyle}
                    placeholder="Enter your email"
                    type="email"
                    fullWidth
                  />
                  <FormLabel style={{ marginBottom: "0.5rem" }}>
                    <Typography style={Subtitle}>
                      You need to enter a password to complete registration
                      process with the company invitation.
                    </Typography>
                  </FormLabel>
                </Grid>

                <Grid
                  marginY={"20px"}
                  marginX={0}
                  textAlign={"left"}
                  item
                  xs={12}
                >
                  <FormLabel style={{ marginBottom: "0.5rem" }}>Name</FormLabel>
                  <OutlinedInput
                    disabled
                    type="text"
                    value={firstName}
                    style={OutlinedInputStyle}
                    placeholder="Enter your name"
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
                    Last name
                  </FormLabel>
                  <OutlinedInput
                    disabled
                    type="text"
                    value={lastName}
                    style={OutlinedInputStyle}
                    placeholder="Enter your last name"
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
                    Company
                  </FormLabel>
                  <Grid
                    item
                    xs={12}
                    display={"flex"}
                    alignItems={"center"}
                    justifyContent={"space-between"}
                  >
                    <OutlinedInput
                      disabled
                      type="text"
                      value={hostCompanyInfo?.company_name || ""}
                      style={OutlinedInputStyle}
                      placeholder="Company name"
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
                >
                  {/* Password field: apply rules only if user does not exist */}
                  <FormLabel style={{ marginBottom: "0.5rem" }}>
                    Password{" "}
                    {!checkIfUserExistsInOtherCompany() && (
                      <span style={{ fontWeight: 800 }}>*</span>
                    )}
                  </FormLabel>
                  <OutlinedInput
                    disabled={
                      loadingStatus ||
                      checkIfUserExistsInOtherCompany() !== null
                    }
                    {...register(
                      "password",
                      checkIfUserExistsInOtherCompany()
                        ? {}
                        : {
                            required: "Password is required",
                            minLength: {
                              value: 8,
                              message: "Password must be at least 8 characters",
                            },
                            pattern: {
                              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                              message:
                                "Password must contain uppercase, lowercase, and number",
                            },
                          }
                    )}
                    style={{
                      ...OutlinedInputStyle,
                      border:
                        !checkIfUserExistsInOtherCompany() &&
                        watch("password") === ""
                          ? "0.5px solid #ff4d4f"
                          : undefined,
                    }}
                    placeholder="Enter a strong password"
                    required={!checkIfUserExistsInOtherCompany()}
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    endAdornment={
                      !checkIfUserExistsInOtherCompany() && (
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
                              border: "none",
                              cursor: "pointer",
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
                      )
                    }
                  />
                  {/* Password strength indicator only for new users */}
                  {!checkIfUserExistsInOtherCompany() && watchPassword && (
                    <div style={{ marginTop: "8px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "4px",
                        }}
                      >
                        <Typography
                          style={{
                            fontSize: "12px",
                            color: "#667085",
                          }}
                        >
                          Password strength
                        </Typography>
                        <Typography
                          style={{
                            fontSize: "12px",
                            color: strengthInfo.color,
                            fontWeight: "500",
                          }}
                        >
                          {strengthInfo.text}
                        </Typography>
                      </div>
                      <Progress
                        percent={passwordStrength}
                        strokeColor={strengthInfo.color}
                        showInfo={false}
                        size="small"
                      />
                      <div style={{ marginTop: "4px" }}>
                        <Typography
                          style={{
                            fontSize: "11px",
                            color: "#667085",
                          }}
                        >
                          Use 8+ characters with uppercase, lowercase, numbers,
                          and symbols
                        </Typography>
                      </div>
                    </div>
                  )}
                  {/* Password validation error */}
                  {errors.password && (
                    <Typography
                      style={{
                        fontSize: "12px",
                        color: "#ff4d4f",
                        marginTop: "4px",
                      }}
                    >
                      {errors.password.message}
                    </Typography>
                  )}
                </Grid>

                <Grid
                  marginY={"20px"}
                  marginX={0}
                  textAlign={"left"}
                  item
                  xs={12}
                >
                  {/* // Confirm password field: apply rules only if user does not exist */}
                  <FormLabel style={{ marginBottom: "0.5rem" }}>
                    Confirm password{" "}
                    {!checkIfUserExistsInOtherCompany() && (
                      <span style={{ fontWeight: 800 }}>*</span>
                    )}
                  </FormLabel>
                  <OutlinedInput
                    required={!checkIfUserExistsInOtherCompany()}
                    disabled={
                      loadingStatus ||
                      checkIfUserExistsInOtherCompany() !== null
                    }
                    {...register(
                      "password2",
                      checkIfUserExistsInOtherCompany()
                        ? {}
                        : {
                            required: "Please confirm your password",
                            validate: (value) =>
                              value === watchPassword ||
                              "Passwords do not match",
                          }
                    )}
                    style={{
                      ...OutlinedInputStyle,
                      borderColor:
                        !checkIfUserExistsInOtherCompany() &&
                        ((!passwordMatch && watchPassword2) ||
                          watch("password2") === "")
                          ? "#ff4d4f"
                          : undefined,
                    }}
                    placeholder="Confirm your password"
                    type={showConfirmPassword ? "text" : "password"}
                    fullWidth
                    endAdornment={
                      !checkIfUserExistsInOtherCompany() && (
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
                              border: "none",
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {showConfirmPassword ? (
                              <VisibleIcon fill={"var(--blue-dark-600)"} />
                            ) : (
                              <HidenIcon stroke={"var(--blue-dark-600)"} />
                            )}
                          </button>
                        </InputAdornment>
                      )
                    }
                  />
                  {/* Password match indicator only for new users */}
                  {!checkIfUserExistsInOtherCompany() && watchPassword2 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginTop: "4px",
                      }}
                    >
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: passwordMatch
                            ? "#52c41a"
                            : "#ff4d4f",
                          marginRight: "6px",
                        }}
                      />
                      <Typography
                        style={{
                          fontSize: "12px",
                          color: passwordMatch ? "#52c41a" : "#ff4d4f",
                        }}
                      >
                        {passwordMatch
                          ? "Passwords match"
                          : "Passwords do not match"}
                      </Typography>
                    </div>
                  )}
                  {/* Confirm password validation error */}
                  {!checkIfUserExistsInOtherCompany() && errors.password2 && (
                    <Typography
                      style={{
                        fontSize: "12px",
                        color: "#ff4d4f",
                        marginTop: "4px",
                      }}
                    >
                      {errors.password2.message}
                    </Typography>
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
                  <BlueButtonComponent
                    title={"Submit registration"}
                    buttonType="submit"
                    disabled={loadingStatus}
                    styles={{ width: "100%" }}
                    loadingState={loadingStatus}
                  />
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
                      <button
                        type="button"
                        onClick={() =>
                          dispatch(
                            onLogin({
                              name: "",
                              lastName: "",
                              email: "",
                              password: "",
                              company: "",
                              role: "",
                            })
                          )
                        }
                        style={{
                          color: "#004EEB",
                          fontSize: "14px",
                          fontFamily: "Inter",
                          fontWeight: "600",
                          lineHeight: "20px",
                          cursor: "pointer",
                          backgroundColor: "transparent",
                          border: "none",
                          padding: "0",
                          margin: "0",
                        }}
                      >
                        Sign in
                      </button>
                    </Link>
                  </Typography>
                </Grid>
              </form>
            </Grid>
          </Grid>
          <div
            style={{
              position: "absolute",
              left: "50px",
              bottom: "25px",
              width: "100%",
            }}
          >
            <FooterComponent />
          </div>
        </Grid>
        <Grid
          display={(isSmallDevice || isMediumDevice) && "none"}
          id="section-img-login-component"
          item
          md={6}
          lg={6}
        ></Grid>
      </Grid>
    </>
  );
};

export default InvitationLanding;
