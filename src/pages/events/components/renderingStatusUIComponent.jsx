import { Grid, Typography } from "@mui/material"
import CenteringGrid from "../../../styles/global/CenteringGrid"
import { RightBlueNarrow } from "../../../components/icons/RightBlueNarrow"

const renderingStatusUIComponent = ({ props, quickGlance }) => {
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
          cursor: "pointer",
        }}
        onClick={() => quickGlance(props)}
      >
        View event details &nbsp;
        <RightBlueNarrow />
      </Typography>
    </Grid>
  )
}

export default renderingStatusUIComponent
