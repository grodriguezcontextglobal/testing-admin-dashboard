import { useState } from "react";
import { useSelector } from "react-redux";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import SingleEmailNotification from "../../../../../components/notification/email/SingleEmail";
import AuthorizedTransaction from "./actions/transactions/AuthorizedTransaction";
import CashTransaction from "./actions/transactions/CashTransaction";
import ChargedTransaction from "./actions/transactions/ChargedTransaction";
import FreeTransaction from "./actions/transactions/FreeTransaction";
import ServicesTransaction from "./actions/transactions/ServicesTransaction";
import MainHeaderComponent from "./ux/MainHeaderComponent";
import Dropdown from "../../../../../components/UX/dropdown/DropDownComponent";

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
  // const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  // const isMediumDevice = useMediaQuery(
  //   "only screen and (min-width : 769px) and (max-width : 992px)",
  // );

  const actions = (
    <>
      <BlueButtonComponent
        disabled={!event.active}
        func={() => handleDeviceForFree()}
        styles={{ width: "100%" }}
        buttonType="button"
        title={"Create a new free transaction"}
      />
      {event?.eventInfoDetail?.merchant && (
        <Dropdown
          options={options}
          onSelect={handleSelect}
          placement="top-center"
          variant="primary"
          renderTrigger={({ onClick, ref }) => (
            <div ref={ref} style={{ display: "inline-block", width: "100%" }}>
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
    </>
  );

  return (
    <>
      <MainHeaderComponent consumer={customer} actions={actions} />
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
          extraServiceNeeded={extraServiceNeeded}
          setExtraServiceNeeded={setExtraServiceNeeded}
        />
      )}
    </>
  );
};

export default FormatAttendeeDetailInfo;
