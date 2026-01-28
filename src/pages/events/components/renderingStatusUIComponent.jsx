import { Grid, Typography } from "@mui/material"
import { checkStatus } from "../utils/checkStatus"
import { PointFilled } from "../../../components/icons/PointFilled"
import CenteringGrid from "../../../styles/global/CenteringGrid"
import { RightBlueNarrow } from "../../../components/icons/RightBlueNarrow"

const renderingStatusUIComponent = ({ props, quickGlance, checkActiveEvent }) => {
  return (
        <Grid
      key={`grid-card-home-action-footer-${props.id}`}
      item
      xs={12}
      display={"flex"}
      justifyContent={"flex-end"}
      alignItems={"center"}
      textAlign={"right"}
    >
      <Grid
        display={"flex"}
        justifyContent={"flex-start"}
        alignItems={"center"}
        item
        xs={6}
        padding={"0 0 0 18px"}
      >
        <Typography
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            borderRadius: "12px",
            padding: "1px 5px",
            backgroundColor: `${
              checkStatus(
                props.eventInfoDetail.dateBegin,
                props.eventInfoDetail.dateEnd,
                props.active,
              ) === "Upcoming"
                ? "var(--blue-50, #EFF8FF)"
                : "var(--success-50, #ECFDF3)"
            }`,
            color: `${
              checkStatus(
                props.eventInfoDetail.dateBegin,
                props.eventInfoDetail.dateEnd,
                props.active,
              ) === "Upcoming"
                ? "var(--blue-700, #175CD3)"
                : "var(--success-700, #027A48)"
            }`,
          }}
        >
          {checkActiveEvent(props?.active) ? (
            <PointFilled style={{ color: "#12b76a" }} />
          ) : (
            <PointFilled style={{ color: "#D0D5DD" }} />
          )}{" "}
          {checkStatus(
            props.eventInfoDetail.dateBegin,
            props.eventInfoDetail.dateEnd,
            props.active,
          )}
        </Typography>
      </Grid>
      <Grid
        display={"flex"}
        justifyContent={"flex-end"}
        alignItems={"center"}
        item
        xs={6}
      >
        <Typography
          fontFamily={"Inter"}
          fontSize={"14px"}
          fontStyle={"normal"}
          fontWeight={600}
          lineHeight={"20px"}
          color="#004EEB"
          padding={"16px 24px"}
          style={{
            ...CenteringGrid,
            justifyContent: "flex-end",
            width: "100%",
          }}
          onClick={() => quickGlance(props)}
        >
          View event details &nbsp;
          <RightBlueNarrow />
        </Typography>
      </Grid>
    </Grid>

  )
}

export default renderingStatusUIComponent