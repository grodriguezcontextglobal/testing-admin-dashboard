import { Grid } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Card, Dropdown } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import { EmailIcon } from "../../../../../components/icons/EmailIcon";
import { WhiteCirclePlusIcon } from "../../../../../components/icons/WhiteCirclePlusIcon";
import SingleEmailNotification from "../../../../../components/notification/email/SingleEmail";
import { CardStyle } from "../../../../../styles/global/CardStyle";
import AuthorizedTransaction from "./actions/transactions/AuthorizedTransaction";
import CashTransaction from "./actions/transactions/CashTransaction";
import ChargedTransaction from "./actions/transactions/ChargedTransaction";
import FreeTransaction from "./actions/transactions/FreeTransaction";
import ServicesTransaction from "./actions/transactions/ServicesTransaction";
import ConsumerDetails from "./details/ConsumerDetails";
import Vertical3Dots from "../../../../../components/icons/Vertical3Dots";

const items = [
  {
    label: "Authorization",
    key: "0",
  },
  {
    label: "Cash",
    key: "2",
  },
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
  const [extraServiceNeeded, setExtraServiceNeeded] = useState(false);
  const { customer } = useSelector((state) => state.customer);

  const handleDeviceForFree = () => {
    setCreateTransactionForNoRegularUser(true);
  };
  const onClick = ({ key }) => {
    if (key === "0") {
      return setCreateTransactionPaid(true);
    } else if (key === "1") {
      return setCreateTransactionChargeOption(true);
    } else if (key === "2") {
      return setCreateTransactionInCash(true);
    } else {
      return setExtraServiceNeeded(true);
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
      // height={"10rem"}
      margin={"0.5rem auto 1rem"}
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
        alignSelf={"flex-start"}
        alignItems={"center"}
        item
        xs={12}
        sm={12}
        md={6}
        lg={6}
      >
        <ConsumerDetails props={customer} />
      </Grid>
      <Grid
        padding={"0px"}
        display={"flex"}
        justifyContent={"flex-end"}
        textAlign={"left"}
        alignSelf={"flex-start"}
        alignItems={"flex-end"}
        marginBottom={`${isSmallDevice || isMediumDevice ? "3dvh" : "0"}`}
        item
        xs={12}
        sm={12}
        md={5}
        lg={5}
      >
        <Card
          id="card-contact-person"
          style={CardStyle}
          styles={{
            body: {
              padding: "24px 0 24px 24px ",
            },
          }}
        >
          <Grid
            display={"flex"}
            flexDirection={"column"}
            justifyContent={"flex-start"}
            textAlign={"right"}
            alignItems={"center"}
            gap={1}
            item
            xs={12}
            sm={12}
            md={12}
          >
            <BlueButtonComponent
              disabled={!event.active}
              func={() => handleDeviceForFree()}
              styles={{ width: "100%" }}
              buttonType="button"
              title={"Create a new free transaction"}
              icon={<WhiteCirclePlusIcon hoverStroke="#155EEF" stroke="#fff" />
              }
            />
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
                <BlueButtonComponent disabled={!event.active} title="Create a new paid transaction" buttonType="button" styles={{ width: "100%" }} icon={<WhiteCirclePlusIcon hoverStroke="#155EEF" stroke="#fff" />} />
              </Dropdown>
            )}
            {event?.extraServicesNeeded && (
              <BlueButtonComponent
                disabled={!event.active}
                func={() => setExtraServiceNeeded(true)}
                title="Services"
                icon={<Vertical3Dots stroke="#fff" hoverStroke="#155EEF" width="20" height="18" />}
              />
              // <Button
              //   disabled={!event.active}
              //   style={{
              //     ...BlueButton,
              //     width: "100%",
              //   }}
              //   onClick={() => setExtraServiceNeeded(true)}
              // >
              //   <Typography
              //     textTransform={"none"}
              //     style={{
              //       ...BlueButtonText,
              //       textAlign: "left",
              //       padding: "0px 10px 0px 15px",
              //       ...CenteringGrid,
              //     }}
              //   >
              //     Services
              //   </Typography>
              // </Button>
            )}
            <BlueButtonComponent
              disabled={!event.active}
              func={() => setNotificationActivation(true)}
              title="Email notification"
              buttonType="button"
              styles={{ width: "100%" }}
              icon={<EmailIcon style={{ marginRight: "0.25rem", alignSelf: "baseline" }} width="20" height="18" />}
            />
          </Grid>
        </Card>
      </Grid>
      {createTransactionForNoRegularUser && (
        <FreeTransaction
          createTransactionForNoRegularUser={createTransactionForNoRegularUser}
          setCreateTransactionForNoRegularUser={
            setCreateTransactionForNoRegularUser
          }
          sendObjectIdUser={window.location.pathname.split("/").at(-1)}
        />
      )}

      {createTransactionPaid && (
        <AuthorizedTransaction
          createTransactionPaid={createTransactionPaid}
          setCreateTransactionPaid={setCreateTransactionPaid}
        />
      )}
      {createTransactionChargeOption && (
        <ChargedTransaction
          createTransactionChargeOption={createTransactionChargeOption}
          setCreateTransactionChargeOption={setCreateTransactionChargeOption}
        />
      )}
      {notificationActivation && (
        <SingleEmailNotification
          customizedEmailNotificationModal={notificationActivation}
          setCustomizedEmailNotificationModal={setNotificationActivation}
        />
      )}
      {createTransactionInCash && (
        <CashTransaction
          openCashTransaction={createTransactionInCash}
          setOpenCashTransaction={setCreateTransactionInCash}
        />
      )}
      {extraServiceNeeded && (
        <ServicesTransaction
          setExtraServiceNeeded={setExtraServiceNeeded}
          extraServiceNeeded={extraServiceNeeded}
        />
      )}
    </Grid>
  );
};

export default FormatAttendeeDetailInfo;
