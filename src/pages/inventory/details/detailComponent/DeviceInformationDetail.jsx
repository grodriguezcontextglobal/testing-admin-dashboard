import { Grid, Typography } from "@mui/material";
import { Card } from "antd";
import { CardStyle } from "../../../../styles/global/CardStyle";

const DeviceInformationDetail = ({ dataFound }) => {
  return (
    <Grid
      padding={"0px"}
      display={"flex"}
      justifyContent={"flex-start"}
      textAlign={"left"}
      alignItems={"flex-start"}
      alignSelf={"stretch"}
      item
      xs={12}
      sm={12}
      md={12}
    >
      <Card
        style={CardStyle}
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
              {dataFound[0]?.item_group}
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
                {dataFound[0]?.company}
              </Typography>
            </Typography>
          </Grid>
        </Grid>
      </Card>
    </Grid>
  );
};

export default DeviceInformationDetail;
