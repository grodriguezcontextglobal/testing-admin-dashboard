import { Grid, Typography } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Card } from "antd";
import { Subtitle } from "../../../styles/global/Subtitle";

const NotesRendering = ({ props, title}) => {
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  const isLargeDevice = useMediaQuery(
    "only screen and (min-width : 993px) and (max-width : 1200px)"
  );
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
            justifyContent={"flex-start"}
            alignItems={"center"}
            item
            xs={12}
          >
            {props.map((item, index) => {
              return (
                <div key={index} style={{ width: "100%", margin:"0 0 1dvh" }}>
                  {
                    <Typography
                      style={{
                        ...Subtitle,
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item}
                    </Typography>
                  }
                </div>
              );
            })}
          </Grid>
        </Grid>
      </Card>
    </Grid>
  );
};

export default NotesRendering;
