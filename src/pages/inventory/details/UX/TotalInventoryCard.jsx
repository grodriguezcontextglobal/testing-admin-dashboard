import { Grid } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Card, Typography } from "antd";
import { Subtitle } from "../../../../styles/global/Subtitle";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";

const TotalInventoryCard = ({props}) => {
    const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
    const isMediumDevice = useMediaQuery(
        "only screen and (min-width : 769px) and (max-width : 992px)"
    );

    return (
        <Grid padding={`${isSmallDevice || isMediumDevice ? "10px 0px" : "10px"}`} item xs={12} sm={12} md={12}>
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
                        {/* Total value of devices at location */}
                        <Typography
                            style={{ ...Subtitle, fontWeight: 500 }}
                        >
                            Total device
                        </Typography>
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid
                        display={"flex"}
                        justifyContent={"flex-start"}
                        alignItems={"center"}
                        item
                        xs={122}
                    >
                        <Typography
                            paddingTop={"8px"}
                            style={TextFontSize30LineHeight38}>
                            {props} devices
                        </Typography>
                    </Grid>
                </Grid>
            </Card>
        </Grid>
    );
};


export default TotalInventoryCard