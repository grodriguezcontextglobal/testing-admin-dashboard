import {
  Button,
  Chip,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Modal, Select, Tooltip } from "antd";
import { groupBy } from "lodash";
import { PropTypes } from "prop-types";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import {
  BorderedCloseIcon,
  CheckIcon,
  QuestionIcon,
  RectangleBluePlusIcon,
} from "../../../../components/icons/Icons";
import { onAddEventData } from "../../../../store/slices/eventSlice";
import { AntSelectorStyle } from "../../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { LightBlueButton } from "../../../../styles/global/LightBlueButton";
import LightBlueButtonText from "../../../../styles/global/LightBlueButtonText";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../styles/global/Subtitle";

const ModalAddAndUpdateDeviceSetup = ({
  openModalDeviceSetup,
  setOpenModalDeviceSetup,
  deviceTitle,
  quantity,
}) => {
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const { register, handleSubmit, watch } = useForm();
  const dispatch = useDispatch();
  const closeModal = () => {
    return setOpenModalDeviceSetup(false);
  };
  const eventInfoDetail = event.eventInfoDetail;
  const [valueItemSelected, setValueItemSelected] = useState([]);
  const [listOfLocations, setListOfLocations] = useState([]);
  const itemQuery = useQuery({
    queryKey: ["itemGroupExistingLocationList"],
    queryFn: () =>
      devitrakApi.post("/db_item/warehouse-items", {
        company_id: user.sqlInfo.company_id,
        warehouse: true,
        item_group: deviceTitle,
      }),
    refetchOnMount: false,
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

  useEffect(() => {
    const controller = new AbortController();
    itemQuery.refetch();
    recordNoSqlDevicesQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  const dataFound = itemQuery?.data?.data?.items ?? [];
  const existingDevice =
    recordNoSqlDevicesQuery?.data?.data?.receiversInventory ?? [];
  const optionsToRenderInSelector = () => {
    const locations = groupBy(dataFound, "location");
    return locations;
  };
  const onChange = (value) => {
    const optionRendering = JSON.parse(value);
    setValueItemSelected(optionRendering);
  };
  const orderValuesInPlace = (values) => {
    return values.sort((a, b) => parseInt(a) - parseInt(b));
  };
  const deviceRanging = () => {
    let ranges = [];
    for (let item of listOfLocations) {
      ranges = [
        ...ranges,
        item.deviceInfo[0].serial_number,
        item.deviceInfo[Number(item.quantity) - 1].serial_number,
      ];
    }
    return orderValuesInPlace(ranges);
  };

  const updateDeviceSetupInEvent = async () => {
    const ranging = deviceRanging();
    const updateDeviceInv = [...event.deviceSetup];
    const foundIndex = updateDeviceInv.findIndex(
      (element) => element.group === listOfLocations[0].deviceInfo[0].item_group
    );
    if (foundIndex > -1) {
      updateDeviceInv[foundIndex] = {
        ...updateDeviceInv[foundIndex],
        startingNumber: ranging[0],
        endingNumber: ranging.at(-1),
      };
    }
    const updatingDeviceInEvent = await devitrakApi.patch(
      `/event/edit-event/${event.id}`,
      {
        deviceSetup: updateDeviceInv,
      }
    );
    if (updatingDeviceInEvent.data) {
      return dispatch(
        onAddEventData({
          ...event,
          deviceSetup: updateDeviceInv,
        })
      );
    }
  };

  const createDeviceRecordInNoSQLDatabase = async (props) => {
    for (let index = 0; index < Number(props.quantity); index++) {
      await devitrakApi.post("/receiver/receivers-pool", {
        device: props.deviceInfo[index].serial_number,
        status: "Operational",
        activity: false,
        comment: "No comment",
        eventSelected: eventInfoDetail.eventName,
        provider: user.company,
        type: props.deviceInfo[index].item_group,
        company: user.companyData.id,
      });
    }
    await updateDeviceSetupInEvent();
    return null;
  };

  const createDeviceInEvent = async (props) => {
    const event_id = event.sql.event_id;
    const database = [...props.deviceInfo];
    await devitrakApi.post("/db_event/event_device", {
      event_id: event_id,
      item_group: database[0].item_group,
      startingNumber: database[0].serial_number,
      quantity: props.quantity,
      category_name:database[0].category_name
  });
    await devitrakApi.post("/db_item/item-out-warehouse", {
      warehouse: false,
      company_id: user.sqlInfo.company_id,
      item_group: database[0].item_group,
      startingNumber: database[0].serial_number,
      quantity: props.quantity,
    });
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
          deviceInfo: valueItemSelected,
          startingNumber: data.serial_number,
        },
      ];
      return setListOfLocations(result);
    }
  };
  const handleDevicesInEvent = async () => {
    for (let data of listOfLocations) {
      console.log(data);
      await createDeviceInEvent(data);
    }
    return await closeModal();
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
    if (valueItemSelected.length > 0)
      return valueItemSelected.some(
        (elem) => elem.serial_number === watch("serial_number")
      );
  };
  return (
    <Modal
      open={openModalDeviceSetup}
      onCancel={() => closeModal()}
      centered
      maskClosable={false}
      footer={[]}
      width={700}
    >
      {/* <Grid
        display={"flex"}
        flexDirection={"column"}
        justifyContent={"space-around"}
        alignItems={"center"}
        gap={2}
        container
      >
        <Grid
          display={"flex"}
          flexDirection={"column"}
          justifyContent={"space-around"}
          alignItems={"center"}
          gap={2}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        > */}
          <form
            style={{
              width: "100%",
              justifyContent: "flex-start",
              alignItems: "center",
              textAlign: "left",
              padding: "0 25px 0 10px",
            }}
            onSubmit={handleSubmit(addingDeviceFromLocations)}
            className="form"
          >
            <Typography style={{ ...Subtitle, margin: "0px auto 1rem" }}>
              Enter serial number range for <strong>{deviceTitle}</strong> to
              assign to this event.
            </Typography>
            <div style={{ margin: "0px auto 1rem", width: "100%" }}>
              <Select
                className="custom-autocomplete"
                showSearch
                placeholder="Search item to add to inventory."
                optionFilterProp="children"
                style={{ ...AntSelectorStyle, width: "100%" }}
                onChange={onChange}
                options={Object.entries(optionsToRenderInSelector())?.map(
                  (item) => {
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
                            <span style={{ fontWeight: 700 }}>{item[0]}</span>
                          </span>
                          <span style={{ textAlign: "right", width: "5 0%" }}>
                            Available: {item[1]?.length}
                          </span>
                        </Typography>
                      ), //renderOptionAsNeededFormat(JSON.stringify(option))
                      value: JSON.stringify(item[1]),
                    };
                  }
                )}
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
                    <Tooltip title="A check icon if serial number does exist and xs icon for not existing serial number.">
                      Starting from serial number <QuestionIcon />
                    </Tooltip>
                  </Typography>
                </InputLabel>
                <OutlinedInput
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
                series starts: {valueItemSelected[0]?.serial_number} - series
                ends: {valueItemSelected?.at(-1)?.serial_number}
              </p>
            </span>

            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: "5px",
              }}
            >
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
                type="submit"
                style={{
                  ...LightBlueButton,
                  ...CenteringGrid,
                  width: "100%",
                }}
              >
                <RectangleBluePlusIcon />
                &nbsp;
                <Typography textTransform="none" style={LightBlueButtonText}>
                  Add qty from location
                </Typography>
              </button>
            </div>
          </form>
          <Button
            disabled={existingDevice.length === Number(quantity)}
            onClick={() => handleDevicesInEvent()}
            style={{
              ...disablingButton(),
              display: `${blockingButton() ? "flex" : "none"}`,
              width: "100%",
            }}
          >
            <Typography textTransform={"none"} style={BlueButtonText}>
              Add devices to this event.
            </Typography>
          </Button>
        {/* </Grid>
      </Grid> */}
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
