import { FormControlLabel } from "@mui/material";
import { Checkbox } from "antd";
import LightBlueButtonComponent from "../../../../components/UX/buttons/LigthBlueButton";
import VisibleIcon from "../../../../components/icons/VisibleIcon";
import HidenIcon from "../../../../components/icons/HidenIcon";

const Password = ({
  handleSubmit,
  onSubmitLogin,
  formFittingTrigger,
  Grid,
  FormLabel,
  Input,
  BlueButtonComponent,
  isLoading,
  forceLogin,
  register,
  showPassword,
  setUpdatePasswordModalState,
  setRememberMe,
  setShowPassword,
  handleBackToEmail,
}) => {
  return (
    <form
      onSubmit={handleSubmit(onSubmitLogin)}
      style={{ width: formFittingTrigger() }}
    >
      <Grid marginY={"20px"} marginX={0} textAlign={"left"} item xs={12}>
        <FormLabel style={{ marginBottom: "0.9rem" }}>Password</FormLabel>
        <Input
          required={!forceLogin}
          {...register("password", {
            required: !forceLogin,
            minLength: 6,
          })}
          endAdornment={
            <button
              type="button"
              style={{
                padding: 0,
                backgroundColor: "transparent",
                outline: "none",
                margin: 0,
                width: "fit-content",
                aspectRatio: "1",
                borderRadius: "50%",
              }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <VisibleIcon fill={"var(--blue-dark-600)"} />
              ) : (
                <HidenIcon stroke={"var(--blue-dark-600)"} />
              )}
            </button>
          }
          style={{
            marginTop: "6px",
          }}
          placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;"
          type={showPassword ? "text" : "password"}
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
          <FormControlLabel
            style={{
              color: "#var(--gray-700, #344054)",
              fontSize: "14px",
              fontFamily: "Inter",
              fontWeight: "500",
              lineHeight: "20px",
            }}
            labelPlacement="end"
            control={
              <Checkbox
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ paddingRight: "0.5rem" }}
              />
            }
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

      <div style={{ display: "flex", gap: "12px", width: "100%" }}>
        <LightBlueButtonComponent
          disabled={false}
          loadingState={false}
          buttonType="button"
          title="Back"
          func={handleBackToEmail}
          styles={{ flex: "1" }}
        />
        <BlueButtonComponent
          disabled={false}
          loadingState={isLoading}
          buttonType="submit"
          title="Sign in"
          styles={{ flex: "1" }}
        />
      </div>
    </form>
  );
};

export default Password;
