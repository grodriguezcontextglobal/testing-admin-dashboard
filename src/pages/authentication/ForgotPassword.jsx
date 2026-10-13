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
import { buildResetPasswordLink } from "./utils/passwordPolicy";

const schema = yup.object().shape({
  email: yup
    .string()
    .email("Email format is not valid")
    .required("Email is required"),
});

/* `company` is no longer among the public fields; the first company the
   account belongs to stands in for it in the email. */
const resetEmailCompany = (user) =>
  user?.company ?? user?.companiesAssigned?.[0]?.company ?? "";

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

  /* The server answers one exact email at a time, with public fields only.
     It used to hand the whole staff list, hashes included, to anyone. */
  const findStaff = async (email) => {
    const response = await devitrakApi.post("/staff/__staff-search", {
      email: String(email ?? "").trim(),
    });
    return response?.data?.adminUsers?.[0] ?? null;
  };

  const sendingEmailMutation = useMutation({
    mutationFn: (data) =>
      devitrakApi.post("/nodemailer/reset-admin-password", data),
    onSuccess: (_, variables) => {
      setLoading(false);
      openNotification("success", `Password reset email sent to ${variables.contactInfo.email}`);
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
    let user = null;
    try {
      user = await findStaff(data.email);
    } catch {
      openNotification("error", "We couldn't look up this email. Please try again.");
      setLoading(false);
      return;
    }
    if (!user) {
      openNotification("error", "No account found for this email.");
      setLoading(false);
      return;
    }
    const stampTime = `${new Date()}`;
    await sendingEmailMutation.mutateAsync({
      adminUser: {
        firstName: user.name,
        lastName: user.lastName,
      },
      linkToResetPassword: buildResetPasswordLink({
        origin: "https://admin.devitrak.net",
        uid: user.id,
        email: user.email ?? data.email,
        stampTime,
      }),
      contactInfo: {
        email: data.email,
        company: resetEmailCompany(user),
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
