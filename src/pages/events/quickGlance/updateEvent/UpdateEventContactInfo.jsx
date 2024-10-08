import { Grid, InputLabel, OutlinedInput, Typography } from "@mui/material";
import { Button, Modal, Space, Tag, notification } from "antd";
import PropTypes from "prop-types";
import { useState } from "react";
import { useForm } from "react-hook-form";
import PhoneInput from "react-phone-number-input";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import { WhitePlusIcon } from "../../../../components/icons/WhitePlusIcon";
import {
  onAddContactInfo,
  onAddEventData,
} from "../../../../store/slices/eventSlice";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
const UpdateEventContactInfo = ({
  openUpdateEventModal,
  setOpenUpdateEventModal,
}) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const { event } = useSelector((state) => state.event);
  const splittingName = event?.contactInfo?.name.split(" ");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: splittingName[0] ?? "",
      lastName: splittingName[1] ?? "",
      email: event?.contactInfo?.email,
    },
  });
  const [contactPhoneNumber, setContactPhoneNumber] = useState("");
  const [listOfPhoneNumbers, setListOfPhoneNumbers] = useState(
    event?.contactInfo?.phone ?? []
  );

  const closeModal = () => {
    return setOpenUpdateEventModal(false);
  };
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, msg) => {
    api.open({
      message: msg,
    });
  };
  const handleUpdateEvent = async (data) => {
    setLoading(true);
    const contactProfile = {
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: listOfPhoneNumbers,
    };
    const respUpdateContactInfo = await devitrakApi.patch(
      `/event/edit-event/${event.id}`,
      {
        contactInfo: contactProfile,
      }
    );
    if (respUpdateContactInfo.data.ok) {
      openNotificationWithIcon("success", "Contact information updated");
      dispatch(onAddEventData({ ...event, contactInfo: contactProfile }));
      dispatch(onAddContactInfo(contactProfile));
      setTimeout(() => {
        setLoading(false);

      }, 2500);
      
      await closeModal();
    }
    setTimeout(() => {
      setLoading(false);
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
      style={{zIndex:30}}
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
                  First name
                </Typography>
              </InputLabel>
              <OutlinedInput
                {...register("firstName", { required: true })}
                aria-invalid={errors.firstName}
                style={{ ...OutlinedInputStyle, margin: "0.1rem auto 1rem", }}
                placeholder="First name"
              />
              <div style={{ width: "100%" }}>
                {errors?.firstName && (
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
                  Last name
                </Typography>
              </InputLabel>
              <OutlinedInput
                {...register("lastName", { required: true })}
                aria-invalid={errors.lastName}
                style={{ ...OutlinedInputStyle, margin: "0.1rem auto 1rem", }}

                placeholder="Last name"
              />
              <div style={{ width: "100%" }}>
                {errors?.lastName && (
                  <Typography>This field is required</Typography>
                )}
              </div>
            </div>
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
              Email
            </Typography>
          </InputLabel>
          <OutlinedInput
            {...register("email", { required: true, minLength: 10 })}
            aria-invalid={errors.email}
            style={{ ...OutlinedInputStyle, margin: "0.1rem auto 1rem", }}

            placeholder="Enter your email"
            fullWidth
          />
          <div style={{ width: "100%" }}>
            {errors?.email && <Typography>This field is required</Typography>}
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
              Phone number
            </Typography>
          </InputLabel>
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
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                textAlign: "left",
                width: "100%",
              }}
            >
              <PhoneInput
                style={{ ...OutlinedInputStyle, padding: "2.5px 12px", border: "0.3px solid var(--gray300)", margin: "0.1rem auto 1rem", width: "100%" }}
                countrySelectProps={{ unicodeFlags: true }}
                defaultCountry="US"
                placeholder="(555) 000-0000"
                value={contactPhoneNumber}
                onChange={setContactPhoneNumber}
              />
            </div>
            <div
              style={{
                textAlign: "left",
                width: "10%",
              }}
            >
              <Button
                onClick={() => {
                  setListOfPhoneNumbers([
                    ...listOfPhoneNumbers,
                    contactPhoneNumber,
                  ]);
                  setContactPhoneNumber("");
                }}
                style={BlueButton}
              >
                <WhitePlusIcon />
              </Button>
            </div>
          </div>
          <Space size={[0, "small"]} wrap>
            {listOfPhoneNumbers.map((item) => {
              return (
                <Tag
                  bordered={false}
                  closable
                  // onClose={() => removePhoneNumber(item)}
                  key={`${item}`}
                  style={{
                    display: "flex",
                    padding: "2px 4px",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "3px",
                    borderRadius: "8px",
                    border: "1px solid var(--gray-300, #D0D5DD)",
                    background: "var(--base-white, #FFF)",
                    margin: "5px",
                  }}
                >
                  &nbsp;
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
                    {item}
                  </Typography>
                  &nbsp;
                </Tag>
              );
            })}
          </Space>
          <Button loading={loading} htmlType="submit" style={{ ...BlueButton, ...CenteringGrid, width: "100%" }}>
            <Typography style={BlueButtonText}>Update</Typography>
          </Button>
        </form>
      </Grid>
    </Modal>
  );
};

export default UpdateEventContactInfo;

UpdateEventContactInfo.propTypes = {
  openUpdateEventModal: PropTypes.bool.isRequired,
  setOpenUpdateEventModal: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
};
