import {
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
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
import "../../../../../../../../styles/global/ant-select.css";
import TextFontsize18LineHeight28 from "../../../../../../../../styles/global/TextFontSize18LineHeight28";
import { groupBy } from "lodash";

const MultipleDevices = ({ setCreateTransactionPaid }) => {
  const { register, handleSubmit, setValue } = useForm();
  const { customer } = useSelector((state) => state.customer);
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const [clientSecret, setClientSecret] = useState("");
  const dispatch = useDispatch();
  const [deviceSelection, setDeviceSelection] = useState(null);
  const totalRef = useRef(0);

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

  const generatePaymentIntent = async (data) => {
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
      dispatch(onAddDevicesSelection(data.quantity));
      dispatch(
        onAddDevicesSelectionPaidTransactions({
          ...data,
          deviceType: JSON.parse(deviceSelection),
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
            gap: "5px",
            width: "100%",
          }}
        >
          <Select
            className="custom-autocomplete"
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
            gap: "5px",
            width: "100%",
          }}
        >
          <OutlinedInput
            disabled={clientSecret !== ""}
            {...register("startingNumber")}
            autoFocus={true}
            style={{ ...OutlinedInputStyle, width: "80%" }}
            placeholder="Scan or enter starting serial number"
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

          <FormControl style={{ width: "20%" }}>
            <InputLabel htmlFor="outlined-adornment-amount">Amount</InputLabel>
            <OutlinedInput
              label="Amount"
              autoFocus={true}
              required
              disabled={clientSecret !== "" || deviceSelection === null}
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
        <Button
          style={{ ...BlueButton, width: "100%" }}
          onClick={() => closeModal()}
        >
          <p style={BlueButtonText}>Cancel</p>
        </Button>
      )}
    </>
  );
};

export default MultipleDevices;
