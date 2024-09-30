/* eslint-disable no-unused-vars */
import { Grid, Typography } from "@mui/material";
import { Card } from "antd";
import { useSelector } from "react-redux";
import { CardStyle } from "../../../styles/global/CardStyle";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import { RightNarrowInCircle } from "../../../components/icons/RightNarrowInCircle";

const ConsumerDetailInfoCntact = () => {
  const { customer } = useSelector((state) => state.customer);
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
      <Card style={CardStyle}>
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
              style={{
                ...TextFontsize18LineHeight28,
                color: "var(--gray-900, #101828)",
                fontWeight: 600,
              }}
            >
              Contact
              <br />
              <Typography
                textAlign={"left"}
                style={{
                  ...TextFontSize30LineHeight38,
                  color: "var(--gray-900, #101828)",
                  fontWeight: 400,
                }}
              >
                {customer.phoneNumber ?? "+1-000-000-0000"}
              </Typography>
              <Typography
                textAlign={"left"}
                style={{
                  ...TextFontSize20LineHeight30,
                  color: "var(--gray600)",
                  fontWeight: 400,
                  textWrap: "pretty",
                }}
              >
                {customer.email}
              </Typography>
              <Typography
                textAlign={"left"}
                style={{
                  ...TextFontSize20LineHeight30,
                  color: "var(--gray600)",
                  fontWeight: 400,
                  textWrap: "pretty",
                }}
              >
                Group <RightNarrowInCircle />
                {" "}
              </Typography>
            </Typography>
          </Grid>
        </Grid>
      </Card>
    </Grid>
  );
};

export default ConsumerDetailInfoCntact;
