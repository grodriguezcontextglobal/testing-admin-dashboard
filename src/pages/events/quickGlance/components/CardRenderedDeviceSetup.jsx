import { Grid, Typography } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Card } from "antd";
import { Subtitle } from "../../../../styles/global/Subtitle";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import { DropDownIcon } from "../../../../components/icons/Icons";
import ModalAddAndUpdateDeviceSetup from "./ModalAddAndUpdateDeviceSetup";
import { useState } from "react";
const CardRendered = ({ props, title }) => {
    const [openModalDeviceSetup, setOpenModalDeviceSetup] = useState(false)
    const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
    const isMediumDevice = useMediaQuery(
        "only screen and (min-width : 769px) and (max-width : 992px)"
    );
    const handleOpenModal = () => {
        return setOpenModalDeviceSetup(true)
    }
    return (
        <>
            <Grid
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
                        cursor: "pointer"
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
                                style={{ ...Subtitle, textWrap: 'nowrap' }}
                            >
                                {title}
                            </Typography>
                            <p onClick={() => handleOpenModal()}><DropDownIcon /></p>
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
                                style={TextFontSize30LineHeight38}
                            >
                                {props}
                            </Typography>
                        </Grid>
                    </Grid>
                </Card>
            </Grid>
            {openModalDeviceSetup &&
                <ModalAddAndUpdateDeviceSetup openModalDeviceSetup={openModalDeviceSetup} setOpenModalDeviceSetup={setOpenModalDeviceSetup} deviceTitle={title} quantity={props} />
            }
        </>
    );
};

export default CardRendered