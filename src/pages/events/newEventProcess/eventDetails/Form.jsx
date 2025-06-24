import { Grid, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  onAddContactInfo,
  onAddEventInfoDetail,
} from "../../../../store/slices/eventSlice";
// import "react-clock/dist/Clock.css";
import "react-datepicker/dist/react-datepicker.css";
import "react-phone-number-input/style.css";
import "../../../../styles/global/OutlineInput.css";
import "../../../../styles/global/ant-select.css";
import "../../../../styles/global/reactInput.css";
import "../style/NewEventInfoSetup.css";
import FormFields from "./ux/FormFields";
const Form = () => {
  const { eventInfoDetail } = useSelector((state) => state.event);
  const addressSplit = eventInfoDetail?.address?.split(" ");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      eventName: eventInfoDetail?.eventName,
      eventLocation: `${addressSplit?.at(-3)}, ${addressSplit
        ?.at(-2)
        ?.replace(",", "")}`,
      address: `${addressSplit?.slice(0, -3)}, ${addressSplit?.at(
        -3
      )} ${addressSplit?.at(-2)}, ${addressSplit?.at(-1)}`,
      building: eventInfoDetail?.eventName,
      conferenceRoom: eventInfoDetail?.floor,
      city: addressSplit?.at(-3),
      state: addressSplit?.at(-2)?.replace(",", ""),
      street: addressSplit?.slice(0, -3)?.toString()?.replaceAll(",", " "),
      zipCode: addressSplit?.at(-1),
    },
  });
  const [begin, setBegin] = useState(
    eventInfoDetail.dateBegin ? new Date(eventInfoDetail.dateBegin) : new Date()
  );
  const [end, setEnd] = useState(
    eventInfoDetail.dateEnd ? new Date(eventInfoDetail.dateEnd) : new Date()
  );
  const [contactPhoneNumber, setContactPhoneNumber] = useState("");
  const [numberOfPhoneNumbersPerEvent, setNumberOfPhoneNumbersPerEvent] =
    useState(eventInfoDetail.phoneNumber);
  const [merchant, setMerchant] = useState(eventInfoDetail.merchant);

  useEffect(() => {
    setEnd(
      eventInfoDetail.dateEnd
        ? new Date(eventInfoDetail.dateEnd)
        : new Date(begin)
    );
  }, [begin, eventInfoDetail.dateBegin]);

  const addingPhoneNumber = () => {
    const result = [...numberOfPhoneNumbersPerEvent, contactPhoneNumber];
    setNumberOfPhoneNumbersPerEvent(result);
    setContactPhoneNumber("");
    return;
  };
  const removePhoneNumber = (phone) => {
    const filter = numberOfPhoneNumbersPerEvent.filter(
      (element) => element !== phone
    );
    return setNumberOfPhoneNumbersPerEvent(filter);
  };

  const handleEventInfo = async (data) => {
    console.log(data);
    const format = {
      eventName: data.eventName,
      eventLocation: `${data.city}, ${data.state}`,
      address: `${data.street}, ${data.city} ${data.state}, ${data.zipCode}`,
      building: data.eventName,
      floor: data.conferenceRoom,
      phoneNumber: numberOfPhoneNumbersPerEvent,
      merchant: merchant,
      dateBegin: begin,
      dateEnd: end,
    };
    const contactInfoFormat = {
      phone: numberOfPhoneNumbersPerEvent,
    };
    if (numberOfPhoneNumbersPerEvent.length < 1)
      return alert(
        "There is no phone number assigned to event. Please enter the phone number and then click plus icon button."
      );
    dispatch(onAddEventInfoDetail(format));
    dispatch(onAddContactInfo(contactInfoFormat));
    // storeSubscriptionJSON();
    navigate("/create-event-page/staff-detail");
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Grid
      display={"flex"}
      flexDirection={"column"}
      justifyContent={"space-around"}
      alignItems={"center"}
      gap={2}
      container
    >
      <FormFields
        isMobile={isMobile}
        handleSubmit={handleSubmit}
        errors={errors}
        handleEventInfo={handleEventInfo}
        register={register}
        eventInfoDetail={eventInfoDetail}
        begin={begin}
        setBegin={setBegin}
        end={end}
        setEnd={setEnd}
        contactPhoneNumber={contactPhoneNumber}
        setContactPhoneNumber={setContactPhoneNumber}
        numberOfPhoneNumbersPerEvent={numberOfPhoneNumbersPerEvent}
        merchant={merchant}
        setMerchant={setMerchant}
        addingPhoneNumber={addingPhoneNumber}
        removePhoneNumber={removePhoneNumber}
      />
    </Grid>
  );
};

export default Form;
