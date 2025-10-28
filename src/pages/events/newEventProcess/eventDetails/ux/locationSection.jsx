import { InputLabel, OutlinedInput, Typography } from "@mui/material";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { TextFontSize20LineHeight30 } from "../../../../../styles/global/TextFontSize20HeightLine30";

const LocationSection = ({ register, errors }) => {
  return (
    <>
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
        required
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
      <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
        <Typography
          textTransform={"none"}
          style={{ ...Subtitle, fontWeight: 500 }}
        >
          Venue name
        </Typography>
      </InputLabel>
      <OutlinedInput
        required
        {...register("conferenceRoom", { required: true })}
        aria-invalid={errors.conferenceRoom}
        style={{
          ...OutlinedInputStyle,
          margin: "0.1rem 0 1.5rem",
          width: "100%",
          border: `${errors.conferenceRoom && "solid 1px #eb0000"}`,
        }}
        placeholder="Venue name or Conference Building name"
        fullWidth
      />
      <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
        <Typography
          textTransform={"none"}
          style={{ ...Subtitle, fontWeight: 500 }}
        >
          City
        </Typography>
      </InputLabel>
      <OutlinedInput
        required
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
        {errors?.city && <Typography>This field is required</Typography>}
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
              style={{ ...Subtitle, fontWeight: 500 }}
            >
              State
            </Typography>
          </InputLabel>
          <OutlinedInput
            required
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
            {errors?.state && <Typography>This field is required</Typography>}
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
              style={{ ...Subtitle, fontWeight: 500 }}
            >
              Zip code
            </Typography>
          </InputLabel>
          <OutlinedInput
            required
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
            {errors?.zipCode && <Typography>This field is required</Typography>}
          </div>
        </div>
      </div>
    </>
  );
};

export default LocationSection;
