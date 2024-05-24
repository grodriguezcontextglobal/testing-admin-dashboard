import { Divider, Modal } from "antd";
import { useSelector } from "react-redux";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { Link } from "react-router-dom";
import { Grid } from "@mui/material";

const Choice = ({ openModal, setOpenModal }) => {
  const { customer } = useSelector((state) => state.stripe);
  const { customer: customerDetail } = useSelector((state) => state.customer);
  console.log("stripe", customer);
  console.log("customer", customerDetail);
  const handleClose = () => {
    setOpenModal(false);
  };
  return (
    <Modal open={openModal} onCancel={() => handleClose()} footer={[]}>
      <p
        style={{
          textTransform: "none",
          textAlign: "left",
          fontWeight: 400,
          fontSize: "16px",
          fontFamily: "Inter",
          lineHeight: "24px",
        }}
      >
        How the lost device fee will be collected?
      </p>
      <Grid
        container
        marginY={2}
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Link to={`/consumers/${customerDetail?.uid}/lost-device-fee/cash`}>
          <button style={BlueButton}>
            <p style={{ ...BlueButtonText, textTransform: "none" }}>
              Credit card
            </p>
          </button>
        </Link>
        <Divider />
        <Link to={`/consumers/${customerDetail?.uid}/lost-device-fee/cash`}>
          <button style={BlueButton}>
            <p style={{ ...BlueButtonText, textTransform: "none" }}>Cash</p>
          </button>
        </Link>
      </Grid>

      <Divider />
      <button onClick={handleClose}>
        <p
          style={{
            textTransform: "none",
            textAlign: "left",
            fontWeight: 400,
            fontSize: "16px",
            fontFamily: "Inter",
            lineHeight: "24px",
          }}
        >
          Go back
        </p>
      </button>
    </Modal>
  );
};

export default Choice;
