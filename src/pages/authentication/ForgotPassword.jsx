import { yupResolver } from "@hookform/resolvers/yup";
import { FormLabel, Stack, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { PropTypes } from "prop-types";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { devitrakApi } from "../../api/devitrakApi";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import Input from "../../components/UX/inputs/Input";
import ModalUX from "../../components/UX/modal/ModalUX";
import { useStatusNotification } from "../../components/notification/alerts/useStatusNotification";
import { buildResetEmailRequest } from "./utils/passwordPolicy";

const schema = yup.object().shape({
  email: yup
    .string()
    .email("Email format is not valid")
    .required("Email is required"),
});

const ForgotPassword = ({ open, close }) => {
  const [loading, setLoading] = useState(false);
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const { notify, contextHolder } = useStatusNotification();

  const openNotification = useCallback(
    (type, msg) => {
      notify(type, msg);
    },
    [notify],
  );

  const sendingEmailMutation = useMutation({
    mutationFn: (data) =>
      devitrakApi.post("/nodemailer/reset-admin-password", data),
    onSuccess: (_, variables) => {
      setLoading(false);
      // The same words whether or not the account exists: the server answers
      // 202 either way so nobody can probe which emails have an account, and
      // the page must not give away what the server keeps to itself.
      openNotification(
        "success",
        `If an account exists for ${variables.contactInfo.email}, we sent it a link to reset the password.`,
      );
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

  /* No lookup first: telling "no account found" apart from "sent" is exactly
     what the server's identical answers are there to prevent. */
  const handleSubmitEmailLink = (data) => {
    setLoading(true);
    sendingEmailMutation.mutate(buildResetEmailRequest(data.email));
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
