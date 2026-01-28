import { Grid, Typography } from "@mui/material";
import { Card } from "antd";
import { CardStyle } from "../../../styles/global/CardStyle";
import { Title } from "../../../styles/global/Title";
import { Subtitle } from "../../../styles/global/Subtitle";
import { BorderedCloseIcon } from "../../icons/BorderedCloseIcon";
import { CloseIcon } from "../../icons/CloseIcon";
import { InformationIcon } from "../../icons/InformationIcon";
import CenteringGrid from "../../../styles/global/CenteringGrid";

const BannerNotificationTemplate = ({
  setNotificationStatus,
  title,
  body,
  category = 0,
}) => {
  return (
    <Card
      style={{
        ...CardStyle,
        ...CenteringGrid,
        padding: "5px 16px",
        border: "1px solid var(--gray-200)",
        boxShadow:
          "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
        background:
          category > 0
            ? "var(--pending-leased-equip-alert)"
            : "var(--basewhite)",
      }}
      styles={{
        body: { ...CenteringGrid, padding: "0px 0px 5px 0px" },
      }}
      // bodyStyle={{ ...CenteringGrid, padding: 0 }}
    >
      <Grid container>
        <Grid style={{ ...CenteringGrid }} container>
          <div
            style={{
              fontSize: "25px",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              width: "fit-content",
              padding: "15px 5px 10px 0",
              alignSelf: "flex-start",
            }}
          ></div>
          <Grid item xs={12} sm={12} md={10} lg={10}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Typography
                style={{
                  ...Title,
                  padding: "",
                  fontSize: "14px",
                  width: "100%",
                  textWrap: "pretty",
                }}
              >
                <span
                  style={{
                    marginRight: "5px",
                    fontSize: "18px",
                    alignSelf: "baseline",
                  }}
                >
                  <InformationIcon />
                </span>
                &nbsp;
                {title}
              </Typography>
              <Typography
                onClick={() => setNotificationStatus(false)}
                style={{
                  cursor: "pointer",
                  fontWeight: 900,
                  height: "15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CloseIcon />
              </Typography>
            </div>

            <Typography
              style={{
                ...Subtitle,
                fontSize: "14px",
                width: "100%",
                textWrap: "pretty",
              }}
            >
              {body}
            </Typography>
          </Grid>
        </Grid>
        <Grid
          sx={{
            ...CenteringGrid,
            justifyContent: "flex-start",
            padding: {
              sx: "1rem 0",
              sm: "1rem 0",
              md: "1rem 0 0 0.5rem",
              lg: "1rem 0 0 0.5rem",
            },
            cursor: "pointer",
          }}
          item
          xs={12}
          sm={12}
          md={10}
          lg={10}
        >
          {/* <div
            onClick={() => setNotificationStatus(false)}
            style={{
              color: "var(--blue700)",
              fontWeight: 900,
              height: "15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          ></div>
          &nbsp; */}
          <Typography
            onClick={() => setNotificationStatus(false)}
            style={{ color: "var(--blue700)", alignContent: "baseline" }}
          >
            <button
              key={"button-dismiss"}
              id="button-dismiss"
              className="transparentButton"
            >
              <BorderedCloseIcon
                fill="var(--blue700)"
                style={{
                  alignSelf: "baseline",
                  height: "15px",
                }}
              />
            </button>
            &nbsp; <span style={{ height:"fit-content", alignSelf:"flex-start" }}>Dismiss the notification</span>
          </Typography>
        </Grid>
      </Grid>
    </Card>
  );
};

export default BannerNotificationTemplate;
