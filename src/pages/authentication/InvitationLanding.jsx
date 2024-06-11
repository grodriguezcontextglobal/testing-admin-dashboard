/* eslint-disable react/prop-types */
import { FormLabel, Grid, OutlinedInput, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Button, message } from "antd";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import FooterComponent from "../../components/general/FooterComponent";
import { onLogin } from "../../store/slices/adminSlice";
import { BlueButton } from "../../styles/global/BlueButton";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../styles/global/Subtitle";
import "../../styles/global/ant-select.css";
import "./style/authStyle.css";

const InvitationLanding = () => {
  const [loadingStatus, setLoadingStatus] = useState(false);
  const firstName = new URLSearchParams(window.location.search).get("first");
  const lastName = new URLSearchParams(window.location.search).get("last");
  const email = new URLSearchParams(window.location.search).get("email");
  const company = new URLSearchParams(window.location.search).get("company");
  const role = new URLSearchParams(window.location.search).get("role");
  const {
    register,
    setValue,
    handleSubmit,
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
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const allStaffSavedQuery = useQuery({
    queryKey: ["staff"],
    queryFn: () => devitrakApi.post("/staff/admin-users", { email: email }),
    // enabled: false,
    refetchOnMount: false,
  });
  const companiesQuery = useQuery({
    queryKey: ["companyListQuery"],
    queryFn: () =>
      devitrakApi.post("/company/search-company", {
        company_name: company,
      }),
    // enabled: false,
    refetchOnMount: false,
  });
  const [messageApi, contextHolder] = message.useMessage();
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
  useEffect(() => {
    const controller = new AbortController();
    allStaffSavedQuery.refetch();
    companiesQuery.refetch();
    return () => {
      controller.abort();
    };
  }, [company]);

  const newUser = useRef(null);
  if (allStaffSavedQuery.data && companiesQuery.data) {
    const hostCompanyInfo = companiesQuery.data.data.company.at(-1);
    const checkIfUserExistsInOtherCompany = () => {
      if (
        allStaffSavedQuery.data.data.adminUsers &&
        allStaffSavedQuery.data.data.adminUsers.length > 0
      ) {
        setValue(
          "password",
          displayMaskedPassword(
            allStaffSavedQuery.data.data.adminUsers.at(-1).password
          )
        );
        setValue(
          "password2",
          displayMaskedPassword(
            allStaffSavedQuery.data.data.adminUsers.at(-1).password
          )
        );
        return (newUser.current =
          allStaffSavedQuery.data.data.adminUsers.at(-1));
      }
      return null;
    };
    // Example function to display a masked password on the screen
    const displayMaskedPassword = (password) => {
      return "*".repeat(password.length); // Mask the password with asterisks
    };

    const updateExistingUser = async () => {
      const resp = await devitrakApi.patch(
        `/staff/edit-admin/${newUser.current.id}`,
        {
          multipleCompanies: true,
          companiesAssigned: [
            ...newUser.current.companiesAssigned,
            {
              company: company,
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
        await devitrakApi.patch(
          `/company/update-company/${hostCompanyInfo.id}`,
          {
            employees: employeesInCompany,
          }
        );
      }
    };
    const createNewUser = async (props) => {
      const templateNewUser = {
        name: firstName,
        lastName: lastName,
        email: email,
        password: props.password,
        question: "What is the name of the company",
        answer: company,
        role: role,
        company: company,
        companiesAssigned: [
          {
            company: company,
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
        const findInvitedStaff = hostCompanyInfo.employees.findIndex(
          (element) => element.user === email
        );
        const employeesInCompany = [...hostCompanyInfo.employees];
        employeesInCompany[findInvitedStaff] = {
          ...employeesInCompany[findInvitedStaff],
          status: "Confirmed",
        };
        await devitrakApi.patch(
          `/company/update-company/${hostCompanyInfo.id}`,
          {
            employees: employeesInCompany,
          }
        );
      }
    };
    const completeSubmitInfo = async (data) => {
      try {
        setLoadingStatus(true);
        if (checkIfUserExistsInOtherCompany()) {
          updateExistingUser();
        } else {
          if (data.password !== data.password2) {
            setLoadingStatus(false);
            return warning("error", "passwords must match.");
          }
          createNewUser(data);
        }
        warning(
          "success",
          "Process completed successfully. Please go to log in to log in into your account."
        );
        return navigate("/login", { replace: true });
      } catch (error) {
        warning("error", "Something went wrong.Please try later.");
        setLoadingStatus(false);
      }
    };
    const errorDic = {
      minLength: "Password must be longer than 6 characters",
      maxLength: "Password must be shorter than 20 characters",
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
                        {" "}
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
                    <FormLabel style={{ marginBottom: "0.5rem" }}>
                      Name{" "}
                    </FormLabel>
                    <OutlinedInput
                      disabled
                      type="text"
                      value={firstName}
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
                      Last name
                    </FormLabel>
                    <OutlinedInput
                      disabled
                      type="text"
                      value={lastName}
                      style={{
                        ...OutlinedInputStyle,
                      }}
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
                        value={company}
                        style={{
                          ...OutlinedInputStyle,
                        }}
                        placeholder="Enter your last name"
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
                    <FormLabel style={{ marginBottom: "0.5rem" }}>
                      Password <span style={{ fontWeight: 800 }}>*</span>
                    </FormLabel>
                    <OutlinedInput
                      disabled={
                        loadingStatus ||
                        checkIfUserExistsInOtherCompany() !== null
                      }
                      {...register("password", {
                        minLength: 6,
                        value: `${
                          checkIfUserExistsInOtherCompany() !== null
                            ? setValue(
                                "password",
                                checkIfUserExistsInOtherCompany().password
                              )
                            : ""
                        }`,
                      })}
                      style={OutlinedInputStyle}
                      placeholder="******"
                      type="password"
                      fullWidth
                    />
                    {errors?.password && (
                      <p
                        style={{
                          ...Subtitle,
                          color: "var(--main-colorslobster)",
                        }}
                      >
                        {errorDic[errors.password.type]}
                      </p>
                    )}
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
                      disabled={
                        loadingStatus ||
                        checkIfUserExistsInOtherCompany() !== null
                      }
                      {...register("password2", {
                        minLength: 6,
                        value: `${
                          checkIfUserExistsInOtherCompany() !== null
                            ? setValue(
                                "password2",
                                checkIfUserExistsInOtherCompany().password
                              )
                            : ""
                        }`,
                      })}
                      style={OutlinedInputStyle}
                      placeholder="******"
                      type="password"
                      fullWidth
                    />
                    {errors?.password2 && (
                      <p
                        style={{
                          ...Subtitle,
                          color: "var(--main-colorslobster)",
                        }}
                      >
                        {errorDic[errors.password2.type]}
                      </p>
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
                    <Button
                      disabled={loadingStatus}
                      htmlType="submit"
                      style={{ ...BlueButton, width: "100%" }}
                    >
                      <Typography style={{ ...BlueButtonText, margin: "auto" }}>
                        Submit registration
                      </Typography>
                    </Button>
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
                        <span
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
                          }}
                        >
                          Sign in
                        </span>
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
  }
};

export default InvitationLanding;
