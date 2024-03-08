import { Grid, Typography } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Card } from "antd";

const CardRendered = ({props, title}) => {
    const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
    const isMediumDevice = useMediaQuery(
      "only screen and (min-width : 769px) and (max-width : 992px)"
    );
    // const isLargeDevice = useMediaQuery(
    //   "only screen and (min-width : 993px) and (max-width : 1200px)"
    // );
    return (
      <Grid
        // padding={`${
        //   isSmallDevice || isMediumDevice || isLargeDevice
        //     ? "10px 0px"
        //     : "10px 10px 10px 0"
        // }`}
        padding={'0 0 10px'}
        item
        xs={12}
      >
        <Card
          style={{
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
              justifyContent={"flex-start"}
              alignItems={"center"}
              item
              xs={12}
            >
              <Typography
                textAlign={`${(isSmallDevice || isMediumDevice) && "left"}`}
                fontFamily={"Inter"}
                fontSize={"14px"}
                fontStyle={"normal"}
                fontWeight={500}
                lineHeight={"20px"}
                color={"var(--gray-600, #475467)"}
                style={{textWrap:'nowrap'}}
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
                fontFamily={"Inter"}
                fontSize={"30px"}
                fontStyle={"normal"}
                fontWeight={600}
                lineHeight={"38px"}
                color={"var(--gray-900, #101828)"}
              >
                {props}
              </Typography>
            </Grid>
          </Grid>
        </Card>
      </Grid>
    );
  };

export default CardRendered