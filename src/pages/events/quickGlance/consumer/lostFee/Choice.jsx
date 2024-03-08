import {
  Box,
  Typography,
  Fade,
  Modal,
  Backdrop,
  Button,
  Divider,
  Grid,
} from "@mui/material";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
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
    >
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
            <Link
              to={`/events/event-attendees/${customer?.uid}/collect-lost-fee/credit-card-method`}
            >
              <Button
                style={BlueButton}
              >
                <Typography
                  textTransform={"none"}
                  style={BlueButtonText}
                >
                  Credit card
                </Typography>
              </Button>
            </Link>
            <Divider />
            <Link
              to={`/events/event-attendees/${customer?.uid}/collect-lost-fee/cash-method`}
            >
              <Button
                style={BlueButton}
              >
                <Typography
                  textTransform={"none"}
                  style={BlueButtonText}
                >
                  Cash
                </Typography>
              </Button>
            </Link>
          </Grid>

          <Divider />
          <Button onClick={handleClose}>
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              fontWeight={400}
              fontSize={"16px"}
              fontFamily={"Inter"}
              lineHeight={"24px"}
            >
              Go back
            </Typography>
          </Button>
        </Box>
      </Fade>
    </Modal>
  );
};

export default Choice;