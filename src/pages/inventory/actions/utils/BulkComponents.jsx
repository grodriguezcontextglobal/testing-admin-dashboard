import { InputLabel, Typography } from "@mui/material";
import Chip from "../../../../components/UX/Chip/Chip";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import { TextFontSize20LineHeight30 } from "../../../../styles/global/TextFontSize20HeightLine30";
import { Divider } from "antd";
import { Subtitle } from "../../../../styles/global/Subtitle";
import { BlueButton } from "../../../../styles/global/BlueButton";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import ScanningModal from "./ScanningModal";
import ScanningMethod from "./ScanningMethod";
import DatePicker from "react-datepicker";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import Input from "../../../../components/UX/inputs/Input";
import ReusableTextArea from "../../../../components/UX/inputs/TextArea";

export const renderTitle = () => {
  return (
    <>
      <InputLabel id="eventName" style={{ marginBottom: "6px", width: "100%" }}>
        <Typography
          textAlign={"left"}
          style={TextFontSize30LineHeight38}
          color={"var(--gray-600, #475467)"}
        >
          Add a group of devices
        </Typography>
      </InputLabel>
      <InputLabel id="eventName" style={{ marginBottom: "6px", width: "100%" }}>
        <Typography
          textAlign={"left"}
          textTransform={"none"}
          style={{ ...TextFontSize20LineHeight30, textWrap: "balance" }}
          color={"var(--gray-600, #475467)"}
        >
          Device serial numbers can be created by inputting a serial number base
          to define the category of devices, and then a range from one number to
          another, depending on your inventory.
        </Typography>
      </InputLabel>
    </>
  );
};

export const renderingOptionsButtons = ({
  watch,
  setOpenScanningModal,
  setOpenScannedItemView,
  // manuallyAddingSerialNumbers,
  addingSubLocation,
  setAddSerialNumberField,
  label,
}) => {
  if (label === "Sub location") {
    return (
      <BlueButtonComponent
        title={"Add sub location"}
        func={() => addingSubLocation(watch("sub_location"))}
        styles={{
          display: "flex",
          margin: "10px 0 0",
        }}
      />
    );
  }
  if (
    label === "Starting Serial number" &&
    watch("format_range_serial_number") === "Custom format"
  ) {
    return (
      <BlueButtonComponent
        title={"Add serial number"}
        func={() => setAddSerialNumberField(true)}
        style={{
          display: "flex",
          margin: "10px 0 0",
        }}
      />
    );
  }
  if (
    label === "All scanned serial numbers are displayed here." ||
    label === "All typed serial numbers are displayed here."
  ) {
    const redirectOptions = () => {
      if (watch("feed_serial_number") === "Scanning") {
        return setOpenScanningModal(true);
      }
      if (watch("feed_serial_number") === "Typing") {
        // return manuallyAddingSerialNumbers();
        return setOpenScanningModal(true);
      }
    };

    return (
      <div
        style={{
          display: "flex",
          margin: "10px 0 0",
          gap: 2,
        }}
      >
        <BlueButtonComponent
          title={
            watch("feed_serial_number") === "Scanning"
              ? "Click for scanning"
              : "Click for typing"
          }
          func={() => redirectOptions()}
        />
        <BlueButtonComponent
          title={
            watch("feed_serial_number") === "Scanning"
              ? "View scanned serial numbers"
              : "View inserted serial numbers"
          }
          func={() => setOpenScannedItemView(true)}
        />
      </div>
    );
  }
};

export const addingExtraInfo = ({
  keyObject,
  valueObject,
  setKeyObject,
  setValueObject,
  handleMoreInfoPerDevice,
}) => {
  return (
    <div
      style={{
        width: "100%",
        ...CenteringGrid,
        justifyContent: "space-between",
        margin: "2rem 0 0",
        gap: "5px",
      }}
    >
      <Input
        style={{ width: "100%" }}
        placeholder="Type the name of the variable to store. e.g. IMEI"
        name="key"
        value={keyObject}
        onChange={(e) => setKeyObject(e.target.value)}
      />
      <Input
        style={{ width: "100%" }}
        placeholder="Type the value of the variable. e.g YABSDA56AKJ"
        name="key"
        value={valueObject}
        onChange={(e) => setValueObject(e.target.value)}
      />
      <BlueButtonComponent
        buttonType="button"
        title="Add"
        func={() => handleMoreInfoPerDevice()}
      />
    </div>
  );
};

export const renderingMoreInfoSubmitted = ({
  moreInfo,
  moreInfoDisplay,
  handleDeleteMoreInfo,
}) => {
  return (
    <>
      <Divider
        style={{
          margin: "15px auto",
          display: moreInfoDisplay ? "" : "none",
        }}
      />
      <div
        style={{
          width: "100%",
          display: moreInfoDisplay ? "flex" : "none",
          justifyContent: "flex-start",
          alignSelf: "flex-start",
        }}
      >
        <p style={Subtitle}>More information</p>
      </div>

      <div
        style={{
          width: "100%",
          display: moreInfoDisplay ? "flex" : "none",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        {moreInfo.length > 0 &&
          moreInfo.map((item, index) => (
            <Chip
              variant="outlined"
              color="default"
              key={`${item.keyObject}-${item.valueObject}`}
              label={`${item.keyObject}:${item.valueObject}`}
              onDelete={() => handleDeleteMoreInfo(index)}
            />
          ))}
      </div>
    </>
  );
};

export const renderingModals = ({
  openScanningModal,
  setOpenScanningModal,
  openScannedItemView,
  setOpenScannedItemView,
  scannedSerialNumbers,
  setScannedSerialNumbers,
}) => {
  return (
    <>
      {openScanningModal && (
        <ScanningModal
          openScanningModal={openScanningModal}
          setOpenScanningModal={setOpenScanningModal}
          // setScannedSerialNumbers={setScannedSerialNumbers}
          // scannedSerialNumbers={scannedSerialNumbers}
        />
      )}
      {openScannedItemView && (
        <ScanningMethod
          openScannedItemView={openScannedItemView}
          setOpenScannedItemView={setOpenScannedItemView}
          scannedDevice={scannedSerialNumbers}
          setScannedDevice={setScannedSerialNumbers}
        />
      )}
    </>
  );
};

export const stylingComponents = ({ loadingStatus }) => {
  const styling = {
    textTransform: "none",
    textAlign: "left",
    fontFamily: "Inter",
    fontSize: "14px",
    fontStyle: "normal",
    fontWeight: 500,
    lineHeight: "20px",
    color: "var(--gray-700, #344054)",
  };

  const buttonStyleLoading = {
    ...BlueButton,
    ...CenteringGrid,
    width: "100%",
    border: `1px solid ${
      loadingStatus ? "var(--disabled-blue-button)" : "var(--blue-dark-600)"
    }`,
    borderRadius: "8px",
    background: `${
      loadingStatus ? "var(--disabled-blue-button)" : "var(--blue-dark-600)"
    }`,
    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
    padding: "6px 12px",
    cursor: "pointer",
  };

  const styleDivParent = {
    width: "100%",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    textAlign: "left",
    gap: "10px",
  };

  return {
    styling,
    buttonStyleLoading,
    styleDivParent,
  };
};

export const renderOptional = ({
  props,
  watch,
  register,
  errors,
  returningDate,
  setReturningDate,
}) => {
  if (props === "Day") {
    return (
      <div
        style={{
          width: "100%",
          display: watch("ownership") === "Rent" ? "flex" : "none",
        }}
      >
        <DatePicker
          id="calender-event"
          autoComplete="checking"
          showTimeSelect
          dateFormat="Pp"
          minDate={new Date()}
          selected={returningDate}
          openToDate={new Date()}
          startDate={new Date()}
          onChange={(date) => setReturningDate(date)}
          style={{
            width: "100%",
            borderRadius: "8px",
          }}
        />
      </div>
    );
  }
  if (props === "Quantity") {
    return (
      <Input
        readOnly
        {...register("quantity")}
        fullWidth
        style={{
          width: "100%",
          borderRadius: "8px",
        }}
      />
    );
  }

  return (
    <ReusableTextArea
      {...register("descript_item", { required: true })}
      fullWidth
      aria-invalid={errors.descript_item}
      placeholder="Please provide a brief description of the new device to be added."
    />
  );
};

export const dicColumnsNameProperlyDisplayed = () => {};

export const renderingResultUX = ({ name, value }) => {
  if (name === "enableAssignFeature") {
    return value === 0 ? "NO" : "YES";
  }
  if (name === "container") {
    return value === 0
      ? "No - It is not a container"
      : "Yes - It is a container";
  }
  if (name === "warehouse") {
    return value === 0 ? "No" : "Yes";
  }

  return value;
};

export const renderTitleSingleItem = () => {
  return (
    <>
      <InputLabel id="eventName" style={{ marginBottom: "6px", width: "100%" }}>
        <Typography
          textAlign={"left"}
          style={TextFontSize30LineHeight38}
          color={"var(--gray-600, #475467)"}
        >
          Add an item
        </Typography>
      </InputLabel>
      <InputLabel id="eventName" style={{ marginBottom: "6px", width: "100%" }}>
        <Typography
          textAlign={"left"}
          textTransform={"none"}
          style={{ ...TextFontSize20LineHeight30, textWrap: "balance" }}
          color={"var(--gray-600, #475467)"}
        >
          Item serial number can be created by inputting a serial number base to
          define the category of item depending on your inventory.
        </Typography>
      </InputLabel>
    </>
  );
};

export const gripingFields = (props) => {
  switch (props) {
    case "brand":
      return 6
    case "category_name":
      return 6
    case "item_group":
      return 6
    case "cost":
      return 6
    case "ownership":
      return 6
    case "sub_location":
      return 6
    case "location":
      return 6
    case "tax_location":
      return 6
    case "container":
      return 6
    case "isItAContainer":
      return 6
    case "":
      return 6
    case "supplier":
      return 6
    case "enableAssignFeature":
      return 6
    case "image_uploader": 
      return 6
    case "image_uploader_preview":
      return 6
    case "image_url":
      return 6
      case "containerSpotLimit":
        return 6
    default:
      return 12  }
}