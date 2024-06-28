import { Button, OutlinedInput, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Select, Tooltip } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../../../api/devitrakApi";
import { StripeCheckoutElement } from "../../../../../../../../components/stripe/elements/StripeCheckoutElement";
import {
  onAddDevicesSelection,
  onAddDevicesSelectionPaidTransactions,
} from "../../../../../../../../store/slices/devicesHandleSlice";
import { AntSelectorStyle } from "../../../../../../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../../../../styles/global/BlueButtonText";
import { OutlinedInputStyle } from "../../../../../../../../styles/global/OutlinedInputStyle";
import TextFontsize18LineHeight28 from "../../../../../../../../styles/global/TextFontSize18LineHeight28";
import _ from "lodash";

const SingleDevice = ({ setCreateTransactionPaid }) => {
  const { register, handleSubmit, setValue } = useForm();
  const { customer } = useSelector((state) => state.customer);
  const { event } = useSelector((state) => state.event);
  const [clientSecret, setClientSecret] = useState("");
  const dispatch = useDispatch();
  const [deviceSelection, setDeviceSelection] = useState(null);
  const totalRef = useRef(0);

  const deviceTrackInPoolQuery = useQuery({
    queryKey: ["devicesInPoolListPerEvent"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-pool-list", {
        eventSelected: event.eventInfoDetail.eventName,
        provider: event.company,
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
  const checkDeviceInUseInOtherCustomerInTheSameEventQuery =
    deviceTrackInPoolQuery?.data?.data?.receiversInventory; //*device in pool

  function closeModal() {
    setCreateTransactionPaid(false);
    setValue("serialNumber", "");
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

  const checkDeviceAvailability = (props) => {
    const grouping = _.groupBy(checkIfDeviceIsInUsed(), "device");
    return grouping[props].at(-1).activity; // === "YES"
  };

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

  const generatePaymentIntent = async (data) => {
    if (checkDeviceAvailability(data.serialNumber)) {
      return alert(
        "device is already assigned to other consumer. Please assign a different serial number."
      );
    }
    totalRef.current = data.amount;
    const response = await devitrakApi.post(
      "/stripe/create-payment-intent-customized",
      {
        customerEmail: customer?.email,
        total: data.amount,
      }
    );
    if (response) {
      setClientSecret(response.data.paymentIntentCustomized.client_secret);
      dispatch(onAddDevicesSelection(1));
      dispatch(
        onAddDevicesSelectionPaidTransactions({
          ...data,
          deviceType: JSON.parse(deviceSelection),
          quantity: 1,
        }) //pass data serial number from handleSubmit
      );
    }
  };

  return (
    <>
      <form
        style={{
          margin: " 0.5rem auto",
          display: `${clientSecret === "" ? "flex" : "none"}`,
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.5rem",
          width: "100%",
        }}
        onSubmit={handleSubmit(generatePaymentIntent)}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1px",
            width: "100%",
          }}
        >
          <Select
            showSearch
            style={{ ...AntSelectorStyle, width: "80%" }}
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
          <Typography
            marginY={2}
            style={{
              ...TextFontsize18LineHeight28,
              width: "80%",
              opacity: deviceSelection !== null ? 1 : 0,
            }}
          >
            Range of serial number for selected item: <br />
            {subtractRangePerGroupToDisplayItInScreen().min} -{" "}
            {subtractRangePerGroupToDisplayItInScreen().max}
          </Typography>
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
          <OutlinedInput
            disabled={clientSecret !== ""}
            {...register("serialNumber")}
            autoFocus={true}
            style={{ ...OutlinedInputStyle, width: "90%" }}
            placeholder="Scan or enter serial number here."
          />
          <OutlinedInput
            disabled={clientSecret !== ""}
            style={{ ...OutlinedInputStyle, width: "90%" }}
            type="text"
            placeholder="Amount to authorize."
            {...register("amount", { required: true })}
          />
        </div>
        <Tooltip title="Please submit CC info after assign all devices.">
          <Button style={{ ...BlueButton, width: "100%" }} type="submit">
            <Typography textTransform={"none"} style={BlueButtonText}>
              Credit Card Info
            </Typography>
          </Button>
        </Tooltip>
      </form>
      {clientSecret !== "" && (
        <StripeCheckoutElement
          clientSecret={clientSecret}
          total={totalRef.current}
        />
      )}
      {clientSecret !== "" && (
        <Button onClick={() => closeModal()}>Cancel</Button>
      )}
    </>
  );
};

export default SingleDevice;
