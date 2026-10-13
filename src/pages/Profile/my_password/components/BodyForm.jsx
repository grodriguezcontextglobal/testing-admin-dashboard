import {
  FormHelperText,
  Grid,
  InputLabel,
  OutlinedInput,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Divider } from "antd";
import { useState } from "react";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import PasswordRequirements from "../../../../components/UX/password/PasswordRequirements";
import PasswordVisibilityToggle from "../../../../components/UX/password/PasswordVisibilityToggle";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import PasswordMfaStep from "../../../authentication/password/PasswordMfaStep";
import Header from "../../components/Header";

const labelStyle = {
  color: "var(--gray-700, #484d47)",
  fontSize: { xs: "13px", sm: "14px" },
  fontWeight: "500",
  fontFamily: "Inter",
  lineHeight: "20px",
  textAlign: "left",
};

const actionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 2,
  flexDirection: { xs: "column", sm: "row" },
  "& > button": {
    width: { xs: "100%", sm: "auto" },
  },
};

const BodyForm = ({
  step,
  onSubmitPassword,
  onConfirmCode,
  onBack,
  triggerRoutes,
  register,
  errors,
  password,
  isSaving,
  mfaError,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isMfaStep = step === "mfa";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const actions = (
    <>
      <GrayButtonComponent
        title={"Cancel"}
        func={() => triggerRoutes()}
        styles={{ width: "fit-content" }}
      />
      <BlueButtonComponent
        buttonType="submit"
        title={"Continue"}
        styles={{ width: "fit-content" }}
      />
    </>
  );

  return (
    <div style={{ width: "100%", padding: isMobile ? "16px" : 0 }}>
      <Grid container>
        <Grid
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
          item
          xs={12}
        >
          <Grid item xs={12} md={6}>
            <Header
              title={"Change your password"}
              description={
                isMfaStep
                  ? "Confirm the change with the code from your authenticator app. You will be signed out afterwards."
                  : "Choose a new password. You will confirm it with your authenticator app."
              }
            />
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Divider />
        </Grid>

        {isMfaStep ? (
          <Grid item xs={12} container spacing={2}>
            <Grid item xs={12} sm={4}>
              <InputLabel>
                <Typography sx={labelStyle}>Verification</Typography>
              </InputLabel>
            </Grid>
            <Grid item xs={12} sm={8}>
              <PasswordMfaStep
                onConfirm={onConfirmCode}
                onBack={onBack}
                isLoading={isSaving}
                error={mfaError}
                confirmLabel="Save and log out"
              />
            </Grid>
          </Grid>
        ) : (
          <Grid item xs={12}>
            <form onSubmit={onSubmitPassword} noValidate>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <InputLabel htmlFor="new-password">
                    <Typography sx={labelStyle}>New password</Typography>
                  </InputLabel>
                </Grid>
                <Grid item xs={12} sm={8} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <OutlinedInput
                    id="new-password"
                    style={{ ...OutlinedInputStyle }}
                    fullWidth
                    {...register("password")}
                    error={Boolean(errors?.password)}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Type your new password"
                    endAdornment={
                      <PasswordVisibilityToggle
                        visible={showPassword}
                        onToggle={() => setShowPassword((shown) => !shown)}
                        controls="new-password"
                      />
                    }
                    inputProps={{ "aria-describedby": "new-password-requirements" }}
                  />
                  {errors?.password && (
                    <FormHelperText error>{errors.password.message}</FormHelperText>
                  )}
                  <PasswordRequirements password={password} id="new-password-requirements" />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <InputLabel htmlFor="confirm-new-password">
                    <Typography sx={labelStyle}>Confirm new password</Typography>
                  </InputLabel>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <OutlinedInput
                    id="confirm-new-password"
                    style={{ ...OutlinedInputStyle }}
                    fullWidth
                    {...register("password2")}
                    error={Boolean(errors?.password2)}
                    type={showConfirmation ? "text" : "password"}
                    endAdornment={
                      <PasswordVisibilityToggle
                        visible={showConfirmation}
                        onToggle={() => setShowConfirmation((shown) => !shown)}
                        controls="confirm-new-password"
                      />
                    }
                    autoComplete="new-password"
                    placeholder="Repeat the new password to confirm."
                  />
                  {errors?.password2 && (
                    <FormHelperText error>{errors.password2.message}</FormHelperText>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid item xs={12} sx={actionsStyle}>
                  {actions}
                </Grid>
              </Grid>
            </form>
          </Grid>
        )}
      </Grid>
    </div>
  );
};

export default BodyForm;
