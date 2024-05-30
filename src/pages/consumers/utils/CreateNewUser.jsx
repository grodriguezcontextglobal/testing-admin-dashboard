import { yupResolver } from "@hookform/resolvers/yup";
import {
  Button,
  Grid,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Modal, notification } from "antd";
import { PropTypes } from "prop-types";
import { useState } from "react";
import { useForm } from "react-hook-form";
import PhoneInput from "react-phone-number-input";
import { useSelector } from "react-redux";
import * as yup from "yup";
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import { AntSelectorStyle } from "../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import "../../../styles/global/ant-select.css";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
const schema = yup
  .object({
    firstName: yup.string().required("first name is required"),
    lastName: yup.string().required("last name is required"),
    email: yup
      .string()
      .email("email has an invalid format")
      .required("email is required"),
    eventAssignedTo: yup.string().required(),
  })
  .required();
export const CreateNewConsumer = ({
  createUserButton,
  setCreateUserButton,
}) => {
  const [consumersList, setConsumersList] = useState([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
  });
  const [contactPhoneNumber, setContactPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((state) => state.admin);
  const { eventsPerAdmin } = useSelector((state) => state.event);
  const [api, contextHolder] = notification.useNotification();
  const listOfAvailableEventsPerAdmin = [...eventsPerAdmin.active];
  const openNotificationWithIcon = (type, msg) => {
    api.open({
      message: type,
      description: msg,
    });
  };

  const queryClient = useQueryClient();
  const checkConsumerInData = async (props) => {
    const listOfConsumersQuery = await devitrakApi.post("/auth/user-query", {
      email: props.email,
    });
    if (listOfConsumersQuery.data.ok) {
      return setConsumersList(listOfConsumersQuery.data.users);
    } else {
      return setConsumersList([]);
    }
  };

  const newConsumerAfterBeingCheck = async (data) => {
    const newUserProfile = {
      name: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: contactPhoneNumber,
      privacyPolicy: true,
      category: "Regular",
      provider: [user.company],
      eventSelected: [data.eventAssignedTo],
    };
    const newUser = await devitrakApi.post("/auth/new", newUserProfile);
    if (newUser.data) {
      queryClient.invalidateQueries([
        "listOfConsumers",
        "attendeesList",
        "consumersList",
      ]);
      openNotificationWithIcon("success", "New consumer added");
      setLoading(false);
      closeDeviceModal();
    }
  };
  const zeroDuplications = (props) => {
    const result = new Set();
    for (let data of props) {
      result.add(data);
    }
    return Array.from(result);
  };
  const updateExistingUserInRecord = async (data) => {
    const { eventSelected, provider, id } = consumersList.at(-1);
    const updateConsumerProfile = {
      id: id,
      eventSelected: zeroDuplications([...eventSelected, data.eventAssignedTo]),
      provider: zeroDuplications([...provider, user.company]),
      phoneNumber: contactPhoneNumber,
    };
    const updatingUserInfoQuery = await devitrakApi.patch(
      `/auth/${id}`,
      updateConsumerProfile
    );
    if (updatingUserInfoQuery.data) {
      queryClient.invalidateQueries(["listOfConsumers", "consumersList"]);
      openNotificationWithIcon("success", "New consumer added");
      setLoading(false);
      closeDeviceModal();
    }
  };
  const handleNewConsumer = async (data) => {
    setLoading(true);
    try {
      await checkConsumerInData(data);
      if (consumersList.length < 1) {
        return newConsumerAfterBeingCheck(data);
      } else {
        return updateExistingUserInRecord(data);
      }
    } catch (error) {
      setLoading(false);
    }
  };

  const closeDeviceModal = () => {
    setValue("firstName", "");
    setValue("lastName", "");
    setValue("email", "");
    setValue("eventAssignedTo", "");
    setContactPhoneNumber("");
    setCreateUserButton(false);
  };
  const titleRender = () => {
    return (
      <p style={TextFontsize18LineHeight28}>
        Add new consumer.
      </p>
    );
  };

  return (
    <>
      {loading && <Loading />}
      {contextHolder}
      <Modal
        title={titleRender()}
        centered
        open={createUserButton}
        onOk={() => closeDeviceModal()}
        onCancel={() => closeDeviceModal()}
        footer={[]}
        maskClosable={false}
      >
        <Grid
          display={"flex"}
          flexDirection={"column"}
          justifyContent={"space-around"}
          alignItems={"center"}
          gap={2}
          container
        >
          <Grid
            display={"flex"}
            flexDirection={"column"}
            justifyContent={"space-around"}
            alignItems={"center"}
            gap={2}
            item
            xs={12}
          >
            <Grid
              display={"flex"}
              justifyContent={"space-between"}
              alignSelf={"stretch"}
              // marginBottom={5}
              gap={2}
              container
            >
              <Grid style={CenteringGrid} item xs={12} sm={12} md={12} lg={10}>
                <form
                  style={{
                    width: "100%",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    textAlign: "left",
                  }}
                  onSubmit={handleSubmit(handleNewConsumer)}
                  className="form"
                >
                  <Typography
                    margin={"0px auto 2rem"}
                    textTransform={"none"}
                    textAlign={"center"}
                    fontFamily={"Inter"}
                    fontSize={"14px"}
                    fontStyle={"normal"}
                    fontWeight={400}
                    lineHeight={"20px"}
                    color={"var(--gray-600, #475467)"}
                  >
                    Enter all the user details for a consumer.
                  </Typography>
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
                      <InputLabel
                        style={{ marginBottom: "3px", width: "100%" }}
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
                          First name
                        </Typography>
                      </InputLabel>
                      <OutlinedInput
                        {...register("firstName", { required: true })}
                        aria-invalid={errors.firstName}
                        style={{
                          ...OutlinedInputStyle,
                          // borderRadius: "12px",
                          border: `${errors.firstName && "solid 1px #004EEB"}`,
                          // margin: "0.1rem auto 1rem",
                          // display: "flex",
                          // justifyContent: "flex-start",
                        }}
                        placeholder="First name"
                      />
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
                        {errors?.firstName?.message}
                      </Typography>
                    </div>
                    <div
                      style={{
                        textAlign: "left",
                        width: "50%",
                      }}
                    >
                      <InputLabel
                        style={{ marginBottom: "3px", width: "100%" }}
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
                          Last name
                        </Typography>
                      </InputLabel>
                      <OutlinedInput
                        {...register("lastName", { required: true })}
                        aria-invalid={errors.lastName}
                        style={{
                          ...OutlinedInputStyle,
                          border: `${errors.lastName && "solid 1px #004EEB"}`,
                        }}
                        placeholder="Last name"
                      />
                      {errors?.lastName?.message}
                    </div>
                  </div>
                  <InputLabel style={{ marginBottom: "3px", width: "100%" }}>
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
                    style={{
                      ...OutlinedInputStyle,
                      border: `${errors.email && "solid 1px #004EEB"}`,
                    }}
                    placeholder="Enter your email"
                    fullWidth
                  />
                  {errors?.email?.message}
                  <InputLabel style={{ marginBottom: "3px", width: "100%" }}>
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
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                    <PhoneInput
                      style={{
                        ...OutlinedInputStyle,
                        margin: "0.1rem 0 1.5rem",
                        padding: "0px 20px",
                        width: "90%",
                        boxShadow: "rgba(16, 24, 40, 0.05) 1px 1px 2px",
                        border: "solid 0.1px rgba(16,24,40,0.2)",
                      }}
                      id="phone_input_check"
                      countrySelectProps={{ unicodeFlags: true }}
                      defaultCountry="US"
                      placeholder="(555) 000-0000"
                      value={contactPhoneNumber}
                      onChange={setContactPhoneNumber}
                    />
                  </Grid>

                  <InputLabel style={{ marginBottom: "3px", width: "100%" }}>
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
                      Event assigned to
                    </Typography>
                  </InputLabel>
                  <Select
                    className="custom-autocomplete"
                    displayEmpty
                    {...register("eventAssignedTo", { required: true })}
                    aria-invalid={errors.eventAssignedTo}
                    style={{
                      ...AntSelectorStyle,
                      width: "100%",
                      margin: "0.3rem 0",
                    }}
                  >
                    <MenuItem disabled value="">
                      <em>Select event</em>
                    </MenuItem>
                    {listOfAvailableEventsPerAdmin?.map((event) => {
                      return (
                        <MenuItem
                          value={event?.eventInfoDetail?.eventName}
                          key={event?.id}
                        >
                          <Typography
                            textTransform={"none"}
                            textAlign={"left"}
                            fontFamily={"Inter"}
                            fontSize={"14px"}
                            fontStyle={"normal"}
                            fontWeight={400}
                            lineHeight={"20px"}
                            color={"var(--gray-700, #344054)"}
                          >
                            {event?.eventInfoDetail?.eventName}
                          </Typography>
                        </MenuItem>
                      );
                    })}
                  </Select>
                  {errors?.eventAssignedTo?.message}
                  <Button type="submit" style={BlueButton}>
                    <Typography textTransform={"none"} style={BlueButtonText}>
                      Add new consumer
                    </Typography>
                  </Button>
                </form>
              </Grid>
            </Grid>{" "}
          </Grid>
        </Grid>
      </Modal>
    </>
  );
};

CreateNewConsumer.propTypes = {
  createUserButton: PropTypes.bool.isRequired,
  setCreateUserButton: PropTypes.bool.isRequired,
};
