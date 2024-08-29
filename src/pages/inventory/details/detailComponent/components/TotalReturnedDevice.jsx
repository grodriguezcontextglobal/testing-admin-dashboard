import { Icon } from "@iconify/react";
import { Grid, Typography } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Card } from "antd";

const TotalReturnedDevice = ({ dataFound }) => {
  console.log(dataFound);
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
        isSmallDevice || isMediumDevice
          ? "10px 0px"
          : isLargeDevice
          ? "10px 10px 10px 0"
          : "10px 0 10px 10px"
      }`}
      item
      xs={12}
      sm={12}
      md={12}
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
            justifyContent={"flex-start"}
            alignItems={"center"}
            item
            xs={12}
          >
            <Typography
              fontFamily={"Inter"}
              fontSize={"14px"}
              fontStyle={"normal"}
              fontWeight={500}
              lineHeight={"20px"}
              color={"var(--gray-600, #475467)"}
            >
              Condition
            </Typography>
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"flex-end"}
            alignItems={"center"}
            item
            xs={12}
          >
            <Grid item xs={12}>
              <Typography
                fontFamily={"Inter"}
                fontSize={"14px"}
                fontStyle={"normal"}
                fontWeight={500}
                lineHeight={"20px"}
                textAlign={"right"}
                color={"var(--gray-600, #475467)"}
              >
                <Icon
                  icon="simple-line-icons:options-vertical"
                  color="#98A2B3"
                />
              </Typography>
            </Grid>
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
            <Typography
              paddingTop={"8px"}
              fontFamily={"Inter"}
              fontSize={"30px"}
              fontStyle={"normal"}
              fontWeight={600}
              lineHeight={"38px"}
              color={"var(--gray-900, #101828)"}
            >
              {dataFound[0]?.itemInfo?.status ?? "Operational"}
            </Typography>
          </Grid>
        </Grid>
      </Card>
    </Grid>
  );
};
export default TotalReturnedDevice;
