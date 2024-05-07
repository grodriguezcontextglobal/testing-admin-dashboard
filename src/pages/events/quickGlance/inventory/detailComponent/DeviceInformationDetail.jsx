import { Grid, Typography } from "@mui/material";
import { Card } from "antd";
import { useSelector } from "react-redux";
import { CardStyle } from "../../../../../styles/global/CardStyle";

const DeviceInformationDetail = () => {
  const { deviceInfoSelected } = useSelector((state) => state.devicesHandle);
  return (
    <Grid
      padding={0}
      display={"flex"}
      justifyContent={"flex-start"}
      alignItems={"flex-start"}
      alignSelf={"stretch"}
      item
      xs={12}
      sm={12}
      md={12}
    >
      <Card
        id="checking"
        style={{ ...CardStyle }}
        styles={{
          body:{
            padding: "24px 24px 24px 0"
          }
        }}
        // bodyStyle={{
        //   padding: "24px 24px 24px 0"
        // }}
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
            textAlign={"left"}
            alignItems={"center"}
            item
            xs={12}
          >
            <Typography
              textAlign={"left"}
              fontFamily={"Inter"}
              fontSize={"18px"}
              fontStyle={"normal"}
              fontWeight={600}
              lineHeight={"28px"}
              color={"var(--gray-900, #101828)"}
            >
              {deviceInfoSelected.company[0]}
              <br />
              <Typography
                textAlign={"left"}
                fontFamily={"Inter"}
                fontSize={"18px"}
                fontStyle={"normal"}
                fontWeight={400}
                lineHeight={"28px"}
                color={"var(--gray-900, #101828)"}
              >
                {deviceInfoSelected.company[1]}
              </Typography>
            </Typography>
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"left"}
            textAlign={"left"}
            alignItems={"center"}
            item
            xs={12}
          >
            <Typography
              textAlign={"left"}
              paddingTop={"8px"}
              fontFamily={"Inter"}
              fontSize={"18px"}
              fontStyle={"normal"}
              fontWeight={600}
              lineHeight={"28px"}
              color={"var(--gray-900, #101828)"}
            >
              Serial number
            </Typography>
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"left"}
            textAlign={"left"}
            alignItems={"center"}
            item
            xs={12}
          >
            <Typography
              textAlign={"left"}
              paddingTop={"8px"}
              fontFamily={"Inter"}
              fontSize={"38px"}
              fontStyle={"normal"}
              fontWeight={600}
              lineHeight={"38px"}
              color={"var(--gray-900, #101828)"}
            >
              {deviceInfoSelected.entireData.device}
            </Typography>
          </Grid>
        </Grid>
      </Card>
    </Grid>
  );
};

export default DeviceInformationDetail;
