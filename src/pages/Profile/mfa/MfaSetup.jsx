import {
  Divider,
  Grid,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { message, notification } from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApiAdmin } from "../../../api/devitrakApi";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../components/UX/buttons/DangerButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import { onUpdateMfaStatus } from "../../../store/slices/adminSlice";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import Header from "../components/Header";

const MfaSetup = () => {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm();
  const [api, contextHolder] = notification.useNotification();
  const dispatch = useDispatch();
  const { mfaEnabled } = useSelector((state) => state.admin);
  const handleGenerateMfa = async () => {
    try {
      setLoading(true);
      const response = await devitrakApiAdmin.post("/mfa/generate");
      if (response.data && response.data.qrCode) {
        setQrCode(response.data.qrCode);
      } else {
        message.error("Failed to generate QR Code");
      }
    } catch (error) {
      console.error(error);
      message.error("Error generating MFA Setup");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMfa = async (data) => {
    try {
      setLoading(true);
      const response = await devitrakApiAdmin.post("/mfa/verify", {
        token: data.token,
      });
      if (response.data) {
        dispatch(onUpdateMfaStatus(true));
        message.success("MFA is now active");
        api.open({
          message: "MFA Activated",
          description:
            "Multi-Factor Authentication has been successfully enabled for your account.",
        });
      }
    } catch (error) {
      console.error(error);
      message.error("Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    try {
      setLoading(true);
      await devitrakApiAdmin.post("/mfa/disable");
      dispatch(onUpdateMfaStatus(false));
      message.success("MFA has been disabled");
      api.info({
        message: "MFA Disabled",
        description:
          "Multi-Factor Authentication has been disabled for your account.",
      });
    } catch (error) {
      console.error("Error disabling MFA:", error);
      message.error("Failed to disable MFA");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    !mfaEnabled && handleGenerateMfa();
  }, [])
  
  return (
    <Grid
      container
      style={{
        padding: "24px 0",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      {contextHolder}
      <Grid item xs={12} sm={12} md={12} lg={12}>
        <Grid
          container
          spacing={2}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Grid item xs={12}>
            <Header
              title={"Multi-Factor Authentication"}
              description={"Add an extra layer of security to your account."}
            />
          </Grid>
        </Grid>

        <Grid item xs={12} sx={{ my: 2 }}>
          <Divider />
        </Grid>

        <Grid container spacing={2} alignItems="flex-start">
          {/* {!mfaEnabled && (
            <Grid item xs={12}>
              <Typography sx={{ mb: 2 }}>
                Protect your account by enabling Multi-Factor Authentication
                (MFA). When enabled, you will be required to enter a code from
                your authenticator app when logging in.
              </Typography>
              <BlueButtonComponent
                title="Setup MFA"
                func={handleGenerateMfa}
                loadingState={loading}
              />
            </Grid>
          )} */}

          {!mfaEnabled && (
            <Grid item xs={12} container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  1. Scan QR Code
                </Typography>
                <Typography sx={{ mb: 2 }}>
                  Open your authenticator app (like Google Authenticator or
                  Authy) and scan the QR code below.
                </Typography>
                {qrCode && (
                  <img
                    src={qrCode}
                    alt="MFA QR Code"
                    style={{
                      maxWidth: "200px",
                      border: "1px solid #eee",
                      padding: "10px",
                    }}
                  />
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  2. Enter Verification Code
                </Typography>
                <Typography sx={{ mb: 2 }}>
                  Enter the 6-digit code generated by your app to verify and
                  enable MFA.
                </Typography>
                <form onSubmit={handleSubmit(handleVerifyMfa)}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <InputLabel sx={{ mb: 1 }}>Verification Code</InputLabel>
                      <OutlinedInput
                        {...register("token", {
                          required: true,
                          minLength: 6,
                          maxLength: 6,
                        })}
                        placeholder="000000"
                        fullWidth
                        style={OutlinedInputStyle}
                      />
                    </Grid>
                    <Grid item xs={12} sx={{ display: "flex", gap: 2 }}>
                      <GrayButtonComponent
                        title="Cancel"
                        func={() => {
                          setQrCode(null);
                          reset();
                        }}
                      />
                      <BlueButtonComponent
                        buttonType="submit"
                        title="Verify & Enable"
                        loadingState={loading}
                      />
                    </Grid>
                  </Grid>
                </form>
              </Grid>
            </Grid>
          )}

          {mfaEnabled && (
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                MFA is Active
              </Typography>
              <Typography sx={{ mb: 2 }}>
                Your account is now secured with Multi-Factor Authentication.
              </Typography>
              <Grid container spacing={2}>
                <Grid item>
                  <DangerButtonComponent
                    title="Disable MFA"
                    func={handleDisableMfa}
                    loadingState={loading}
                  />
                </Grid>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default MfaSetup;
