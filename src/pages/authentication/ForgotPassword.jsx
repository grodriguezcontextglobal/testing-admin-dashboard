import { yupResolver } from "@hookform/resolvers/yup";
import { FormLabel, Stack, Typography } from "@mui/material";
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
    reset,
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

  const openNotification = useCallback(
    (type, msg) => {
      api[type]?.({ message: msg }) ?? api.open({ message: msg });
    },
    [api],
  );

  const findStaff = useCallback(() => {
    const groupByEmail = groupBy(
      listAdminUsers?.data?.data?.adminUsers,
      "email",
    );
    return groupByEmail[watch("email")];
  }, [listAdminUsers?.data?.data?.adminUsers, watch]); //eslint-disable-line react-hooks/exhaustive-deps

  adminUserInfoRef.current = findStaff();

  const sendingEmailMutation = useMutation({
    mutationFn: (data) =>
      devitrakApi.post("/nodemailer/reset-admin-password", data),
    onSuccess: (_, variables) => {
      setLoading(false);
      openNotification("success", `Password reset email queued for ${variables.contactInfo.email}`);
      setTimeout(handleClose, 1500);
    },
    onError: (error) => {
      openNotification(
        "error",
        error.response?.data?.error ?? "Something went wrong. Please try again.",
      );
      setLoading(false);
    },
  });

  const handleSubmitEmailLink = async (data) => {
    setLoading(true);
    const user = adminUserInfoRef.current;
    if (!user) {
      openNotification("error", "No account found for this email.");
      setLoading(false);
      return;
    }
    const stampTime = `${new Date()}`;
    await sendingEmailMutation.mutateAsync({
      adminUser: {
        firstName: user.at(-1).name,
        lastName: user.at(-1).lastName,
      },
      linkToResetPassword: `https://admin.devitrak.net/reset-password?uid=${user.at(-1).id
        }&stamp-time=${encodeURI(stampTime)}`,
      contactInfo: {
        email: data.email,
        company: user.at(-1).company,
      },
    });
  };

  const handleClose = () => {
    reset();
    close(false);
  };

  return (
    <>
      {contextHolder}
      <ModalUX
        openDialog={open}
        closeModal={handleClose}
        width={480}
        title={
          <Typography
            style={{
              color: "var(--gray900, #101828)",
              fontFamily: "Inter",
              fontSize: "18px",
              fontWeight: "600",
              lineHeight: "28px",
            }}
          >
            Reset your password
          </Typography>
        }
        body={
          <form
            id="reset-password-email-modal"
            onSubmit={handleSubmit(handleSubmitEmailLink)}
          >
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <Typography
                style={{
                  color: "var(--gray-500, #667085)",
                  fontFamily: "Inter",
                  fontSize: "14px",
                  lineHeight: "20px",
                }}
              >
                Enter your email and we&apos;ll send you a link to reset your
                password.
              </Typography>
              <FormLabel htmlFor="email">Email
                <Input
                  {...register("email")}
                  // label="Email"
                  type="email"
                  placeholder="you@example.com"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              </FormLabel>
              <BlueButtonComponent
                form="reset-password-email-modal"
                loadingState={loading}
                buttonType="submit"
                title="Send reset link"
                size="lg"
                styles={{ width: "100%", margin:".5rem 0" }}
              />
            </Stack>
          </form>
        }
      />
    </>
  );
};

export default ForgotPassword;

ForgotPassword.propTypes = {
  open: PropTypes.bool,
  close: PropTypes.func,
};
