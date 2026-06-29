/* eslint-disable react/prop-types */
import { Icon } from "@iconify/react/dist/iconify.js";
import { FormLabel, Grid, InputAdornment, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { message, Progress } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import Input from "../../components/UX/inputs/Input";
import FooterComponent from "../../components/general/FooterComponent";
import HidenIcon from "../../components/icons/HidenIcon";
import VisibleIcon from "../../components/icons/VisibleIcon";
import { onLogin } from "../../store/slices/adminSlice";
import { Subtitle } from "../../styles/global/Subtitle";
import "../../styles/global/ant-select.css";
import { LEGACY_ROLE_MAP } from "../../config/roles";
import DevitrakTermsAndConditions from "./actions/DevitrakTermsAndConditions";
import "./style/authStyle.css";

const InvitationLanding = () => {
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [first, setFirst] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [acceptanceTermsAndPoliciesResult, setAcceptanceTermsAndPoliciesResult] = useState(null);

  // URL parameters
  const params    = new URLSearchParams(window.location.search);
  const firstName = params.get("first");
  const lastName  = params.get("last");
  const email     = params.get("email");
  const company   = params.get("company");
  const role      = params.get("role"); // numérico legado — mantener para compatibilidad
  // roleType: preferir el string explícito; si no existe, convertir el numérico con LEGACY_ROLE_MAP
  const roleType  = params.get("roleType") ?? LEGACY_ROLE_MAP[Number(role)] ?? "assistant";

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { firstName, lastName, email, role, password: "", password2: "" },
  });

  const watchPassword  = watch("password");
  const watchPassword2 = watch("password2");

  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery("only screen and (min-width : 769px) and (max-width : 992px)");

  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const newUser   = useRef(null);
  const [messageApi, contextHolder] = message.useMessage();

  // ── API queries ─────────────────────────────────────────────────────────────
  const allStaffSavedQuery = useQuery({
    queryKey: ["staff"],
    queryFn: () => devitrakApi.post("/staff/__staff-search", { email }),
    enabled: !!email,
    staleTime: 60 * 60,
  });

  const companiesQuery = useQuery({
    queryKey: ["companyListQuery"],
    queryFn: () => devitrakApi.post("/company/search-company", { _id: company }),
    enabled: !!email,
    staleTime: 60 * 60,
  });

  // ── Derivaciones ────────────────────────────────────────────────────────────
  const existingUser = useMemo(() => {
    const users = allStaffSavedQuery.data?.data?.adminUsers ?? [];
    if (users.length === 0) return null;
    const found = users.at(-1);
    newUser.current = found;
    return found;
  }, [allStaffSavedQuery.data]);

  const isNewUser = allStaffSavedQuery.isSuccess && existingUser === null;

  // T&C modal solo para usuario nuevo
  const shouldShowDrawer = useMemo(() => {
    return first && isNewUser && !!companiesQuery.data;
  }, [first, isNewUser, companiesQuery.data]);

  // ── Password helpers ─────────────────────────────────────────────────────────
  const calculatePasswordStrength = (password) => {
    if (!password) return 0;
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*(),.?":{}|<>]/.test(password),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  };

  const getStrengthInfo = (strength) => {
    if (strength < 40) return { text: "Weak",   color: "#ff4d4f" };
    if (strength < 70) return { text: "Fair",   color: "#faad14" };
    if (strength < 90) return { text: "Good",   color: "#52c41a" };
    return               { text: "Strong", color: "#389e0d" };
  };

  const strengthInfo = getStrengthInfo(passwordStrength);

  useEffect(() => {
    setPasswordStrength(watchPassword ? calculatePasswordStrength(watchPassword) : 0);
  }, [watchPassword]);

  useEffect(() => {
    if (watchPassword && watchPassword2) setPasswordMatch(watchPassword === watchPassword2);
    else setPasswordMatch(true);
  }, [watchPassword, watchPassword2]);

  // ── Helpers de API ───────────────────────────────────────────────────────────
  const warning = (type, content) => {
    messageApi.open({ type, content });
  };

  // Endpoint consolidado: maneja MongoDB + SQL (staff_member + company_staff) en un solo call
  const callAcceptInvitation = async (password = undefined) => {
    const hostCompanyInfo = companiesQuery.data.data.company.at(-1);
    const payload = {
      user: {
        name: firstName,
        lastName,
        email,
        ...(password ? { password } : {}),
      },
      company: { company_name: hostCompanyInfo.company_name },
      roleType,
    };
    const resp = await devitrakApi.post("/registration/accept-invitation", payload);
    return resp.data;
  };

  // Para usuario existente: también actualiza companiesAssigned en MongoDB
  const linkExistingUserToCompany = async () => {
    const hostCompanyInfo = companiesQuery.data.data.company.at(-1);
    await devitrakApi.patch(`/staff/edit-admin/${existingUser.id}`, {
      multipleCompanies: true,
      companiesAssigned: [
        ...(existingUser.companiesAssigned ?? []),
        { company: hostCompanyInfo.company_name, active: true, super_user: false, role },
      ],
    });
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleAcceptInvitation = async () => {
    try {
      setLoadingStatus(true);
      await Promise.all([
        callAcceptInvitation(),        // MongoDB employees + SQL staff_member + company_staff
        linkExistingUserToCompany(),   // companiesAssigned en AdminUser MongoDB
      ]);
      warning("success", "Invitation accepted. Please sign in to access your account.");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Invitation accept error:", error);
      warning("error", error?.response?.data?.msg ?? "Something went wrong. Please try later.");
      setLoadingStatus(false);
    }
  };

  const handleNewUserSubmit = async (data) => {
    if (data.password !== data.password2) {
      return warning("error", "Passwords must match.");
    }
    try {
      setLoadingStatus(true);
      const result = await callAcceptInvitation(data.password);
      // Actualizar T&C si aplica
      if (acceptanceTermsAndPoliciesResult?.acceptanceInfo?.id && result.user?.uid) {
        await devitrakApi.patch(`/devitrak/${acceptanceTermsAndPoliciesResult.acceptanceInfo.id}`, {
          staff_id: result.user.uid,
          email,
        }).catch(() => {});
      }
      warning("success", "Registration complete. Please sign in to access your account.");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Registration error:", error);
      warning("error", error?.response?.data?.msg ?? "Something went wrong. Please try later.");
      setLoadingStatus(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (!allStaffSavedQuery.isSuccess || !companiesQuery.isSuccess) {
    return (
      <>
        {contextHolder}
        <Grid style={{ backgroundColor: "var(--basewhite)", height: "100dvh" }} container>
          <Grid item xs={12} display="flex" justifyContent="center" alignItems="center" flexDirection="column" gap={2}>
            <Icon icon="svg-spinners:ring-resize" width={40} height={40} color="#155eef" />
            <Typography style={{ color: "#667085", fontSize: "16px", fontFamily: "Inter" }}>
              Verifying your invitation...
            </Typography>
          </Grid>
        </Grid>
      </>
    );
  }

  const hostCompanyInfo = companiesQuery.data.data.company.at(-1);

  // ── Existing user: pantalla de confirmación ──────────────────────────────────
  if (existingUser) {
    return (
      <>
        {contextHolder}
        <Grid style={{ backgroundColor: "var(--basewhite)", height: "100dvh" }} container>
          <Grid
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            item
            xs={12}
            sm={12}
            md={6}
            lg={6}
            style={{ padding: isSmallDevice ? "2rem 1rem" : "0 3rem" }}
          >
            <div style={{ width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Header */}
              <div>
                <Typography style={{ color: "#101828", fontSize: "30px", fontFamily: "Inter", fontWeight: 600, lineHeight: "38px", marginBottom: "8px" }}>
                  Welcome back!
                </Typography>
                <Typography style={{ color: "#667085", fontSize: "16px", fontFamily: "Inter", lineHeight: "24px" }}>
                  You have been invited to join a new company.
                </Typography>
              </div>

              {/* User info card */}
              <div style={{ border: "1px solid #EAECF0", borderRadius: "12px", padding: "20px", backgroundColor: "#F9FAFB", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#EFF4FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon icon="mdi:account-outline" width={22} height={22} color="#155eef" />
                  </div>
                  <div>
                    <Typography style={{ fontSize: "14px", fontWeight: 600, color: "#101828", fontFamily: "Inter" }}>
                      {existingUser.name} {existingUser.lastName}
                    </Typography>
                    <Typography style={{ fontSize: "13px", color: "#667085", fontFamily: "Inter" }}>
                      {email}
                    </Typography>
                  </div>
                </div>

                <div style={{ height: "1px", backgroundColor: "#EAECF0" }} />

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#EFF4FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon icon="mdi:office-building-outline" width={22} height={22} color="#155eef" />
                  </div>
                  <div>
                    <Typography style={{ fontSize: "12px", color: "#667085", fontFamily: "Inter" }}>
                      Invited to
                    </Typography>
                    <Typography style={{ fontSize: "14px", fontWeight: 600, color: "#101828", fontFamily: "Inter" }}>
                      {hostCompanyInfo?.company_name}
                    </Typography>
                  </div>
                </div>
              </div>

              {/* Info note */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", backgroundColor: "#EFF8FF", borderRadius: "8px", padding: "12px 16px", border: "1px solid #B2DDFF" }}>
                <Icon icon="mdi:information-outline" width={18} height={18} color="#0086C9" style={{ marginTop: "2px", flexShrink: 0 }} />
                <Typography style={{ fontSize: "13px", color: "#026AA2", fontFamily: "Inter", lineHeight: "20px" }}>
                  Your existing account will be linked to this company. No password change required.
                </Typography>
              </div>

              {/* Accept button */}
              <BlueButtonComponent
                title="Accept invitation"
                func={handleAcceptInvitation}
                disabled={loadingStatus}
                loadingState={loadingStatus}
                styles={{ width: "100%" }}
              />

              <Typography style={{ ...Subtitle, textAlign: "center" }}>
                Not you?{" "}
                <Link to="/login" style={{ color: "#004EEB", fontWeight: 600, fontSize: "14px", fontFamily: "Inter" }}>
                  Sign in with a different account
                </Link>
              </Typography>
            </div>
          </Grid>

          <Grid display={(isSmallDevice || isMediumDevice) ? "none" : "block"} id="section-img-login-component" item md={6} lg={6} />
        </Grid>
        <div style={{ position: "absolute", left: "50px", bottom: "25px" }}>
          <FooterComponent />
        </div>
      </>
    );
  }

  // ── New user: formulario de registro ─────────────────────────────────────────
  return (
    <>
      {contextHolder}
      {shouldShowDrawer && (
        <DevitrakTermsAndConditions
          open={shouldShowDrawer}
          setOpen={() => setFirst(false)}
          navigate={navigate}
          company_id={company}
          staffMember={`${firstName} ${lastName}`}
          setAcceptanceTermsAndPoliciesResult={setAcceptanceTermsAndPoliciesResult}
          staffEmail={email}
        />
      )}
      <Grid style={{ backgroundColor: "var(--basewhite)", height: "100dvh" }} container>
        <Grid display="flex" flexDirection="column" item xs={12} sm={12} md={6} lg={6}>
          <Grid
            container
            display="flex"
            flexDirection="column"
            justifyContent="space-around"
            alignItems="center"
            style={{ overflow: "auto", height: "auto" }}
          >
            <Grid
              className="register-container"
              display="flex"
              flexDirection="column"
              style={{ padding: isSmallDevice ? "0.5rem" : "0.5rem 2rem" }}
              container
            >
              <form className="register-form-container" onSubmit={handleSubmit(handleNewUserSubmit)}>
                {/* Header */}
                <Grid item xs={12} display="flex" flexDirection="column" justifyContent="space-around" alignItems="center">
                  <Typography style={{ color: "#101828", fontSize: "30px", fontFamily: "Inter", fontWeight: 600, lineHeight: "38px", marginBottom: "1rem" }}>
                    Complete your registration
                  </Typography>
                  <Typography style={{ color: "#667085", fontSize: "16px", fontFamily: "Inter", lineHeight: "24px" }}>
                    You have been invited to <strong>{hostCompanyInfo?.company_name}</strong>. Set a password to finish.
                  </Typography>
                </Grid>

                {/* Email — disabled, from URL */}
                <Grid marginY="20px" marginX={0} textAlign="left" item xs={12}>
                  <FormLabel style={{ marginBottom: "0.5rem" }}>Email</FormLabel>
                  <Input disabled value={email} placeholder="Enter your email" type="email" fullWidth />
                </Grid>

                {/* Name — disabled, from URL */}
                <Grid marginY="20px" marginX={0} textAlign="left" item xs={12}>
                  <FormLabel style={{ marginBottom: "0.5rem" }}>Name</FormLabel>
                  <Input disabled value={firstName} type="text" placeholder="Enter your name" fullWidth />
                </Grid>

                {/* Last name — disabled, from URL */}
                <Grid marginY="20px" marginX={0} textAlign="left" item xs={12}>
                  <FormLabel style={{ marginBottom: "0.5rem" }}>Last name</FormLabel>
                  <Input disabled value={lastName} type="text" placeholder="Enter your last name" fullWidth />
                </Grid>

                {/* Company — disabled */}
                <Grid marginY="20px" marginX={0} textAlign="left" item xs={12}>
                  <FormLabel style={{ marginBottom: "0.5rem" }}>Company</FormLabel>
                  <Input disabled value={hostCompanyInfo?.company_name || ""} type="text" placeholder="Company name" fullWidth />
                </Grid>

                {/* Password */}
                <Grid marginY="20px" marginX={0} textAlign="left" item xs={12}>
                  <FormLabel style={{ marginBottom: "0.5rem" }}>
                    Password <span style={{ fontWeight: 800 }}>*</span>
                  </FormLabel>
                  <Input
                    {...register("password", {
                      required: "Password is required",
                      minLength: { value: 8, message: "Password must be at least 8 characters" },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/,
                        message: "Password must contain uppercase, lowercase, number, and special character",
                      },
                    })}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    placeholder="Enter a strong password"
                    required
                    disabled={loadingStatus}
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    endAdornment={
                      <InputAdornment position="end">
                        <button
                          type="button"
                          style={{ padding: 0, backgroundColor: "transparent", outline: "none", margin: 0, width: "fit-content", aspectRatio: "1", borderRadius: "50%", border: "none", cursor: "pointer" }}
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <VisibleIcon fill="var(--blue-dark-600)" /> : <HidenIcon stroke="var(--blue-dark-600)" />}
                        </button>
                      </InputAdornment>
                    }
                  />
                  {watchPassword && (
                    <div style={{ marginTop: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <Typography style={{ fontSize: "12px", color: "#667085" }}>Password strength</Typography>
                        <Typography style={{ fontSize: "12px", color: strengthInfo.color, fontWeight: 500 }}>{strengthInfo.text}</Typography>
                      </div>
                      <Progress percent={passwordStrength} strokeColor={strengthInfo.color} showInfo={false} size="small" />
                      <Typography style={{ fontSize: "11px", color: "#667085", marginTop: "4px" }}>
                        Use 8+ characters with uppercase, lowercase, numbers, and symbols
                      </Typography>
                    </div>
                  )}
                </Grid>

                {/* Confirm password */}
                <Grid marginY="20px" marginX={0} textAlign="left" item xs={12}>
                  <FormLabel style={{ marginBottom: "0.5rem" }}>
                    Confirm password <span style={{ fontWeight: 800 }}>*</span>
                  </FormLabel>
                  <Input
                    required
                    disabled={loadingStatus}
                    {...register("password2", {
                      required: "Please confirm your password",
                      validate: (value) => value === watchPassword || "Passwords do not match",
                    })}
                    error={(!passwordMatch && !!watchPassword2) || !!errors.password2}
                    helperText={errors.password2?.message}
                    placeholder="Confirm your password"
                    type={showConfirmPassword ? "text" : "password"}
                    fullWidth
                    endAdornment={
                      <InputAdornment position="end">
                        <button
                          type="button"
                          style={{ padding: 0, backgroundColor: "transparent", outline: "none", margin: 0, width: "fit-content", aspectRatio: "1", borderRadius: "50%", border: "none", cursor: "pointer" }}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <VisibleIcon fill="var(--blue-dark-600)" /> : <HidenIcon stroke="var(--blue-dark-600)" />}
                        </button>
                      </InputAdornment>
                    }
                  />
                  {watchPassword2 && (
                    <div style={{ display: "flex", alignItems: "center", marginTop: "4px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: passwordMatch ? "#52c41a" : "#ff4d4f", marginRight: "6px" }} />
                      <Typography style={{ fontSize: "12px", color: passwordMatch ? "#52c41a" : "#ff4d4f" }}>
                        {passwordMatch ? "Passwords match" : "Passwords do not match"}
                      </Typography>
                    </div>
                  )}
                </Grid>

                {/* Submit */}
                <Grid marginY="20px" marginX={0} textAlign="left" display="flex" justifyContent="space-between" alignItems="center" item xs={12}>
                  <BlueButtonComponent
                    title="Complete registration"
                    buttonType="submit"
                    disabled={loadingStatus}
                    styles={{ width: "100%" }}
                    loadingState={loadingStatus}
                  />
                </Grid>

                <Grid item xs={12} justifyContent="center" alignItems="center">
                  <Typography style={{ color: "#475467", fontSize: "14px", fontFamily: "Inter", lineHeight: "20px" }}>
                    Already have an account?{" "}
                    <Link to="/login">
                      <button
                        type="button"
                        onClick={() => dispatch(onLogin({ name: "", lastName: "", email: "", password: "", company: "", role: "" }))}
                        style={{ color: "#004EEB", fontSize: "14px", fontFamily: "Inter", fontWeight: 600, lineHeight: "20px", cursor: "pointer", backgroundColor: "transparent", border: "none", padding: 0, margin: 0 }}
                      >
                        Sign in
                      </button>
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
        <Grid display={(isSmallDevice || isMediumDevice) ? "none" : "block"} id="section-img-login-component" item md={6} lg={6} />
      </Grid>
    </>
  );
};

export default InvitationLanding;
