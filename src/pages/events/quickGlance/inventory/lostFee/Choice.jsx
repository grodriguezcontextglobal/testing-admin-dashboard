import {
  Box,
  Divider,
  Fade,
  Grid,
  Typography
} from "@mui/material";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../../../components/UX/modal/ModalUX";
const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  border: "2px solid #000",
  p: 4,
  borderRadius: "20px",
  boxShadow: "0px 0px 5px var(--gray300)",
};
const Choice = ({ openModal, setOpenModal }) => {
  const { customer } = useSelector((state) => state.stripe);
  const handleClose = () => {
    setOpenModal(false);
  };
  const navigate = useNavigate();
  const bodyModal = () => {
    return (
      <Fade in={openModal}>
        <Box sx={style}>
          <Typography
            textTransform={"none"}
            textAlign={"left"}
            fontWeight={400}
            fontSize={"16px"}
            fontFamily={"Inter"}
            lineHeight={"24px"}
          >
            How the lost device fee will be collected?
          </Typography>
          <Grid
            container
            marginY={2}
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
          >
            <BlueButtonComponent
              title={"Credit card"}
              styles={{ width: "100%" }}
              func={() => navigate(`/events/event-attendees/${customer?.uid}/collect-lost-fee/credit-card-method`)}
            />
            <BlueButtonComponent
              title={"Cash"}
              styles={{ width: "100%" }}
              func={() => navigate(`/events/event-attendees/${customer?.uid}/collect-lost-fee/cash-method`)}
            />
          </Grid>

          <Divider />
          <GrayButtonComponent
            title={"Go back"}
            func={handleClose}
          />
        </Box>
      </Fade>

    )
  }
  const closeModal = () => {
    setOpenModal(false);
  }
  return (
    <ModalUX
      openDialog={openModal}
      closeModal={closeModal}
      bodyModal={bodyModal()}
    />
  );
};

export default Choice;