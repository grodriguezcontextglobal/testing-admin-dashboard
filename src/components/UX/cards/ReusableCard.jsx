import { Grid, Typography } from "@mui/material";
import { Card } from "antd";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Subtitle } from "../../../styles/global/Subtitle";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";

const ReusableCard = ({ title, props, onClick=null, children, style = {}, cardStyle = {} }) => {
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  return (
      <Grid
        padding={'0 0 10px'}
        item
        xs={12}
        // style={style}
      >
        <Card
          style={{
            ...style,
            borderRadius: "12px",
            border: "1px solid var(--gray-200, #EAECF0)",
            background: "var(--base-white, #FFF)",
            boxShadow:
              "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
            ...cardStyle
          }}
          onClick={onClick}
        >
          <Grid
            display={"flex"}
            justifyContent={"space-around"}
            alignItems={"center"}
            container
          >
            {title && (
            <Grid
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              item
              xs={12}
            >
              <Typography
                textAlign={`${(isSmallDevice || isMediumDevice) && "left"}`}
                style={{ ...Subtitle, textWrap: 'nowrap' }}
              >
                {title}
              </Typography>
            </Grid>
            )}
          </Grid>
          <Grid container>
            <Grid
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              item
              xs={12}
            >
              {children ? children : (
                <Typography
                  paddingTop={"8px"}
                  style={{ ...TextFontSize30LineHeight38}}
                >
                  {props}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Card>
      </Grid>
      )
};

export default ReusableCard;