import { useEffect, useState } from "react";
import { Button, Modal, notification } from "antd";
import { Grid, InputLabel, OutlinedInput, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import PropTypes from "prop-types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useDispatch, useSelector } from "react-redux";
import { onAddEventData } from "../../../../store/slices/eventSlice";
import { devitrakApi } from "../../../../api/devitrakApi";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { useQuery } from "@tanstack/react-query";

const UpdateEventInfo = ({ openUpdateEventModal, setOpenUpdateEventModal }) => {
  const { user } = useSelector((state) => state.admin);
  const eventInventoryQuery = useQuery({
    queryKey: ["eventInventoryQuery"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-pool-list", {
        company: user.companyData.id,
        eventSelected: event.eventInfoDetail.eventName,
      }),
    refetchOnMount: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    eventInventoryQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  const { event } = useSelector((state) => state.event);
  const [begin, setBegin] = useState(
    new Date(event?.eventInfoDetail?.dateBegin) ?? new Date()
  );
  const [end, setEnd] = useState(
    new Date(event?.eventInfoDetail?.dateEnd) ?? new Date()
  );
  const cityAndState = event.eventInfoDetail.eventLocation.split(",");
  const street = event.eventInfoDetail.address.split(",");
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      city: cityAndState[0],
      conferenceRoom: event.eventInfoDetail.building,
      eventName: event.eventInfoDetail.eventName,
      state: cityAndState[1],
      street: street[0],
      zipCode: street[2],
    },
  });
  const closeModal = () => {
    reset({});
    return setOpenUpdateEventModal(false);
  };
  const addressSplitting = () => {
    const address = event.eventInfoDetail.address.split(",");
    return {
      address: address[0],
      cityAndState: address[1],
      zip: address[2],
    };
  };
  addressSplitting();

  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, msg) => {
    api.open({
      message: msg,
    });
  };
  const handleUpdateEvent = async (data) => {
    setLoading(true);
    const eventInfoProfile = {
      eventName: data.eventName,
      eventLocation: `${data.city}, ${data.state}`,
      address: `${data.street}, ${data.city} ${data.state}, ${data.zipCode}`,
      building: data.conferenceRoom,
      floor: data.conferenceRoom,
      phoneNumber: event.contactInfo.phone,
      merchant: event.eventInfoDetail.merchant,
      dateBegin: begin.toString(),
      dateEnd: end.toString(),
    };

    const respUpdateEventInfoDetail = await devitrakApi.patch(
      `/event/edit-event/${event.id}`,
      {
        eventInfoDetail: eventInfoProfile,
      }
    );
    if (respUpdateEventInfoDetail.data.ok) {
      setTimeout(() => {
        setLoading(false);
        reset({});
        dispatch(
          onAddEventData({ ...event, eventInfoDetail: eventInfoProfile })
        );

        openNotificationWithIcon(
          "success",
          "Event detail information updated."
        );
        closeModal();
      }, 2500);
    }
    setTimeout(() => {
      setLoading(false);
      reset({});
      closeModal();
    }, 2500);
  };
  const renderTitle = () => {
    return (
      <Typography
        textAlign={"center"}
        fontFamily={"Inter"}
        fontSize={"18px"}
        fontStyle={"normal"}
        fontWeight={600}
        lineHeight={"28px"}
        color={"var(--gray-900, #101828)"}
        padding={"0 0 20px 0"}
      >
        Update contact information
      </Typography>
    );
  };
  return (
    <Modal
      title={renderTitle()}
      centered
      open={openUpdateEventModal}
      onOk={() => closeModal()}
      onCancel={() => closeModal()}
      footer={[]}
      maskClosable={false}
      style={{ zIndex: 30 }}
    >
      {contextHolder}
      <Grid
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
        margin={"auto"}
        container
      >
        <form onSubmit={handleSubmit(handleUpdateEvent)}>
          <InputLabel
            id="eventName"
            style={{ marginBottom: "0.2rem", width: "100%" }}
          >
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              fontFamily={"Inter"}
              fontSize={"14px"}
              fontStyle={"normal"}
              fontWeight={500}
              lineHeight={"20px"}
              color={"var(--gray-700, #344054)"}
            >
              Event name
            </Typography>
          </InputLabel>
          <OutlinedInput
            id="eventName"
            required
            readOnly={
              eventInventoryQuery?.data?.data?.receiversInventory.length > 0
            }
            {...register("eventName", { required: true })}
            aria-invalid={errors.eventName}
            style={{
              ...OutlinedInputStyle,
              border: `${errors.eventName && "solid 1px #004EEB"}`,
              margin: "0.1rem auto 1rem",
            }}
            placeholder="Event name"
            fullWidth
          />
          <div
            style={{
              width: "100%",
              textAlign: "left",
              marginBottom: "1rem",
            }}
          >
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              fontFamily={"Inter"}
              fontSize={"20px"}
              fontStyle={"normal"}
              fontWeight={600}
              lineHeight={"30px"}
              color={"var(--gray-600, #475467)"}
            >
              Location of the event
            </Typography>
          </div>
          <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              fontFamily={"Inter"}
              fontSize={"14px"}
              fontStyle={"normal"}
              fontWeight={500}
              lineHeight={"20px"}
              color={"var(--gray-700, #344054)"}
            >
              Street
            </Typography>
          </InputLabel>
          <OutlinedInput
            {...register("street", { required: true })}
            aria-invalid={errors.street}
            style={{
              ...OutlinedInputStyle,
              margin: "0.1rem auto 1rem",
            }}
            placeholder="Street name"
            fullWidth
          />
          <div style={{ width: "100%" }}>
            {errors?.street && <Typography>This field is required</Typography>}
          </div>
          <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              fontFamily={"Inter"}
              fontSize={"14px"}
              fontStyle={"normal"}
              fontWeight={500}
              lineHeight={"20px"}
              color={"var(--gray-700, #344054)"}
            >
              Venue name
            </Typography>
          </InputLabel>
          <OutlinedInput
            {...register("conferenceRoom", { required: true })}
            aria-invalid={errors.conferenceRoom}
            style={{
              ...OutlinedInputStyle,
              margin: "0.1rem auto 1rem",
            }}
            placeholder="Suite number or conference room"
            fullWidth
          />
          <div style={{ width: "100%" }}>
            {errors?.conferenceRoom && (
              <Typography>This field is required</Typography>
            )}
          </div>
          <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              fontFamily={"Inter"}
              fontSize={"14px"}
              fontStyle={"normal"}
              fontWeight={500}
              lineHeight={"20px"}
              color={"var(--gray-700, #344054)"}
            >
              City
            </Typography>
          </InputLabel>
          <OutlinedInput
            {...register("city", { required: true })}
            aria-invalid={errors.city}
            style={{
              ...OutlinedInputStyle,
              margin: "0.1rem auto 1rem",
            }}
            placeholder="City of the event"
            fullWidth
          />
          <div style={{ width: "100%" }}>
            {errors?.city && <Typography>This field is required</Typography>}
          </div>

          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              textAlign: "left",
              gap: "10px",
            }}
          >
            <div
              style={{
                textAlign: "left",
                width: "50%",
              }}
            >
              <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                <Typography
                  textTransform={"none"}
                  textAlign={"left"}
                  fontFamily={"Inter"}
                  fontSize={"14px"}
                  fontStyle={"normal"}
                  fontWeight={500}
                  lineHeight={"20px"}
                  color={"var(--gray-700, #344054)"}
                >
                  State
                </Typography>
              </InputLabel>
              <OutlinedInput
                {...register("state", { required: true })}
                aria-invalid={errors.state}
                style={{
                  ...OutlinedInputStyle,
                  margin: "0.1rem auto 1rem",
                }}
                placeholder="State of event"
                fullWidth
              />
              <div style={{ width: "100%" }}>
                {errors?.state && (
                  <Typography>This field is required</Typography>
                )}
              </div>
            </div>
            <div
              style={{
                textAlign: "left",
                width: "50%",
              }}
            >
              <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                <Typography
                  textTransform={"none"}
                  textAlign={"left"}
                  fontFamily={"Inter"}
                  fontSize={"14px"}
                  fontStyle={"normal"}
                  fontWeight={500}
                  lineHeight={"20px"}
                  color={"var(--gray-700, #344054)"}
                >
                  Zip code
                </Typography>
              </InputLabel>
              <OutlinedInput
                {...register("zipCode", { required: true })}
                aria-invalid={errors.zipCode}
                style={{
                  ...OutlinedInputStyle,
                  margin: "0.1rem auto 1rem",
                }}
                placeholder="Zip code"
                fullWidth
              />
              <div style={{ width: "100%" }}>
                {errors?.zipCode && (
                  <Typography>This field is required</Typography>
                )}
              </div>
            </div>
          </div>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              textAlign: "left",
              gap: "10px",
              margin: "0 0 0.5rem",
            }}
          >
            <div
              style={{
                textAlign: "left",
                width: "50%",
              }}
            >
              <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                <Typography
                  textTransform={"none"}
                  textAlign={"left"}
                  fontFamily={"Inter"}
                  fontSize={"14px"}
                  fontStyle={"normal"}
                  fontWeight={500}
                  lineHeight={"20px"}
                  color={"var(--gray-700, #344054)"}
                >
                  Starting day
                </Typography>
              </InputLabel>
              <DatePicker
                id="calender-event"
                autoComplete="checking"
                showTimeSelect
                dateFormat="Pp"
                minDate={new Date()}
                selected={begin}
                onChange={(date) => setBegin(date)}
                placeholderText="Starting day of the event"
                style={{
                  ...OutlinedInputStyle,
                  margin: "0.1rem auto 1rem",
                }}
              />
            </div>
            <div
              style={{
                textAlign: "left",
                width: "50%",
              }}
            >
              <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                <Typography
                  textTransform={"none"}
                  textAlign={"left"}
                  fontFamily={"Inter"}
                  fontSize={"14px"}
                  fontStyle={"normal"}
                  fontWeight={500}
                  lineHeight={"20px"}
                  color={"var(--gray-700, #344054)"}
                >
                  Closing day
                </Typography>
              </InputLabel>
              <DatePicker
                style={{
                  ...OutlinedInputStyle,
                  border: "solid 1px rgba(0, 0, 0, 0.23)",
                  background: "#fff",
                  borderRadius: "12px",
                  padding: "16.5px 14px",
                  margin: "0.1rem auto 1rem",
                  width: "50%",
                }}
                id="calender-event"
                showTimeSelect
                dateFormat="Pp"
                minDate={begin}
                selected={end}
                onChange={(date) => setEnd(date)}
                placeholderText="Closing day of the event"
              />
            </div>
          </div>
          <Button
            htmlType="submit"
            loading={loading}
            style={{ ...BlueButton, ...CenteringGrid, width: "100%" }}
          >
            <Typography style={BlueButtonText}>Update</Typography>
          </Button>
        </form>
      </Grid>
    </Modal>
  );
};

export default UpdateEventInfo;

UpdateEventInfo.propTypes = {
  openUpdateEventModal: PropTypes.bool.isRequired,
  setOpenUpdateEventModal: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
};
