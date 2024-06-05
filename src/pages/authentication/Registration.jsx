import { Icon } from "@iconify/react/dist/iconify.js";
import {
  FormLabel,
  Grid,
  OutlinedInput,
  TextField,
  Typography,
} from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Avatar, notification } from "antd";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import FooterComponent from "../../components/general/FooterComponent";
import { UploadImagePlaceholder } from "../../components/icons/Icons";
import { convertToBase64 } from "../../components/utils/convertToBase64";
import { onLogin } from "../../store/slices/adminSlice";
import { BlueButton } from "../../styles/global/BlueButton";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import CenteringGrid from "../../styles/global/CenteringGrid";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../styles/global/Subtitle";
import "../../styles/global/ant-select.css";
import "./style/authStyle.css";
const Registration = () => {
  const { user } = useSelector((state) => state.admin);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      firstName: user.name,
      lastName: user.lastName,
      email: user.email,
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

  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  const onSubmitRegister = async (data) => {
    if (data.password !== data.password2)
      return openNotificationWithIcon(
        "error",
        "Action denied.",
        "Password must match."
      );
    try {
      let base64 = "";
      if (data.photo.length > 0) {
        base64 = await convertToBase64(data.photo[0]);
      } else if (user.imageProfile) {
        base64 = await convertToBase64(user.rowImageProfile);
      }
      const newAdminUserTemplate = {
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
              height: "90dvh",
            }}
          >
            <Grid
              className="register-container"
              display={"flex"}
              flexDirection={"column"}
              style={{ padding: `${isSmallDevice ? "1rem" : "2rem"}` }}
              container
            >
              <form
                className="register-form-container"
                onSubmit={handleSubmit(onSubmitRegister)}
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
                    Welcome
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
                    Email <span style={{ fontWeight: 800 }}>*</span>
                  </FormLabel>
                  <OutlinedInput
                    required
                    {...register("email")}
                    // value={email}
                    // onChange={(e) => setEmail(e.target.value)}
                    style={OutlinedInputStyle}
                    placeholder="Enter your email"
                    type="email"
                    fullWidth
                  />
                  <FormLabel style={{ marginBottom: "0.5rem" }}>
                    <Typography style={Subtitle}>
                      {" "}
                      You need to enter a company email if you are creating a
                      new company.
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
                  <FormLabel style={{ marginBottom: "0.5rem" }}>
                    Password <span style={{ fontWeight: 800 }}>*</span>
                  </FormLabel>
                  <OutlinedInput
                    required
                    {...register("password")}
                    // value={password}
                    // onChange={(e) => setPassword(e.target.value)}
                    style={OutlinedInputStyle}
                    placeholder="******"
                    type="password"
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
                    Repeat password <span style={{ fontWeight: 800 }}>*</span>
                  </FormLabel>
                  <OutlinedInput
                    required
                    {...register("password2")}
                    // value={password2}
                    // onChange={(e) => setPassword2(e.target.value)}
                    style={OutlinedInputStyle}
                    placeholder="******"
                    type="password"
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
                    First name <span style={{ fontWeight: 800 }}>*</span>
                  </FormLabel>
                  <OutlinedInput
                    required
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
                <Grid
                  marginY={"20px"}
                  marginX={0}
                  textAlign={"left"}
                  item
                  xs={12}
                >
                  <FormLabel style={{ marginBottom: "0.5rem" }}>
                    Last name <span style={{ fontWeight: 800 }}>*</span>
                  </FormLabel>
                  <OutlinedInput
                    required
                    {...register("lastName")}
                    type="text"
                    // value={lastName}
                    // onChange={(e) => setLastName(e.target.value)}
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
                              <UploadImagePlaceholder style={{}} />
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
                  <button
                    type="submit"
                    style={{ ...BlueButton, ...CenteringGrid, width: "100%" }}
                  >
                    <p style={BlueButtonText}>Set up new company</p>
                  </button>
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
      </Grid>{" "}
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
