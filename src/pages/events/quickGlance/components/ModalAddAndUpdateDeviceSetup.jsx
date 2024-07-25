import {
  Button,
  Chip,
  Grid,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Modal, Select } from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import { RectangleBluePlusIcon } from "../../../../components/icons/Icons";
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
  const { register, handleSubmit } = useForm();
  const closeModal = () => {
    return setOpenModalDeviceSetup(false);
  };
  const eventInfoDetail = event.eventInfoDetail;
  const [valueItemSelected, setValueItemSelected] = useState({});
  const [listOfLocations, setListOfLocations] = useState([]);
  const itemQuery = useQuery({
    queryKey: ["itemGroupExistingLocationList"],
    queryFn: () =>
      devitrakApi.post("/db_item/warehouse-items", {
        company: user.company,
        warehouse: true,
        item_group: deviceTitle,
      }),
    // enabled: false,
    refetchOnMount: false,
  });
  const recordNoSqlDevicesQuery = useQuery({
    queryKey: ["recordNoSqlDevices"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-pool-list", {
        provider: user.company,
        type: deviceTitle,
        eventSelected: event.eventInfoDetail.eventName,
      }),
    // enabled: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    itemQuery.refetch();
    recordNoSqlDevicesQuery.refetch();
    return () => {
      controller.abort();
    };
  }, [deviceTitle]);

  const dataFound = itemQuery?.data?.data?.items ?? [];
  const groupingItemByCategoriesToRenderThemInSelector = () => {
    const result = new Map();
    for (let data of dataFound) {
      if (!result.has(data.category_name)) {
        result.set(data.category_name, [data]);
      } else {
        result.set(data.category_name, [
          ...result.get(data.category_name),
          data,
        ]);
      }
    }
    return result;
  };
  const optionsToRenderInSelector = () => {
    const result = new Set();
    for (let [, value] of groupingItemByCategoriesToRenderThemInSelector()) {
      result.add(value);
    }
    const checkLocation = new Map();
    for (let data of Array.from(result)) {
      for (let item of data) {
        if (
          !checkLocation.has(
            `${item.category_name}-${item.item_group}-${item.location}`
          )
        ) {
          checkLocation.set(
            `${item.category_name}-${item.item_group}-${item.location}`,
            [item]
          );
        } else {
          checkLocation.set(
            `${item.category_name}-${item.item_group}-${item.location}`,
            [
              ...checkLocation.get(
                `${item.category_name}-${item.item_group}-${item.location}`
              ),
              item,
            ]
          );
        }
      }
    }
    let finalResultAfterSortValueByLocation = [];
    for (const [, value] of checkLocation) {
      finalResultAfterSortValueByLocation = [
        ...finalResultAfterSortValueByLocation,
        value,
      ];
    }
    return finalResultAfterSortValueByLocation;
  };

  const onChange = (value) => {
    const optionRendering = JSON.parse(value);
    setValueItemSelected(optionRendering);
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
      });
    }
    await closeModal();
    return null;
  };

  const createDeviceInEvent = async (props) => {
    const event_id = event.sql.event_id;
    // const limit = Number(props.quantity) - 1;
    const respoUpdating = await devitrakApi.post("/db_event/event_device", {
      event_id: event_id,
      item_group: valueItemSelected[0].item_group,
      category_name: valueItemSelected[0].category_name,
      startingNumber: valueItemSelected[0].serial_number,
      quantity:props.quantity,
    });
    if (respoUpdating.data.ok) {
      await devitrakApi.post("/db_item/item-out-warehouse", {
        warehouse: false,
        company: user.company,
        item_group: valueItemSelected[0].item_group,
        startingNumber: valueItemSelected[0].serial_number,
        quantity:props.quantity,
      });
    }
    await createDeviceRecordInNoSQLDatabase(props);
  };

  const addingDeviceFromLocations = (data) => {
    if (
      recordNoSqlDevicesQuery?.data?.data?.receiversInventory.length ===
      Number(quantity)
    ) {
      return alert(
        "Device type had reached out the quantity set when event was created."
      );
    } else {
      const checkingDiff =
        Number(quantity) -
        recordNoSqlDevicesQuery?.data?.data?.receiversInventory.length;
      if (Number(data.quantity) > checkingDiff) {
        return alert(
          `Quantity assigned is bigger than needed to reach out the quantity set in event.`
        );
      }
      const result = [
        ...listOfLocations,
        { quantity: data.quantity, deviceInfo: valueItemSelected },
      ];
      return setListOfLocations(result);
    }
  };
  const handleDevicesInEvent = async () => {
    for (let data of listOfLocations) {
      await createDeviceInEvent(data);
    }
    return null;
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
    if (
      recordNoSqlDevicesQuery?.data?.data?.receiversInventory.length ===
      Number(quantity)
    ) {
      return LightBlueButton;
    } else {
      return BlueButton;
    }
  };
  return (
    <Modal
      open={openModalDeviceSetup}
      onCancel={() => closeModal()}
      centered
      maskClosable={false}
      footer={[]}
    >
      <Grid
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
        >
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
                options={optionsToRenderInSelector().map((item) => {
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
                          <span style={{ fontWeight: 700 }}>
                            {item[0].location}
                          </span>
                        </span>
                        <span style={{ textAlign: "right", width: "5 0%" }}>
                          Available: {item.length}
                        </span>
                      </Typography>
                    ), //renderOptionAsNeededFormat(JSON.stringify(option))
                    value: JSON.stringify(item),
                  };
                })}
              />
            </div>
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                textAlign: "left",
                gap: "10px",
              }}
            >
              <div
                style={{
                  textAlign: "left",
                  width: "50%",
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
                  {...register("quantity", { required: true })}
                  style={OutlinedInputStyle}
                  placeholder="e.g. 150650"
                />
              </div>
              <div
                style={{
                  textAlign: "left",
                  width: "50%",
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
            </div>
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
          </form>
          <Button
            disabled={
              recordNoSqlDevicesQuery?.data?.data?.receiversInventory.length ===
              Number(quantity)
            }
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
          {/* </Grid>{" "} */}
        </Grid>
      </Grid>
    </Modal>
  );
};

export default ModalAddAndUpdateDeviceSetup;
