import { yupResolver } from "@hookform/resolvers/yup";
import { InputLabel, MenuItem, OutlinedInput } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { notification, Select } from "antd";
import { PropTypes } from "prop-types";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import * as yup from "yup";
import { devitrakApi } from "../../../api/devitrakApi";
import DevitrakLoading from "../../../components/animation/DevitrakLoading";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import ModalUX from "../../../components/UX/modal/ModalUX";
import { onAddCustomerInfo } from "../../../store/slices/customerSlice";
import { onAddCustomer } from "../../../store/slices/stripeSlice";
import "../../../styles/global/ant-select.css";
import { AntSelectorStyle } from "../../../styles/global/AntSelectorStyle";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";

const schema = yup.object({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  email: yup
    .string()
    .email("Email has an invalid format")
    .required("Email is required"),
});

const formContainerStyle = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
  padding: "1rem 0",
};

const inputRowStyle = {
  display: "flex",
  gap: "1rem",
  width: "100%",
};

const inputColumnStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  flex: 1,
};

const fullWidthInputStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  width: "100%",
};

const labelStyle = {
  textTransform: "none",
  textAlign: "left",
  fontFamily: "Inter",
  fontSize: "14px",
  fontStyle: "normal",
  fontWeight: 500,
  lineHeight: "20px",
  color: "var(--gray-700, #344054)",
  margin: 0,
};

const requiredMarkStyle = { color: "#D92D20", marginLeft: "2px" };

const errorTextStyle = {
  color: "#D92D20",
  fontSize: "12px",
  fontFamily: "Inter",
  margin: "2px 0 0 0",
  lineHeight: "18px",
};

const phoneBaseStyle = {
  ...OutlinedInputStyle,
  padding: "0px 20px",
  width: "90%",
  boxShadow: "rgba(16, 24, 40, 0.05) 1px 1px 2px",
  border: "solid 0.1px rgba(16,24,40,0.2)",
};

const RequiredLabel = ({ text }) => (
  <p style={labelStyle}>
    {text}
    <span style={requiredMarkStyle} aria-hidden="true">
      *
    </span>
  </p>
);

RequiredLabel.propTypes = { text: PropTypes.string.isRequired };

export const CreateNewConsumer = ({
  createUserButton,
  setCreateUserButton,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const [contactPhoneNumber, setContactPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
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

  const openNotificationWithIcon = useCallback(
    (type, msg) => {
      api.open({ message: type, description: msg });
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
    return () => controller.abort();
  }, [location.key, location.pathname, event?.eventInfoDetail?.eventName]);

  const queryClient = useQueryClient();

  const redirectingStaffBasedOnConsumerEventPage = (props) => {
    if (location.pathname === "/events/event-quickglance") {
      const userFormatData = { ...props, uid: props.id ?? props.uid };
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
      const newEventToAddConsumer = eventAssignedTo
        ? JSON.parse(eventAssignedTo)
        : null;
      const newUserProfile = {
        name: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: contactPhoneNumber,
        privacyPolicy: true,
        category: "Regular",
        provider: [user.company],
        eventSelected: newEventToAddConsumer
          ? [newEventToAddConsumer.eventInfoDetail.eventName]
          : [],
        company_providers: [user.companyData.id],
        event_providers: newEventToAddConsumer
          ? [newEventToAddConsumer.id]
          : [],
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

  const updateExistingUserInRecord = async (data) => {
    try {
      const newEventToAddConsumer = eventAssignedTo
        ? JSON.parse(eventAssignedTo)
        : null;
      const { event_providers, company_providers, eventSelected, provider, id } =
        data.consumersList.at(-1);
      if (
        newEventToAddConsumer &&
        event_providers.some((element) => element === newEventToAddConsumer.id)
      ) {
        openNotificationWithIcon(
          "Info",
          `${data.firstName} ${data.lastName} (${data.email}) is already in the event/company record.`
        );
        setLoading(false);
        return redirectingStaffBasedOnConsumerEventPage(
          data.consumersList.at(-1)
        );
      } else {
        const updateConsumerProfile = {
          id,
          eventSelected: [
            ...new Set([
              ...eventSelected,
              newEventToAddConsumer &&
                newEventToAddConsumer.eventInfoDetail.eventName,
            ]),
          ],
          provider: [...new Set([...provider, user.company])],
          company_providers: [
            ...new Set([...company_providers, user.companyData.id]),
          ],
          event_providers: [
            ...new Set([
              ...data.consumersList.at(-1).event_providers,
              newEventToAddConsumer && newEventToAddConsumer.id,
            ]),
          ],
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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConsumer = async (data) => {
    if (!contactPhoneNumber) {
      setPhoneError("Phone number is required");
      return;
    }
    setPhoneError("");
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
    setPhoneError("");
    setCreateUserButton(false);
  };

  const titleRender = () => (
    <p style={{ ...TextFontsize18LineHeight28, textAlign: "center" }}>
      Add new consumer.
    </p>
  );

  const bodyModal = () => (
    <form style={formContainerStyle} onSubmit={handleSubmit(handleNewConsumer)}>
      <p style={Subtitle}>Enter all the user details for a consumer.</p>

      <div style={inputRowStyle}>
        <div style={inputColumnStyle}>
          <InputLabel style={{ margin: 0, width: "100%" }}>
            <RequiredLabel text="First name" />
          </InputLabel>
          <OutlinedInput
            {...register("firstName")}
            style={{
              ...OutlinedInputStyle,
              ...(errors.firstName && { border: "solid 1px #D92D20" }),
            }}
            placeholder="First name"
          />
          {errors.firstName && (
            <p style={errorTextStyle} role="alert">
              {errors.firstName.message}
            </p>
          )}
        </div>
        <div style={inputColumnStyle}>
          <InputLabel style={{ margin: 0, width: "100%" }}>
            <RequiredLabel text="Last name" />
          </InputLabel>
          <OutlinedInput
            {...register("lastName")}
            style={{
              ...OutlinedInputStyle,
              ...(errors.lastName && { border: "solid 1px #D92D20" }),
            }}
            placeholder="Last name"
          />
          {errors.lastName && (
            <p style={errorTextStyle} role="alert">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      <div style={fullWidthInputStyle}>
        <InputLabel style={{ margin: 0, width: "100%" }}>
          <RequiredLabel text="Email" />
        </InputLabel>
        <OutlinedInput
          type="email"
          {...register("email", { minLength: 10, pattern: /^\S+@\S+$/i })}
          style={{
            ...OutlinedInputStyle,
            ...(errors.email && { border: "solid 1px #D92D20" }),
          }}
          placeholder="Enter your email"
          fullWidth
        />
        {errors.email && (
          <p style={errorTextStyle} role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div style={inputRowStyle}>
        <div style={{ ...fullWidthInputStyle, width: "100%" }}>
          <InputLabel style={{ margin: 0, width: "90%" }}>
            <RequiredLabel text="Phone number" />
          </InputLabel>
          <PhoneInput
            style={
              phoneError
                ? { ...phoneBaseStyle, border: "solid 1px #D92D20" }
                : phoneBaseStyle
            }
            id="phone_input_check"
            countrySelectProps={{ unicodeFlags: true }}
            defaultCountry="US"
            placeholder="(555) 000-0000"
            value={contactPhoneNumber}
            onChange={(value) => {
              setContactPhoneNumber(value);
              if (value) setPhoneError("");
            }}
          />
          {phoneError && (
            <p style={errorTextStyle} role="alert">
              {phoneError}
            </p>
          )}
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
            <MenuItem value={null}>
              <p style={labelStyle}>No event</p>
            </MenuItem>
          </Select>

          <OutlinedInput
            inputProps={{ readOnly: true }}
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
        styles={{ width: "100%", marginTop: "1.5rem" }}
      />
    </form>
  );

  return (
    <>
      {loading && <DevitrakLoading />}
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