import {
  Button,
  Grid,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Select, Space, Tag, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import {
  CheckIcon,
  PlusIcon,
  RectangleBluePlusIcon,
} from "../../../../components/icons/Icons";
import { onAddDeviceSetup } from "../../../../store/slices/eventSlice";
import { AntSelectorStyle } from "../../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { GrayButton } from "../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../styles/global/GrayButtonText";
import { LightBlueButton } from "../../../../styles/global/LightBlueButton";
import LightBlueButtonText from "../../../../styles/global/LightBlueButtonText";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../styles/global/Subtitle";
import { TextFontSize20LineHeight30 } from "../../../../styles/global/TextFontSize20HeightLine30";
import "../../../../styles/global/ant-select.css";
import AddingEventCreated from "../staff/components/AddingEventCreated";
import FormDeviceTrackingMethod from "./newItemSetup/FormDeviceTrackingMethod";
const Form = () => {
  const { register, handleSubmit, setValue } = useForm();
  const { user } = useSelector((state) => state.admin);
  const { deviceSetup, staff } = useSelector((state) => state.event);
  const [displayFormToCreateCategory, setDisplayFormToCreateCategory] =
    useState(false);
  const [valueItemSelected, setValueItemSelected] = useState({});
  const [selectedItem, setSelectedItem] = useState(deviceSetup);
  const [assignAllDevices, setAssignAllDevices] = useState(false);
  const [triggerAddingAdminStaff, setTriggerAddingAdminStaff] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const itemQuery = useQuery({
    queryKey: ["listOfItems"],
    queryFn: () =>
      devitrakApi.post("/db_item/warehouse-items", {
        company_id: user.sqlInfo.company_id,
        warehouse: true,
        enableAssignFeature: 1,
      }),
  });

  useEffect(() => {
    const controller = new AbortController();
    if (staff.adminUser.length === 0) {
      return setTriggerAddingAdminStaff(true);
    }
    return () => {
      controller.abort();
    };
  }, []);

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
        if (!checkLocation.has(`${item.category_name}-${item.item_group}`)) {
          checkLocation.set(`${item.category_name}-${item.item_group}`, [item]);
        } else {
          checkLocation.set(`${item.category_name}-${item.item_group}`, [
            ...checkLocation.get(`${item.category_name}-${item.item_group}`),
            item,
          ]);
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
  const removeItemSelected = (item) => {
    const filter = selectedItem.filter((_, index) => index !== item);
    dispatch(onAddDeviceSetup(filter));
    return setSelectedItem(filter);
  };

  const handleAddingNewItemToDeviceSetupEvent = (data) => {
    const resulting = [
      ...selectedItem,
      {
        ...data,
        ...valueItemSelected[0],
        quantity: assignAllDevices ? valueItemSelected.length : data.quantity,
        existing: true,
      },
    ];
    setSelectedItem(resulting);
    setValue("quantity", "");
    setAssignAllDevices(false);
    return;
  };
  const handleNextStepEventSetup = () => {
    dispatch(onAddDeviceSetup(selectedItem));
    return navigate("/create-event-page/review-submit");
  };
  const renderingStyle = () => {
    if (staff.adminUser.length === 0) {
      return {
        button: {
          ...BlueButton,
          background: "var(--disabled-blue-button)",
          width: "100%",
          border: "transparent",
        },
        text: {
          ...BlueButtonText,
          color: "var(--disabled-gray-button-text)",
          textTransform: "none",
        },
      };
    } else {
      return {
        button: {
          ...BlueButton,
          width: "100%",
        },
        text: {
          ...BlueButtonText,
          textTransform: "none",
        },
      };
    }
  };
  return (
    <Grid
      container
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
      key={"settingUp-deviceList-event"}
    >
      {triggerAddingAdminStaff && <AddingEventCreated />}
      <InputLabel
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <Typography
          textTransform="none"
          style={{ ...TextFontSize20LineHeight30, color: "var(--gray600)" }}
        >
          Assign from existing groups in the inventory
        </Typography>
      </InputLabel>
      <Typography
        textTransform="none"
        textAlign="justify"
        // color="var(--gray-600, #475467)"
        margin={"0.2rem auto 0.5rem"}
        style={{
          ...Subtitle,
          color: "var(--gray600)",
          wordWrap: "break-word",
          width: "100%",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        You can select groups of devices from existing inventory in your
        database and assign to this event. When assigning, you can choose the
        whole group of devices, or only a range of serial numbers per group. You
        will see the groups selected as small tags below.
      </Typography>
      <Grid
        style={{
          borderRadius: "8px",
          border: "1px solid var(--gray300, #D0D5DD)",
          background: "var(--gray100, #F2F4F7)",
          padding: "24px",
          width: "100%",
        }}
        item
        xs={12}
        sm={12}
        md={12}
        lg={12}
      >
        <InputLabel
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          <Typography
            textTransform="none"
            style={{ ...TextFontSize20LineHeight30, fontWeight: 600 }}
          >
            Existing groups
          </Typography>
        </InputLabel>
        <InputLabel
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          <Typography
            textTransform="none"
            style={{
              ...TextFontSize20LineHeight30,
              fontWeight: 600,
              fontSize: "14px",
              color: "#000",
            }}
          >
            Select from existing category
          </Typography>
        </InputLabel>
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
                  <span style={{ width: "50%" }}>
                    <span style={{ fontWeight: 700 }}>
                      {item[0].category_name}
                    </span>{" "}
                    {item[0].item_group}
                  </span>
                  {/* <span style={{ textAlign: "left", width: "30%" }}>
                    Location:{" "}
                    <span style={{ fontWeight: 700 }}>{item[0].location}</span>
                  </span> */}
                  <span style={{ textAlign: "right", width: "20%" }}>
                    Total available: {item.length}
                  </span>
                </Typography>
              ),
              value: JSON.stringify(item),
            };
          })}
        />
        <form
          onSubmit={handleSubmit(handleAddingNewItemToDeviceSetupEvent)}
          style={{
            width: "100%",
          }}
        >
          <Grid
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            marginY={2}
            gap={2}
            style={{
              width: "100%",
            }}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            <Grid item xs={6} sm={6} md={6} lg={6}>
              <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                <Typography
                  textTransform={"none"}
                  textAlign={"left"}
                  style={{ ...Subtitle, fontWeight: 500 }}
                >
                  Assign all&nbsp;
                  <input
                    type="checkbox"
                    value={assignAllDevices}
                    name="assignAllDevices"
                    defaultChecked={assignAllDevices}
                    onChange={(e) => setAssignAllDevices(e.target.checked)}
                  />
                </Typography>
              </InputLabel>
            </Grid>
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            marginY={2}
            gap={2}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            <Grid item xs={6} sm={6} md={6} lg={6}>
              <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                <Typography
                  textTransform={"none"}
                  textAlign={"left"}
                  style={{ ...Subtitle, fontWeight: 500 }}
                >
                  Quantity
                </Typography>
              </InputLabel>
              <OutlinedInput
                disabled={assignAllDevices}
                {...register("quantity")}
                style={{
                  ...OutlinedInputStyle,
                  width: "100%",
                }}
                placeholder="Enter quantity needed."
                fullWidth
              />
            </Grid>
            <Grid
              style={{ alignSelf: "baseline" }}
              item
              xs={6}
              sm={6}
              md={6}
              lg={6}
            >
              <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                <Typography
                  textTransform={"none"}
                  textAlign={"left"}
                  style={{ ...Subtitle, fontWeight: 500, color: "transparent" }}
                  color={"transparent"}
                >
                  Quantity
                </Typography>
              </InputLabel>
              <Button
                type="submit"
                style={{ ...LightBlueButton, ...CenteringGrid, width: "100%" }}
              >
                <RectangleBluePlusIcon />
                &nbsp;
                <Typography textTransform="none" style={LightBlueButtonText}>
                  Add item
                </Typography>
              </Button>
            </Grid>
          </Grid>
        </form>

        <Grid item xs={12}>
          <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              style={{ ...Subtitle, fontWeight: 500 }}
            >
              Groups selected
            </Typography>
          </InputLabel>
          <Space
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
            size={[0, "small"]}
            wrap
          >
            {selectedItem.map((item, index) => {
              return (
                <Tooltip
                  key={index}
                  title={`${
                    item.consumerUses ? "" : "Item set up for internal use."
                  }`}
                >
                  <Tag
                    bordered={false}
                    closable
                    style={{
                      display: "flex",
                      padding: "2px 4px 2px 5px",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      gap: "3px",
                      borderRadius: "6px",
                      border: "1px solid var(--gray-300, #D0D5DD)",
                      background: "var(--base-white, #FFF)",
                      margin: "5px",
                    }}
                    onClose={() => removeItemSelected(index)}
                    key={`${item._id}${index}`}
                  >
                    <CheckIcon />
                    &nbsp;{item.item_group}
                    {"      "}&nbsp;Qty: {item.quantity}
                  </Tag>
                </Tooltip>
              );
            })}
          </Space>
        </Grid>
      </Grid>

      <InputLabel
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          margin: "2rem auto 0.5rem",
        }}
      >
        <Typography
          textTransform="none"
          style={{ ...TextFontSize20LineHeight30, fontWeight: 600 }}
          color="var(--gray600)"
        >
          Generate a new category or group of devices
        </Typography>
      </InputLabel>
      <Typography
        textTransform="none"
        textAlign="justify"
        fontFamily="Inter"
        fontSize="14px"
        fontStyle="normal"
        fontWeight={400}
        lineHeight="20px"
        color="var(--gray-600, #475467)"
        style={{
          wordWrap: "break-word",
          width: "100%",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        If you haven&apos;t added the devices you&apos;re taking to this event
        into the inventory, create a new category of devices for this event; or
        create a new group within an existing category. Then you can enter a
        range of serial numbers starting with a serial number base, to register
        the new devices in your inventory.
      </Typography>

      <Tooltip title="Section in construction">
        <Button
          // disabled
          onClick={() =>
            setDisplayFormToCreateCategory(!displayFormToCreateCategory)
          }
          style={{
            ...LightBlueButton,
            width: "fit-content",
            margin: "1rem auto",
          }}
        >
          <PlusIcon />{" "}
          <Typography textTransform="none" style={LightBlueButtonText}>
            Create a new category or group
          </Typography>
        </Button>
      </Tooltip>
      {displayFormToCreateCategory && (
        <FormDeviceTrackingMethod
          existingData={optionsToRenderInSelector()}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
          setDisplayFormToCreateCategory={setDisplayFormToCreateCategory}
        />
      )}
      <Grid
        style={{
          width: "100%",
          display: `${displayFormToCreateCategory ? "none" : "flex"}`,
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.5rem",
        }}
        marginY={"0.5rem"}
        item
        xs={12}
        sm={12}
        md={12}
        lg={12}
      >
        <Button
          disabled={staff.adminUser.length === 0}
          onClick={() => navigate("/create-event-page/review-submit")}
          style={{
            ...GrayButton,
            width: "100%",
          }}
        >
          <Typography
            style={{
              ...GrayButtonText,
              color:
                staff.adminUser.length === 0 &&
                "var(--disabled-gray-button-text)",
              textTransform: "none",
            }}
          >
            Skip this step
          </Typography>
        </Button>
        <Button
          disabled={staff.adminUser.length === 0}
          onClick={(e) => handleNextStepEventSetup(e)}
          style={renderingStyle().button}
        >
          <Typography style={renderingStyle().text}>Next step</Typography>
        </Button>
      </Grid>
    </Grid>
  );
};

export default Form;
