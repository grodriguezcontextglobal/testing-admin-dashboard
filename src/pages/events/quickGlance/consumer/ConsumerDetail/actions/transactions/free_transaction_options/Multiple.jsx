import {
  FormControl,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { nanoid } from "@reduxjs/toolkit";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, message, Select } from "antd";
import { groupBy } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../../../api/devitrakApi";
import { AntSelectorStyle } from "../../../../../../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../../../../styles/global/BlueButtonText";
import { OutlinedInputStyle } from "../../../../../../../../styles/global/OutlinedInputStyle";
import TextFontsize18LineHeight28 from "../../../../../../../../styles/global/TextFontSize18LineHeight28";
const Multiple = ({ setCreateTransactionForNoRegularUser }) => {
  const { register, handleSubmit } = useForm();
  const { user } = useSelector((state) => state.admin);
  const { customer } = useSelector((state) => state.customer);
  const { event } = useSelector((state) => state.event);
  const [deviceSelection, setDeviceSelection] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // const [noAssigned, setNoAssigned] = useState([]);
  const deviceTrackInPoolQuery = useQuery({
    queryKey: ["devicesInPoolListPerEvent"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-pool-list", {
        eventSelected: event.eventInfoDetail.eventName,
        company: user.companyData.id,
        activity: false,
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

  const subtractRangePerGroupToDisplayItInScreen = useCallback(() => {
    const devicesInPool = checkIfDeviceIsInUsed();
    const deviceSelectionInfo = JSON.parse(deviceSelection);
    const groupByType = groupBy(devicesInPool, "type");
    const groupByStatus = groupBy(
      groupByType[deviceSelectionInfo?.group],
      "status"
    );
    let check = [];
    for (const [key] of Object.entries(groupByStatus)) {
      if (String(key).toLowerCase() !== "lost") {
        check = [...check, ...groupByStatus[key]].flat().sort((a, b) => a.device - b.device);
      }
    }
    const max = check?.at(-1)?.device;
    const min = check[0]?.device;
    if (check.length > 0) {
      return {
        max: max,
        min: min,
      };
    }
    return {
      max: 0,
      min: 0,
    };
  }, [deviceSelection]);

  subtractRangePerGroupToDisplayItInScreen();

  const assignItemEmailNotification = async (props) => {
    try {
      await devitrakApi.post("/nodemailer/assignig-device-notification", {
        consumer: {
          email: customer.email,
          firstName: customer.name,
          lastName: customer.lastName,
        },
        devices: props.device,
        event: props.eventSelected ?? props.event,
        transaction: props.paymentIntent,
        company: user.companyData.id,
        link: `https://app.devitrak.net/?event=${props.event_id}&company=${user.companyData.id}`,
        admin: user.email,
      });
      message.success("Assignment email has been sent successfully");
    } catch (error) {
      message.error(`There was an error. ${error}`);
    }
  };

  const onSubmitRegister = async (data) => {
    try {
      setIsLoading(true);
      const totalDeviceAssigned = data.quantity;
      const id = nanoid(12);
      const max = 918273645;
      const transactionGenerated = "pi_" + id;
      reference.current = transactionGenerated;
      const stripeResponse = await devitrakApi.post(
        "/stripe/stripe-transaction-no-regular-user",
        {
          paymentIntent: transactionGenerated,
          clientSecret:
            totalDeviceAssigned +
            customer.uid +
            Math.floor(Math.random() * max),
          device: totalDeviceAssigned,
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
          deviceValue: Number(deviceInfToStoreParsed.value),
          deviceNeeded: Number(totalDeviceAssigned),
        };
        const transactionProfile = {
          paymentIntent: reference.current,
          clientSecret:
            stripeResponse.data.stripeTransaction.clientSecret ?? "unknown",
          device: deviceSelectedOption,
          consumerInfo: customer,
          provider: event.company,
          eventSelected: event.eventInfoDetail.eventName,
          event_id: event.id,
          date: `${new Date()}`,
          company: user.companyData.id,
        };
        const grouping = groupBy(
          checkDeviceInUseInOtherCustomerInTheSameEventQuery,
          "type"
        );
        const copiedDeviceData = grouping[deviceInfToStoreParsed.group];
        const deviceFound = copiedDeviceData.findIndex(
          (element) => element.device === data.startingNumber
        );
        if (Number(deviceFound) > -1) {
          const dataToPass = copiedDeviceData.slice(deviceFound, deviceFound + Number(data.quantity));
          const createTransactionTemplate = {
            serialNumbers: JSON.stringify(dataToPass),
            deviceType: copiedDeviceData[0].type,
            status: true,
            paymentIntent: reference.current,
            company: user.companyData.id,
            user: customer.email,
            eventSelected: event.eventInfoDetail.eventName,
            provider: user.company,
            event_id: event.id,
            timestamp: new Date().toISOString(),
            qty: data.quantity,
            startingNumber: data.startingNumber,
          };

          const templateBulkItemUpdate = {
            device: copiedDeviceData.slice(
              deviceFound,
              deviceFound + Number(data.quantity)
            ),
            company: user.companyData.id,
            activity: true,
            eventSelected: event.eventInfoDetail.eventName,
          };

          await devitrakApi.patch(
            "/receiver/update-bulk-items-in-pool",
            templateBulkItemUpdate
          );
          await devitrakApi.post(
            "/receiver/create-bulk-item-transaction-in-user",
            createTransactionTemplate
          );
          await assignItemEmailNotification({
            paymentIntent: reference.current,
            device: [
              ...templateBulkItemUpdate.device.map((item) => ({
                deviceType: item.type,
                serialNumber: item.device,
                paymentIntent: reference.current,
              })),
            ],
            event_id: event.id,
            eventSelected: event.eventInfoDetail.eventName,
            event: event.eventInfoDetail.eventName,
          });
  
        }
        await devitrakApi.post("/stripe/save-transaction", transactionProfile);

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

        setIsLoading(false);
        alert("Devices assigned successfully");

        return closeModal();
      }
    } catch (error) {
      setIsLoading(false);
      return alert(error);
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
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "3px",
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
            {...register("startingNumber")}
            autoFocus={true}
            style={{ ...OutlinedInputStyle, width: "70%" }}
            placeholder="Scan or enter the starting serial number here.."
          />
          <FormControl style={{ width: "20%" }}>
            <InputLabel htmlFor="outlined-adornment-amount">Qty</InputLabel>
            <OutlinedInput
              label="Qty"
              disabled={deviceSelection === null}
              {...register("quantity")}
              autoFocus={true}
              style={{ ...OutlinedInputStyle }}
              placeholder="e.g 3"
              fullWidth
              startAdornment={
                <InputAdornment position="start"></InputAdornment>
              }
            />
          </FormControl>
        </div>

        <Button
          loading={isLoading}
          style={{ ...BlueButton, width: "100%" }}
          htmlType="submit"
        >
          <Typography textTransform={"none"} style={BlueButtonText}>
            Create transaction
          </Typography>
        </Button>
      </form>
    </div>
  );
};

export default Multiple;
