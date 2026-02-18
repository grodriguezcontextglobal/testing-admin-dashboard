import { Grid } from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Card } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import UXDropdown from "../../../../../components/UX/dropdown/DropDownComponent";
import SingleEmailNotification from "../../../../../components/notification/email/SingleEmail";
import { CardStyle } from "../../../../../styles/global/CardStyle";
import AuthorizedTransaction from "./actions/transactions/AuthorizedTransaction";
import CashTransaction from "./actions/transactions/CashTransaction";
import ChargedTransaction from "./actions/transactions/ChargedTransaction";
import FreeTransaction from "./actions/transactions/FreeTransaction";
import ServicesTransaction from "./actions/transactions/ServicesTransaction";
import ConsumerDetails from "./details/ConsumerDetails";

const options = [
  {
    label: "Authorization",
    value: "0",
  },
  {
    label: "Cash",
    value: "2",
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
  const handleSelect = (option) => {
    const key = option.value;
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
    "only screen and (min-width : 769px) and (max-width : 992px)",
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
              // icon={<WhiteCirclePlusIcon hoverStroke="#155EEF" stroke="#fff" />}
            />
            {event?.eventInfoDetail?.merchant && (
              <UXDropdown
                options={options}
                onSelect={handleSelect}
                placement="top-center"
                variant="primary"//"outline" // | "ghost" | "primary""
                renderTrigger={({ onClick, ref }) => (
                  <div ref={ref} style={{ display: "inline-block" }}>
                    <BlueButtonComponent
                      buttonType="button"
                      disabled={!event.active}
                      title={"Create a new paid transaction"}
                      func={onClick}
                      size="lg"
                    />
                  </div>
                )}
                style={{ width: "100%" }}
              />
            )}
            {event?.extraServicesNeeded && (
              <BlueButtonComponent
                disabled={!event.active}
                func={() => setExtraServiceNeeded(true)}
                title="Services"
              />
            )}
            <BlueButtonComponent
              disabled={!event.active}
              func={() => setNotificationActivation(true)}
              title="Email notification"
              buttonType="button"
              styles={{ width: "100%" }}
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
