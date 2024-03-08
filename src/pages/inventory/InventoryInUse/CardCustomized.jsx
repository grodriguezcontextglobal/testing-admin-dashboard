import { Icon } from '@iconify/react';
import { Grid, Typography } from '@mui/material';
import { useMediaQuery } from '@uidotdev/usehooks';
import { Card } from 'antd';

const CardCustomized = ({ title, props }) => {
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
                            fontSize={"14px"}
                            fontStyle={"normal"}
                            fontWeight={500}
                            lineHeight={"20px"}
                            color={"var(--gray-600, #475467)"}
                        >
                            {title}
                        </Typography>
                        <span
                            style={{
                                borderRadius: "16px",
                                justifyContent: "center",
                                display: "flex",
                                padding: "2px 8px",
                                alignItems: "center",
                                background: `${props.activity === "LOST" || props.activity === "YES"
                                    ? "var(--blue-50, #EFF8FF)"
                                    : "var(--success-50, #ECFDF3)"
                                    }`,
                                width: "fit-content",
                            }}
                        >
                            <Typography
                                color={`${props.activity === "LOST" || props.activity === "YES"
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
                                    color={`${props.activity === "LOST" || props.activity === "YES"
                                        ? "#2E90FA"
                                        : "#12B76A"
                                        }`}
                                />
                                {props.activity === "LOST"
                                    ? "Lost"
                                    : props.activity === "YES"
                                        ? "In Use"
                                        : "In Stock"}
                            </Typography>
                        </span>
                    </Grid>
                </Grid>
                <Grid margin={'20px 0 0 0'} container>
                    <Grid
                        display={"flex"}
                        justifyContent={"flex-start"}
                        alignItems={"center"}
                        item
                        xs={12}
                    >
                        <span
                            style={{
                                alignItems: "center",
                                background: `${String(props.status).toLowerCase() === "operational" ? "var(--blue-50, #EFF8FF)" : "#ffefef"
                                    }`,
                                borderRadius: "16px",
                                display: "flex",
                                justifyContent: "center",
                                padding: "2px 8px",
                                width: "fit-content",
                            }}
                        >
                            <Typography
                                color={`${String(props.status).toLowerCase() === "operational" ? "var(--blue-700, #175CD3)" : "#d31717"
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
                                    color={`${String(props.status).toLowerCase() === "operational" ? "#2E90FA" : "#d31717"}`}
                                />
                                {props.status}
                            </Typography>
                        </span>
                    </Grid>
                </Grid>
            </Card>
        </Grid>
    );
};

export default CardCustomized