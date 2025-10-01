import { Typography } from "@mui/material";
import { Button, Tooltip } from "antd";
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { QuestionIcon } from "../../../../../components/icons/QuestionIcon";
import ModalUX from "../../../../../components/UX/modal/ModalUX";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { TextFontSize14LineHeight20 } from "../../../../../styles/global/TextFontSize14LineHeight20";
import { formatDate } from "../../../../inventory/utils/dateFormat";
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

  const bodyModal = () => {
    return (
      <>
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
      </>
    );
  };
  return (
    <ModalUX title={"Returning date"} body={bodyModal()} openDialog={openReturnDateModal} closeModal={handleCancel} />
    // <Modal
    //   open={openReturnDateModal}
    //   onCancel={handleCancel}
    //   footer={[]}
    //   centered
    //   maskClosable={false}
    //   style={{ zIndex: 30 }}
    // ></Modal>
  );
};

export default ReturnDateModal;
