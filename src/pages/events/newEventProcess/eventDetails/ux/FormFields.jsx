import { Grid } from "@mui/material";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import DateSection from "./dateSection";
import LocationSection from "./locationSection";
import MainMerchantSection from "./merchant/MainMerchantSection";
import PhoneNumberContact from "./phoneNumberContact";
import Title from "./title";

const FormFields = ({
  addingPhoneNumber,
  begin,
  contactPhoneNumber,
  end,
  errors,
  eventInfoDetail,
  handleEventInfo,
  handleSubmit,
  isMobile,
  merchant,
  numberOfPhoneNumbersPerEvent,
  register,
  removePhoneNumber,
  setBegin,
  setContactPhoneNumber,
  setEnd,
  setMerchant,
}) => {
  return (
    <form
      style={{
        width: "100%",
        justifyContent: "flex-start",
        alignItems: "center",
        textAlign: "left",
      }}
      onSubmit={handleSubmit(handleEventInfo)}
      key={eventInfoDetail.eventName ?? "form_new_event"}
    >
      {/* event name */}
      <Title key="eventName" register={register} errors={errors} />
      {/* contact phone number */}
      <PhoneNumberContact
        key="contactPhoneNumber"
        contactPhoneNumber={contactPhoneNumber}
        setContactPhoneNumber={setContactPhoneNumber}
        isMobile={isMobile}
        addingPhoneNumber={addingPhoneNumber}
        removePhoneNumber={removePhoneNumber}
        numberOfPhoneNumbersPerEvent={numberOfPhoneNumbersPerEvent}
      />
      {/* date section */}
      <DateSection
        key="dateSection"
        begin={begin}
        end={end}
        setBegin={setBegin}
        setEnd={setEnd}
      />
      {/* location section */}
      <LocationSection key="locationSection" register={register} errors={errors} />
      {/* main merchant section */}
      <MainMerchantSection key="mainMerchantSection" merchant={merchant} setMerchant={setMerchant} />
      <Grid item xs={12} sm={12} md={12} lg={12}>
        <BlueButtonComponent
          title={
            String(eventInfoDetail.eventName).length === 0
              ? "Next step"
              : "Save changes"
          }
          buttonType="submit"
          styles={{ width: "100%" }}
        />
      </Grid>
    </form>
  );
};

export default FormFields;
