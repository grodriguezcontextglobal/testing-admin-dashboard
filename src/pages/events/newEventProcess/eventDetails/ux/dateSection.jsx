import { Typography } from "@mui/material";
import { InputLabelStyle } from "../../style/InputLabelStyle";
import DatePicker from "react-datepicker";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";

const DateSection = ({ begin, end, setBegin, setEnd }) => {
  return (
    <>
      <div
        style={{
          width: "100%",
          textAlign: "left",
          margin: "1.5rem 0 0.5rem",
        }}
      >
        <Typography style={InputLabelStyle}>Date of the event</Typography>
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
            justifyContent: "flex-start !important",
            margin: "0.1rem 0 1.5rem",
            width: "100%",
          }}
        />
        <DatePicker
          style={{
            ...OutlinedInputStyle,
            justifyContent: "flex-end !important",
            margin: "0.1rem 0 1.5rem",
            width: "100%",
          }}
          id="calender-event"
          showTimeSelect
          dateFormat="Pp"
          openToDate={new Date(begin)}
          startDate={new Date(begin)}
          minDate={new Date(begin)}
          selected={new Date(end)}
          onChange={(date) => setEnd(date)}
          placeholderText="Event close date"
        />
      </div>
    </>
  );
};

export default DateSection;
