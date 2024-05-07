import { Icon } from "@iconify/react";
import { Grid, Typography } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Button, Card, Dropdown } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import { EmailIcon } from "../../../../../components/icons/Icons";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import { CardStyle } from "../../../../../styles/global/CardStyle";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import AuthorizedTransaction from "./actions/transactions/AuthorizedTransaction";
import CashTransaction from "./actions/transactions/CashTransaction";
import ChargedTransaction from "./actions/transactions/ChargedTransaction";
import FreeTransaction from "./actions/transactions/FreeTransaction";
import ConsumerDetails from "./details/ConsumerDetails";
import SingleEmailNotification from "../../../../../components/notification/email/SingleEmail";
// import "../../Events/quickGlance/FormatEventDetailInfo.css";
// import { ModalCreateTransactionForNoRegularUser } from "../transactionOptions/ModalCreateTransactionForNoRegularUser";
// import { ModalPaidTransaction } from "../transactionOptions/ModalPaidTransaction";
// import { ModalPaidTransactionChargeOption } from "../transactionOptions/ModalPaidTransactionChargeOption";
// import ModalCashDepositTransaction from "../transactionOptions/ModalCashDepositTransaction";

const items = [
    {
        label: "Authorization",
        key: "0",
    },
    {
        label: "Charge",
        key: "1",
    },
    {
        label: "Cash",
        key: "2"
    }
];

const FormatAttendeeDetailInfo = () => {
    const { event } = useSelector((state) => state.event);
    const [notificationActivation, setNotificationActivation] = useState(false);
    const [createTransactionPaid, setCreateTransactionPaid] = useState(false);
    const [createTransactionInCash, setCreateTransactionInCash] = useState(false);
    const [createTransactionChargeOption, setCreateTransactionChargeOption] =
        useState(false);
    const [
        createTransactionForNoRegularUser,
        setCreateTransactionForNoRegularUser,
    ] = useState(false);

    const { customer } = useSelector((state) => state.customer);

    const handleDeviceForFree = () => {
        setCreateTransactionForNoRegularUser(true);
    };
    const onClick = ({ key }) => {
        if (key === "0") {
            return setCreateTransactionPaid(true);
        } else if (key === "1") {
            return setCreateTransactionChargeOption(true);
        } else {
            return setCreateTransactionInCash(true)
        }
    };
    const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
    const isMediumDevice = useMediaQuery(
        "only screen and (min-width : 769px) and (max-width : 992px)"
    );
    return (
        <Grid
            display={"flex"}
            flexDirection={`${isSmallDevice || isMediumDevice ? "column" : "row"}`}
            justifyContent={"space-between"}
            alignItems={"center"}
            height={"10rem"}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
        >
            <Grid
                padding={"0px"}
                display={"flex"}
                justifyContent={"flex-start"}
                textAlign={"left"}
                alignSelf={'flex-start'}
                alignItems={"center"}
                item
                xs={12}
                sm={12}
                md={6}
            >
                <ConsumerDetails props={customer} />
            </Grid>
            <Grid
                padding={"0px"}
                display={"flex"}
                justifyContent={"flex-end"}
                textAlign={"left"}
                alignSelf={'flex-start'}
                alignItems={"flex-end"}
                marginBottom={`${isSmallDevice || isMediumDevice ? "3dvh" : "0"}`}
                item
                xs={12}
                sm={12}
                md={5}
            >
                <Card
                    id="card-contact-person"
                    style={CardStyle}
                    styles={{
                        body:{
                            padding: "24px 0 24px 24px "
                        }
                    }}
                    // bodyStyle={{
                    //     padding: "24px 0 24px 24px "
                    // }}
                >
                    <Grid
                        display={"flex"}
                        flexDirection={'column'}
                        justifyContent={"flex-start"}
                        textAlign={"right"}
                        alignItems={"center"}
                        gap={1}
                        item
                        xs={12}
                        sm={12}
                        md={12}
                    >
                        <Button
                            disabled={!event.active}
                            style={{
                                ...BlueButton, width: '100%'
                            }}
                            onClick={() => handleDeviceForFree()}
                        >
                            <Typography
                                textTransform={"none"}
                                style={{
                                    ...BlueButtonText,
                                    textAlign: "left",
                                    padding: "0px 10px 0px 15px",
                                    ...CenteringGrid
                                }}
                            >
                                <Icon
                                    icon="simple-line-icons:plus"
                                    width={22}
                                    height={22}
                                />&nbsp; Create a new free transaction
                            </Typography>

                        </Button>
                        {event?.eventInfoDetail?.merchant && (
                            <Dropdown
                                disabled={!event.active}
                                menu={{
                                    items,
                                    onClick,
                                }}
                                placement="bottomLeft"
                                arrow
                                trigger={["click"]}
                            >
                                <Button
                                    disabled={!event.active}
                                    style={{
                                        ...BlueButton, width: '100%'
                                    }}
                                >
                                    <Typography
                                        textTransform={"none"}
                                        style={{
                                            ...BlueButtonText,
                                            textAlign: "left",
                                            padding: "0px 10px 0px 15px",
                                            ...CenteringGrid
                                        }}
                                    >
                                        <Icon icon="guidance:bank" width={22} height={22} />&nbsp;Create a new paid transaction
                                    </Typography>

                                </Button>
                            </Dropdown>
                            // </Tooltip>
                        )}
                        <Button
                            disabled={!event.active}
                            style={{
                                ...BlueButton, width: '100%'
                            }}
                            onClick={() => setNotificationActivation(true)}
                        >
                            <Typography
                                textTransform={"none"}
                                style={{
                                    ...BlueButtonText,
                                    textAlign: "left",
                                    padding: "0px 10px 0px 15px",
                                    ...CenteringGrid
                                }}
                            >
                                <EmailIcon /> Email notification
                            </Typography>
                        </Button>
                    </Grid>
                </Card>
            </Grid>
            {createTransactionForNoRegularUser && <FreeTransaction
                createTransactionForNoRegularUser={createTransactionForNoRegularUser}
                setCreateTransactionForNoRegularUser={
                    setCreateTransactionForNoRegularUser
                }
                sendObjectIdUser={window.location.pathname.split("/").at(-1)}
            />}

            {createTransactionPaid && <AuthorizedTransaction
                createTransactionPaid={createTransactionPaid}
                setCreateTransactionPaid={setCreateTransactionPaid}
            />}
            {createTransactionChargeOption && <ChargedTransaction
                createTransactionChargeOption={createTransactionChargeOption}
                setCreateTransactionChargeOption={setCreateTransactionChargeOption}
            />}
            {notificationActivation && <SingleEmailNotification
                customizedEmailNotificationModal={notificationActivation}
                setCustomizedEmailNotificationModal={setNotificationActivation}
            />}
            {createTransactionInCash &&
                <CashTransaction openCashTransaction={createTransactionInCash} setOpenCashTransaction={setCreateTransactionInCash} />
            }
        </Grid>
    );
};

export default FormatAttendeeDetailInfo;

