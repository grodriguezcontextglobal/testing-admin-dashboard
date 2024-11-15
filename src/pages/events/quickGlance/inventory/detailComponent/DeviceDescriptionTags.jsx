import { Icon } from "@iconify/react";
import { Grid, Typography } from "@mui/material";
import { Card } from "antd";
import { useSelector } from "react-redux";
import { CardStyle } from "../../../../../styles/global/CardStyle";

const DeviceDescriptionTags = () => {
  const { deviceInfoSelected } = useSelector((state) => state.devicesHandle);

  return (
    <Grid
      padding={"0px 0px 0px 10px"}
      display={"flex"}
      justifyContent={"flex-start"}
      textAlign={"center"}
      flexDirection={"column"}
      alignItems={"center"}
      alignSelf={"stretch"}
      item
      xs={12}
          sm={12}
          md={12}
    >
      <Card
        id="card-contact-person"
        style={CardStyle}
      >
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          textAlign={"center"}
          flexDirection={"column"}
          alignSelf={"stretch"}
          alignItems={"center"}
          item
          xs={12}
        >
          {deviceInfoSelected.entireData.status !== "Lost" ? (
            <span
              style={{
                borderRadius: "16px",
                justifyContent: "center",
                display: "flex",
                padding: "2px 8px",
                alignItems: "center",
                mixBlendMode: "multiply",
                background: `${
                  deviceInfoSelected.activity
                    ? "var(--orange-dark-50, #FFF4ED)"
                    : "var(--success-50, #ECFDF3)"
                }`,
                width: "fit-content",
                marginBottom: "5px",
              }}
            >
              <Typography
                color={`${
                  deviceInfoSelected.entireData.activity
                    ? "var(--orange-700, #B93815)"
                    : "var(--success-700, #027A48)"
                }`}
                fontSize={"12px"}
                fontFamily={"Inter"}
                fontStyle={"normal"}
                fontWeight={500}
                lineHeight={"18px"}
                textAlign={"center"}
                textTransform={"capitalize"}
              >
                <Icon
                  icon="tabler:point-filled"
                  rotate={3}
                  color={`${
                    deviceInfoSelected.entireData.activity
                      ? "#EF6820"
                      : "#12B76A"
                  }`}
                />
                {deviceInfoSelected.entireData.activity ? "In Use" : "In Stock"}
              </Typography>
            </span>
          ) : (
            <span
              style={{
                borderRadius: "16px",
                justifyContent: "center",
                display: "flex",
                padding: "2px 8px",
                alignItems: "center",
                mixBlendMode: "multiply",
                background: "var(--orange-dark-50, #FFF4ED)",
                width: "fit-content",
                marginBottom: "5px",
              }}
            >
              <Typography
                color={"var(--orange-700, #B93815)"}
                fontSize={"12px"}
                fontFamily={"Inter"}
                fontStyle={"normal"}
                fontWeight={500}
                lineHeight={"18px"}
                textAlign={"center"}
                textTransform={"capitalize"}
              >
                <Icon icon="tabler:point-filled" rotate={3} color={"#EF6820"} />
                {deviceInfoSelected.entireData.status}
              </Typography>
            </span>
          )}
          <br />
          <span
            style={{
              borderRadius: "16px",
              justifyContent: "center",
              display: "flex",
              padding: "2px 8px",
              alignItems: "center",
              mixBlendMode: "multiply",
              background: "var(--orange-dark-50, #FFF4ED)",
              width: "fit-content",
              marginBottom: "5px",
            }}
          >
            <Typography
              color={"var(--orange-700, #B93815)"}
              fontSize={"12px"}
              fontFamily={"Inter"}
              fontStyle={"normal"}
              fontWeight={500}
              lineHeight={"18px"}
              textAlign={"center"}
              textTransform={"capitalize"}
            >
              <Icon icon="tabler:point-filled" rotate={3} color={"#EF6820"} />
              {deviceInfoSelected.entireData.status}
            </Typography>
          </span>
        </Grid>
      </Card>
    </Grid>
  );
};

export default DeviceDescriptionTags;
