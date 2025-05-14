import { Icon } from "@iconify/react";
import { Grid, Typography } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Card } from "antd";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import { useNavigate } from "react-router-dom";
import { Subtitle } from "../../../styles/global/Subtitle";

const CardLocations = ({ props, title, optional, navigate = null }) => {
  const navigateTo = useNavigate();
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  return (
    <Card
      style={{
        maxWidth: "max-content",
        width: "100%",
        minWidth: "351px",
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
        <Grid item xs={12} sm={12} md={12} lg={12}>
          {" "}
          <Typography
            style={{
              ...TextFontSize30LineHeight38,
              textWrap: "balance",
              textAlign: "left",
              cursor: "pointer",
              width: "100%",
            }}
            onClick={() => navigateTo(navigate)}
          >
            {title}
          </Typography>
          {optional !== null && (
            <span
              style={{
                borderRadius: "16px",
                justifyContent: "center",
                display: "flex",
                padding: "2px 8px",
                alignItems: "center",
                background: `${
                  !optional
                    ? "var(--blue-50, #EFF8FF)"
                    : "var(--success-50, #ECFDF3)"
                }`,
                width: "fit-content",
              }}
            >
              <Typography
                color={`${
                  !optional
                    ? "var(--blue-700, #175CD3)"
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
                  color={`${!optional ? "#2E90FA" : "#12B76A"}`}
                />
                {!optional ? "In Use" : "In Stock"}
              </Typography>
            </span>
          )}
        </Grid>
        <Grid item xs={12} sm={12} md={12} lg={12}>
          {" "}
          <Typography
            textAlign={`${(isSmallDevice || isMediumDevice) && "left"}`}
            style={{
              ...Subtitle,
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
            color={"var(--gray-600, #475467)"}
          >
            {props}
          </Typography>
        </Grid>
      </Grid>
    </Card>
  );
};

export default CardLocations;
