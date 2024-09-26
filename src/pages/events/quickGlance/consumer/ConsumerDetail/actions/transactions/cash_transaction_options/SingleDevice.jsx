import {
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Select } from "antd";
import { groupBy } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../../../api/devitrakApi";
import { AntSelectorStyle } from "../../../../../../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../../../../styles/global/BlueButtonText";
import { OutlinedInputStyle } from "../../../../../../../../styles/global/OutlinedInputStyle";
import { nanoid } from "@reduxjs/toolkit";
import TextFontsize18LineHeight28 from "../../../../../../../../styles/global/TextFontSize18LineHeight28";
import DeviceAssigned from "../../../../../../../../classes/deviceAssigned";

const SingleDevice = ({ setCreateTransactionForNoRegularUser }) => {
  const { register, handleSubmit } = useForm();
  const { user } = useSelector((state) => state.admin);
  const { customer } = useSelector((state) => state.customer);
  const { event } = useSelector((state) => state.event);
  const [deviceSelection, setDeviceSelection] = useState(null);
  const deviceTrackInPoolQuery = useQuery({
    queryKey: ["devicesInPoolListPerEvent"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-pool-list", {
        eventSelected: event.eventInfoDetail.eventName,
        company: user.companyData.id,
      }),
    // enabled: false,
    refetchOnMount: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    deviceTrackInPoolQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);
  const queryClient = useQueryClient();
  const reference = useRef(null);
  const checkDeviceInUseInOtherCustomerInTheSameEventQuery =
    deviceTrackInPoolQuery?.data?.data?.receiversInventory;
  function closeModal() {
    setCreateTransactionForNoRegularUser(false);
  }
  const option = () => {
    const option = new Set();
    for (let data of event.deviceSetup) {
      if (data.consumerUses) {
        option.add(data);
      }
    }
    return Array.from(option);
  };

  const checkIfDeviceIsInUsed = () => {
    if (checkDeviceInUseInOtherCustomerInTheSameEventQuery?.length > 0)
      return checkDeviceInUseInOtherCustomerInTheSameEventQuery;
    return [];
  };
  checkIfDeviceIsInUsed();

  const formattingSerialNumberLeadingZero = (num, reference) => {
    return String(num).padStart(reference.length, `${reference[0]}`);
  };
  const subtractRangePerGroupToDisplayItInScreen = useCallback(() => {
    const devicesInPool = checkIfDeviceIsInUsed();
    const deviceSelectionInfo = JSON.parse(deviceSelection);
    const findingRange = new Set();
    for (let i = 0; i < devicesInPool.length; i++) {
      if (devicesInPool[i]?.type === deviceSelectionInfo?.group) {
        if (
          !devicesInPool[i]?.activity && //`${devicesInPool[i]?.activity}`.toLowerCase() === "no" &&
          `${devicesInPool[i]?.status}`.toLowerCase() !== "lost"
        )
          findingRange.add(Number(devicesInPool[i].device));
      }
    }
    const result = Array.from(findingRange);
    const max = Math.max(...result);
    const min = Math.min(...result);
    if (result.length > 0) {
      return {
        max: formattingSerialNumberLeadingZero(
          max,
          deviceSelectionInfo.startingNumber
        ),
        min: formattingSerialNumberLeadingZero(
          min,
          deviceSelectionInfo.startingNumber
        ),
      };
    }
    return {
      max: 0,
      min: 0,
    };
  }, [deviceSelection]);

  subtractRangePerGroupToDisplayItInScreen();

  const checkDeviceAvailability = (props) => {
    const grouping = groupBy(checkIfDeviceIsInUsed(), "device");
    return grouping[props].at(-1).activity; // === "YES"
  };
  const createReceiverInTransaction = async (props) => {
    const transaction = new DeviceAssigned(
      props.paymentIntent,
      props.device,
      customer.email,
      true,
      event.eventInfoDetail.eventName,
      user.company,
      new Date().getTime(),
      user.companyData.id
    );
    await devitrakApi.post(
      "/receiver/receiver-assignation",
      transaction.render()
    );
  };

  const createDevicesInPool = async (props) => {
    const grouping = groupBy(checkIfDeviceIsInUsed(), "device");
    await devitrakApi.patch(
      `/receiver/receivers-pool-update/${grouping[props].at(-1).id}`,
      { activity: true, status: "Operational" }
    );
  };

  const onSubmitRegister = async (data) => {
    if (!checkDeviceAvailability(data.serialNumber)) {
      try {
        const id = nanoid();
        const max = 918273645;
        const transactionGenerated =
          `pi_cash_amount:$${data.amount}_received_by:**${user.email}**&` + id;
        reference.current = transactionGenerated;
        const stripeResponse = await devitrakApi.post(
          "/stripe/stripe-transaction-no-regular-user",
          {
            paymentIntent: transactionGenerated,
            clientSecret: 1 + customer.uid + Math.floor(Math.random() * max),
            device: 1,
            user: customer.uid,
            eventSelected: event.eventInfoDetail.eventName,
            provider: user.company,
            company: user.companyData.id,
          }
        );
        if (stripeResponse.data) {
          let deviceInfToStoreParsed = JSON.parse(deviceSelection);
          let deviceSelectedOption = {
            deviceType: deviceInfToStoreParsed.group,
            deviceValue: deviceInfToStoreParsed.value,
            deviceNeeded: 1,
          };
          const transactionProfile = {
            paymentIntent: reference.current,
            clientSecret:
              stripeResponse.data.stripeTransaction.clientSecret ?? "unknown",
            device: deviceSelectedOption,
            consumerInfo: customer,
            provider: event.company,
            eventSelected: event.eventInfoDetail.eventName,
            date: `${new Date()}`,
            company: user.companyData.id,
          };
          const createTransactionTemplate = {
            device: {
              serialNumber: data.serialNumber,
              deviceType: deviceSelectedOption.deviceType,
              status: true,
            },
            paymentIntent: reference.current,
          };
          await createReceiverInTransaction(createTransactionTemplate);
          await createDevicesInPool(data.serialNumber);
          await devitrakApi.post(
            "/stripe/save-transaction",
            transactionProfile
          );
          await queryClient.refetchQueries({
            queryKey: ["transactionListQuery"],
            exact: true,
          });
          await queryClient.refetchQueries({
            queryKey: ["transactionsList"],
            exact: true,
          });

          await queryClient.refetchQueries({
            queryKey: ["listOfNoOperatingDevices"],
            exact: true,
          });

          await queryClient.refetchQueries({
            queryKey: ["assginedDeviceList"],
            exact: true,
          });
          await queryClient.refetchQueries({
            queryKey: ["listOfDevicesAssigned"],
            exact: true,
          });
          alert("Device assigned successful");
          closeModal();
        }
      } catch (error) {
        console.log(
          "🚀 ~ file: ModalCreateUser.js ~ line 136 ~ onSubmitRegister ~ error",
          error
        );
        alert(error);
      }
    } else {
      return alert("Device in use for other consumer");
    }
  };
  return (
    <div
      style={{
        minWidth: "fit-content",
        backgroundColor: "#ffffff",
        padding: "20px 0",
      }}
    >
      <form
        style={{
          margin: " 0.5rem auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.5rem",
          alignSelf: "stretch",
          width: "100%",
        }}
        onSubmit={handleSubmit(onSubmitRegister)}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <Select
            showSearch
            style={{ ...AntSelectorStyle, width: "100%" }}
            placeholder="Search to Select"
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? "").includes(input)
            }
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? "")
                .toLowerCase()
                .localeCompare((optionB?.label ?? "").toLowerCase())
            }
            value={deviceSelection}
            onChange={(value) => {
              setDeviceSelection(value);
            }}
            options={option()?.map((item) => {
              return {
                label: item.group,
                value: JSON.stringify(item),
              };
            })}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1px",
            width: "100%",
          }}
        >
          <Typography
            marginY={2}
            style={{
              ...TextFontsize18LineHeight28,
              width: "60%",
            }}
          >
            {deviceSelection !== null ? (
              <>
                Range of serial number for selected item: <br />
                {subtractRangePerGroupToDisplayItInScreen().min} -{" "}
                {subtractRangePerGroupToDisplayItInScreen().max}
              </>
            ) : (
              "Please select a device type to display available device range."
            )}
          </Typography>
          <OutlinedInput
            disabled={deviceSelection === null}
            {...register("serialNumber")}
            autoFocus={true}
            style={{ ...OutlinedInputStyle }}
            placeholder="Scan or enter serial number here."
          />
          <FormControl style={{ width: "20%" }}>
            <InputLabel htmlFor="outlined-adornment-amount">Amount</InputLabel>
            <OutlinedInput
              label="Amount"
              required
              style={{ ...OutlinedInputStyle }}
              type="text"
              fullWidth
              placeholder="e.g 150"
              {...register("amount")}
              startAdornment={
                <InputAdornment position="start">$</InputAdornment>
              }
            />
          </FormControl>
        </div>

        <Button style={{ ...BlueButton, width: "100%" }} type="submit">
          <Typography textTransform={"none"} style={BlueButtonText}>
            Create transaction
          </Typography>
        </Button>
      </form>
    </div>
  );
};

export default SingleDevice;
