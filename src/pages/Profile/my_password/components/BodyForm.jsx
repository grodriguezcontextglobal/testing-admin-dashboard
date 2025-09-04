import {
  Grid,
  InputLabel,
  OutlinedInput,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Divider } from "antd";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import Header from "../../components/Header";

const BodyForm = ({
  handleUpdatePersonalInfo,
  handleSubmit,
  triggerRoutes,
  register,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <form
      onSubmit={handleSubmit(handleUpdatePersonalInfo)}
      style={{
        width: "100%",
        padding: isMobile ? "16px" : 0,
      }}
    >
      <Grid container>
        <Grid
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <Grid item xs={12} sm={12} md={6} lg={6}>
            <Header
              title={"Change your password"}
              description={"Update your password."}
            />
          </Grid>
          {/* Top Buttons */}
          <Grid
            item
            xs={12}
            sm={12}
            md={6}
            lg={6}
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
              "& > button": {
                width: { xs: "100%", sm: "auto" },
              },
            }}
          >
            <GrayButtonComponent
              title={"Cancel"}
              onClick={() => triggerRoutes()}
              style={{
                width: "fit-content",
              }}
            />
            <BlueButtonComponent
              buttonType="submit"
              title={"Save and log out"}
              style={{
                width: "fit-content",
              }}
            />
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Divider />
        </Grid>

        {/* Password Form Fields */}
        <Grid item xs={12} container spacing={2}>
          {/* Current Password */}
          <Grid item xs={12} sm={4}>
            <InputLabel>
              <Typography
                sx={{
                  color: "#344054",
                  fontSize: { xs: "13px", sm: "14px" },
                  fontWeight: "500",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                  textAlign: { xs: "left", sm: "left" },
                }}
              >
                Current password
              </Typography>
            </InputLabel>
          </Grid>
          <Grid item xs={12} sm={8}>
            <OutlinedInput
              required
              style={{ ...OutlinedInputStyle }}
              fullWidth
              {...register("current_password", {
                required: true,
                minLength: 6,
                maxLength: 12,
              })}
              type="password"
              placeholder="Current password"
            />
          </Grid>

          {/* New Password */}
          <Grid item xs={12} sm={4}>
            <InputLabel>
              <Typography
                sx={{
                  color: "#344054",
                  fontSize: { xs: "13px", sm: "14px" },
                  fontWeight: "500",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                  textAlign: { xs: "left", sm: "left" },
                }}
              >
                New password
              </Typography>
            </InputLabel>
          </Grid>
          <Grid item xs={12} sm={8}>
            <OutlinedInput
              required
              style={{ ...OutlinedInputStyle }}
              fullWidth
              {...register("password1", { required: true })}
              type="password"
              placeholder="Type your new password"
            />
          </Grid>

          {/* Confirm New Password */}
          <Grid item xs={12} sm={4}>
            <InputLabel>
              <Typography
                sx={{
                  color: "#344054",
                  fontSize: { xs: "13px", sm: "14px" },
                  fontWeight: "500",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                  textAlign: { xs: "left", sm: "left" },
                }}
              >
                Confirm new password
              </Typography>
            </InputLabel>
          </Grid>
          <Grid item xs={12} sm={8}>
            <OutlinedInput
              required
              style={{ ...OutlinedInputStyle }}
              fullWidth
              {...register("password2", { required: true })}
              type="password"
              placeholder="Repeat the new password to confirm."
            />
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Divider />
        </Grid>

        {/* Bottom Buttons */}
        <Grid
          item
          xs={12}
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
            "& > button": {
              width: { xs: "100%", sm: "auto" },
            },
          }}
        >
          <GrayButtonComponent
            title={"Cancel"}
            func={() => triggerRoutes()}
            style={{
              width: "fit-content",
            }}
          />
          <BlueButtonComponent
            buttonType="submit"
            title={"Save and log out"}
            style={{
              width: "fit-content",
            }}
          />
        </Grid>
      </Grid>
    </form>
  );
};

export default BodyForm;
