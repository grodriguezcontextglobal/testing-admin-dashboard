import { Icon } from "@iconify/react";
import { Button, Grid, InputAdornment, OutlinedInput, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Divider } from "antd";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import Loading from "../../../../components/animation/Loading";
import { MagnifyIcon } from "../../../../components/icons/MagnifyIcon";
import { WhitePlusIcon } from "../../../../components/icons/WhitePlusIcon";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import EventInventoryTable from "./table/EventInventoryData";

const MainPage = () => {
    const event_id = new URLSearchParams(window.location.search).get(
        "event_id"
    );
    const trackingHistoryItemQuery = useQuery({
        queryKey: ["listOfItemsInStock"],
        queryFn: () => devitrakApi.post(`/db_item/inventory_event/${event_id}`),
    });
    // const [openDeviceModal, setOpenDeviceModal] = useState(false);
    const { register } = useForm();
    // const dispatch = useDispatch();
    const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
    const isMediumDevice = useMediaQuery(
        "only screen and (min-width : 769px) and (max-width : 992px)"
    );
    const isLargeDevice = useMediaQuery(
        "only screen and (min-width : 993px) and (max-width : 1200px)"
    );
    const isExtraLargeDevice = useMediaQuery(
        "only screen and (min-width : 1201px)"
    );
    if (trackingHistoryItemQuery.isLoading) return <div style={CenteringGrid}><Loading /></div>
    if (trackingHistoryItemQuery.data) {
        const dataFound = trackingHistoryItemQuery?.data?.data?.result
        return (

            <Grid
                style={{
                    padding: "5px",
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                }}
                container
            >
                    <Grid
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                        marginTop={5}
                        container
                    >
                        <Grid
                            textAlign={"right"}
                            display={`${(isLargeDevice || isExtraLargeDevice) ? "none" : "flex"}`}
                            justifyContent={"flex-end"}
                            alignItems={"center"}
                            gap={1}
                            item
                            xs={12}
                            sm={12}
                        >
                            <Button
                                style={{ ...BlueButton }}
                                // onClick={() => setOpenDeviceModal(true)}
                            >
                                <WhitePlusIcon />&nbsp; <Typography
                                    textTransform={"none"}
                                    style={BlueButtonText}
                                > Add new group of devices </Typography>
                            </Button>
                        </Grid>
                        <Grid marginY={0} item xs={12} sm={12} md={6}>
                            <Typography
                                textTransform={"none"}
                                style={{
                                    color: "var(--gray-900, #101828)",
                                    lineHeight: "38px",
                                }}
                                textAlign={"left"}
                                fontWeight={600}
                                fontFamily={"Inter"}
                                fontSize={"30px"}
                            >
                                Devices
                            </Typography>
                        </Grid>
                        <Grid
                            textAlign={"right"}
                            display={`${(isSmallDevice || isMediumDevice) ? "none" : "flex"}`}
                            justifyContent={"flex-end"}
                            alignItems={"center"}
                            gap={1}
                            item
                            md={6}
                        >
                            <Button
                                style={{ ...BlueButton }}
                                // onClick={() => setOpenDeviceModal(true)}
                            >
                                <WhitePlusIcon />&nbsp; <Typography
                                    textTransform={"none"}
                                    style={BlueButtonText}
                                > Add new group of devices </Typography>
                            </Button>
                        </Grid>
                    </Grid>
                    <Grid
                        style={{
                            paddingTop: "0px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                        container
                        marginTop={4}
                    >
                        <Grid marginY={0} item xs={12} sm={12} md={8}>
                            <Grid
                                display={"flex"}
                                justifyContent={"flex-start"}
                                alignItems={"center"}
                                item
                                xs={12}
                            >
                                <Link to="/inventory">
                                    <Typography
                                        display={"flex"}
                                        justifyContent={"flex-start"}
                                        alignItems={"center"}
                                        textTransform={"none"}
                                        textAlign={"left"}
                                        fontWeight={600}
                                        fontSize={"18px"}
                                        fontFamily={"Inter"}
                                        lineHeight={"28px"}
                                        color={"var(--blue-dark-600, #155EEF)"}
                                    // onClick={() => dispatch(onResetDeviceInQuickGlance())}
                                    >
                                        Back
                                    </Typography>
                                </Link>
                                <Typography
                                    display={"flex"}
                                    justifyContent={"flex-start"}
                                    alignItems={"center"}
                                    textTransform={"none"}
                                    textAlign={"left"}
                                    fontWeight={600}
                                    fontSize={"18px"}
                                    fontFamily={"Inter"}
                                    lineHeight={"28px"}
                                    color={"var(--gray-900, #101828)"}
                                >
                                    <Icon icon="mingcute:right-line" />
                                    {dataFound[0]?.event_name}{" "}
                                </Typography>
                            </Grid>
                        </Grid>
                        <Grid textAlign={"right"} item xs={4}></Grid>
                    </Grid>
                    <Divider />
                    <Grid
                        marginY={3}
                        display={"flex"}
                        justifyContent={"flex-start"}
                        alignItems={"center"}
                        gap={1}
                        container
                    >

                        <Grid
                            display={'flex'}
                            justifyContent={"flex-end"}
                            alignItems={"center"}
                            item
                            xs={12}
                            sm={12}
                            md={12}
                        >
                            <OutlinedInput
                                {...register("searchDevice")}
                                fullWidth
                                placeholder="Search devices here"
                                style={OutlinedInputStyle}
                                startAdornment={
                                    <InputAdornment position="start">
                                        <MagnifyIcon />
                                    </InputAdornment>
                                }
                            />
                        </Grid>
                    </Grid>
                    <Grid container>
                        <Grid
                            display={"flex"}
                            justifyContent={"center"}
                            alignItems={"center"}
                            item
                            xs={12}
                        >
                            <EventInventoryTable dataFound={dataFound} />
                        </Grid>
                    </Grid>
                {/* </Grid> */}
            </Grid>

        )
    }

}

export default MainPage