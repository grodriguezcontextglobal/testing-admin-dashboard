import { Typography } from "@mui/material";
import { Button, Modal, Tooltip } from "antd";
import { QuestionIcon } from "../../../../../components/icons/QuestionIcon";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { TextFontSize14LineHeight20 } from "../../../../../styles/global/TextFontSize14LineHeight20";
import { useState } from "react";
import { formatDate } from "../../../../inventory/utils/dateFormat";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
const ReturnDateModal = ({
  openReturnDateModal,
  setOpenReturnDateModal,
  data,
  setSelectedItem,
  setDisplayFormToCreateCategory,
}) => {
  const [returningDate, setReturningDate] = useState(new Date());
  const handleCancel = () => {
    return setOpenReturnDateModal(false);
  };
  const handleAddReturnDateRentedDevice = () => {
    let resulting = [...data];
    resulting.at(-1).return_date = formatDate(returningDate);
    setSelectedItem(resulting);
    return setDisplayFormToCreateCategory(false);
  };

  return (
    <Modal
      open={openReturnDateModal}
      onCancel={handleCancel}
      footer={[]}
      centered
      maskClosable={false}
      style={{ zIndex: 30 }}
    >
      <div
        style={{
          textAlign: "left",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignSelf: "flex-start",
        }}
      >
        <Tooltip
          placement="top"
          title="When rented equipment will be returned to renter company."
          style={{
            width: "100%",
          }}
        >
          <Typography
            style={{
              ...TextFontSize14LineHeight20,
              fontWeight: 500,
              color: "var(--gray700, #344054)",
            }}
          >
            Returning date <QuestionIcon />
          </Typography>
        </Tooltip>
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
          }}
        />
      </div>
      <div
        style={{
          textAlign: "left",
          width: "100%",
          display: "flex",
          alignSelf: "flex-start",
          marginTop: "20px",
        }}
      >
        <Button
          onClick={() => handleAddReturnDateRentedDevice()}
          style={BlueButton}
        >
          <p style={BlueButtonText}>Submit</p>
        </Button>
      </div>
    </Modal>
  );
};

export default ReturnDateModal;
