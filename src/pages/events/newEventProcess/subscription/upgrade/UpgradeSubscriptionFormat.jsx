import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { onAddSubscription } from "../../store/slices/subscriptionSlice";
import "../../style/component/subscription/Format.css";
import { Box, Button, ListItemIcon, Typography } from "@mui/material";

const UpgradeSubscriptionFormat = ({ props }) => {
  const dispatch = useDispatch();
  const navigation = useNavigate();
  const {
    id,
    name,
    adminUser,
    headsetAttendees,
    deviceCapacity,
    deviceType,
    support,
    training,
    price,
    merchantService,
  } = props;

  const handleSelectSubscription = async (props) => {
    dispatch(onAddSubscription(props));
    if(props.id !== 1) return navigation("/subscription/subscription-payment")
    return navigation("/create-event-page/event-detail");
  };
  return (
    <Box className="card-format-container" key={id}>
      <Typography variant="h5" component="subtitle1">
        <strong>{name}</strong>
      </Typography>
      <Typography variant="body1">
        Price: <strong>${price}</strong>
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => handleSelectSubscription(props)}
        sx={{ mt: 2 }}
      >
        SELECT
      </Button>
      <Typography variant="body1" component="p" sx={{ mt: 2 }}>
        <ListItemIcon>
          <Icon icon="ic:outline-check" color="#1e73be" />
        </ListItemIcon>
        Admin user: <strong>{adminUser}</strong>
      </Typography>
      <Typography variant="body1" component="p">
        <ListItemIcon>
          <Icon icon="ic:outline-check" color="#1e73be" />
        </ListItemIcon>
        Headset Attendees: <strong>{headsetAttendees}</strong>
      </Typography>
      <Typography variant="body1" component="p">
        <ListItemIcon>
          <Icon icon="ic:outline-check" color="#1e73be" />
        </ListItemIcon>
        Max capacity of devices: <strong>{deviceCapacity}</strong>
      </Typography>
      <Typography variant="body1" component="p">
        <Box sx={{ textDecoration: "underline" }}>Type of devices:</Box>
        {deviceType?.map((type) => (
          <Typography key={type} variant="body2" component="p" sx={{ ml: 2 }}>
            <ListItemIcon>
              <Icon icon="ic:outline-check" color="#1e73be" />
            </ListItemIcon>
            {type}
          </Typography>
        ))}
      </Typography>
      <Typography variant="body1" component="p">
        <ListItemIcon>
          <Icon icon="ic:outline-check" color="#1e73be" />
        </ListItemIcon>
        Remotely Support: <strong>{support ? "Yes" : "No"}</strong>
      </Typography>
      <Typography variant="body1" component="p">
        <ListItemIcon>
          <Icon icon="ic:outline-check" color="#1e73be" />
        </ListItemIcon>
        Merchant Service: <strong>{merchantService ? "Yes" : "No"}</strong>
      </Typography>
      <Typography variant="body1" component="p">
        <ListItemIcon>
          <Icon icon="ic:outline-check" color="#1e73be" />
        </ListItemIcon>
        Training: <strong>{training}</strong>
      </Typography>
    </Box>
  );
};

export default UpgradeSubscriptionFormat;
