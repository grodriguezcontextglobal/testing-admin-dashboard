import { yupResolver } from "@hookform/resolvers/yup";
import {
  Button,
  FormControl,
  FormLabel,
  Grid,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Modal, notification } from "antd";
import { groupBy } from "lodash";
import { PropTypes } from "prop-types";
import { useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { devitrakApi } from "../../api/devitrakApi";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import axios from "axios";

const schema = yup.object().shape({
  email: yup
    .string()
    .email("Email format is not valid")
    .required("Email is required"),
});

const ForgotPassword = ({ open, close }) => {
  const adminUserInfoRef = useRef(null);
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });
  const listAdminUsers = useQuery({
    queryKey: ["listOfAdminUsers"],
    queryFn: () => devitrakApi.get("/staff/admin-users"),
  });

  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, msg) => {
    api.open({
      message: msg,
    });
  };
  const findStaff = useCallback(() => {
    const groupByEmail = groupBy(
      listAdminUsers?.data?.data?.adminUsers,
      "email"
    );

    return groupByEmail[watch("email")];
  }, [listAdminUsers?.data?.data?.adminUsers, watch("email")]); //eslint-disable-line react-hooks/exhaustive-deps

  adminUserInfoRef.current = findStaff();

  const handleSubmitEmailLink = async (data) => {
    if (adminUserInfoRef.current) {
      const stampTime = `${new Date()}`;
      let config = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_APP_AWS_AUTHORIZER_TOKEN}`,
        },
      };
      let axiosData = {
        adminUser: {
          firstName: adminUserInfoRef.current.at(-1).name,
          lastName: adminUserInfoRef.current.at(-1).lastName,
        },
        linkToResetPassword: `https://admin.devitrak.net/reset-password?uid=${
          adminUserInfoRef.current.at(-1).id
        }&stamp-time=${encodeURI(stampTime)}`,
        contactInfo: {
          email: data.email,
          company: adminUserInfoRef.current.at(-1).company,
        },
      };
      const url =
        "https://api.garssoftwaresolutions.link/devitrak/notifications/staff/reset-password";
      const resp = await axios.post(url, axiosData, config);

      if (resp.data.statusCode >= 200 && resp.data.statusCode < 300) {
        openNotificationWithIcon("success", `Email sent to ${data.email}`);
        setTimeout(async () => {
          await handleClose();
        }, 1500);
      }
    } else {
      openNotificationWithIcon("error", "Email was not found!");
    }
  };
  const handleClose = () => {
    setValue("email", "");
    return close(false);
  };
  const renderTitle = () => {
    return (
      <Typography
        style={{
          color: "var(--gray900, #101828)",
          textAlign: "center",
          fontFamily: "Inter",
          fontSize: "18px",
          fontWeight: "600",
          lineHeight: "28px",
        }}
        id="transition-modal-title"
        variant="h6"
        component="h2"
      >
        Reset your password
      </Typography>
    );
  };
  return (
    <>
      {contextHolder}
      <Modal
        title={renderTitle()}
        style={{
          top: 20,
        }}
        open={open}
        onOk={() => handleClose()}
        onCancel={() => handleClose()}
        footer={[]}
        maskClosable={false}
      >
        <Grid container>
          <Grid
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
            alignSelf={"stretch"}
            margin={"0 auto"}
            item
            xs={10}
          >
            <Typography id="transition-modal-description" sx={{ mt: 2, mb: 2 }}>
              Enter your email to get a link to reset your password.
            </Typography>
          </Grid>
          <Grid container>
            <form
              style={{
                width: "100%",
              }}
              onSubmit={handleSubmit(handleSubmitEmailLink)}
            >
              <Grid
                display={"flex"}
                flexDirection={"column"}
                alignItems={"center"}
                alignSelf={"stretch"}
                marginY={2}
                marginX={"auto"}
                paddingX={"9px"}
                item
                xs={10}
              >
                <FormControl fullWidth>
                  <FormLabel>
                    {" "}
                    <Typography
                      style={{
                        color: "var(--gray-700, #344054)",
                        textAlign: "left",
                        fontFamily: "Inter",
                        fontSize: "14px",
                        fontWeight: "500",
                        lineHeight: "20px",
                        paddingBottom: "5px",
                      }}
                    >
                      Email
                    </Typography>
                  </FormLabel>
                  <OutlinedInput
                    {...register("email")}
                    type="email"
                    style={OutlinedInputStyle}
                    placeholder="Enter your email"
                  />
                  {errors && (
                    <Typography
                      style={{
                        color: "red",
                        textAlign: "left",
                        fontFamily: "Inter",
                        fontSize: "14px",
                        fontWeight: "500",
                        lineHeight: "20px",
                        paddingBottom: "5px",
                      }}
                    >
                      {errors?.email?.message}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid marginX={"auto"} paddingX={"9px"} marginY={3} item xs={10}>
                <Button
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    border: "1px solid var(--blue-dark-600, #155EEF)",
                    background: "var(--blue-dark-600, #155EEF)",
                    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                  }}
                  variant="contained"
                  type="submit"
                >
                  <Typography
                    style={{
                      color: "var(--base-white, #FFF)",
                      textAlign: "center",
                      fontFamily: "Inter",
                      fontSize: "16px",
                      fontWeight: "600",
                      lineHeight: "24px",
                    }}
                    id="transition-modal-title"
                  >
                    Reset password
                  </Typography>
                </Button>
              </Grid>
            </form>
          </Grid>
        </Grid>
      </Modal>
    </>
  );
};

export default ForgotPassword;

ForgotPassword.propTypes = {
  open: PropTypes.bool,
  close: PropTypes.bool,
};

// console.log("test", test);
// const resp = await devitrakApi.post("/nodemailer/reset-admin-password", {
//   adminUser: {
//     firstName: adminUserInfoRef.current.at(-1).name,
//     lastName: adminUserInfoRef.current.at(-1).lastName,
//   },
//   linkToResetPassword: `https://admin.devitrak.net/reset-password?uid=${
//     adminUserInfoRef.current.at(-1).id
//   }&stamp-time=${encodeURI(stampTime)}`,
//   contactInfo: {
//     email: data.email,
//     company: adminUserInfoRef.current.at(-1).company,
//   },
// });
