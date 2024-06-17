import { Icon } from "@iconify/react";
import { Grid, Typography } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Card } from "antd";

const CardRendered = ({ props, title, optional }) => {
    const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
    const isMediumDevice = useMediaQuery(
        "only screen and (min-width : 769px) and (max-width : 992px)"
    );
    const isLargeDevice = useMediaQuery(
        "only screen and (min-width : 993px) and (max-width : 1200px)"
    );
    return (
        <Grid
            padding={`${isSmallDevice || isMediumDevice || isLargeDevice
                ? "10px 0px"
                : "10px 10px 10px 0"
                }`}
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
                        justifyContent={"space-between"}
                        alignItems={"center"}
                        item
                        xs={12}
                    >
                        <Typography
                            textAlign={`${(isSmallDevice || isMediumDevice) && "left"}`}
                            fontFamily={"Inter"}
                            fontSize={"12px"}
                            fontStyle={"normal"}
                            fontWeight={500}
                            lineHeight={"18px"}
                            color={"var(--gray-600, #475467)"}
                            
                        >
                            {title}
                        </Typography>
                        {optional !== null && <span
                            style={{
                                borderRadius: "16px",
                                justifyContent: "center",
                                display: "flex",
                                padding: "2px 8px",
                                alignItems: "center",
                                background: `${!optional
                                    ? "var(--blue-50, #EFF8FF)"
                                    : "var(--success-50, #ECFDF3)"
                                    }`,
                                width: "fit-content",
                            }}
                        >
                            <Typography
                                color={`${!optional
                                    ? "var(--blue-700, #175CD3)"
                                    : "var(--success-700, #027A48)"
                                    }`}
                                fontSize={"12px"}
                                fontFamily={"Inter"}
                                fontStyle={"normal"}
                                fontWeight={500}
                                lineHeight={"18px"}
                                textAlign={"center"}
                                textTransform={"capitalize"}
                            >
                                <Icon
                                    icon="tabler:point-filled"
                                    rotate={3}
                                    color={`${!optional
                                        ? "#2E90FA"
                                        : "#12B76A"
                                        }`}
                                />
                                {!optional
                                    ? "In Use"
                                    : "In Stock"}
                            </Typography>
                        </span>}
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
                            textAlign={"left"}
                            style={{
                                textOverflow: "ellipsis"
                            }}
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