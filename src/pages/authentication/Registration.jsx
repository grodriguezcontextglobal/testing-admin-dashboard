import { Icon } from "@iconify/react/dist/iconify.js";
import { FormLabel, Grid, InputAdornment, TextField, Typography } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Avatar, notification, Progress } from "antd";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import FooterComponent from "../../components/general/FooterComponent";
import { convertToBase64 } from "../../components/utils/convertToBase64";
import HidenIcon from "../../components/icons/HidenIcon";
import VisibleIcon from "../../components/icons/VisibleIcon";
import { onLogin } from "../../store/slices/adminSlice";
import { Subtitle } from "../../styles/global/Subtitle";
import "../../styles/global/ant-select.css";
import { devitrakApi } from "../../api/devitrakApi";
import { useCallback, useEffect, useState } from "react";
import { isValidEmail } from "../../components/utils/IsValidEmail";
import { checkArray } from "../../components/utils/checkArray";
import { UploadImagePlaceholder } from "../../components/icons/UpdateImagePlaceholder";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import Input from "../../components/UX/inputs/Input";
// import "./style/authStyle.css";
const Registration = () => {
  const { user } = useSelector((state) => state.admin);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      firstName: user.name,
      lastName: user.lastName,
      email: user.email,
      email_confirmation: user.email,
      password: user.password,
      password2: user.password,
    },
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMatch, setPasswordMatch] = useState(true);

  const watchPassword = watch("password");
  const watchPassword2 = watch("password2");

  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, title, msg) => {
    api.open({
      message: title,
      description: msg,
    });
  };

  const isSmallDevice = useMediaQuery("only screen abd (max-width: 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width: 769px) and (max-width:992px)",
  );
  const isLargeDevice = useMediaQuery(
    "only screen and (min-width : 993px) and (max-width : 1200px)",
  );
  const isExtraLargeDevice = useMediaQuery(
    "only screen abd (min-width: 1201px)",
  );

  const adjustingFormWidth = (arg1, arg2, arg3, arg4) => {
    if (isSmallDevice) return arg1; //"90vw";
    if (isMediumDevice) return arg2; //"50vw";
    if (isLargeDevice) return arg3; //"40vw";
    if (isExtraLargeDevice) return arg4; //"50vw";
  };
  const [userExists, setUserExists] = useState([]);
  const checkExistingUser = useCallback(
    async () => {
      const email = watch("email");
      if (!isValidEmail(email)) {
        setUserExists([]);
        return;
      }
      const response = await devitrakApi.post(`/staff/__staff-search`, { email });
      if (response.data) {
        setUserExists([...response.data.adminUsers]);
      }
    },
    [watch("email")],
  );

  useEffect(() => {
    const controller = new AbortController();
    checkExistingUser();
    return () => {
      controller.abort();
    };
  }, [watch("email")]);

  useEffect(() => {
    const controller = new AbortController();
    if (userExists.length > 0) {
      setValue("email", userExists[0].email);
      setValue("email_confirmation", userExists[0].email);
      setValue("password", userExists[0].password);
      setValue("password2", userExists[0].password);
      setValue("firstName", userExists[0].name);
      setValue("lastName", userExists[0].lastName);
      openNotificationWithIcon(
        "success",
        "Email already exists in our record.",
        "Please proceed to set up a company account.",
      );
    }
    return () => {
      controller.abort();
    };
  }, [userExists.length]);

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
    if (strength < 40) return { text: "Weak", color: "#ff4d4f" };
    if (strength < 70) return { text: "Fair", color: "#faad14" };
    if (strength < 90) return { text: "Good", color: "#52c41a" };
    return { text: "Strong", color: "#389e0d" };
  };

  const strengthInfo = getStrengthInfo(passwordStrength);

  useEffect(() => {
    setPasswordStrength(watchPassword ? calculatePasswordStrength(watchPassword) : 0);
  }, [watchPassword]);

  useEffect(() => {
    if (watchPassword && watchPassword2) {
      setPasswordMatch(watchPassword === watchPassword2);
    } else {
      setPasswordMatch(true);
    }
  }, [watchPassword, watchPassword2]);

  const onSubmitRegister = async (data) => {
    if (data.password !== data.password2)
      return openNotificationWithIcon(
        "error",
        "Action denied.",
        "Password must match.",
      );
    if (data.email !== data.email_confirmation)
      return openNotificationWithIcon(
        "error",
        "Action denied.",
        "Emails must match.",
      );
    if (userExists.length > 0) {
      openNotificationWithIcon(
        "success",
        "Email already exists in our record.",
        "Please proceed to set up a company account.",
      );
      const userData = checkArray(userExists);
      const newAdminUserTemplate = {
        existing: true,
        userID: userData.id,
        name: userData.name,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        role: "0",
        online: true,
        imageProfile: userData.imageProfile,
        rowImageProfile: "",
        data: {
          name: userData.name,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          imageProfile: userData.imageProfile,
        },
      };
      dispatch(onLogin(newAdminUserTemplate));
      return navigate("/register/company-setup");
    }
    try {
      let base64 = "";
      if (data.photo.length > 0) {
        base64 = await convertToBase64(data.photo[0]);
      } else if (user.imageProfile) {
        base64 = await convertToBase64(user.rowImageProfile);
      }
      const newAdminUserTemplate = {
        existing: false,
        name: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: "0",
        online: true,
        super_user: true,
        imageProfile: base64,
        rowImageProfile: data.photo[0],
        data: {
          name: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: "000-000-0000",
          imageProfile: base64,
        },
      };
      dispatch(onLogin(newAdminUserTemplate));
      navigate("/register/company-setup");
    } catch (error) {
      openNotificationWithIcon(
        "error",
        "Action was not accepted. Please try again later.",
        `${error.response}`,
      );
    }
  };

  return (
    <>
      {contextHolder}
      <Grid
        id="container-checking"
        container
        style={{
          backgroundColor: "var(--basewhite)",
          height: "100dvh",
          margin: 0,
          width: "100vw",
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
              }}
            >
              Welcome
            </p>
            <p
              style={{
                color: "var(--gray-500, #667085)",
                fontSize: "16px",
                fontFamily: "Inter",
                lineHeight: "24px",
              }}
            >
              Please enter your information
            </p>
          </Grid>

          <form
            className="register-form-container"
            onSubmit={handleSubmit(onSubmitRegister)}
            style={{
              width: adjustingFormWidth("90vw", "90vw", "45vw", "90vw"),
              padding: "0 20px 0 0",
            }}
          >
            <Grid marginY={"20px"} marginX={0} textAlign={"left"} item xs={12}>
              <FormLabel style={{ marginBottom: "0.5rem" }}>
                Email <span style={{ fontWeight: 800 }}>*</span>
              </FormLabel>
              <Input
                required={userExists.length < 1}
                {...register("email")}
                placeholder="Enter your email"
                type="email"
                fullWidth
              />
            </Grid>
            <Grid marginY={"20px"} marginX={0} textAlign={"left"} item xs={12}>
              <FormLabel style={{ marginBottom: "0.5rem" }}>
                Confirm email <span style={{ fontWeight: 800 }}>*</span>
              </FormLabel>
              <Input
                disabled={userExists.length > 0}
                required={userExists.length < 1}
                {...register("email_confirmation")}
                placeholder="Repeat your email"
                type="email_confirmation"
                fullWidth
              />
            </Grid>
            <Grid marginY={"20px"} marginX={0} textAlign={"left"} item xs={12}>
              <FormLabel style={{ marginBottom: "0.5rem" }}>
                Password{" "}
                {userExists.length < 1 && <span style={{ fontWeight: 800 }}>*</span>}
              </FormLabel>
              <Input
                disabled={userExists.length > 0}
                {...register(
                  "password",
                  userExists.length > 0
                    ? {}
                    : {
                        required: "Password is required",
                        minLength: {
                          value: 8,
                          message: "Password must be at least 8 characters",
                        },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/,
                          message:
                            "Password must contain uppercase, lowercase, number, and special character",
                        },
                      },
                )}
                error={!!errors.password}
                helperText={errors.password?.message}
                placeholder="Enter a strong password"
                required={userExists.length < 1}
                type={showPassword ? "text" : "password"}
                fullWidth
                endAdornment={
                  userExists.length < 1 && (
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
              {userExists.length < 1 && watchPassword && (
                <div style={{ marginTop: "8px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                    }}
                  >
                    <Typography style={{ fontSize: "12px", color: "#667085" }}>
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
                  <Typography style={{ fontSize: "11px", color: "#667085", marginTop: "4px" }}>
                    Use 8+ characters with uppercase, lowercase, numbers, and symbols
                  </Typography>
                </div>
              )}
            </Grid>
            <Grid marginY={"20px"} marginX={0} textAlign={"left"} item xs={12}>
              <FormLabel style={{ marginBottom: "0.5rem" }}>
                Repeat password{" "}
                {userExists.length < 1 && <span style={{ fontWeight: 800 }}>*</span>}
              </FormLabel>
              <Input
                disabled={userExists.length > 0}
                required={userExists.length < 1}
                {...register(
                  "password2",
                  userExists.length > 0
                    ? {}
                    : {
                        required: "Please confirm your password",
                        validate: (value) =>
                          value === watchPassword || "Passwords do not match",
                      },
                )}
                error={
                  userExists.length < 1 &&
                  ((!passwordMatch && watchPassword2) || !!errors.password2)
                }
                helperText={
                  userExists.length < 1 && errors.password2?.message
                }
                placeholder="Confirm your password"
                type={showConfirmPassword ? "text" : "password"}
                fullWidth
                endAdornment={
                  userExists.length < 1 && (
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
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
              {userExists.length < 1 && watchPassword2 && (
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
                      backgroundColor: passwordMatch ? "#52c41a" : "#ff4d4f",
                      marginRight: "6px",
                    }}
                  />
                  <Typography
                    style={{
                      fontSize: "12px",
                      color: passwordMatch ? "#52c41a" : "#ff4d4f",
                    }}
                  >
                    {passwordMatch ? "Passwords match" : "Passwords do not match"}
                  </Typography>
                </div>
              )}
            </Grid>
            <Grid marginY={"20px"} marginX={0} textAlign={"left"} item xs={12}>
              <FormLabel style={{ marginBottom: "0.5rem" }}>
                First name <span style={{ fontWeight: 800 }}>*</span>
              </FormLabel>
              <Input
                disabled={userExists.length > 0}
                required={userExists.length < 1}
                {...register("firstName")}
                type="text"
                // value={firstName}
                // onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your name"
                fullWidth
              />
            </Grid>
            <Grid marginY={"20px"} marginX={0} textAlign={"left"} item xs={12}>
              <FormLabel style={{ marginBottom: "0.5rem" }}>
                Last name <span style={{ fontWeight: 800 }}>*</span>
              </FormLabel>
              <Input
                disabled={userExists.length > 0}
                required={userExists.length < 1}
                {...register("lastName")}
                type="text"
                placeholder="Enter your last name"
                fullWidth
              />
            </Grid>

            <Grid
              display={"flex"}
              flexDirection={"column"}
              justifyContent={"flex-start"}
              alignItems={"center"}
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
                xs={12}
                sm={12}
                md={12}
              >
                <FormLabel style={{ marginBottom: "0.5rem" }}>
                  Update your profile photo{" "}
                  <span style={{ fontWeight: 800 }}>*</span>
                </FormLabel>
              </Grid>
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
                      user.data ? (
                        user.data.imageProfile
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <UploadImagePlaceholder />
                        </div>
                      )
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
                      className="photo_input"
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
                buttonType="submit"
                title="Set up new company"
                styles={{ width: "100%" }}
              />
            </Grid>
          </form>
          <Grid item xs={12} justifyContent={"center"} alignItems={"center"}>
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
                  onClick={() =>
                    dispatch(
                      onLogin({
                        name: "",
                        lastName: "",
                        email: "",
                        password: "",
                        company: "",
                        role: "",
                      }),
                    )
                  }
                  style={{
                    backgroundColor: "transparent",
                    outline: "none",
                    color: "#004EEB",
                    fontSize: "14px",
                    fontFamily: "Inter",
                    fontWeight: "600",
                    lineHeight: "20px",
                    cursor: "pointer",
                    margin: 0,
                    padding: 0,
                  }}
                >
                  Sign in
                </button>
              </Link>
            </p>
          </Grid>

          <div
            style={{
              position: "relative",
              bottom: "0dvh",
              margin: "0 20vw 0 0",
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

export default Registration;

//   if (matchCompany()) {
//     dispatch(onLogin(newAdminUserTemplate));
//     navigate("/register/company-setup");
//   } else {
//     return openNotificationWithIcon(
//       "info",
//       "Company is already registered in our record. Please contact with company administrator to get access permission."
//     );
//   }

{
  /* <AutoComplete
                                            className="custom-autocomplete"
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
                                        /> */
}

// else {
//     const resp = await devitrakApi.post(
//         "/admin/new_admin_user",
//         newAdminUserTemplate
//     );
//     if (resp.data) {
//         localStorage.setItem("admin-token", resp.data.token);
//         const companyInfo = await devitrakApi.post('/db_company/consulting-company', {
//             company_name: companyValue
//         })
//         const insertingNewMemberInCompany = await devitrakApi.post('/db_staff/new_member', {
//             first_name: firstName,
//             last_name: lastName,
//             email: email,
//             phone_number: "000-000-0000",
//         })

//         const respoFindMemberInfo = await devitrakApi.post("/db_staff/consulting-member", {
//             email: email,
//         })
//         const updatingEmployeesList = await devitrakApi.patch(`/company/update-company/${grouping[companyValue].at(-1).id}`, {
//             employees: [{ user: email, super_user: false, role: "Editor", _id: resp.data.uid }, ...grouping[companyValue][0].employees]
//         })

//         const stripeSQL = await devitrakApi.post('/db_stripe/consulting-stripe', {
//             company_id: companyInfo.data.company.at(-1).company_id
//         })
//         if (companyInfo?.data && insertingNewMemberInCompany.data && updatingEmployeesList.data) {
//             dispatch(
//                 onLogin({
//                     data: resp.data.entire,
//                     name: resp.data.name,
//                     lastName: resp.data.lastName,
//                     uid: resp.data.uid,
//                     email: resp.data.email,
//                     role: resp.data.role,
//                     affiliate: resp.data.affiliate,
//                     company: resp.data.company,
//                     sqlMemberInfo: respoFindMemberInfo.data.member.at(-1),
//                     sqlInfo: { ...companyInfo.data.company.at(-1), stripeIDL: stripeSQL.data.stripe.at(-1) },
//                 })
//             );
//             queryClient.clear()
//             navigate('/', { replace: true, relative: "path" })
//             return;
//         }
//     }
// }
