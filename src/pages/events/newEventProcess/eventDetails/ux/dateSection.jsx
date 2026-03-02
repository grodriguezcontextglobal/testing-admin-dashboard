import { InputLabel, Typography } from "@mui/material";
import DatePicker from "react-datepicker";
import Input from "../../../../../components/UX/inputs/Input";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { InputLabelStyle } from "../../style/InputLabelStyle";
import { QuestionIcon } from "../../../../../components/icons/QuestionIcon";
import { Tooltip } from "antd";

const DateSection = ({
  begin,
  end,
  setBegin,
  setEnd,
  daysBeforeEvent,
  daysAfterEvent,
  setDaysBeforeEvent,
  setDaysAfterEvent,
}) => {
  const isSmallDevice = window.innerWidth <= 768;
  return (
    <>
      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: `repeat(${isSmallDevice ? 1 : 4}, 1fr)`,
          gap: "1rem",
          margin: "1.5rem 0 0.5rem",
        }}
      >
        {" "}
        <div>
          <InputLabel>
            <Typography style={InputLabelStyle}>
              Days before event starts&nbsp;
              <Tooltip title="The number of days before the event starts for managing equipment shipping to event location.">
                <QuestionIcon />
              </Tooltip>
            </Typography>
          </InputLabel>
          <Input
            value={daysBeforeEvent}
            onChange={(e) => setDaysBeforeEvent(e.target.value)}
            placeholder="e.g. 0 or 5"
          />
        </div>
        <div>
          <InputLabel>
            <Typography style={InputLabelStyle}>Event start date</Typography>
          </InputLabel>
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
        </div>
        <div>
          <InputLabel>
            <Typography style={InputLabelStyle}>Event end date</Typography>
          </InputLabel>
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
        <div>
          <InputLabel>
            <Typography style={InputLabelStyle}>
              Days after event ends&nbsp;
              <Tooltip title="The number of days after the event ends for managing equipment shipping from event location.">
                <QuestionIcon />
              </Tooltip>
            </Typography>
          </InputLabel>
          <Input
            value={daysAfterEvent}
            onChange={(e) => setDaysAfterEvent(e.target.value)}
            placeholder="e.g. 0 or 5"
          />
        </div>
      </div>
    </>
  );
};

export default DateSection;
