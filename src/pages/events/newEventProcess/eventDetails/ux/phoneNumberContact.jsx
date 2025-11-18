import { InputLabel, Typography } from "@mui/material";
import { InputLabelStyle } from "../../style/InputLabelStyle";
import { Space, Tag, Tooltip } from "antd";
import PhoneInput from "react-phone-number-input";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import { WhiteCirclePlusIcon } from "../../../../../components/icons/WhiteCirclePlusIcon";

const PhoneNumberContact = ({
    contactPhoneNumber,
    setContactPhoneNumber,
    isMobile,
    addingPhoneNumber,
    removePhoneNumber,
    numberOfPhoneNumbersPerEvent,
}) => {
  return (
    <>
      <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
        <Typography style={InputLabelStyle}>
          Event contact Phone number
        </Typography>
      </InputLabel>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
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
            alignSelf: "flex-start",
          }}
        >
          <Tooltip
            title="Please click the 'Add phone number' button to include your phone number. Otherwise, it will not be added."
            style={{ width: "100%" }}
          >
            <PhoneInput
              className="container-phone input-phone"
              id="phone_input_check"
              style={{
                boxShadow: "rgba(16, 24, 40, 0.05) 1px 1px 2px",
                width: "100%",
              }}
              countrySelectProps={{ unicodeFlags: true }}
              defaultCountry="US"
              placeholder="(555) 000-0000"
              value={contactPhoneNumber}
              onChange={setContactPhoneNumber}
            />
          </Tooltip>
        </div>
        <div
          style={{
            ...CenteringGrid,
            justifyContent: "flex-end",
            height: "2.5rem",
            textAlign: "left",
            width: "50%",
          }}
        >
          <BlueButtonComponent
            title={isMobile ? "Add" : "Click and Add phone number"}
            buttonType="button"
            func={() => addingPhoneNumber()}
            disabled={contactPhoneNumber === ""}
            styles={{ width: "100%" }}
            icon={<WhiteCirclePlusIcon />}
          />
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
              <Typography style={InputLabelStyle}>{item}</Typography>
              &nbsp;
            </Tag>
          );
        })}
      </Space>
    </>
  );
};

export default PhoneNumberContact;
