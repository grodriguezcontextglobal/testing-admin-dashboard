import {
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { Button } from "antd";
import { useForm } from "react-hook-form";
import ModalUX from "../../../components/UX/modal/ModalUX";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../styles/global/Subtitle";

const ChargeLostFee = ({ openModal, setOpenModal, record }) => {
  const { register, handleSubmit } = useForm();
  const closeModal = () => {
    return setOpenModal(false);
  };
  const bodyUX = () => {
    return (
      <Grid
        display={"flex"}
        flexDirection={"column"}
        justifyContent={"space-around"}
        alignItems={"center"}
        container
      >
        <Grid item xs={12} sm={12} md={12} lg={12}>
          <form
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "center",
              textAlign: "left",
              gap: "10px",
            }}
            onSubmit={handleSubmit(null)}
            // className="form"
          >
            <div style={{ width: "100%" }}>
              {" "}
              <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                <p style={Subtitle}>Lost item serial number</p>
              </InputLabel>
              <OutlinedInput
                disabled
                value={record.serial_number}
                style={{ ...OutlinedInputStyle, width: "100%" }}
              />
            </div>
            <div style={{ width: "100%" }}>
              {" "}
              <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                <p style={Subtitle}>Capturing deposit amount</p>
              </InputLabel>
              <OutlinedInput
                {...register("amount")}
                style={{ ...OutlinedInputStyle, width: "100%" }}
                placeholder="e.g. $200"
                startAdornment={
                  <InputAdornment position="start">
                    <p style={Subtitle}>$</p>
                  </InputAdornment>
                }
              />
            </div>
            <div style={{ width: "100%" }}>
              {" "}
              <FormHelperText
                style={{
                  marginBottom: "1rem",
                }}
                id="outlined-weight-helper-text"
              >
                <p style={Subtitle}>
                  Please be aware that the displayed amount is the maximum value
                  that will be captured. If you wish to capture a lesser amount,
                  you have the option to manually input the desired value before
                  submitting.
                </p>
              </FormHelperText>
            </div>

            <Button
              type="submit"
              style={{
                ...BlueButton,
                width: "100%",
              }}
            >
              <Typography
                textTransform={"none"}
                style={{
                  ...BlueButtonText,
                  width: "100%",
                }}
              >
                Charge lost fee to customer
              </Typography>
            </Button>
          </form>
        </Grid>
      </Grid>
    )
  }

  return (
    <>
    <ModalUX body={bodyUX} title={"Charge lost fee"} openDialog={openModal} closeModal={closeModal} />
    {/* <Modal
      open={openModal}
      onCancel={() => closeModal()}
      onClose={() => closeModal()}
      title="Charge lost fee"
      footer={null}
      centered
      maskClosable={false}
      >
    </Modal> */}
      </>
  );
};

export default ChargeLostFee;
