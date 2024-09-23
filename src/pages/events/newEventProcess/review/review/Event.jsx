import { Grid, InputLabel, Typography } from "@mui/material";
import { useSelector } from "react-redux";

const Event = () => {
  const { eventInfoDetail, contactInfo } = useSelector((state) => state.event);
  const options = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    timeZone: "America/New_York", // Eastern Standard Time (EST)
  };
  const formatter = new Intl.DateTimeFormat("en-US", options);
  const address = eventInfoDetail?.address?.split(" ");
  return (
    <Grid
      display={"flex"}
      justifyContent={"flex-start"}
      alignItems={"center"}
      container
    >
      <Grid
        display={"flex"}
        flexDirection={"column"}
        justifyContent={"center"}
        alignItems={"center"}
        gap={2}
        item
        xs={12}
      >
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          <Typography
            textTransform={"none"}
            textAlign={"left"}
            fontFamily={"Inter"}
            fontSize={"20px"}
            fontStyle={"normal"}
            fontWeight={600}
            lineHeight={"30px"}
            color={"var(--gray-600, #475467)"}
            alignSelf={"stretch"}
          >
            Event name
          </Typography>
        </InputLabel>
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          <Typography
            textTransform={"none"}
            textAlign={"left"}
            fontFamily={"Inter"}
            fontSize={"16px"}
            fontStyle={"normal"}
            fontWeight={400}
            lineHeight={"24px"}
            color={"var(--gray-600, #475467)"}
          >
            {eventInfoDetail.eventName}
          </Typography>
        </InputLabel>
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          <Typography
            textTransform={"none"}
            textAlign={"left"}
            fontFamily={"Inter"}
            fontSize={"20px"}
            fontStyle={"normal"}
            fontWeight={600}
            lineHeight={"30px"}
            color={"var(--gray-600, #475467)"}
            alignSelf={"stretch"}
          >
            Main point of contact
          </Typography>
        </InputLabel>
        <InputLabel
          id="eventName"
          style={{ marginBottom: "0.2rem", width: "100%" }}
        >
          <Typography
            textTransform={"none"}
            textAlign={"left"}
            fontFamily={"Inter"}
            fontSize={"16px"}
            fontStyle={"normal"}
            fontWeight={400}
            lineHeight={"24px"}
            color={"var(--gray-600, #475467)"}
          >
            {contactInfo.name}
            <br />
            {contactInfo.email}
            <br />
            {contactInfo.phone.map((phone) => {
              return (
                <span key={phone}>
                  {phone}
                  <br />
                </span>
              );
            })}
          </Typography>
        </InputLabel>
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          <Typography
            textTransform={"none"}
            textAlign={"left"}
            fontFamily={"Inter"}
            fontSize={"20px"}
            fontStyle={"normal"}
            fontWeight={600}
            lineHeight={"30px"}
            color={"var(--gray-600, #475467)"}
            alignSelf={"stretch"}
          >
            Date of the event
          </Typography>
        </InputLabel>
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          <Typography
            textTransform={"none"}
            textAlign={"left"}
            fontFamily={"Inter"}
            fontSize={"16px"}
            fontStyle={"normal"}
            fontWeight={400}
            lineHeight={"24px"}
            color={"var(--gray-600, #475467)"}
          >
            Start: {`${formatter.format(new Date(eventInfoDetail.dateBegin))}`}
            <br />
            End: {`${formatter.format(new Date(eventInfoDetail.dateEnd))}`}
          </Typography>
        </InputLabel>
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          <Typography
            textTransform={"none"}
            textAlign={"left"}
            fontFamily={"Inter"}
            fontSize={"20px"}
            fontStyle={"normal"}
            fontWeight={600}
            lineHeight={"30px"}
            color={"var(--gray-600, #475467)"}
            alignSelf={"stretch"}
          >
            Location of the event
          </Typography>
        </InputLabel>
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          <Typography
            textTransform={"none"}
            textAlign={"left"}
            fontFamily={"Inter"}
            fontSize={"16px"}
            fontStyle={"normal"}
            fontWeight={400}
            lineHeight={"24px"}
            color={"var(--gray-600, #475467)"}
          >
            {eventInfoDetail.floor}
            <br />
            {address.slice(0, -3).toString().replaceAll(",", " ")}
            <br />
            {address.at(-3)} {address.at(-2)} {address.at(-1)}
          </Typography>
        </InputLabel>
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          <Typography
            textTransform={"none"}
            textAlign={"left"}
            fontFamily={"Inter"}
            fontSize={"20px"}
            fontStyle={"normal"}
            fontWeight={600}
            lineHeight={"30px"}
            color={"var(--gray-600, #475467)"}
            alignSelf={"stretch"}
          >
            Will this event need a merchant service?
          </Typography>
        </InputLabel>
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          <Typography
            textTransform={"none"}
            textAlign={"left"}
            fontFamily={"Inter"}
            fontSize={"16px"}
            fontStyle={"normal"}
            fontWeight={400}
            lineHeight={"24px"}
            color={"var(--gray-600, #475467)"}
          >
            {eventInfoDetail.merchant ? "Yes" : "No"}
          </Typography>
        </InputLabel>
      </Grid>
    </Grid>
  );
};

export default Event;
