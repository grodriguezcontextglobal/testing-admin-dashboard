import { Grid } from "@mui/material"
import TextLink from "../../../components/UX/buttons/TextLink"
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
      <TextLink
        onClick={() => quickGlance(props)}
        style={{ padding: "16px 24px" }}
      >
        View event details &nbsp;
        <RightBlueNarrow />
      </TextLink>
    </Grid>
  )
}

export default renderingStatusUIComponent
