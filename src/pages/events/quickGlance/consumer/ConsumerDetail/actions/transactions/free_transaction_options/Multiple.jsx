import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../../../api/devitrakApi";
import { nanoid } from "@reduxjs/toolkit";
import _ from "lodash";
import { Card, Select, Space } from "antd";
import { AntSelectorStyle } from "../../../../../../../../styles/global/AntSelectorStyle";
import {
  Button,
  Chip,
  FormControl,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { OutlinedInputStyle } from "../../../../../../../../styles/global/OutlinedInputStyle";
import { BlueButton } from "../../../../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../../../../styles/global/BlueButtonText";
import { CardStyle } from "../../../../../../../../styles/global/CardStyle";
import TextFontsize18LineHeight28 from "../../../../../../../../styles/global/TextFontSize18LineHeight28";
import { checkArray } from "../../../../../../../../components/utils/checkArray";
import DeviceAssigned from "../../../../../../../../classes/deviceAssigned";
const Multiple = ({ setCreateTransactionForNoRegularUser }) => {
  const { register, handleSubmit } = useForm();
  const { user } = useSelector((state) => state.admin);
  const { customer } = useSelector((state) => state.customer);
  const { event } = useSelector((state) => state.event);
  const [deviceSelection, setDeviceSelection] = useState(null);
  const [noAssigned, setNoAssigned] = useState([]);
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
          !devicesInPool[i]?.activity &&
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
    const grouping = _.groupBy(checkIfDeviceIsInUsed(), "device");
    return grouping[props].at(-1).activity;
    // return grouping[props].length > 0;
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

    await devitrakApi.post("/receiver/receiver-assignation", transaction.render());
  };

  const createDevicesInPool = async (props) => {
    const grouping = _.groupBy(checkIfDeviceIsInUsed(), "device");
    await devitrakApi.patch(
      `/receiver/receivers-pool-update/${grouping[props].at(-1).id}`,
      { activity: true, status: "Operational" }
    );
  };

  const onSubmitRegister = async (data) => {
    try {
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
          deviceValue: deviceInfToStoreParsed.value,
          deviceNeeded: totalDeviceAssigned,
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
        const grouping = _.groupBy(
          checkDeviceInUseInOtherCustomerInTheSameEventQuery,
          "type"
        );
        const copiedDeviceData = grouping[deviceInfToStoreParsed.group];
        const deviceFound = copiedDeviceData.findIndex(
          (element) => element.device === data.startingNumber
        );
        if (Number(deviceFound) > -1) {
          for (
            let index = Number(deviceFound);
            index < Number(deviceFound) + Number(totalDeviceAssigned);
            index++
          ) {
            const serialNumber = checkArray(copiedDeviceData[index]).device;
            if (!checkDeviceAvailability(serialNumber)) {
              const createTransactionTemplate = {
                device: {
                  serialNumber: serialNumber,
                  deviceType: deviceSelectedOption.deviceType,
                  status: true,
                },
                paymentIntent: reference.current,
                company: user.companyData.id,
              };
              await createReceiverInTransaction(createTransactionTemplate);
              await createDevicesInPool(serialNumber);
            } else {
              let resultingNoAssigned = [];
              resultingNoAssigned = [...noAssigned, serialNumber];
              setNoAssigned(resultingNoAssigned);
            }
          }
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
        alert("Devices assigned successfully");
        if (noAssigned.length === 0) {
          return closeModal();
        }
      }
    } catch (error) {
      console.log(
        "🚀 ~ file: ModalCreateUser.js ~ line 136 ~ onSubmitRegister ~ error",
        error
      );
      alert(error);
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

        <Button style={{ ...BlueButton, width: "100%" }} type="submit">
          <Typography textTransform={"none"} style={BlueButtonText}>
            Create transaction
          </Typography>
        </Button>
      </form>
      <div
        style={{
          margin: "1rem 0 0 0",
          display: `${noAssigned.length === 0 && "none"}`,
        }}
      >
        <Card
          style={CardStyle}
          title={`Scanned device`}
          extra={
            <p style={{ fontSize: "20px", fontWeight: 500 }}>
              <strong>{noAssigned?.length}</strong>
            </p>
          }
        >
          <Space size={[8, 16]} wrap>
            {noAssigned.length > 0 &&
              noAssigned.map((item) => (
                <Chip
                  onDelete={() => "handleDeleteElementInList(item)"}
                  key={`${item}`}
                  label={`${item}`}
                  style={{ margin: "0px 2px 0px 0px" }}
                />
              ))}
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default Multiple;
