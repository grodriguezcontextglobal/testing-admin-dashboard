import { FormLabel } from "@mui/material"
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton"
import LightBlueButtonComponent from "../../../../components/UX/buttons/LigthBlueButton"
import Input from "../../../../components/UX/inputs/Input"

const MFA = ({ handleSubmit, formFittingTrigger, register, isLoading, onSubmitLogin, Grid, setCurrentStep }) => {
  return (
              <form
                onSubmit={handleSubmit(onSubmitLogin)}
                style={{ width: formFittingTrigger() }}
              >
                <Grid
                  marginY={"20px"}
                  marginX={0}
                  textAlign={"left"}
                  item
                  xs={12}
                >
                  <FormLabel style={{ marginBottom: "0.9rem" }}>
                    MFA Code
                  </FormLabel>
                  <Input
                  label={"MFA Code"}
                    type="text"
                    required
                    {...register("mfaCode", {
                      required: true,
                      minLength: 6,
                      maxLength: 6,
                    })}
                    style={{
                      marginTop: "6px",
                    }}
                    placeholder="000000"
                    fullWidth
                    autoFocus
                  />
                </Grid>

                <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                  <LightBlueButtonComponent
                    disabled={false}
                    loadingState={false}
                    buttonType="button"
                    title="Back"
                    func={() => setCurrentStep("password")}
                    styles={{ flex: "1" }}
                  />
                  <BlueButtonComponent
                    disabled={false}
                    loadingState={isLoading}
                    buttonType="submit"
                    title="Verify"
                    styles={{ flex: "1" }}
                  />
                </div>
              </form>
  )
}

export default MFA