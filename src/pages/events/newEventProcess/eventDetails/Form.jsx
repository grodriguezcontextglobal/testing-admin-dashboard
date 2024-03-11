import { Icon } from "@iconify/react";
import {
  Button,
  Grid,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { Space, Tag } from "antd";
import { useCallback, useMemo, useState } from "react";
import "react-clock/dist/Clock.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useForm } from "react-hook-form";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import { onAddCompanyAccountStripe } from "../../../../store/slices/adminSlice";
import {
  onAddContactInfo,
  onAddEventInfoDetail,
} from "../../../../store/slices/eventSlice";
import { onAddNewSubscription } from "../../../../store/slices/subscriptionSlice";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import "../../../../styles/global/OutlineInput.css";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { TextFontSize20LineHeight30 } from "../../../../styles/global/TextFontSize20HeightLine30";
import { InputLabelStyle } from "../style/InputLabelStyle";
import "../style/NewEventInfoSetup.css";
import { AntSelectorStyle } from "../../../../styles/global/AntSelectorStyle";
const Form = () => {
  const { subscription, subscriptionJSON } = useSelector(
    (state) => state.subscription
  );
  const { eventInfoDetail } = useSelector((state => state.event))
  const { companyAccountStripe } = useSelector((state) => state.admin);
  const addressSplit = eventInfoDetail?.address?.split(' ')
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      eventName: eventInfoDetail?.eventName,
      eventLocation: `${addressSplit?.at(-3)}, ${addressSplit?.at(-2)?.replace(",", "")}`,
      address: `${addressSplit?.slice(0, -3)}, ${addressSplit?.at(-3)} ${addressSplit?.at(-2)}, ${addressSplit?.at(-1)}`,
      building: eventInfoDetail?.eventName,
      conferenceRoom: eventInfoDetail?.floor,
      city: addressSplit?.at(-3),
      state: addressSplit?.at(-2)?.replace(",", ""),
      street: addressSplit?.slice(0, -3)?.toString()?.replaceAll(",", " "),
      zipCode: addressSplit?.at(-1)
    }
  });
  const [begin, setBegin] = useState(eventInfoDetail.dateBegin ? new Date(eventInfoDetail.dateBegin) : new Date());
  const [end, setEnd] = useState(eventInfoDetail.dateEnd ? new Date(eventInfoDetail.dateEnd) : new Date());
  const [contactPhoneNumber, setContactPhoneNumber] = useState('');
  const [numberOfPhoneNumbersPerEvent, setNumberOfPhoneNumbersPerEvent] =
    useState(eventInfoDetail.phoneNumber);
  const [merchant, setMerchant] = useState(eventInfoDetail.merchant);
  
  const paymentIntentParams = new URLSearchParams(window.location.search).get(
    "payment_intent"
  );

  const storeSubscriptionJSON = useCallback(async () => {
    if (paymentIntentParams) {
      const respPaymentIntentRetrieved = await devitrakApi.get(
        `/stripe/payment_intents/${paymentIntentParams}`
      );

      await devitrakApi.patch(
        `/stripe/updating-subscription/${companyAccountStripe.id}`,
        {
          subscriptionHistory: [
            ...companyAccountStripe.subscriptionHistory,
            {
              subscription: subscriptionJSON.id,
              billing_cycle_anchor: subscriptionJSON.billing_cycle_anchor,
              created: subscriptionJSON.created,
              current_period_end: subscriptionJSON.current_period_end,
              current_period_start: subscriptionJSON.current_period_start,
              latest_invoice: {
                ...subscriptionJSON.latest_invoice,
                payment_intent: respPaymentIntentRetrieved.data.paymentIntent,
              },
              paymentIntent: respPaymentIntentRetrieved.data.paymentIntent,
              status: "active",
            },
          ],
        }
      );
      dispatch(
        onAddCompanyAccountStripe({
          ...companyAccountStripe,
          subscriptionHistory: [
            ...companyAccountStripe.subscriptionHistory,
            {
              subscription: subscriptionJSON.id,
              billing_cycle_anchor: subscriptionJSON.billing_cycle_anchor,
              created: subscriptionJSON.created,
              current_period_end: subscriptionJSON.current_period_end,
              current_period_start: subscriptionJSON.current_period_start,
              latest_invoice: {
                ...subscriptionJSON.latest_invoice,
                payment_intent: respPaymentIntentRetrieved.data.paymentIntent,
              },
              paymentIntent: respPaymentIntentRetrieved.data.paymentIntent,
              status: "active",
            },
          ],
        })
      );
      dispatch(
        onAddNewSubscription({
          ...subscriptionJSON,
          latest_invoice: {
            ...subscriptionJSON.latest_invoice,
            payment_intent: respPaymentIntentRetrieved.data.paymentIntent,
          },
          paymentIntent: respPaymentIntentRetrieved.data.paymentIntent,
          status: "active",
        })
      );
    }
  }, []);

  const addingPhoneNumber = () => {
    const result = [
      ...numberOfPhoneNumbersPerEvent,
      contactPhoneNumber,
    ]
    setNumberOfPhoneNumbersPerEvent(result);
    setContactPhoneNumber("");
    return;
  }
  const removePhoneNumber = (phone) => {
    const filter = numberOfPhoneNumbersPerEvent.filter(
      (element) => element !== phone
    );
    return setNumberOfPhoneNumbersPerEvent(filter);
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
    };
    const contactInfoFormat = {
      phone: numberOfPhoneNumbersPerEvent,
    };
    if (numberOfPhoneNumbersPerEvent.length < 1)
      return alert("There is no phone number assigned to event. Please enter the phone number and then click plus icon button.");
    dispatch(onAddEventInfoDetail(format));
    dispatch(onAddContactInfo(contactInfoFormat));
    storeSubscriptionJSON();
    navigate("/create-event-page/staff-detail");
  };
  const checkSubscription = useMemo(() => {
    // if (subscription.id !== 1) 
    return false;

    // await devitrakApi.patch(
    //   `/stripe/updating-subscription/${companyAccountStripe.id}`,
    //   {
    //     companyAccountStripe.subscriptionHistory.at(-1).status: 'active'
    //   }
    // );
    // return true;
  }, [subscription.id]);

  return (
    <Grid
      display={"flex"}
      flexDirection={"column"}
      justifyContent={"space-around"}
      alignItems={"center"}
      gap={2}
      container
    >
      <form
        style={{
          width: "100%",
          justifyContent: "flex-start",
          alignItems: "center",
          textAlign: "left",
        }}
        onSubmit={handleSubmit(handleEventInfo)}
        className="form"
      >
        <InputLabel
          id="eventName"
          style={{ marginBottom: "0.2rem", width: "100%" }}
        >
          <Typography
            style={InputLabelStyle}
          >
            Event name
          </Typography>
        </InputLabel>
        <OutlinedInput
          id="eventName"
          {...register("eventName", { required: true, maxLength: 50 })}
          aria-invalid={errors.eventName}
          style={{
            ...OutlinedInputStyle,
            margin: "0.1rem 0 1.5rem",
            border: `${errors.eventName && "solid 1px #eb0000"}`,
            width: "100%",
          }}
          placeholder="Event name"
        />
        <div style={{ width: "100%" }}>
          {errors?.eventName && (
            <Typography>{errors.eventName.type === "maxLength" ? "Name length must be less than 50 characters" : "Field is required"}</Typography>
          )}
        </div>
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          <Typography
            style={InputLabelStyle}
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
            alignSelf: "stretch",
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
            style={{ ...AntSelectorStyle, width: "100%", margin: "0.0rem 0 1.5rem", padding: "0px 20px" }}
              // style={AntSelectorStyl}
              id='phone_input_check'
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
              disabled={contactPhoneNumber === ""}
              onClick={() => addingPhoneNumber()}
              style={{...OutlinedInputStyle, padding: "2.5px 12px", border:"0.3px solid var(--gray300)", margin: "0.1rem auto 1.5rem",width:"100%"}}
            >
              <Icon icon="material-symbols:add" width={15} />
            </Button>
          </div>
        </div>
        <Space
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
          size={[0, "small"]}
          wrap
        >
          {numberOfPhoneNumbersPerEvent?.map((item) => {
            return (
              <Tag
                bordered={false}
                closable
                onClose={() => removePhoneNumber(item)}
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
                  style={InputLabelStyle}
                >
                  {item}
                </Typography>
                &nbsp;
              </Tag>
            );
          })}
        </Space>
        <div
          style={{
            width: "100%",
            textAlign: "left",
            marginBottom: "1rem",
          }}
        >
          <Typography
            style={InputLabelStyle}
          >
            Date of the event
          </Typography>
        </div>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            alignSelf: "stretch",
            textAlign: "left",
            gap: "5%",
          }}
        >
          {/* <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    width:"45%"
                  }}
                > */}
          <DatePicker
            id="calender-event"
            autoComplete="checking"
            showTimeSelect
            dateFormat="Pp"
            minDate={new Date()}
            selected={begin}
            onChange={(date) => setBegin(date)}
            placeholderText="Event start date"
            startDate={new Date()}
            style={{
              ...OutlinedInputStyle,
              margin: "0.1rem 0 1.5rem", width: '100%'
            }}
          />
          {/* </div>
                <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      width:"45%"
                    }}
                > */}
          <DatePicker
            style={{
              ...OutlinedInputStyle,
              margin: "0.1rem 0 1.5rem", width: '100%'
            }}
            id="calender-event"
            showTimeSelect
            dateFormat="Pp"
            openToDate={begin}
            startDate={begin}
            minDate={begin}
            minTime={
              end.getDate() === begin.getDate()
                ? begin
                : new Date().setHours(0, 0, 0)
            }
            maxTime={new Date().setHours(23, 59, 59)}
            selected={end}
            onChange={(date) => setEnd(date)}
            placeholderText="Event close date"
          />
          {/* </div> */}
        </div>
        <div
          style={{
            width: "100%",
            textAlign: "left",
            margin: "1rem 0",
          }}
        >
          <Typography
            textTransform={"none"}
            textAlign={"left"}
            style={{ ...TextFontSize20LineHeight30, fontWeight: 600 }}
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
            margin: "0.1rem 0 1.5rem",
            width: "100%",
            border: `${errors.street && "solid 1px #eb0000"}`,
          }}
          placeholder="Street name"
          fullWidth
        />
        <div style={{ width: "100%" }}>
          {errors?.street && (
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
            Venue name
          </Typography>
        </InputLabel>
        <OutlinedInput
          {...register("conferenceRoom", { required: true })}
          aria-invalid={errors.conferenceRoom}
          style={{
            ...OutlinedInputStyle,
            margin: "0.1rem 0 1.5rem",
            width: "100%",
            border: `${errors.conferenceRoom && "solid 1px #eb0000"}`,
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
            margin: "0.1rem 0 1.5rem",
            width: "100%",
            border: `${errors.city && "solid 1px #eb0000"}`,
          }}
          placeholder="City of the event"
          fullWidth
        />
        <div style={{ width: "100%" }}>
          {errors?.city && (
            <Typography>This field is required</Typography>
          )}
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
                margin: "0.1rem 0 1.5rem",
                border: `${errors.state && "solid 1px #eb0000"}`,
                width: "100%",
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
                margin: "0.1rem 0 1.5rem",
                border: `${errors.zipCode && "solid 1px #eb0000"}`,
                width: "100%",
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
        <div style={{ width: "100%", textAlign: "left" }}>
          <Typography
            textTransform={"none"}
            textAlign={"left"}
            style={TextFontSize20LineHeight30}
          >
            Will this event need a merchant service?
          </Typography>
        </div>
        <div style={{ width: "100%", textAlign: "left" }}>
          <Typography
            style={{ ...InputLabelStyle, fontWeight: 400 }}
          >
            A merchant service is needed to process monetary transactions
            such as obtaining deposits and charging users for lost
            devices.
          </Typography>
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
            }}
          >
            <Button
              disabled={checkSubscription}
              style={{
                ...BlueButton,
                gap: "8px",
                margin: "0.1rem 0 1.5rem",
                border: `${merchant
                  ? "1px solid var(--blue-dark-700, #004EEB)"
                  : "1px solid #d5d5d5"
                  }`,
                background: `${merchant
                  ? "var(--blue-dark-700, #004EEB)"
                  : "var(--base-white, #FFF)"
                  }`,
              }}
            >
              <Typography
                display={"flex"}
                justifyContent={"space-around"}
                alignItems={"center"}
                textTransform={"capitalize"}
                fontFamily={"Inter"}
                fontSize={"14px"}
                fontStyle={"normal"}
                fontWeight={600}
                lineHeight={"20px"}
                color={`${merchant ? "#fff" : "#8f8f8f"}`}
                onClick={() => setMerchant(true)}
              >
                {merchant ? (
                  <Icon width={20} height={20} icon="iconoir:check" />
                ) : (
                  <Icon width={20} height={20} icon="octicon:x-24" />
                )}
                &nbsp;Yes
              </Typography>
            </Button>
          </div>
          <div
            style={{
              textAlign: "left",
            }}
          >
            <Button
              disabled={checkSubscription}
              style={{
                ...BlueButton,
                gap: "8px",
                margin: "0.1rem 0 1.5rem",
                border: `${!merchant
                  ? "1px solid var(--blue-dark-700, #004EEB)"
                  : "1px solid #d5d5d5"
                  }`,
                background: `${!merchant ? "var(--blue-dark-700, #004EEB)" : "#fff"
                  }`,
              }}
              onClick={() => setMerchant(false)}
            >
              <Typography
                display={"flex"}
                justifyContent={"space-around"}
                alignItems={"center"}
                textTransform={"capitalize"}
                fontFamily={"Inter"}
                fontSize={"14px"}
                fontStyle={"normal"}
                fontWeight={600}
                lineHeight={"20px"}
                color={`${!merchant ? "#fff" : "#8f8f8f"}`}
              >
                {!merchant ? (
                  <Icon width={20} height={20} icon="iconoir:check" />
                ) : (
                  <Icon width={20} height={20} icon="octicon:x-24" />
                )}
                &nbsp;No
              </Typography>
            </Button>
          </div>
        </div>
        <Grid item xs={12} sm={12} md={12} lg={12}>
          <Button
            type="submit"
            style={{
              ...BlueButton,
              width: "100%",
              margin: "0.1rem 0 1.5rem",
            }}
          >
            <Typography
              textTransform={"none"}
              style={BlueButtonText}
            >
              Next step
            </Typography>
          </Button>
        </Grid>
      </form>
    </Grid>
  );
};


export default Form
