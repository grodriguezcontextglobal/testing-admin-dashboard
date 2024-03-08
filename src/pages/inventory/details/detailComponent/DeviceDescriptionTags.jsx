import { Icon } from "@iconify/react";
import { Grid, Typography } from "@mui/material";
import { Card } from "antd";
import { CardStyle } from "../../../../styles/global/CardStyle";

const DeviceDescriptionTags = ({ dataFound }) => {
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
            <span
              style={{
                borderRadius: "16px",
                justifyContent: "center",
                display: "flex",
                padding: "2px 8px",
                alignItems: "center",
                mixBlendMode: "multiply",
                background: `${dataFound[0]?.warehouse === 0
                  ? "var(--orange-dark-50, #FFF4ED)"
                  : "var(--success-50, #ECFDF3)"
                  }`,
                width: "fit-content",
                marginBottom: "5px",
              }}
            >
              <Typography
                color={`${dataFound[0]?.warehouse === 0
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
                  color={`${dataFound[0]?.warehouse === 0
                    ? "#EF6820"
                    : "#12B76A"
                    }`}
                />
                {dataFound[0]?.warehouse === 0 ? "In Use" : "In Stock"}
              </Typography>
            </span>
          <br />
          <span
            style={{
              borderRadius: "16px",
              justifyContent: "center",
              display: "flex",
              padding: "2px 8px",
              alignItems: "center",
              mixBlendMode: "multiply",
              background: `${dataFound[0]?.warehouse === 0 ? "var(--Primary-50, #F9F5FF)" : "#FFF4ED"}`,
              width: "fit-content",
              marginBottom: "5px",
            }}
          >
            <Typography
              color={`${dataFound[0]?.warehouse === 0 ? "var(--Primary-700, #6941C6)" : "#EF6820"}`}
              fontSize={"12px"}
              fontFamily={"Inter"}
              fontStyle={"normal"}
              fontWeight={500}
              lineHeight={"18px"}
              textAlign={"center"}
              textTransform={"capitalize"}
            >
              <Icon icon="tabler:point-filled" rotate={3} color={`${dataFound[0]?.warehouse === 0 ? "#6941C6" : "#EF6820"}`} />
              {dataFound[0]?.warehouse === 0 ? "Rented" : "Warehouse"}
            </Typography>
          </span>
        </Grid>
      </Card>
    </Grid>
  );
};

export default DeviceDescriptionTags;
