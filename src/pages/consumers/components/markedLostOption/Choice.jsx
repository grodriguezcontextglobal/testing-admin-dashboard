import { Grid } from "@mui/material";
import { Divider } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../../components/UX/modal/ModalUX";

const Choice = ({ openModal, setOpenModal }) => {
  // const { customer } = useSelector((state) => state.stripe);
  const { customer: customerDetail } = useSelector((state) => state.customer);
  const handleClose = () => {
    setOpenModal(false);
  };
  const navigate = useNavigate()
  const bodyModal = () => {
    return (
      <>
        <Grid
          container
          marginY={2}
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          gap={2}
          wrap        >
          <BlueButtonComponent title={"Credit card"} styles={{ width: "100%" }}
            func={() => navigate(`/consumers/${customerDetail?.uid}/lost-device-fee/credit_card`)} />
          <BlueButtonComponent title={"Cash"} styles={{ width: "100%" }}
            func={() => navigate(`/consumers/${customerDetail?.uid}/lost-device-fee/cash`)} />
        </Grid>
        <Divider />
        <GrayButtonComponent func={handleClose} title={"Go back"} />
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
  );
};

export default Choice;
