import { Grid, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  onAddContactInfo,
  onAddEventData,
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
import AddingEventCreated from "../staff/components/AddingEventCreated";
import { devitrakApi } from "../../../../api/devitrakApi";
import { checkArray } from "../../../../components/utils/checkArray";
import { useStatusNotification } from "../../../../components/notification/alerts/useStatusNotification";
import {
  eventExists,
  mergeEventInfoDetail,
  saveExistingEventDetails,
  stepOneSubmitLabel,
} from "./utils/eventDetailsStep";
const Form = () => {
  const { eventInfoDetail, staff, event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const { notify, contextHolder } = useStatusNotification();
  // Two requests either way; without this the button looked dead meanwhile.
  const [saving, setSaving] = useState(false);
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
  const [triggerAddingAdminStaff, setTriggerAddingAdminStaff] = useState(false);
  const [daysBeforeEvent, setDaysBeforeEvent] = useState(
    eventInfoDetail.daysBeforeEvent
  );
  const [daysAfterEvent, setDaysAfterEvent] = useState(
    eventInfoDetail.daysAfterEvent
  );

  useEffect(() => {
    const controller = new AbortController();
    if (staff.adminUser.length === 0) {
      return setTriggerAddingAdminStaff(true);
    }
    return () => {
      controller.abort();
    };
  }, []);

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

  const createEventInProcess = async ({ event, contactInfo, sqlAddress }) => {
    const createEventNoSQLDatabase = async () => {
      const eventLink = event.eventName.replace(/ /g, "%20");
      const newEventInfo = await devitrakApi.post("/event/create-event", {
        user: user.email,
        company: user.company,
        subscription: [],
        eventInfoDetail: {
          ...event,
          dateBeginTime: new Date(event.dateBegin).getTime(),
          dateEndTime: new Date(event.dateEnd).getTime(),
        },
        staff: [],
        deviceSetup: [],
        extraServicesNeeded: false,
        extraServices: [],
        active: false,
        contactInfo: contactInfo,
        qrCodeLink: `https://app.devitrak.net/?event=${eventLink}&company=${user.companyData.id}`,
        company_id: user.companyData.id,
        legal_contract: false,
        legal_documents_list: [],
        contract_for: "event",
      });
      if (newEventInfo.data.ok) {
        const eventId = checkArray(newEventInfo.data.event);
        await devitrakApi.patch(`/event/edit-event/${eventId.id}`, {
          qrCodeLink: `https://app.devitrak.net/?event=${eventId.id}&company=${user.companyData.id}`,
        });
        return { NoSQlID: eventId.id };
      }
    };
    const createEvent = async () => {
      const eventSQL = await devitrakApi.post("/db_event/new_event", {
        event_name: event.eventName,
        venue_name: event.floor,
        street_address: sqlAddress.street_address,
        city_address: sqlAddress.city_address,
        state_address: sqlAddress.state_address,
        zip_address: sqlAddress.zip_address,
        email_company: contactInfo.email,
        phone_number: contactInfo.phone[0],
        company_assigned_event_id: user.sqlInfo.company_id,
        contact_name: contactInfo.name,
      });
      console.log(eventSQL.data.consumer);
      return { SqlID: eventSQL.data.consumer.insertId };
    };
    return await Promise.all([createEvent(), createEventNoSQLDatabase()]);
  };

  const handleEventInfo = async (data) => {
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
      daysBeforeEvent: daysBeforeEvent,
      daysAfterEvent: daysAfterEvent,
    };
    const contactInfoFormat = {
      name: `${user.name} ${user.lastName}`,
      email: user.email,
      phone: numberOfPhoneNumbersPerEvent,
    };
    if (numberOfPhoneNumbersPerEvent.length < 1) {
      return notify(
        "warning",
        "Add a phone number for the event.",
        "Enter it and press the plus button next to the field."
      );
    }

    setSaving(true);
    try {
      if (eventExists(event)) {
        // A second visit to this step, or a resumed draft: update both records.
        await saveExistingEventDetails({
          api: devitrakApi,
          event,
          format,
          contactInfo: contactInfoFormat,
          address: data,
        });
      } else {
        const t = await createEventInProcess({
          event: format, contactInfo: contactInfoFormat, sqlAddress: {
            street_address: data.street,
            city_address: data.city,
            state_address: data.state,
            zip_address: data.zipCode,
          }
        });
        dispatch(onAddEventData({ ...format, idNoSQl: t[1].NoSQlID, idSql: t[0].SqlID }));
      }
      dispatch(onAddContactInfo(contactInfoFormat));
      // Merged, not replaced: the rest (legal_documents_list among it) belongs
      // to later steps and was being dropped here.
      dispatch(onAddEventInfoDetail(mergeEventInfoDetail(eventInfoDetail, format)));
      return navigate("/create-event-page/staff-detail");
    } catch (error) {
      // This used to be swallowed, which read as a button that did nothing.
      notify(
        "error",
        "The event details could not be saved.",
        error?.response?.data?.msg ?? error?.message ?? "Please try again."
      );
    } finally {
      setSaving(false);
    }
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
      {contextHolder}
      {triggerAddingAdminStaff && <AddingEventCreated />}
      <FormFields
        isMobile={isMobile}
        handleSubmit={handleSubmit}
        errors={errors}
        handleEventInfo={handleEventInfo}
        submitLabel={stepOneSubmitLabel(event)}
        saving={saving}
        register={register}
        eventInfoDetail={eventInfoDetail}
        begin={begin}
        setBegin={setBegin}
        end={end}
        setEnd={setEnd}
        daysBeforeEvent={daysBeforeEvent}
        daysAfterEvent={daysAfterEvent}
        setDaysBeforeEvent={setDaysBeforeEvent}
        setDaysAfterEvent={setDaysAfterEvent}
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
