import { Icon } from "@iconify/react/dist/iconify.js";
import { FormLabel, Grid, OutlinedInput, TextField } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Avatar, Button, notification } from "antd";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import FooterComponent from "../../components/general/FooterComponent";
import { convertToBase64 } from "../../components/utils/convertToBase64";
import { onLogin } from "../../store/slices/adminSlice";
import { BlueButton } from "../../styles/global/BlueButton";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import CenteringGrid from "../../styles/global/CenteringGrid";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../styles/global/Subtitle";
import "../../styles/global/ant-select.css";
import { devitrakApi } from "../../api/devitrakApi";
import { useCallback, useEffect, useState } from "react";
import { isValidEmail } from "../../components/utils/IsValidEmail";
import { checkArray } from "../../components/utils/checkArray";
import { UploadImagePlaceholder } from "../../components/icons/UpdateImagePlaceholder";
// import "./style/authStyle.css";
const Registration = () => {
  const { user } = useSelector((state) => state.admin);
  const { register, handleSubmit, watch, setValue } = useForm({
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

  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, title, msg) => {
    api.open({
      message: title,
      description: msg,
    });
  };

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
  const [userExists, setUserExists] = useState([]);
  const checkExistingUser = useCallback(async () => {
    if (isValidEmail(watch("email"))) {
      const response = await devitrakApi.post(`/staff/admin-users`, {
        email: watch("email"),
      });
      if (response.data) {
        const result = [...response.data.adminUsers];
        return setUserExists(result);
      }
    }
  }, isValidEmail(watch("email")));

  useEffect(() => {
    const controller = new AbortController();
    checkExistingUser();
    return () => {
      controller.abort();
    };
  }, [isValidEmail(watch("email"))]);

  useEffect(() => {
    const controller = new AbortController();
    if (userExists.length > 0) {
      setValue("email", userExists[0].email);
      setValue("email_confirmation", userExists[0].email);
      setValue("password", userExists[0].password);
      setValue("password2", userExists[0].password);
      setValue("firstName", userExists[0].name);
      setValue("lastName", userExists[0].lastName);
      return openNotificationWithIcon(
        "success",
        "Email already exists in our record.",
        "Please proceed to set up a company account."
      );
    }
    return () => {
      controller.abort();
    };
  }, [userExists.length > 0]);

  const onSubmitRegister = async (data) => {
    if (data.password !== data.password2)
      return openNotificationWithIcon(
        "error",
        "Action denied.",
        "Password must match."
      );
    if (data.email !== data.email_confirmation)
      return openNotificationWithIcon(
        "error",
        "Action denied.",
        "Emails must match."
      );
    if (userExists.length > 0) {
      openNotificationWithIcon(
        "success",
        "Email already exists in our record.",
        "Please proceed to set up a company account."
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
        `${error.response}`
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
              <OutlinedInput
                required={userExists.length < 1}
                {...register("email")}
                style={OutlinedInputStyle}
                placeholder="Enter your email"
                type="email"
                fullWidth
              />
            </Grid>
            <Grid marginY={"20px"} marginX={0} textAlign={"left"} item xs={12}>
              <FormLabel style={{ marginBottom: "0.5rem" }}>
                Confirm email <span style={{ fontWeight: 800 }}>*</span>
              </FormLabel>
              <OutlinedInput
                disabled={userExists.length > 0}
                required={userExists.length < 1}
                {...register("email_confirmation")}
                style={OutlinedInputStyle}
                placeholder="Repeat your email"
                type="email_confirmation"
                fullWidth
              />
            </Grid>
            <Grid marginY={"20px"} marginX={0} textAlign={"left"} item xs={12}>
              <FormLabel style={{ marginBottom: "0.5rem" }}>
                Password <span style={{ fontWeight: 800 }}>*</span>
              </FormLabel>
              <OutlinedInput
                disabled={userExists.length > 0}
                required={userExists.length < 1}
                {...register("password")}
                style={OutlinedInputStyle}
                placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;"
                type="password"
                fullWidth
              />
            </Grid>
            <Grid marginY={"20px"} marginX={0} textAlign={"left"} item xs={12}>
              <FormLabel style={{ marginBottom: "0.5rem" }}>
                Repeat password <span style={{ fontWeight: 800 }}>*</span>
              </FormLabel>
              <OutlinedInput
                disabled={userExists.length > 0}
                required={userExists.length < 1}
                {...register("password2")}
                // value={password2}
                // onChange={(e) => setPassword2(e.target.value)}
                style={OutlinedInputStyle}
                placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;"
                type="password"
                fullWidth
              />
            </Grid>
            <Grid marginY={"20px"} marginX={0} textAlign={"left"} item xs={12}>
              <FormLabel style={{ marginBottom: "0.5rem" }}>
                First name <span style={{ fontWeight: 800 }}>*</span>
              </FormLabel>
              <OutlinedInput
                disabled={userExists.length > 0}
                required={userExists.length < 1}
                {...register("firstName")}
                type="text"
                // value={firstName}
                // onChange={(e) => setFirstName(e.target.value)}
                style={{
                  ...OutlinedInputStyle,
                }}
                placeholder="Enter your name"
                fullWidth
              />
            </Grid>
            <Grid marginY={"20px"} marginX={0} textAlign={"left"} item xs={12}>
              <FormLabel style={{ marginBottom: "0.5rem" }}>
                Last name <span style={{ fontWeight: 800 }}>*</span>
              </FormLabel>
              <OutlinedInput
                disabled={userExists.length > 0}
                required={userExists.length < 1}
                {...register("lastName")}
                type="text"
                style={{
                  ...OutlinedInputStyle,
                }}
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
              <Button
                htmlType="submit"
                style={{ ...BlueButton, ...CenteringGrid, width: "100%" }}
              >
                <p style={BlueButtonText}>Set up new company</p>
              </Button>
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
                      })
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
