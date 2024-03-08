import { useState } from "react";
import { Grid, Typography } from "@mui/material";
import { Card, Tooltip } from "antd";
import { useSelector } from "react-redux";
// import "../FormatEventDetailInfo.css";
import { Icon } from "@iconify/react";
import UpdateEventContactInfo from "../../updateEvent/UpdateEventContactInfo";
// import UpdateEventContactInfo from "./updateEvent/UpdateEventContactInfo";

const ContactInformation = () => {
    const { event } = useSelector((state) => state.event);
    const [openUpdateEventModal, setOpenUpdateEventModal] = useState(false);
    const renderTitle = () => {
        return (
            <Typography
                textAlign={"left"}
                fontFamily={"Inter"}
                fontSize={"18px"}
                fontStyle={"normal"}
                fontWeight={600}
                lineHeight={"28px"}
                color={"var(--gray-900, #101828)"}
            >
                Point of contact
            </Typography>
        );
    };
    return (
        <>
            <Card
                title={renderTitle()}
                extra={event?.active &&
                    <Tooltip title="Update this section of the event">
                        <Icon
                            onClick={() => setOpenUpdateEventModal(true)}
                            icon="uil:ellipsis-v"
                            width={25}
                        />
                    </Tooltip>
                }
                style={{
                    border: "none"
                }}
                styles={{
                    border: "none",
                    header: {
                        borderBottom: "transparent",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0 24px 0 0",
                        background: "var(--main-background-color)",
                        border: "none"
                    },
                    body: {
                        borderRadius: "12px",
                        border: "none",
                        background: "var(--main-background-color)",
                        boxShadow: "none",
                        textAlign: "left",
                        width: "100%",
                        padding: 0
                    },
                    cover: {
                        border: 'none'
                    }
                }}
            // headStyle={{
            //     borderBottom: "transparent",

            //     display: "flex",
            //     justifyContent: "space-between",
            //     alignItems: "center",
            //     padding: "0 24px 0 0",
            //     background: "var(--main-background-color)",
            // }}
            // bodystyle={{
            //     borderRadius: "12px",
            //     border: "none",
            //     background: "var(--main-background-color)",
            //     boxShadow: "none",
            //     textAlign: "left",
            //     width: "100%",
            //     padding: 0
            // }}
            >
                <Grid
                    display={"flex"}
                    justifyContent={"space-around"}
                    alignItems={"center"}
                    container
                >
                    <Grid
                        display={"flex"}
                        justifyContent={"left"}
                        textAlign={"left"}
                        alignItems={"center"}
                        item
                        xs={12}
                    >
                        <Typography
                            textAlign={"left"}
                            paddingTop={"8px"}
                            fontFamily={"Inter"}
                            fontSize={"18px"}
                            fontStyle={"normal"}
                            fontWeight={400}
                            lineHeight={"28px"}
                            color={"var(--gray-900, #101828)"}
                        >
                            {event?.contactInfo?.name}
                        </Typography>
                    </Grid>
                    <Grid
                        display={"flex"}
                        flexDirection={"column"}
                        justifyContent={"flex-start"}
                        textAlign={"left"}
                        alignItems={"center"}
                        item
                        xs={12}
                    >
                        <Typography
                            style={{
                                width: "100%",
                            }}
                            textAlign={"left"}
                            paddingTop={"8px"}
                            fontFamily={"Inter"}
                            fontSize={"16px"}
                            fontStyle={"normal"}
                            fontWeight={600}
                            lineHeight={"24px"}
                            color={"var(--gray-600, #475467)"}
                        >
                            Contact
                        </Typography>
                        <Typography
                            style={{
                                width: "100%",
                            }}
                            textAlign={"left"}
                            paddingTop={"8px"}
                            fontFamily={"Inter"}
                            fontSize={"16px"}
                            fontStyle={"normal"}
                            fontWeight={400}
                            lineHeight={"24px"}
                            color={"var(--gray-600, #475467)"}
                        >
                            {event?.contactInfo?.email}
                        </Typography>
                        <Typography
                            style={{
                                width: "100%",
                            }}
                            textAlign={"left"}
                            paddingTop={"8px"}
                            fontFamily={"Inter"}
                            fontSize={"16px"}
                            fontStyle={"normal"}
                            fontWeight={400}
                            lineHeight={"24px"}
                            color={"var(--gray-600, #475467)"}
                        >
                            {event?.contactInfo?.phone?.map((item) => {
                                return <span key={item}>m: {item}<br /></span>;
                            })}
                        </Typography>{" "}
                    </Grid>
                </Grid>
            </Card >
            {openUpdateEventModal && openUpdateEventModal && <UpdateEventContactInfo
                openUpdateEventModal={openUpdateEventModal}
                setOpenUpdateEventModal={setOpenUpdateEventModal}
                title={"Update contact info"}
            />}
        </>

    );
};

export default ContactInformation;