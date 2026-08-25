import { Grid } from "@mui/material"
import { RightBlueNarrow } from "../../../components/icons/RightBlueNarrow"
import "../../../components/UX/buttons/text_link.css"

const renderingStatusUIComponent = ({ props, quickGlance }) => {
  const activate = () => quickGlance(props);

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
      {/* Plain span with the text-link styling, not the TextLink component
          (which renders a <button>). Kept keyboard/screen-reader operable with
          role + tabIndex + onKeyDown rather than reintroducing the <button>. */}
      <span
        className="customized__textLink"
        role="button"
        tabIndex={0}
        onClick={activate}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            activate();
          }
        }}
        style={{ padding: "16px 24px" }}
      >
        View event details &nbsp;
        <RightBlueNarrow />
      </span>
    </Grid>
  )
}

export default renderingStatusUIComponent
