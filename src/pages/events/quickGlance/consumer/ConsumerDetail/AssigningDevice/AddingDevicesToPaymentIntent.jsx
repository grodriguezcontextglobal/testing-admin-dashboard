import {
  FormHelperText,
  Grid,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { message, notification } from "antd";
import { groupBy } from "lodash";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import {
  devitrakApi
} from "../../../../../../api/devitrakApi";
import DeviceAssigned from "../../../../../../classes/deviceAssigned";
import EmailStructureUpdateItem from "../../../../../../classes/emailStructureUpdateItem";
import { checkArray } from "../../../../../../components/utils/checkArray";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import { onAddDevicesAssignedInPaymentIntent } from "../../../../../../store/slices/stripeSlice";
import { OutlinedInputStyle } from "../../../../../../styles/global/OutlinedInputStyle";
import TextFontsize18LineHeight28 from "../../../../../../styles/global/TextFontSize18LineHeight28";
import clearCacheMemory from "../../../../../../utils/actions/clearCacheMemory";
import { useDeviceStatus } from "./hooks/useDeviceStatus";
// import EmailStructureUpdateItem from "../../../../../../classes/emailStructureUpdateItem";

function AddingDevicesToPaymentIntent({ record, refetchingFn }) {
  const [submittedAction, setSubmittedAction] = useState(false);
  // const { customer } = useSelector((state) => state.stripe);
  const { user } = useSelector((state) => state.admin);
  const { choice, event } = useSelector((state) => state.event);
  const { customer } = useSelector((state) => state.customer);
  const dispatch = useDispatch();
  const { deviceSetup } = event;
  const refDeviceObjectRetrieve = useRef(null);
  const refDeviceSetInEvent = useRef(null);
  const {
    register,
    formState: { errors },
    handleSubmit,
    watch,
    setValue,
  } = useForm();
  const { devicesInPool, refetchPool, assignDevice, getDeviceStatus } =
    useDeviceStatus(event, user);

  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, message) => {
    api.open({
      message: `${type}`,
      description: `${message}`,
      placement: "bottomRight",
    });
  };

  // Normalize and aggregation helpers
  const normalizeType = (t) =>
    String(t ?? "")
      .trim()
      .replace(/\s+/g, " ");
  const KNOWN_CATEGORIES = [...event.deviceSetup.map((ds) => ds.category)];
  const extractCategoryAndGroup = (typeRaw) => {
    const t = normalizeType(typeRaw);
    for (const cat of KNOWN_CATEGORIES) {
      // const prefix = `${cat} `;
      if (t) {
        const group = t; //.slice(prefix.length).trim();
        return { category: cat, group };
      }
      if (t === cat) {
        return { category: cat, group: "" };
      }
    }
    return { category: "", group: t };
  };

  // Build group → category map using event.deviceSetup
  const groupToCategory = useMemo(() => {
    const map = {};
    const setup = Array.isArray(event?.deviceSetup) ? event.deviceSetup : [];
    for (const ds of setup) {
      const group = normalizeType(ds?.group);
      const category = normalizeType(ds?.category);
      if (group && category) {
        map[group] = category;
      }
    }
    return map;
  }, [event?.deviceSetup]);

  const makeCanonicalKey = (group) => {
    // const c = normalizeType(category);
    const g = normalizeType(group);
    return g ? `${g}` : g;
  };

  const requestedByType = useMemo(() => {
    const map = {};
    try {
      const root = Array.isArray(record?.device) ? record.device : [];
      for (const entry of root) {
        if (Array.isArray(entry?.device)) {
          for (const d of entry.device) {
            const rawType = d?.deviceType;
            const needed = Number(d?.deviceNeeded) || 0;
            const lowered = String(rawType ?? "").toLowerCase();
            if (needed > 0 && lowered !== "undefined") {
              const { category, group } = extractCategoryAndGroup(rawType);
              const key =
                category && group
                  ? makeCanonicalKey(group)
                  : makeCanonicalKey(group);
              const finalKey = normalizeType(key);
              if (finalKey) {
                map[finalKey] = (map[finalKey] || 0) + needed;
              }
            }
          }
        }
        const rawTypeFlat = entry?.deviceType;
        const neededFlat = Number(entry?.deviceNeeded) || 0;
        const loweredFlat = String(rawTypeFlat ?? "").toLowerCase();
        if (neededFlat > 0 && loweredFlat !== "undefined") {
          const { category, group } = extractCategoryAndGroup(rawTypeFlat);
          const key =
            category && group
              ? makeCanonicalKey(group)
              : makeCanonicalKey(group);
          const finalKey = normalizeType(key);
          if (finalKey) {
            map[finalKey] = (map[finalKey] || 0) + neededFlat;
          }
        }
      }
    } catch (_) {
      return;
    }
    return map;
  }, [record, groupToCategory]);

  const assignedByType = useMemo(async () => {
    const map = {};
    // try {
    const checkAssignedDevicesToTransactionIntent = await devitrakApi.post(
      "/receiver/receiver-assigned",
      {
        paymentIntent: record?.paymentIntent,
      },
    );
    if (checkAssignedDevicesToTransactionIntent.data) {
      const assignedDevices =
        checkAssignedDevicesToTransactionIntent.data.receiver;
      const grouping = groupBy(assignedDevices, "device.deviceType");
      for (const key in grouping) {
        map[key] = grouping[key].length;
      }
    }
    // } catch (_) {
    //   return;
    // }
    return map;
  }, [
    devicesInPool, // Updated dependency
    record?.paymentIntent,
    groupToCategory,
  ]);

  let serialNumber = watch("serialNumber");

  const assignItemEmailNotification = async (props) => {
    try {
      await devitrakApi.post("/nodemailer/assignig-device-notification", {
        consumer: {
          email: customer.email,
          firstName: customer.name,
          lastName: customer.lastName,
        },
        devices: [{ ...props.device, paymentIntent: props.paymentIntent }],
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

  const sortAndFilterDeviceListPerCompanyAndEvent = () => {
    if (devicesInPool?.length > 0) {
      return devicesInPool;
    }
    return [];
  };
  sortAndFilterDeviceListPerCompanyAndEvent();

  const sortedByDevice = groupBy(
    sortAndFilterDeviceListPerCompanyAndEvent(),
    "device",
  );

  const retrieveDeviceInfoSetInEventForConsumers = () => {
    const sortInventory = groupBy(
      sortAndFilterDeviceListPerCompanyAndEvent(),
      "type",
    );
    const result = new Set();
    for (let data of deviceSetup) {
      if (data.consumerUses) {
        if (sortInventory[data.group]) {
          result.add({
            ...data,
            startingNumber: sortInventory[data.group][0].device,
            endingNumber: sortInventory[data.group].at(-1).device,
          });
        }
      }
    }
    refDeviceSetInEvent.current = Array.from(result);
    return Array.from(result);
  };
  retrieveDeviceInfoSetInEventForConsumers();

  // Ensure we store a single device object for the serial, not an array
  const retrieveDeviceSetupValueBaseOnTypeOfSerialNumber = () => {
    const list = sortedByDevice?.[serialNumber];
    if (Array.isArray(list) && list.length > 0) {
      const latest = list.at(-1);
      refDeviceObjectRetrieve.current = latest;
      return latest;
    }
    refDeviceObjectRetrieve.current = null;
    return null;
  };

  if (serialNumber?.length > 0) {
    retrieveDeviceSetupValueBaseOnTypeOfSerialNumber();
  }

  const createEventInTransactionLog = async () => {
    await devitrakApi.post("/transaction-audit-log/create-audit", {
      transaction: record.paymentIntent,
      user: user.email,
      actionTaken: `Receivers ${serialNumber} were assigned to transaction`,
      time: `${new Date()}`,
      action: "action",
      company: user.company,
    });
  };

  const renderingEmailNotificationForDeviceAssignment = async () => {
    const checkingAllTransactions = await devitrakApi.post(
      "/receiver/receiver-assigned",
      {
        paymentIntent: record.paymentIntent,
      },
    );
    if (
      checkingAllTransactions?.data?.receiver.every(
        (item) => item.device.status,
      ) &&
      checkingAllTransactions?.data?.receiver?.length ===
        record.device[0].deviceNeeded
    ) {
      const response = await devitrakApi.post(
        "/nodemailer/device-report-per-transaction",
        {
          consumer: {
            email: customer.email,
            firstName: customer.name,
            lastName: customer.lastName,
          },
          devices: [
            ...checkingAllTransactions.data.receiver.map((item) => {
              return {
                device: {
                  serialNumber: item.device.serialNumber,
                  deviceType: item.device.deviceType,
                  status: item.device.status ? "Assigned" : item.device.status,
                },
                paymentIntent: record.paymentIntent,
              };
            }),
          ],
          event: event.eventInfoDetail.eventName,
          transaction: record.paymentIntent,
          company: user.companyData.id,
          link: `https://app.devitrak.net/?event=${event.id}&company=${user.companyData.id}`,
          admin: user.email,
        },
      );
      if (response.data.ok) {
        return message.success(
          `Device report was sent successfully to ${customer.email}`,
        );
      }
    }
  };

  const handleDevicesAssignedToPaymentIntentInEvent = async (data) => {
    setSubmittedAction(true);

    const deviceLookup = retrieveDeviceSetupValueBaseOnTypeOfSerialNumber();
    if (!deviceLookup) {
      openNotificationWithIcon(
        "Warning",
        `Serial number ${data.serialNumber} is out of valid range for this event, please review and try another serial number.`,
      );
      setValue("serialNumber", "");
      // Refresh transaction intent to keep UI aligned
      refetchingFn?.();
      return setSubmittedAction(false);
    }

    // Build canonical type key: "category_name item_group"
    const rawType =
      checkArray(refDeviceObjectRetrieve.current)?.type ||
      checkArray(refDeviceObjectRetrieve.current)?.deviceType;
    const parsed = extractCategoryAndGroup(rawType);
    const currentKey = parsed.group
      ? makeCanonicalKey(parsed.group)
      : makeCanonicalKey(parsed.group);
    const canonicalKey = normalizeType(currentKey);
    // Enforce requested type and quantity limits
    const requestedCount = requestedByType[canonicalKey];
    if (!requestedCount) {
      openNotificationWithIcon(
        "Warning",
        `Type "${canonicalKey}" was not requested for this transaction. Please assign one of the requested types.`,
      );
      setValue("serialNumber", "");
      // Refresh transaction intent
      refetchingFn?.();
      return setSubmittedAction(false);
    }
    const alreadyAssignedCheck = await assignedByType;
    const alreadyAssigned = alreadyAssignedCheck?.[canonicalKey] || 0;
    if (alreadyAssigned >= requestedCount) {
      const remaining = Math.max(requestedCount - alreadyAssigned, 0);
      openNotificationWithIcon(
        "Info",
        `Limit reached for "${canonicalKey}". Requested: ${requestedCount}, assigned: ${alreadyAssigned}, remaining: ${remaining}.`,
      );
      setValue("serialNumber", "");
      // Refresh to reflect latest counts and prevent stale UI
      refetchingFn?.();
      refetchPool();
      return setSubmittedAction(false);
    }

    // Check device status using hook
    const deviceStatusResult = getDeviceStatus(data.serialNumber);
    if (
      deviceStatusResult === "unavailable" ||
      deviceStatusResult === "not_found"
    ) {
      // Should be covered by deviceLookup check, but safe to keep
    } else if (deviceStatusResult === "assigned") {
      openNotificationWithIcon(
        "Info",
        `device ${data.serialNumber} is already assigned to other customer`,
      );
      setValue("serialNumber", "");
      return setSubmittedAction(false);
    }

    // It is available
    const deviceToUpdate = deviceStatusResult.device;

    const newDeviceObject = {
      serialNumber: data.serialNumber,
      deviceType: canonicalKey,
      status: true,
    };
    const template = new DeviceAssigned(
      record.paymentIntent,
      newDeviceObject,
      record.consumerInfo.email,
      true,
      choice,
      user.company,
      new Date().getTime(),
      user.companyData.id,
      event.id,
    );

    try {
      await assignDevice({
        template: template.render(),
        deviceIdToUpdate: deviceToUpdate.id,
      });

      await createEventInTransactionLog();
      await clearCacheMemory(
        `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`,
      );
      await clearCacheMemory(
        `eventSelected=${event.id}&company=${user.companyData.id}`,
      );

      dispatch(
        onAddDevicesAssignedInPaymentIntent(
          // We don't have this exact data structure from mutation result easily,
          // but we can pass what we have or refetch.
          // For now, let's assume it updates via query invalidation.
          [],
        ),
      );

      refetchingFn();
      if (Number(record.device[0].deviceNeeded) === 1) {
        const dateString = new Date().toString();
        const dateRef = dateString.split(" ");
        const linkStructure = `https://app.devitrak.net/authentication/${event.id}/${user.companyData.id}/${customer.uid}`;
        const emailStructure = new EmailStructureUpdateItem(
          customer.name,
          customer.lastName,
          customer.email,
          newDeviceObject.serialNumber,
          newDeviceObject.deviceType,
          event.eventInfoDetail.eventName,
          event.company,
          record.paymentIntent,
          String(dateRef.slice(0, 4)).replaceAll(",", " "),
          dateRef[4],
          linkStructure,
        );
        await devitrakApi.post(
          "/nodemailer/assignig-device-notification",
          emailStructure.render(),
        );
      }

      openNotificationWithIcon(
        "Success",
        "Devices are being added, they will be displayed shortly.",
      );
      setValue("serialNumber", "");
      await assignItemEmailNotification(template.render());
      await renderingEmailNotificationForDeviceAssignment();
      setSubmittedAction(false);
    } catch (error) {
      // Error handled by mutation hook primarily, but we catch here to reset UI state
      setSubmittedAction(false);
    }
  };

  return (
    <>
      {contextHolder}
      <form
        onSubmit={handleSubmit(handleDevicesAssignedToPaymentIntentInEvent)}
      >
        <Grid
          display={"flex"}
          justifyContent={"space-around"}
          alignItems={"center"}
          marginY={1}
          container
        >
          <Grid item xs={9}>
            <InputLabel>
              <Typography style={TextFontsize18LineHeight28}>
                Serial number
              </Typography>
            </InputLabel>
            <OutlinedInput
              // disabled={submittedAction}
              autoFocus={true}
              {...register("serialNumber", { required: true })}
              fullWidth
              style={OutlinedInputStyle}
            />
            <FormHelperText id="outlined-weight-helper-text">
              {errors?.serialNumber && <p>Serial number is required</p>}
            </FormHelperText>
          </Grid>
          <Grid height={"auto"} alignSelf={"flex-end"} item xs={2}>
            <BlueButtonComponent
              disabled={submittedAction}
              buttonType="submit"
              title={"Add"}
            />
          </Grid>
        </Grid>
      </form>
    </>
  );
}

export default AddingDevicesToPaymentIntent;
