import { InputLabel, OutlinedInput, Typography } from "@mui/material";
import { InputLabelStyle } from "../../style/InputLabelStyle";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";

const Title = ({ register, errors }) => {
  return (
    <>
      <InputLabel
        id="eventName"
        style={{ marginBottom: "0.2rem", width: "100%" }}
      >
        <Typography style={InputLabelStyle}>Event name</Typography>
      </InputLabel>
      <OutlinedInput
        required
        id="eventName"
        {...register("eventName")}
        aria-invalid={errors.eventName}
        style={{
          ...OutlinedInputStyle,
          margin: "0.1rem 0 1.5rem",
          border: `${errors.eventName && "solid 1px #eb0000"}`,
          width: "100%",
        }}
        placeholder="Event name"
      />
    </>
  );
};

export default Title;
