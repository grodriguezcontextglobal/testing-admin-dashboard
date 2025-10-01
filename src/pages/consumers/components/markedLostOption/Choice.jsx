import { Grid } from "@mui/material";
import { Divider } from "antd";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import ModalUX from "../../../../components/UX/modal/ModalUX";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { GrayButton } from "../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../styles/global/GrayButtonText";

const Choice = ({ openModal, setOpenModal }) => {
  // const { customer } = useSelector((state) => state.stripe);
  const { customer: customerDetail } = useSelector((state) => state.customer);
  const handleClose = () => {
    setOpenModal(false);
  };
  const bodyModal = () => {
    return (
      <>
        {/* <p
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
        </p> */}
        <Grid
          container
          marginY={2}
          display={"flex"}
          flexDirection={"column"}
          justifyContent={"space-between"}
          alignItems={"center"}
          gap={2}
        >
          <Link
            style={{ width: "100%", backgroundColor: "transparent" }}
            to={`/consumers/${customerDetail?.uid}/lost-device-fee/credit_card`}
          >
            <button style={{ ...BlueButton, width: "100%" }}>
              <p
                style={{
                  ...BlueButtonText,
                  textTransform: "none",
                  ...CenteringGrid,
                }}
              >
                Credit card
              </p>
            </button>
          </Link>
          <Link
            style={{ width: "100%", backgroundColor: "transparent" }}
            to={`/consumers/${customerDetail?.uid}/lost-device-fee/cash`}
          >
            <button style={{ ...BlueButton, width: "100%" }}>
              <p
                style={{
                  ...BlueButtonText,
                  textTransform: "none",
                  ...CenteringGrid,
                }}
              >
                Cash
              </p>
            </button>
          </Link>
        </Grid>

        <Divider />
        <button onClick={handleClose} style={{ ...GrayButton, width: "100%" }}>
          <p
            style={{
              ...GrayButtonText,
              ...CenteringGrid,
              textTransform: "none",
            }}
          >
            Go back
          </p>
        </button>
      </>
    );
  };
  return (
    <ModalUX
      title={"How the lost device fee will be collected?"}
      openDialog={openModal}
      closeModal={handleClose}
      body={bodyModal()}
    />
    // <Modal
    //   open={openModal}
    //   centered
    //   onCancel={() => handleClose()}
    //   footer={[]}
    //   style={{ zIndex: 30 }}
    // ></Modal>
  );
};

export default Choice;
