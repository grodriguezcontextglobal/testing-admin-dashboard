import { FormLabel } from "@mui/material"
import { useState } from "react"
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton"
import LightBlueButtonComponent from "../../../../components/UX/buttons/LigthBlueButton"
import TextLink from "../../../../components/UX/buttons/TextLink"
import Input from "../../../../components/UX/inputs/Input"

/* The sign-in step that asks for the second factor: the 6-digit code from the
   authenticator app or, when the device is lost, a one-time recovery code
   (FedRAMP A5). Only one of the two fields exists at a time, and switching
   empties the other, so the payload never carries both. */
const MFA = ({ handleSubmit, formFittingTrigger, register, setValue, isLoading, onSubmitLogin, Grid, setCurrentStep }) => {
  const [useRecoveryCode, setUseRecoveryCode] = useState(false)

  const switchTo = (recovery) => {
    setValue?.(recovery ? "mfaCode" : "recoveryCode", "")
    setUseRecoveryCode(recovery)
  }

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
                  {useRecoveryCode ? (
                    <>
                      <FormLabel
                        htmlFor="login-recovery-code"
                        style={{ marginBottom: "0.9rem" }}
                      >
                        Recovery code
                      </FormLabel>
                      <Input
                        id="login-recovery-code"
                        type="text"
                        required
                        autoComplete="off"
                        {...register("recoveryCode", { required: true })}
                        style={{
                          marginTop: "6px",
                        }}
                        placeholder="xxxx-xxxx-xxxx-xxxx"
                        helperText="Enter one of the recovery codes you saved. Each code works once, even if sign-in then stops at an active session."
                        aria-describedby="login-recovery-code-helper-text"
                        fullWidth
                        autoFocus
                      />
                    </>
                  ) : (
                    <>
                      <FormLabel
                        htmlFor="login-mfa-code"
                        style={{ marginBottom: "0.9rem" }}
                      >
                        Authentication code
                      </FormLabel>
                      <Input
                        id="login-mfa-code"
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
                        helperText="Enter the 6-digit code from your authenticator app."
                        aria-describedby="login-mfa-code-helper-text"
                        fullWidth
                        autoFocus
                      />
                    </>
                  )}
                  <TextLink
                    onClick={() => switchTo(!useRecoveryCode)}
                    style={{ marginTop: "12px" }}
                  >
                    {useRecoveryCode
                      ? "Use the code from your authenticator app"
                      : "Lost your device? Use a recovery code"}
                  </TextLink>
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
