import { Grid, Typography } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Card, Input } from "antd";
import { Subtitle } from "../../../styles/global/Subtitle";
const { TextArea } = Input;
const NotesRendering = ({ props, title }) => {
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  const isLargeDevice = useMediaQuery(
    "only screen and (min-width : 993px) and (max-width : 1200px)"
  );

  const renderingNotesPerCustomer = () => {
    let notes = "";
    props.slice().reverse().map((item, index) => {
      notes += `${new Date(item.date).toString().split(" ").slice(1, 5).toString().replaceAll(",", " ")}:  ${item.notes}`;
      if (index !== props.length - 1) {
        notes += "\n";
      }
    });
    return notes;
  };
    return (
    <Grid
      padding={`${
        isSmallDevice || isMediumDevice || isLargeDevice
          ? "10px 0px"
          : "10px 10px 10px 0"
      }`}
      item
      xs={12}
    >
      <Card
        style={{
          borderRadius: "12px",
          border: "1px solid var(--gray-200, #EAECF0)",
          background: "var(--base-white, #FFF)",
          boxShadow:
            "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
        }}
      >
        <Grid
          display={"flex"}
          justifyContent={"space-around"}
          alignItems={"center"}
          container
        >
          <Grid
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            item
            xs={12}
          >
            <Typography
              textAlign={`${(isSmallDevice || isMediumDevice) && "left"}`}
              fontFamily={"Inter"}
              fontSize={"12px"}
              fontStyle={"normal"}
              fontWeight={500}
              lineHeight={"18px"}
              color={"var(--gray-600, #475467)"}
            >
              {title}
            </Typography>
          </Grid>
        </Grid>
        <Grid container>
          <Grid
            display={"flex"}
            flexDirection={"column"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            item
            xs={12}
          >
            <TextArea
              disabled
              rows={4}
              style={{ ...Subtitle, border: "transparent", background: "transparent" }}
              placeholder="Add a note"
              value={renderingNotesPerCustomer()}
            />
          </Grid>
        </Grid>
      </Card>
    </Grid>
  );
};

export default NotesRendering;
