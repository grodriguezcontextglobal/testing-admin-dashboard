import { Backdrop, Box, Divider, Fade, Grid, Modal } from "@mui/material";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
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
  width: "40vw",
};
const Choice = ({ openModal, setOpenModal }) => {
  const { customer } = useSelector((state) => state.stripe);
  const handleClose = () => {
    setOpenModal(false);
  };

  return (
    <Modal
      aria-labelledby="transition-modal-title"
      aria-describedby="transition-modal-description"
      open={openModal}
      onClose={handleClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
        },
      }}
      sx={{ zIndex: 1300 }}
    >
      <Fade in={openModal}>
        <Box sx={style}>
          <p style={{ ...Subtitle, fontWeight: 600 }}>
            How will the lost device fee be paid?
          </p>
          <Grid
            container
            marginY={2}
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            gap={1}
          >
            <Link
              style={{ width: "100%" }}
              to={`/events/event-attendees/${customer?.uid}/collect-lost-fee/credit-card-method`}
            >
              <BlueButtonComponent
                styles={{ width: "100%" }}
                title="Credit card"
              />
            </Link>
            <Divider />
            <Link
              style={{ width: "100%" }}
              to={`/events/event-attendees/${customer?.uid}/collect-lost-fee/cash-method`}
            >
              <BlueButtonComponent styles={{ width: "100%" }} title="Cash" />
            </Link>
          </Grid>

          <GrayButtonComponent
            styles={{ width: "100%" }}
            title="Go back"
            func={handleClose}
          />
        </Box>
      </Fade>
    </Modal>
  );
};

export default Choice;
