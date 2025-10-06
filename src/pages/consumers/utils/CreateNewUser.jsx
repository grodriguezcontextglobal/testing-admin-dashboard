import { yupResolver } from "@hookform/resolvers/yup";
import { InputLabel, MenuItem, OutlinedInput } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { notification, Select } from "antd";
import { PropTypes } from "prop-types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import * as yup from "yup";
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import ModalUX from "../../../components/UX/modal/ModalUX";
import { onAddCustomerInfo } from "../../../store/slices/customerSlice";
import { onAddCustomer } from "../../../store/slices/stripeSlice";
import "../../../styles/global/ant-select.css";
import { AntSelectorStyle } from "../../../styles/global/AntSelectorStyle";
// import CenteringGrid from "../../../styles/global/CenteringGrid";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";

const schema = yup.object({
  firstName: yup.string().required("first name is required"),
  lastName: yup.string().required("last name is required"),
  email: yup
    .string()
    .email("email has an invalid format")
    .required("email is required"),
  // eventAssignedTo: yup.string().required(),
});

export const CreateNewConsumer = ({
  createUserButton,
  setCreateUserButton,
}) => {
  const { register, handleSubmit, setValue } = useForm({
    resolver: yupResolver(schema),
  });
  const [contactPhoneNumber, setContactPhoneNumber] = useState("");
  const [eventAssignedTo, setEventAssignedTo] = useState("");
  const [loading, setLoading] = useState(false);
  const { event } = useSelector((state) => state.event);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.admin);
  const { eventsPerAdmin } = useSelector((state) => state.event);
  const [api, contextHolder] = notification.useNotification();
  const listOfAvailableEventsPerAdmin = [...eventsPerAdmin.active];
  // Memoized styles
  const formContainerStyle = useMemo(
    () => ({
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "1.5rem",
      padding: "1rem 0",
    }),
    []
  );

  const inputRowStyle = useMemo(
    () => ({
      display: "flex",
      gap: "1rem",
      width: "100%",
    }),
    []
  );

  const inputColumnStyle = useMemo(
    () => ({
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      flex: 1,
    }),
    []
  );

  const fullWidthInputStyle = useMemo(
    () => ({
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      width: "100%",
    }),
    []
  );

  const labelStyle = useMemo(
    () => ({
      textTransform: "none",
      textAlign: "left",
      fontFamily: "Inter",
      fontSize: "14px",
      fontStyle: "normal",
      fontWeight: 500,
      lineHeight: "20px",
      color: "var(--gray-700, #344054)",
      margin: 0,
    }),
    []
  );

  const phoneInputStyle = useMemo(
    () => ({
      ...OutlinedInputStyle,
      padding: "0px 20px",
      width: "max-content",
      boxShadow: "rgba(16, 24, 40, 0.05) 1px 1px 2px",
      border: "solid 0.1px rgba(16,24,40,0.2)",
    }),
    []
  );

  const openNotificationWithIcon = useCallback(
    (type, msg) => {
      api.open({
        message: type,
        description: msg,
      });
    },
    [api]
  );
  useEffect(() => {
    const controller = new AbortController();
    if (location.pathname === "/events/event-quickglance") {
      const eventInfo = listOfAvailableEventsPerAdmin.find(
        (item) =>
          item.eventInfoDetail.eventName === event?.eventInfoDetail?.eventName
      );
      setEventAssignedTo(JSON.stringify(eventInfo));
    } else if (location.pathname === "/consumers") {
      setEventAssignedTo("");
    }
    return () => {
      controller.abort();
    };
  }, [location.key, location.pathname, event?.eventInfoDetail?.eventName]);

  const queryClient = useQueryClient();

  const redirectingStaffBasedOnConsumerEventPage = (props) => {
    if (location.pathname === "/events/event-quickglance") {
      let userFormatData = {
        ...props,
        uid: props.id ?? props.uid,
      };
      dispatch(onAddCustomerInfo(userFormatData));
      dispatch(onAddCustomer(userFormatData));
      queryClient.invalidateQueries([
        "transactionsList",
        "listOfDevicesAssigned",
        "listOfNoOperatingDevices",
      ]);

      return navigate(
        `/events/event-attendees/${userFormatData.uid}/transactions-details`
      );
    }
    return closeDeviceModal();
  };
  const newConsumerAfterBeingCheck = async (data) => {
    try {
      if (contactPhoneNumber.length === 0) {
        alert("Please enter a phone number");
        return setLoading(false);
      }
      const newEventToAddConsumer = JSON.parse(eventAssignedTo);
      const newUserProfile = {
        name: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: contactPhoneNumber,
        privacyPolicy: true,
        category: "Regular",
        provider: [user.company],
        eventSelected: [newEventToAddConsumer.eventInfoDetail.eventName],
        company_providers: [user.companyData.id],
        event_providers: [newEventToAddConsumer.id],
        groupName: [],
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
          phone_number: `${newUserProfile.phoneNumber}`,
        });
        openNotificationWithIcon("Success", "New consumer added");
        setLoading(false);
        return redirectingStaffBasedOnConsumerEventPage(newUser.data);
      }
    } catch (error) {
      setLoading(false);
      return openNotificationWithIcon("error", `${error.message}`);
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
    const newEventToAddConsumer = JSON.parse(eventAssignedTo);
    const { event_providers, company_providers, eventSelected, provider, id } =
      data.consumersList.at(-1);
    if (
      event_providers.some((element) => element === newEventToAddConsumer.id)
    ) {
      alert(
        `${data.firstName} ${data.lastName} | email: ${data.email} is already in the event/company record.`
      );
      setLoading(false);
      return redirectingStaffBasedOnConsumerEventPage(
        data.consumersList.at(-1)
      );
    } else {
      const updateConsumerProfile = {
        id: id,
        eventSelected: zeroDuplications([
          ...eventSelected,
          newEventToAddConsumer.eventInfoDetail.eventName,
        ]),
        provider: zeroDuplications([...provider, user.company]),
        company_providers: zeroDuplications([
          ...company_providers,
          user.companyData.id,
        ]),
        event_providers: zeroDuplications([
          ...data.consumersList.at(-1).event_providers,
          newEventToAddConsumer.id,
        ]),
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
        openNotificationWithIcon("Success", "New consumer added");
        setLoading(false);
        return redirectingStaffBasedOnConsumerEventPage(
          data.consumersList.at(-1)
        );
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
      return openNotificationWithIcon("error", `${error.message}`);
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

  const bodyModal = () => {
    return (
      <form
        style={formContainerStyle}
        onSubmit={handleSubmit(handleNewConsumer)}
      >
        <p style={Subtitle}>Enter all the user details for a consumer.</p>

        <div style={inputRowStyle}>
          <div style={inputColumnStyle}>
            <InputLabel style={{ margin: 0, width: "100%" }}>
              <p style={labelStyle}>First name</p>
            </InputLabel>
            <OutlinedInput
              required
              {...register("firstName")}
              style={OutlinedInputStyle}
              placeholder="First name"
            />
          </div>
          <div style={inputColumnStyle}>
            <InputLabel style={{ margin: 0, width: "100%" }}>
              <p style={labelStyle}>Last name</p>
            </InputLabel>
            <OutlinedInput
              required
              {...register("lastName")}
              style={OutlinedInputStyle}
              placeholder="Last name"
            />
          </div>
        </div>

        <div style={fullWidthInputStyle}>
          <InputLabel style={{ margin: 0, width: "100%" }}>
            <p style={labelStyle}>Email</p>
          </InputLabel>
          <OutlinedInput
            required
            type="email"
            {...register("email", {
              minLength: 10,
              pattern: /^\S+@\S+$/i,
            })}
            style={OutlinedInputStyle}
            placeholder="Enter your email"
            fullWidth
          />
        </div>
        <div style={inputRowStyle}>
          <div style={{ ...fullWidthInputStyle, width: "100%" }}>
            <InputLabel style={{ margin: 0, width: "90%" }}>
              <p style={labelStyle}>Phone number</p>
            </InputLabel>
            <PhoneInput
              style={{ ...phoneInputStyle, width: "90%" }}
              id="phone_input_check"
              countrySelectProps={{ unicodeFlags: true }}
              defaultCountry="US"
              placeholder="(555) 000-0000"
              value={contactPhoneNumber}
              onChange={setContactPhoneNumber}
            />
          </div>
          <div style={{ ...fullWidthInputStyle, width: "100%" }}>
            <InputLabel style={{ margin: 0, width: "100%" }}>
              <p style={labelStyle}>Event assigned to</p>
            </InputLabel>

            <Select
              className="custom-autocomplete"
              displayEmpty
              name="eventAssignedTo"
              value={eventAssignedTo}
              onChange={(value) => setEventAssignedTo(value)}
              style={{
                ...AntSelectorStyle,
                width: "100%",
                display:
                  location.pathname === "/events/event-quickglance"
                    ? "none"
                    : "flex",
              }}
            >
              <MenuItem disabled value="">
                <em>Select event</em>
              </MenuItem>
              {listOfAvailableEventsPerAdmin?.map((event) => (
                <MenuItem value={JSON.stringify(event)} key={event?.id}>
                  <p style={labelStyle}>{event?.eventInfoDetail?.eventName}</p>
                </MenuItem>
              ))}
            </Select>

            <OutlinedInput
              required
              readOnly
              type="text"
              style={{
                ...OutlinedInputStyle,
                display:
                  location.pathname === "/events/event-quickglance"
                    ? "flex"
                    : "none",
              }}
              defaultValue={
                location.pathname === "/events/event-quickglance"
                  ? event.eventInfoDetail.eventName
                  : ""
              }
              fullWidth
            />
          </div>
        </div>

        <BlueButtonComponent
          disabled={false}
          loadingState={loading}
          buttonType="submit"
          title="Add new consumer"
          styles={{
            width: "100%",
            marginTop: "1.5rem",
          }}
        />
      </form>
    );
  };

  return (
    <>
      {loading && <Loading />}
      {contextHolder}
      <ModalUX
        title={titleRender()}
        openDialog={createUserButton}
        closeModal={closeDeviceModal}
        body={bodyModal()}
      />
    </>
  );
};

CreateNewConsumer.propTypes = {
  createUserButton: PropTypes.bool.isRequired,
  setCreateUserButton: PropTypes.func.isRequired,
};
