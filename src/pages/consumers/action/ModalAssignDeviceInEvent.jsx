import { Icon } from "@iconify/react/dist/iconify.js";
import { Grid, InputAdornment, OutlinedInput } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Button, Modal, Select, Spin } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import { ProfileIcon } from "../../../components/icons/ProfileIcon";
import "../../../styles/global/ant-select.css";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { GrayButton } from "../../../styles/global/GrayButton";
import GrayButtonText from "../../../styles/global/GrayButtonText";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import { TextFontSize14LineHeight20 } from "../../../styles/global/TextFontSize14LineHeight20";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import CashDeposit from "./transaction/CashDeposit";
import NoDepositTransaction from "./transaction/NoDeposit";
const ModalAssignDeviceInEvent = ({ assignDevice, setAssignDevice }) => {
  const { customer } = useSelector((state) => state.customer);
  const { user } = useSelector((state) => state.admin);
  const [typeOfTransaction, setTypeOfTransaction] = useState("");
  const [eventSelected, setEventSelected] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [authorizedAmount, setAuthorizedAmount] = useState("");
  const [qty, setQty] = useState("1");
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [triggering, setTriggering] = useState(0);
  const eventsWhereStaffIsAssigned = useQuery({
    queryKey: ["eventsWhereStaffIsAssigned"],
    queryFn: () =>
      devitrakApi.post("/event/staff-all-events", {
        email: user.email,
      }),
    refetchOnMount: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    eventsWhereStaffIsAssigned.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  const closeModal = () => {
    return setAssignDevice(false);
  };

  const sortedByCompany =
    eventsWhereStaffIsAssigned?.data?.data?.events?.filter(
      (item) => item.company_id === user.companyData.id && item.active
    ) ?? [];

  const renderingInventoryOptionsBasedOnSelectedEvent = useCallback(() => {
    if (eventSelected.length > 0) {
      const eventInventory =
        typeof eventSelected === "string"
          ? JSON.parse(eventSelected)
          : eventSelected;
      try {
        if (eventInventory.deviceSetup.length > 0) {
          const inventoryForConsumerUseOnly = eventInventory.deviceSetup.filter(
            (item) => item.consumerUses
          );
          return inventoryForConsumerUseOnly;
        }
      } catch (error) {
        alert(error.message);
      }
    }
    return [];
  }, [eventSelected]);

  const renderingEventOptions = () => {
    return sortedByCompany?.map((item) => ({
      value: JSON.stringify(item),
      label: (
        <p
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            padding: "5px 5px 5px 0px",
          }}
        >
          {item.eventInfoDetail.eventName}
        </p>
      ),
    }));
  };

  const addEventToUserHistory = async () => {
    const companyNameList = new Set();
    const eventsIdList = new Set();
    const companyIdList = new Set();
    const eventNamesList = new Set();
    const eventInfo =
      typeof eventSelected === "string"
        ? JSON.parse(eventSelected)
        : eventSelected;

    [...customer.data.event_providers, eventInfo.id].forEach((item) =>
      eventsIdList.add(item)
    );

    [...customer.data.company_providers, user.companyData.id].forEach((item) =>
      companyIdList.add(item)
    );

    [
      ...customer.data.eventSelected,
      eventInfo.eventInfoDetail.eventName,
    ].forEach((item) => eventNamesList.add(item));

    [...customer.data.provider, eventInfo.company].forEach((item) =>
      companyNameList.add(item)
    );
    const updateConsumerInfo = {
      event_providers: [...Array.from(eventsIdList)],
      company_providers: [...Array.from(companyIdList)],
      eventSelected: [...Array.from(eventNamesList)],
      provider: [...Array.from(companyNameList)],
    };
    await devitrakApi.patch(`/auth/${customer.uid}`, updateConsumerInfo);
  };
  const handleSubmitInformation = async (e) => {
    e.preventDefault();
    try {
      setIsLoadingState(true);
      await addEventToUserHistory();
      if (typeOfTransaction === "Authorized-Deposit") {
        return setTriggering(1);
      } else if (typeOfTransaction === "Cash-Deposit") {  
        return setTriggering(2);
      } else {
        return setTriggering(3);
      }
    } catch (error) {
      setIsLoadingState(false);
      alert(error.message ?? error.error);
    }
  };

  return (
    <Modal
      open={assignDevice}
      onCancel={() => closeModal()}
      centered
      footer={[]}
      style={{ zIndex: 30 }}
    >
      <Grid container>
        <Grid
          display={"flex"}
          flexDirection={"column"}
          justifyContent={"flex-start"}
          alignSelf={"flex-start"}
          margin={"20px 0px 0px"}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                margin: "0 20px 0 0",
              }}
            >
              {[].length > 0 ? (
                <img
                  src={""}
                  alt="profile"
                  style={{
                    verticalAlign: "middle",
                    objectFit: "cover",
                    overflow: "hidden",
                    borderRadius: "50%",
                  }}
                  width={"100%"}
                  height={"100%"}
                />
              ) : (
                <Avatar
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <ProfileIcon />
                </Avatar>
              )}
            </div>
            <h1
              style={{
                ...TextFontSize14LineHeight20,
                textWrap: "pretty",
                margin: "0px 0px 10px 0px",
              }}
            >
              New transaction for {customer.name} {customer.lastName}!
            </h1>
          </div>
          <p
            style={{
              ...TextFontsize18LineHeight28,
              textWrap: "balance",
              width: "100%",
              margin: "15px 0",
            }}
          >
            Select the event and type of transaction
          </p>
        </Grid>
        <p
          style={{
            ...TextFontSize14LineHeight20,
            fontWeight: 500,
            textWrap: "pretty",
            margin: "10px 0px 5px",
          }}
        >
          Event where you want to assign the transaction:
        </p>
        <Select
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            height: "2.5rem",
          }}
          onChange={(event) => setEventSelected(event)}
          options={[...renderingEventOptions()]}
        />
        <p
          style={{
            ...TextFontSize14LineHeight20,
            fontWeight: 500,
            textWrap: "pretty",
            margin: "10px 0px 5px",
          }}
        >
          Type of transaction you want to create:
        </p>

        <Select
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            height: "2.5rem",
          }}
          onChange={(value) => setTypeOfTransaction(value)}
          options={[
            ...["No-Deposit", "Cash-Deposit"].map(
              //, "Authorized-Deposit",
              (item) => ({
                value: item,
                label: (
                  <p
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      padding: "5px 5px 5px 0px",
                    }}
                  >
                    {item}
                  </p>
                ),
              })
            ),
          ]}
        />
        <p
          style={{
            ...TextFontSize14LineHeight20,
            fontWeight: 500,
            textWrap: "pretty",
            margin: "10px 0px 5px",
          }}
        >
          Device type you want to assign:
        </p>
        <Select
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            height: "2.5rem",
          }}
          onChange={(event) => setDeviceType(event)}
          options={[
            ...renderingInventoryOptionsBasedOnSelectedEvent().map((item) => ({
              value: item.group,
              label: (
                <p
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    padding: "5px 5px 5px 0px",
                  }}
                >
                  {item.group}
                </p>
              ),
            })),
          ]}
        />
        <p
          style={{
            ...TextFontSize14LineHeight20,
            fontWeight: 500,
            textWrap: "pretty",
            margin: "10px 0px 5px",
          }}
        >
          Serial number to assign
          <span style={{ fontWeight: 400 }}>
            &nbsp;(if transaction is for multiple devices, this will be the
            first device of the range)
          </span>
          :
        </p>
        <OutlinedInput
          style={OutlinedInputStyle}
          type="text"
          name="serialNumber"
          onChange={(event) => setSerialNumber(event.target.value)}
          fullWidth
          placeholder="e.g. 0150235"
        />
        <p
          style={{
            ...TextFontSize14LineHeight20,
            fontWeight: 500,
            textWrap: "pretty",
            margin: "10px 0px 5px",
          }}
        >
          Quantity of devices to assign in transaction (1 unit as default):
        </p>
        <OutlinedInput
          style={OutlinedInputStyle}
          name="qty"
          type="text"
          onChange={(event) => setQty(event.target.value)}
          fullWidth
          placeholder="e.g. 20"
        />
        <p
          style={{
            ...TextFontSize14LineHeight20,
            fontWeight: 500,
            textWrap: "pretty",
            margin: "10px 0px 5px",
            display: typeOfTransaction === "No-Deposit" ? "none" : "flex",
          }}
        >
          Authorized amount for transaction{" "}
          <span style={{ textDecoration: "underline" }}>($)</span>:
        </p>
        <OutlinedInput
          style={{
            ...OutlinedInputStyle,
            display: typeOfTransaction === "No-Deposit" ? "none" : "flex",
          }}
          onChange={(event) => setAuthorizedAmount(event.target.value)}
          fullWidth
          placeholder="e.g. 200"
          name="authorizedAmount"
          type="text"
          startAdornment={
            <InputAdornment position="start">
              <Icon
                icon="radix-icons:dollar-sign-line"
                color="#344054"
                width={20}
                height={19}
              />
            </InputAdornment>
          }
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            width: "100%",
            gap: "10px",
          }}
        >
          <Button
            loading={isLoadingState}
            onClick={() => {
              closeModal();
            }}
            style={{ ...GrayButton, width: "100%", margin: "20px 0px" }}
          >
            <p style={GrayButtonText}>Cancel</p>
          </Button>
          <Button
            loading={isLoadingState}
            onClick={(e) => handleSubmitInformation(e)}
            style={{ ...BlueButton, width: "100%", margin: "20px 0px" }}
          >
            <p style={BlueButtonText}>
              {typeOfTransaction !== "Authorized-Deposit"
                ? "Create transaction"
                : "Credit card information"}
            </p>
          </Button>
        </div>

        {isLoadingState && <Spin indicator={<Loading />} fullscreen />}
        {triggering === 2 && (
          <CashDeposit
            customer={customer}
            quantity={qty}
            staff={user}
            event={JSON.parse(eventSelected)}
            deviceInfo={{
              group: deviceType,
              deviceNeeded: qty,
              value: authorizedAmount,
            }}
            serialNumber={serialNumber}
            loadingState={setIsLoadingState}
            triggering={setTriggering}
            closeModal={closeModal}
            amount={authorizedAmount}
          />
        )}

        {triggering === 3 && (
          <NoDepositTransaction
            customer={customer}
            quantity={qty}
            staff={user}
            event={JSON.parse(eventSelected)}
            deviceInfo={{
              group: deviceType,
              deviceNeeded: qty,
              value: authorizedAmount,
            }}
            serialNumber={serialNumber}
            loadingState={setIsLoadingState}
            triggering={setTriggering}
            closeModal={closeModal}
          />
        )}
      </Grid>
    </Modal>
  );
};

export default ModalAssignDeviceInEvent;
