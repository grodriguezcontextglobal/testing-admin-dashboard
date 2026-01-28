import { InputLabel, OutlinedInput, Typography } from "@mui/material";
import { Button, Divider } from "antd";
import DatePicker from "react-datepicker";
import { WhiteCirclePlusIcon } from "../../../../../../components/icons/WhiteCirclePlusIcon";
import Chip from "../../../../../../components/UX/Chip/Chip";
import { BlueButton } from "../../../../../../styles/global/BlueButton";
import CenteringGrid from "../../../../../../styles/global/CenteringGrid";
import { OutlinedInputStyle } from "../../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../../styles/global/Subtitle";
import { TextFontSize20LineHeight30 } from "../../../../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../../../../styles/global/TextFontSize30LineHeight38";
import ScanningMethod from "../../../../../inventory/actions/utils/ScanningMethod";
import ScanningModal from "../../../../../inventory/actions/utils/ScanningModal";
import Input from "../../../../../../components/UX/inputs/Input";

// export const renderTitle = () => {
//   return (
//     <>
//       <InputLabel id="eventName" style={{ marginBottom: "6px", width: "100%" }}>
//         <Typography
//           textAlign={"left"}
//           style={TextFontSize30LineHeight38}
//           color={"var(--gray-600, #475467)"}
//         >
//           Add a group of items
//         </Typography>
//       </InputLabel>
//       <InputLabel id="eventName" style={{ marginBottom: "6px", width: "100%" }}>
//         <Typography
//           textAlign={"left"}
//           textTransform={"none"}
//           style={{ ...TextFontSize20LineHeight30, textWrap: "balance" }}
//           color={"var(--gray-600, #475467)"}
//         >
//           Devices serial numbers can be created by inputting a serial number
//           base to define the category of items, and then a range from one number
//           to another, depending on your inventory.
//         </Typography>
//       </InputLabel>
//     </>
//   );
// };

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
      <Button
        style={{
          display: "flex",
          margin: "10px 0 0",
        }}
        onClick={() => addingSubLocation(watch("sub_location"))}
      >
        Add sub location
      </Button>
    );
  }
  if (
    label === "Starting Serial number" &&
    watch("format_range_serial_number") === "Custom serial number"
  ) {
    return (
      <Button
        style={{
          display: "flex",
          margin: "10px 0 0",
        }}
        onClick={() => setAddSerialNumberField(true)}
      >
        Add serial number
      </Button>
    );
  }
  if (
    label === "Scanned serial number will be displayed here." ||
    label === "Typed serial number will be displayed here."
  ) {
    const redirectOptions = () => {
      if (watch("feed_serial_number") === "Scanning") {
        return setOpenScanningModal(true);
      }
      if (watch("feed_serial_number") === "Typing") {
        return setOpenScanningModal(true);
        //manuallyAddingSerialNumbers();
      }
    };

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <Button
          style={{
            display: "flex",
            margin: "10px 0 0",
          }}
          onClick={() => redirectOptions()}
        >
          {watch("feed_serial_number") === "Scanning"
            ? "Click for scanning"
            : "Add serial number"}
        </Button>
        <Button
          style={{
            display: "flex",
            margin: "10px 0 0",
          }}
          onClick={() => setOpenScannedItemView(true)}
        >
          {watch("feed_serial_number") === "Scanning"
            ? "View scanned serial numbers"
            : "View inserted serial numbers"}
        </Button>
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
        gap: "5px",
      }}
    >
      <OutlinedInput
        style={{ ...OutlinedInputStyle, width: "100%" }}
        placeholder="e.g IMEI"
        name="key"
        value={keyObject}
        onChange={(e) => setKeyObject(e.target.value)}
      />
      <OutlinedInput
        style={{ ...OutlinedInputStyle, width: "100%" }}
        placeholder="e.g YABSDA56AKJ"
        name="key"
        value={valueObject}
        onChange={(e) => setValueObject(e.target.value)}
      />
      <Button
        style={{ ...BlueButton, width: "fit-content" }}
        htmlType="button"
        onClick={() => handleMoreInfoPerDevice()}
      >
        <WhiteCirclePlusIcon />
      </Button>
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
          marginBottom: "-15px",
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
              color="gray"
              style={{
                backgroundColor: "var(--basewhite)",
                padding: "2.5px 5px",
                margin: "0 1px",
                border: "solid 0.1px var(--gray900)",
                borderRadius: "8px",
              }}
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
          setScannedSerialNumbers={setScannedSerialNumbers}
          scannedSerialNumbers={scannedSerialNumbers}
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
            ...OutlinedInputStyle,
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
    <Input
      required
      multiline
      minRows={5}
      {...register("descript_item", { required: true })}
      fullWidth
      aria-invalid={errors.descript_item}
      style={{
        borderRadius: "8px",
        backgroundColor: "#fff",
        color: "#000",
        verticalAlign: "center",
        boxShadow: "1px 1px 2px rgba(16, 24, 40, 0.05)",
        outline: "none",
      }}
      placeholder="Please provide a brief description of the new device to be added."
    />
  );
};

export const dicColumnsNameProperlyDisplayed = () => {};

export const gripingFields = (props) => {
  if (
    props === "min_serial_number" ||
    props === "max_serial_number" ||
    props === "quantity"
  )
    return 6;
  return 6;
};

export const renderingResultUX = ({ name, value }) => {
  if (name === "enableAssignFeature") {
    return value === 0 ? "Disabled" : "Enabled";
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
