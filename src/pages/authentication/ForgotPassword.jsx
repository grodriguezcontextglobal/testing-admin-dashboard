import { yupResolver } from "@hookform/resolvers/yup";
import { FormControl, FormLabel, Grid, Typography } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { groupBy } from "lodash";
import { PropTypes } from "prop-types";
import { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { devitrakApi } from "../../api/devitrakApi";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import Input from "../../components/UX/inputs/Input";
import ModalUX from "../../components/UX/modal/ModalUX";
import ReusableCardWithHeaderAndFooter from "../../components/UX/cards/ReusableCardWithHeaderAndFooter";
// import axios from "axios";

const schema = yup.object().shape({
  email: yup
    .string()
    .email("Email format is not valid")
    .required("Email is required"),
});

const ForgotPassword = ({ open, close }) => {
  const adminUserInfoRef = useRef(null);
  const [loading, setLoading] = useState(false);
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
    queryFn: () => devitrakApi.get("/staff/__staff-search"),
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
      "email",
    );

    return groupByEmail[watch("email")];
  }, [listAdminUsers?.data?.data?.adminUsers, watch("email")]); //eslint-disable-line react-hooks/exhaustive-deps

  adminUserInfoRef.current = findStaff();

  const sendingEmailForResetPasswordMutation = useMutation({
    mutationFn: (data) =>
      devitrakApi.post("/nodemailer/reset-admin-password", data),
    onSuccess: () => {
      setLoading(false);
      setTimeout(() => {
        return handleClose();
      }, 1500);
    },
    onError: (error) => {
      openNotificationWithIcon("error", error.response.data.error);
      return setLoading(false);
    },
  });
  const handleSubmitEmailLink = async (data) => {
    try {
      setLoading(true);
      if (adminUserInfoRef.current) {
        const stampTime = `${new Date()}`;
        const bodyFetch = {
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
        await sendingEmailForResetPasswordMutation.mutateAsync(bodyFetch);
        return openNotificationWithIcon(
          "Success",
          `Email sent to ${data.email}`,
        );
      } else {
        openNotificationWithIcon("error", "Email was not found!");
        return setLoading(false);
      }
    } catch (error) {
      console.log("error from function", error);
      openNotificationWithIcon("error", error.response.data.error);
      return setLoading(false);
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
  const body = () => {
    return (
      <ReusableCardWithHeaderAndFooter
        title={"Enter your email to get a link to reset your password."}
        actions={[
          <div key="reset-password-button" style={{width:"100%", margin:"0 0 0 24px"}}>
            <BlueButtonComponent
              form="reset-password-email-modal"
              loadingState={loading}
              buttonType="submit"
              title="Reset password"
            />
          </div>,
        ]}
      >
        <form
          style={{
            width: "100%",
            margin:"24px 0 0 0"
          }}
          onSubmit={handleSubmit(handleSubmitEmailLink)}
          id="reset-password-email-modal"
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
            <Input
              {...register("email")}
              type="email"
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
        </form>
      </ReusableCardWithHeaderAndFooter>
    );
  };

  return (
    <>
      {contextHolder}
      <ModalUX
        openDialog={open}
        closeModal={handleClose}
        title={renderTitle()}
        modalStyles={{ top: 20 }}
        body={body()}
      />
    </>
  );
};

export default ForgotPassword;

ForgotPassword.propTypes = {
  open: PropTypes.bool,
  close: PropTypes.bool,
};

// let config = {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${
//       import.meta.env.VITE_APP_AWS_AUTHORIZER_TOKEN
//     }`,
//   },
// };
// let axiosData = {
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
// };
// const url =
//   "https://9dsiqsqjtk.execute-api.us-east-1.amazonaws.com/prod/devitrak/notifications/staff/reset-password";
// const resp = await axios.post(url, axiosData, config);
// console.log(resp);
//  if (resp.data.statusCode >= 200 && resp.data.statusCode < 300) {
