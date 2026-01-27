import { Grid, Typography } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Card } from "antd";

const ReusableCardWithFooter = ({
  title,
  children,
  style = {},
  actions = [],
  onClick = null,
}) => {
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)",
  );
  const { subtitle, textFontSize30LineHeight38 } = style;
  return (
    <Card
      style={{
        borderRadius: "12px",
        border: "1px solid var(--gray-200, #EAECF0)",
        background: "var(--base-white, #FFF)",
        boxShadow:
          "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
      }}
      onClick={onClick}
      actions={actions}
    >
      <Grid
        display={"flex"}
        justifyContent={"space-around"}
        alignItems={"center"}
        container
      >
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          item
          xs={12}
        >
          <Typography
            textAlign={`${(isSmallDevice || isMediumDevice) && "left"}`}
            style={{ ...subtitle, textWrap: "nowrap" }}
          >
            {title}
          </Typography>
        </Grid>
      </Grid>
      <Grid container>
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          item
          xs={12}
        >
          <Typography
            paddingTop={"8px"}
            style={{ ...textFontSize30LineHeight38 }}
          >
            {children}
          </Typography>
        </Grid>
      </Grid>
    </Card>
  );
};

export default ReusableCardWithFooter;
