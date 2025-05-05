import {
  Chip,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Button, message, Modal, Select, Space, Tooltip } from "antd";
import { PropTypes } from "prop-types";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import { BorderedCloseIcon } from "../../../../components/icons/BorderedCloseIcon";
import { CheckIcon } from "../../../../components/icons/CheckIcon";
import { QuestionIcon } from "../../../../components/icons/QuestionIcon";
import { RectangleBluePlusIcon } from "../../../../components/icons/RectangleBluePlusIcon";
import { checkArray } from "../../../../components/utils/checkArray";
import { onAddEventData } from "../../../../store/slices/eventSlice";
import { AntSelectorStyle } from "../../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { LightBlueButton } from "../../../../styles/global/LightBlueButton";
import LightBlueButtonText from "../../../../styles/global/LightBlueButtonText";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../styles/global/Subtitle";
import { groupBy } from "lodash";

const ModalAddAndUpdateDeviceSetup = ({
  openModalDeviceSetup,
  setOpenModalDeviceSetup,
  deviceTitle,
  quantity,
}) => {
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const { register, handleSubmit, watch, setValue } = useForm();
  const dispatch = useDispatch();
  const closeModal = () => {
    return setOpenModalDeviceSetup(false);
  };
  const eventInfoDetail = event.eventInfoDetail;
  const [valueItemSelected, setValueItemSelected] = useState([]);
  const [listOfLocations, setListOfLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const itemQuery = useQuery({
    queryKey: ["itemGroupExistingLocationList"],
    queryFn: () =>
      devitrakApi.post("/db_event/retrieve-item-location-quantity", {
        company_id: user.sqlInfo.company_id,
        warehouse: 1,
        item_group: deviceTitle,
        enableAssignFeature: 1,
      }),
    enabled: !!user.sqlInfo.company_id,
  });

  const recordNoSqlDevicesQuery = useQuery({
    queryKey: ["recordNoSqlDevices"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-pool-list", {
        type: deviceTitle,
        eventSelected: event.eventInfoDetail.eventName,
        company: user.companyData.id,
      }),
    refetchOnMount: false,
  });

  const eventInfoSqlDB = useQuery({
    queryKey: ["eventInfoSqlDB"],
    queryFn: () =>
      devitrakApi.post("/db_event/consulting-event", {
        company_assigned_event_id: user.sqlInfo.company_id,
        event_name: event.eventInfoDetail.eventName,
      }),
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    itemQuery.refetch();
    recordNoSqlDevicesQuery.refetch();
    eventInfoSqlDB.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  const existingDevice =
    recordNoSqlDevicesQuery?.data?.data?.receiversInventory ?? [];

  // const optionsToRenderInSelector = () => {
  //   const dataToIterate = checkTypeFetchResponse(dataFound);
  //   const locations = groupBy(dataToIterate, "location");
  //   const options = new Map();
  //   for (const [key, value] of Object.entries(locations)) {
  //     const serialNumberListOrderedAsc = orderBy(
  //       value,
  //       ["serial_number"],
  //       ["asc"]
  //     );
  //     options.set(key, {
  //       qty: value.length,
  //       data: JSON.stringify(value),
  //       start: serialNumberListOrderedAsc[0].serial_number,
  //       end: serialNumberListOrderedAsc.at(-1).serial_number,
  //       serialNumberList: JSON.stringify(
  //         groupBy(orderBy(value, ["serial_number"], ["asc"]), "serial_number")
  //       ),
  //     });
  //   }
  //   return options;
  // };

  const onChange = (value) => {
    const optionRendering = JSON.parse(value);
    setValueItemSelected(optionRendering);
  };

  const itemsFromContainer = async ({ database }) => {
    const event_id = checkArray(eventInfoSqlDB?.data?.data?.event).event_id;
    const sqlInventoryCompanyItems = await devitrakApi.post(
      "/db_item/warehouse-items",
      {
        company_id: user.sqlInfo.company_id,
        warehouse: true,
        item_id: { $in: [...database.map((item) => item.item_id)] },
        enableAssignFeature: 1,
      }
    );
    if (sqlInventoryCompanyItems.data) {
      await devitrakApi.post(
        "/db_event/inserting-items-in-event-from-container",
        {
          event_id: event_id,
          refDatabase: database,
        }
      );
      await devitrakApi.post(
        "/db_event/update-item-in-table-after-being-added-to-event-from-container",
        {
          refDatabase: database,
          warehouse: false,
        }
      );
      const template = {
        deviceList: JSON.stringify(database.map((item) => item.serial_number)),
        status: "Operational",
        activity: false,
        comment: "No comment",
        eventSelected: eventInfoDetail.eventName,
        provider: user.company,
        type: database[0].item_group,
        company: user.companyData.id,
      };
      await devitrakApi.post("/receiver/receivers-pool-bulk", template);
    }
  };

  const updateDeviceSetupInEvent = async (props) => {
    const ranging = props.deviceInfo;
    const updateDeviceInv = [...event.deviceSetup];
    const foundIndex = updateDeviceInv.findIndex(
      (element) => element.group === props.deviceInfo[0].item_group
    );
    if (foundIndex > -1) {
      const checkIfContainer = [...ranging].findIndex(
        (item) => item.serial_number === props.startingNumber
      );
      if (checkIfContainer > -1) {
        if (ranging[checkIfContainer].container > 0) {
          const newItemToAdd = {
            category:
              ranging[checkIfContainer].container_items[0].category_name,
            group: ranging[checkIfContainer].container_items[0].item_group,
            value: updateDeviceInv[foundIndex].value,
            description: updateDeviceInv[foundIndex].description,
            company: updateDeviceInv[foundIndex].company,
            quantity: ranging[checkIfContainer].containerSpotLimit,
            ownership: ranging[checkIfContainer].container_items[0].ownership,
            createdBy: updateDeviceInv[foundIndex].createdBy,
            key: updateDeviceInv[foundIndex].key,
            dateCreated: updateDeviceInv[foundIndex].dateCreated,
            resume: updateDeviceInv[foundIndex].resume,
            consumerUses: updateDeviceInv[foundIndex].consumerUses,
            startingNumber:
              ranging[checkIfContainer].container_items[0].serial_number,
            endingNumber:
              ranging[checkIfContainer].container_items.at(-1).serial_number,
          };
          updateDeviceInv.push(newItemToAdd);
          await itemsFromContainer({
            database: ranging[checkIfContainer].container_items,
          });
        }
      }
      updateDeviceInv[foundIndex] = {
        ...updateDeviceInv[foundIndex],
        startingNumber: ranging[0].serial_number,
        endingNumber: ranging.at(-1).serial_number,
      };
    }
    const updatingDeviceInEvent = await devitrakApi.patch(
      `/event/edit-event/${event.id}`,
      {
        deviceSetup: updateDeviceInv,
      }
    );
    if (updatingDeviceInEvent.data) {
      setLoading(false);
      return dispatch(
        onAddEventData({
          ...event,
          deviceSetup: updateDeviceInv,
        })
      );
    }
  };

  const createDeviceRecordInNoSQLDatabase = async (props) => {
    const index = props.deviceInfo.findIndex(
      (element) => element.serial_number === props.startingNumber
    );
    if (index > -1) {
      let data = null;
      data = props.deviceInfo.slice(index, index + Number(props.quantity));
      const template = {
        deviceList: JSON.stringify(data.map((item) => item.serial_number)),
        status: "Operational",
        activity: false,
        comment: "No comment",
        eventSelected: eventInfoDetail.eventName,
        provider: user.company,
        type: data[0].item_group,
        company: user.companyData.id,
      };
      await devitrakApi.post("/receiver/receivers-pool-bulk", template);
      await updateDeviceSetupInEvent(props);
      return null;
    }
  };

  const createDeviceInEvent = async (props) => {
    const event_id = checkArray(eventInfoSqlDB?.data?.data?.event).event_id;
    let database = [...props.deviceInfo];
    const index = database.findIndex(
      (item) => item.serial_number === props.startingNumber
    );
    if (index > -1) {
      await devitrakApi.post("/db_event/event_device", {
        event_id: event_id,
        item_group: database[0].item_group,
        startingNumber: database[0].serial_number,
        quantity: props.quantity,
        category_name: database[0].category_name,
      });
      await devitrakApi.post("/db_item/item-out-warehouse", {
        warehouse: false,
        company_id: user.sqlInfo.company_id,
        item_group: database[0].item_group,
        startingNumber: database[0].serial_number,
        quantity: props.quantity,
      });
    }
    await createDeviceRecordInNoSQLDatabase(props);
  };

  const addingDeviceFromLocations = (data) => {
    if (existingDevice.length === Number(quantity)) {
      return alert(
        "Device type had reached out the quantity set when event was created."
      );
    } else {
      const checkingDiff = Number(quantity) - existingDevice.length;
      if (Number(data.quantity) > checkingDiff) {
        return alert(
          `Quantity assigned is bigger than needed to reach out the quantity set in event.`
        );
      }
      const result = [
        ...listOfLocations,
        {
          quantity: data.quantity,
          deviceInfo: JSON.parse(valueItemSelected?.data),
          startingNumber: data.serial_number,
        },
      ];
      setValue("quantity", "");
      setValue("serial_number", "");
      return setListOfLocations(result);
    }
  };

  const handleDevicesInEvent = async () => {
    setLoading(true);
    for (let data of listOfLocations) {
      const index = data.deviceInfo.findIndex(
        (element) => element.serial_number === data.startingNumber
      );
      if (index > -1) {
        const deviceInfo = [...data.deviceInfo].slice(
          index,
          index + Number(data.quantity)
        );
        await createDeviceInEvent({ ...data, deviceInfo: deviceInfo });
      } else {
        message.warning("device not found");
      }
    }
    setLoading(false);
    await devitrakApi.post("/cache_update/remove-cache", {
      key: `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`,
    });
    await devitrakApi.post("/cache_update/remove-cache", {
      key: `eventSelected=${event.id}&company=${user.companyData.id}`,
    });
    return closeModal();
  };

  const removeItem = (props) => {
    const result = listOfLocations.toSpliced(props, 1);
    return setListOfLocations(result);
  };

  const blockingButton = () => {
    const initial = 0;
    const checking = listOfLocations.reduce(
      (accu, { quantity }) => accu + Number(quantity),
      initial
    );
    return checking === Number(quantity);
  };

  const disablingButton = () => {
    if (existingDevice.length === Number(quantity)) {
      return LightBlueButton;
    } else {
      return BlueButton;
    }
  };

  const checkIfSerialNumberExists = () => {
    if (valueItemSelected?.data?.length > 0) {
      const checkingSerialNumber = groupBy(
        JSON.parse(valueItemSelected.data),
        "serial_number"
      );
      return checkingSerialNumber[watch("serial_number")]?.length > 0;
    }
    return false;
  };

  const renderOptionAsNeededFormat = () => {
    const result = new Set();
    if (itemQuery.data) {
      const dataFound = itemQuery?.data?.data?.items ?? [];
      for (const [key, value] of Object.entries(dataFound)) {
        //optionsToRenderInSelector()
        result.add({ key, value });
      }
    }
    return Array.from(result);
  };

  return (
    <Modal
      open={openModalDeviceSetup}
      onCancel={() => closeModal()}
      centered
      maskClosable={false}
      footer={[]}
      width={700}
      style={{ zIndex: 30 }}
    >
      <form
        style={{
          width: "100%",
          justifyContent: "flex-start",
          alignItems: "center",
          textAlign: "left",
          padding: 0,
        }}
        onSubmit={handleSubmit(addingDeviceFromLocations)}
        // className="form"
      >
        <Typography style={{ ...Subtitle, margin: "0px auto 1rem" }}>
          Enter serial number range for <strong>{deviceTitle}</strong> to assign
          to this event.
        </Typography>
        <div style={{ margin: "0px auto 1rem", width: "100%" }}>
          <Select
            className="custom-autocomplete"
            showSearch
            placeholder="Search item to add to inventory."
            optionFilterProp="children"
            style={{ ...AntSelectorStyle, width: "100%" }}
            onChange={onChange}
            options={renderOptionAsNeededFormat()?.map((item) => {
              return {
                label: (
                  <Typography
                    textTransform={"capitalize"}
                    style={{
                      ...Subtitle,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <span style={{ textAlign: "left", width: "50%" }}>
                      Location:{" "}
                      <span style={{ fontWeight: 700 }}>{item.key}</span>
                    </span>
                    <span style={{ textAlign: "right", width: "5 0%" }}>
                      Available: {item?.value?.qty}
                    </span>
                  </Typography>
                ),
                value: JSON.stringify({
                  data: item?.value?.data,
                  start: item?.start,
                  end: item?.end,
                }),
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
            textAlign: "left",
            gap: "10px",
          }}
        >
          <div
            style={{
              textAlign: "left",
              width: "100%",
              margin: "0.5rem 0",
            }}
          >
            <InputLabel style={{ marginBottom: "3px", width: "100%" }}>
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                style={{ ...Subtitle, fontWeight: 500, textWrap: "pretty" }}
              >
                Qty of devices from {valueItemSelected[0]?.location}
              </Typography>
            </InputLabel>
            <OutlinedInput
              required
              {...register("quantity")}
              style={OutlinedInputStyle}
              placeholder="e.g. 150"
            />
          </div>
          <div
            style={{
              textAlign: "left",
              width: "100%",
              margin: "0.5rem 0",
            }}
          >
            <InputLabel style={{ marginBottom: "3px", width: "100%" }}>
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                style={{ ...Subtitle, fontWeight: 500, textWrap: "pretty" }}
              >
                <Tooltip title="The check icon means the serial number does exist in company's inventory. The x icon means the serial number does not exist in company's inventory.">
                  Starting from serial number <QuestionIcon />
                </Tooltip>
              </Typography>
            </InputLabel>
            <OutlinedInput
              required
              {...register("serial_number")}
              style={OutlinedInputStyle}
              placeholder="e.g. 154580"
              endAdornment={
                <InputAdornment position="end">
                  <span>
                    {checkIfSerialNumberExists() ? (
                      <CheckIcon />
                    ) : (
                      <BorderedCloseIcon />
                    )}
                  </span>
                </InputAdornment>
              }
            />
          </div>
        </div>
        <span style={{ width: "100%", textAlign: "right" }}>
          <p style={Subtitle}>
            series starts: {valueItemSelected?.start} - series ends:{" "}
            {valueItemSelected?.end}
          </p>
        </span>

        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            margin: "0.5rem 0",
            gap: "5px",
          }}
        >
          <Space size={[8, 16]} wrap>
            {listOfLocations.map((item, index) => {
              return (
                <Chip
                  key={`${item.quantity}${item.deviceInfo.at(-1).item_id}`}
                  label={`${item.deviceInfo.at(-1).location} - ${
                    item.quantity
                  }`}
                  onDelete={() => removeItem(index)}
                />
              );
            })}
          </Space>
        </div>
        <div
          style={{
            textAlign: "left",
            width: "100%",
            margin: "0.5rem 0",
          }}
        >
          <InputLabel style={{ marginBottom: "3px", width: "100%" }}>
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              style={{
                ...Subtitle,
                color: "transparent",
                fontWeight: 500,
                textWrap: "pretty",
              }}
            >
              Qty of devices from {valueItemSelected[0]?.location}
            </Typography>
          </InputLabel>
          <button
            disabled={blockingButton()}
            type="submit"
            style={{
              ...LightBlueButton,
              ...CenteringGrid,
              display: `${blockingButton() ? "none" : "flex"}`,
              width: "100%",
            }}
          >
            <Typography textTransform="none" style={LightBlueButtonText}>
              <RectangleBluePlusIcon />
              &nbsp; Add qty from location
            </Typography>
          </button>
        </div>
      </form>
      <Button
        disabled={existingDevice.length === Number(quantity)}
        loading={loading}
        onClick={() => handleDevicesInEvent()}
        style={{
          ...disablingButton(),
          ...CenteringGrid,
          display: `${blockingButton() ? "flex" : "none"}`,
          width: "100%",
        }}
      >
        <Typography textTransform={"none"} style={BlueButtonText}>
          Add devices to this event.
        </Typography>
      </Button>
    </Modal>
  );
};

export default ModalAddAndUpdateDeviceSetup;

ModalAddAndUpdateDeviceSetup.propTypes = {
  openModalDeviceSetup: PropTypes.bool,
  setOpenModalDeviceSetup: PropTypes.func,
  deviceTitle: PropTypes.string,
  quantity: PropTypes.string,
};
