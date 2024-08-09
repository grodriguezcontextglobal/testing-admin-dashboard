import { yupResolver } from "@hookform/resolvers/yup";
import {
  Grid,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Modal, notification, Button } from "antd";
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
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import "../../../styles/global/ant-select.css";
import { Subtitle } from "../../../styles/global/Subtitle";
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

const paragraphStyle = {
  textTransform: "none",
  textAlign: "left",
  fontFamily: "Inter",
  fontSize: "14px",
  fontStyle: "normal",
  fontWeight: 500,
  lineHeight: "20px",
  color: "var(--gray-700, #344054)",
};

export const CreateNewConsumer = ({
  createUserButton,
  setCreateUserButton,
}) => {
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
  const { eventsPerAdmin, event } = useSelector((state) => state.event);
  const [api, contextHolder] = notification.useNotification();
  const listOfAvailableEventsPerAdmin = [...eventsPerAdmin.active];
  const openNotificationWithIcon = (type, msg) => {
    api.open({
      message: type,
      description: msg,
    });
  };
  const queryClient = useQueryClient();
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
      company_providers:[user.companyData.id],
      event:[data.eventAssignedTo.id]
    };
    const newUser = await devitrakApi.post("/auth/new", newUserProfile);
    if (newUser.data) {
      queryClient.invalidateQueries([
        "listOfConsumers",
        "attendeesList",
        "consumersList",
      ]);
      await devitrakApi.post("/db_consumer/new_consumer", {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phoneNumber: contactPhoneNumber,
      });
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
    const { eventSelected, provider, id } = data.consumersList.at(-1);
    if (
      eventSelected.some(
        (element) => element === event.eventInfoDetail.eventName
      )
    ) {
      alert(
        `${data.firstName} ${data.lastName} | email: ${data.email} is already in the event/company record.`
      );
      return setLoading(false);
    } else {
      const updateConsumerProfile = {
        id: id,
        eventSelected: zeroDuplications([
          ...eventSelected,
          data.eventAssignedTo,
        ]),
        provider: zeroDuplications([...provider, user.company]),
        company_providers:zeroDuplications([...data.consumersList.at(-1).company_providers, user.companyData.id]),
        event_providers:zeroDuplications([...data.consumersList.at(-1).event_providers, data.eventAssignedTo.id]),
        phoneNumber: contactPhoneNumber,
      };
      const updatingUserInfoQuery = await devitrakApi.patch(
        `/auth/${id}`,
        updateConsumerProfile
      );
      if (updatingUserInfoQuery.data) {
        queryClient.invalidateQueries({
          queryKey: ["listOfConsumers"],
          exact: true,
        });
        queryClient.invalidateQueries({
          queryKey: ["consumersList"],
          exact: true,
        });
        openNotificationWithIcon("success", "New consumer added");
        setLoading(false);
        closeDeviceModal();
      }
    }
  };
  const handleNewConsumer = async (data) => {
    setLoading(true);
    try {
      const listOfConsumersQuery = await devitrakApi.post("/auth/user-query", {
        email: data.email,
      });
      if (listOfConsumersQuery.data.ok) {
        if (listOfConsumersQuery.data.users.length > 0) {
          return updateExistingUserInRecord({
            ...data,
            consumersList: listOfConsumersQuery.data.users,
          });
        }
        return newConsumerAfterBeingCheck(data);
      }
      return setLoading(false);
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
      <p style={{ ...TextFontsize18LineHeight28, textAlign: "center" }}>
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
                  <p style={Subtitle}>
                    Enter all the user details for a consumer.
                  </p>
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      textAlign: "left",
                      gap: "10px",
                      margin: "0.5rem 0 0",
                    }}
                  >
                    <div
                      style={{
                        textAlign: "left",
                        width: "50%",
                      }}
                    >
                      <InputLabel style={{ margin: 0, width: "100%" }}>
                        <p style={paragraphStyle}>First name</p>
                      </InputLabel>
                      <OutlinedInput
                        {...register("firstName", { required: true })}
                        aria-invalid={errors.firstName}
                        style={{
                          ...OutlinedInputStyle,
                          border: `${errors.firstName && "solid 1px #004EEB"}`,
                        }}
                        placeholder="First name"
                      />
                      <p style={Subtitle}>{errors?.firstName?.message}</p>
                    </div>
                    <div
                      style={{
                        textAlign: "left",
                        width: "50%",
                      }}
                    >
                      <InputLabel style={{ margin: 0, width: "100%" }}>
                        <p style={paragraphStyle}>Last name</p>
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
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      textAlign: "left",
                      margin: "0.5rem 0 0",
                    }}
                  >
                    <InputLabel style={{ margin: 0, width: "100%" }}>
                      <p style={paragraphStyle}>Email</p>
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
                  </div>
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      textAlign: "left",
                      margin: "0.5rem 0 0",
                    }}
                  >
                    <InputLabel style={{ margin: 0, width: "100%" }}>
                      <p style={paragraphStyle}>Phone number</p>
                    </InputLabel>
                    <PhoneInput
                      style={{
                        ...OutlinedInputStyle,
                        margin: "0.5rem 0 ",
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
                  </div>
                  <div>
                    <InputLabel style={{ margin: 0, width: "100%" }}>
                      <p style={paragraphStyle}>Event assigned to</p>
                    </InputLabel>
                    <Select
                      className="custom-autocomplete"
                      displayEmpty
                      {...register("eventAssignedTo", { required: true })}
                      aria-invalid={errors.eventAssignedTo}
                      style={{
                        ...AntSelectorStyle,
                        width: "100%",
                        margin: "0 0 0.3rem",
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
                            <p style={paragraphStyle}>
                              {event?.eventInfoDetail?.eventName}
                            </p>
                          </MenuItem>
                        );
                      })}
                    </Select>
                    {errors?.eventAssignedTo?.message}
                  </div>
                  <Button
                    loading={loading}
                    htmlType="submit"
                    style={{
                      ...BlueButton,
                      ...CenteringGrid,
                      width: "100%",
                      margin: "1.5rem 0 0",
                    }}
                  >
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
