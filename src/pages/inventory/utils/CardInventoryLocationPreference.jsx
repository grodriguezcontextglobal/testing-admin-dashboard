import { Grid } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Card } from "antd";
import { RightNarrowInCircle } from "../../../components/icons/Icons";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import { useNavigate } from "react-router-dom";

const CardInventoryLocationPreference = ({ props, title, route }) => {
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  const isLargeDevice = useMediaQuery(
    "only screen and (min-width : 993px) and (max-width : 1200px)"
  );
  const navigate = useNavigate();
  return (
    <Grid
      padding={`${
        isSmallDevice || isMediumDevice || isLargeDevice
          ? "10px 0px"
          : "10px 10px 10px 0"
      }`}
      item
      xs={12}
      sm={12}
      md={12}
      lg={12}
    >
      <Card
        style={{
          width: "100%",
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
            sm={12}
            md={12}
            lg={12}
          >
            <p style={TextFontSize30LineHeight38}>{title}</p>
            <button
              onClick={() => navigate(route)}
              style={{
                backgroundColor: "transparent",
                outline: "none",
                margin: 0,
                padding: 0,
              }}
            >
              <RightNarrowInCircle />
            </button>
          </Grid>
        </Grid>
        <Grid container>
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            <p
              style={{
                textAlign: `${(isSmallDevice || isMediumDevice) && "left"}`,
                fontFamily: "Inter",
                fontSize: "14px",
                fontStyle: "normal",
                fontWeight: 500,
                lineHeight: "20px",
                color: "var(--gray-600, #475467)",
              }}
            >
              {props}
            </p>
          </Grid>
        </Grid>
      </Card>
    </Grid>
  );
};

export default CardInventoryLocationPreference;
