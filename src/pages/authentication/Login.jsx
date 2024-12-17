import {
  FormControlLabel,
  FormLabel,
  Grid,
  OutlinedInput,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Checkbox, Typography, notification } from "antd";
import { lazy, Suspense, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi, devitrakApiAdmin } from "../../api/devitrakApi";
import FooterComponent from "../../components/general/FooterComponent";
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
import PropTypes from "prop-types";
import { checkArray } from "../../components/utils/checkArray";
import Loading from "../../components/animation/Loading";
const ForgotPassword = lazy(() => import("./ForgotPassword"));
const ModalMultipleCompanies = lazy(() => import("./multipleCompanies/Modal"));

const Login = () => {
  const { register, handleSubmit, setValue } = useForm();
  const [updatePasswordModalState, setUpdatePasswordModalState] =
    useState(false);
  const [openMultipleCompanies, setOpenMultipleCompanies] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, msg) => {
    api.open({
      message: (
        <div style={{ display: "flex", alignItems: "center" }}>{msg}</div>
      ),
      duration: 0,
    });
  };
  const dataPassed = useRef([]);
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

  const navigateUserBasedOnRole = async (props) => {
    if (Number(props.role) === 4) {
      const response = await devitrakApi.post("/event/event-list", {
        "staff.headsetAttendees.email": props.email,
        active: true,
      });
      if (response.data.ok) {
        if (response.data.list.length > 0) {
          addingEventState(response.data.list[0]);
          return navigate(`/events`);
        } else {
          return openNotificationWithIcon(
            "error",
            "Event is ended. If you need log in into your devitrak account, please contact event administrator."
          );
        }
      }
    } else {
      return navigate("/");
    }
  };
  const loginIntoOneCompanyAccount = async ({ props }) => {
    const respo = await devitrakApiAdmin.post("/login", {
      email: props.email,
      password: props.password,
    });

    if (respo.data) {
      localStorage.setItem("admin-token", respo.data.token);
      const updatingOnlineStatusResponse = await devitrakApiAdmin.patch(
        `/profile/${respo.data.uid}`,
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
      // const subscriptionCompanyInfo = await devitrakApi.post(
      //   "/subscription/company-subscription",
      //   {
      //     companyName: props.company_name,
      //   }
      // );
      dispatch(
        onLogin({
          data: {
            ...respo.data.entire,
            online: updatingOnlineStatusResponse.data.entire.online,
          },
          name: respo.data.name,
          lastName: respo.data.lastName,
          uid: respo.data.uid,
          email: respo.data.email,
          role: props.role,
          phone: respo.data.phone,
          company: props.company_name,
          token: respo.data.token,
          online: updatingOnlineStatusResponse.data.entire.online,
          companyData: props.company_data[0],
          sqlMemberInfo: checkArray(respoFindMemberInfo.data.member),
          sqlInfo: {
            ...checkArray(companyInfoTable.data.company),
            stripeID: checkArray(stripeSQL.data.stripe),
          },
          subscription: {},
          // subscriptionCompanyInfo.data
          //   ? subscriptionCompanyInfo.data.subscription.subscription
          //   : {},
        })
      );
      dispatch(
        onAddSubscription(
          {}
          // subscriptionCompanyInfo.data
          //   ? subscriptionCompanyInfo.data.subscription.subscription
          //   : {}
        )
      );
      dispatch(clearErrorMessage());
      queryClient.clear();
      openNotificationWithIcon("Success", "User logged in.");
      await navigateUserBasedOnRole({
        role: props.role,
        email: respo.data.email,
      });
    }
  };
  const onSubmitLogin = async (data) => {
    dispatch(onChecking());
    try {
      const checkCompanyUserSet = await devitrakApi.post(
        "/company/search-company",
        { "employees.user": data.email }
      );
      if (checkCompanyUserSet.data) {
        const result = new Set();
        const userFoundInCompany = checkCompanyUserSet.data.company;
        for (let item of userFoundInCompany) {
          const userInfo = item.employees.filter(
            (element) => element.user === data.email && element.active
          );
          if (Array.isArray(userInfo) && userInfo.length > 0) {
            result.add({ company: item.company_name, role: userInfo[0].role });
          }
        }
        const infoFound = Array.from(result);
        setOpenMultipleCompanies(infoFound.length > 1);
        if (infoFound.length === 0)
          return openNotificationWithIcon(
            "error",
            "We could not find an active status in any company where you were assigned."
          );
        if (infoFound.length === 1) {
          await loginIntoOneCompanyAccount({
            props: {
              email: data.email,
              password: data.password,
              company_name: infoFound[0].company,
              role: infoFound[0].role,
              company_data: userFoundInCompany,
            },
          });
        }
        if (infoFound.length > 1) {
          // const storeData = (dataPassed.current = {
          //   ...data,
          //   companyInfo: infoFound,
          //   company_data: userFoundInCompany,
          // });
          // return storeData;
          dataPassed.current = {
            ...data,
            companyInfo: infoFound,
            company_data: userFoundInCompany,
          };
          return dataPassed.current;
        }
      }
    } catch (error) {
      openNotificationWithIcon("error", `${error.response.data.msg}`);
      dispatch(onLogout("Incorrect credentials"));
      dispatch(onAddErrorMessage(error?.response?.data?.msg));
      throw error;
    }
    setValue("email", "");
    setValue("password", "");
    return dispatch(clearErrorMessage());
  };
  const isSmallDevice = useMediaQuery("only screen abd (max-width: 768px)");
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
          // width: "100vw",
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
              Please enter your email
            </p>
            <form
              onSubmit={handleSubmit(onSubmitLogin)}
              style={{ width: formFittingTrigger() }} //formFittingTrigger(),padding: "0 20px 0 0"
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
                <FormLabel style={{ marginBottom: "0.9rem" }}>Email</FormLabel>
                <OutlinedInput
                  required
                  {...register("email", { required: true, minLength: 10 })}
                  type="email"
                  style={{
                    ...OutlinedInputStyle,
                    marginTop: "6px",
                  }}
                  placeholder="Enter your email"
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
                <FormLabel style={{ marginBottom: "0.9rem" }}>
                  Password
                </FormLabel>
                <OutlinedInput
                  required
                  {...register("password", { required: true, minLength: 6 })}
                  style={{
                    ...OutlinedInputStyle,
                    marginTop: "6px",
                  }}
                  placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;"
                  type="password"
                  fullWidth
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
                  {" "}
                  <FormControlLabel
                    style={{
                      color: "#var(--gray-700, #344054)",
                      fontSize: "14px",
                      fontFamily: "Inter",
                      fontWeight: "500",
                      lineHeight: "20px",
                    }}
                    labelPlacement="end"
                    control={<Checkbox style={{ paddingRight: "0.5rem" }} />}
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
                    {" "}
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
              <OutlinedInput
                style={{
                  color: "#fff",
                  width: "100%",
                  border: "1px solid var(--blue-dark-600, #155EEF)",
                  background: " var(--blue-dark-600, #155EEF)",
                  borderRadius: "8px",
                  boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                }}
                type="submit"
                value="Sign in"
              />
            </form>
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
          openMultipleCompanies={true}
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
