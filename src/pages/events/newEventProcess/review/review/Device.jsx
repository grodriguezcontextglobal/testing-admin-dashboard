import { Grid, InputLabel } from "@mui/material";
import { Button, Checkbox, Table, Tooltip } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BorderedCloseIcon } from "../../../../../components/icons/BorderedCloseIcon";
import { CheckIcon } from "../../../../../components/icons/CheckIcon";
import { onAddDeviceSetup } from "../../../../../store/slices/eventSlice";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import { GrayButton } from "../../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../../styles/global/GrayButtonText";
import TextFontsize18LineHeight28 from "../../../../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize20LineHeight30 } from "../../../../../styles/global/TextFontSize20HeightLine30";

const Device = () => {
  const { deviceSetup } = useSelector((state) => state.event);
  const [dataToRender, setDataToRender] = useState([]);
  const [container, setContainer] = useState([]);
  const [checkConsumerUses, setCheckConsumerUses] = useState([]);
  const [allConsumerUsesChecked, setAllConsumerUsesChecked] = useState(false);
  const [allContainersChecked, setAllContainersChecked] = useState(false);
  const dispatch = useDispatch();
  useEffect(() => {
    const controller = new AbortController();
    const formattingData = () => {
      const result = new Set();
      for (let data of deviceSetup) {
        if (!result.has(data.category_name)) {
          result.add(data);
        }
      }
      return Array.from(result);
    };

    const formattedData = formattingData();
    setDataToRender(formattedData);

    // Initialize checkConsumerUses and container based on initial data
    const initialConsumerUses = formattedData.map((item, index) => item.consumerUses ? index : -1).filter(index => index !== -1);
    setCheckConsumerUses(initialConsumerUses);

    const initialContainers = formattedData.map((item, index) => item.isItSetAsContainerForEvent ? index : -1).filter(index => index !== -1);
    setContainer(initialContainers);

    // Initialize allConsumerUsesChecked
    const initialAllConsumerUsesChecked = formattedData.length > 0 && formattedData.every(item => item.consumerUses);
    setAllConsumerUsesChecked(initialAllConsumerUsesChecked);

    // Initialize allContainersChecked
    const initialAllContainersChecked = formattedData.length > 0 && formattedData.every(item => item.isItSetAsContainerForEvent);
    setAllContainersChecked(initialAllContainersChecked);
    return () => {
      controller.abort();
    };
  }, []);

  const updateGlobalStore = useCallback((data) => {
    return dispatch(onAddDeviceSetup(data));
  }, []);
  const updateDeviceFeatures = (data) => {
    let copyData = [...dataToRender];
    let newCheckConsumerUses;
    let isChecking;

    if (checkConsumerUses.some((element) => element === data)) {
      // If it's currently checked, uncheck it
      copyData[data] = {
        ...copyData[data],
        consumerUses: false,
      };
      newCheckConsumerUses = checkConsumerUses.filter((element) => element !== data);
      isChecking = false;
    } else {
      // If it's currently unchecked, check it
      copyData[data] = {
        ...copyData[data],
        consumerUses: true,
      };
      newCheckConsumerUses = [...checkConsumerUses, data];
      isChecking = true;
    }

    setCheckConsumerUses(newCheckConsumerUses);
    updateGlobalStore(copyData);
    setDataToRender(copyData);

    // Update allConsumerUsesChecked based on the new state of newCheckConsumerUses
    if (!isChecking) {
      // If an item was unchecked, "select all" must be unchecked
      setAllConsumerUsesChecked(false);
    } else if (copyData.length > 0 && newCheckConsumerUses.length === copyData.length) {
      // If an item was checked, and now all are checked, "select all" should be checked
      setAllConsumerUsesChecked(true);
    } else {
      // If an item was checked, but not all are checked, "select all" should be unchecked
      setAllConsumerUsesChecked(false);
    }
  };
  const handleSelectAllConsumerUses = (e) => {
    const checked = e.target.checked;
    let copyData = [...dataToRender];
    let newCheckConsumerUses = [];

    if (checked) {
      newCheckConsumerUses = copyData.map((_, index) => index);
      copyData = copyData.map((item) => ({ ...item, consumerUses: true }));
    } else {
      copyData = copyData.map((item) => ({ ...item, consumerUses: false }));
    }
    setCheckConsumerUses(newCheckConsumerUses);
    updateGlobalStore(copyData);
    setDataToRender(copyData);
    setAllConsumerUsesChecked(checked);
  };

  const handleSelectAllContainers = (e) => {
    const checked = e.target.checked;
    let copyData = [...dataToRender];
    let newContainer = [];

    if (checked) {
      newContainer = copyData.map((_, index) => index);
      copyData = copyData.map((item) => ({
        ...item,
        isItSetAsContainerForEvent: true,
      }));
    } else {
      copyData = copyData.map((item) => ({
        ...item,
        isItSetAsContainerForEvent: false,
      }));
    }
    setContainer(newContainer);
    updateGlobalStore(copyData);
    setDataToRender(copyData);
    setAllContainersChecked(checked);
  };

  const updateContainerFeatures = (data) => {
    let copyData = [...dataToRender];
    let newContainer;
    let isChecking;

    if (container.some((element) => element === data)) {
      // If it's currently checked, uncheck it
      copyData[data] = {
        ...copyData[data],
        isItSetAsContainerForEvent: false,
      };
      newContainer = container.filter((element) => element !== data);
      isChecking = false;
    } else {
      // If it's currently unchecked, check it
      copyData[data] = {
        ...copyData[data],
        isItSetAsContainerForEvent: true,
      };
      newContainer = [...container, data];
      isChecking = true;
    }

    setContainer(newContainer);
    updateGlobalStore(copyData);
    setDataToRender(copyData);

    // Update allContainersChecked based on the new state of newContainer
    if (!isChecking) {
      // If an item was unchecked, "select all" must be unchecked
      setAllContainersChecked(false);
    } else if (copyData.length > 0 && newContainer.length === copyData.length) {
      // If an item was checked, and now all are checked, "select all" should be checked
      setAllContainersChecked(true);
    } else {
      // If an item was checked, but not all are checked, "select all" should be unchecked
      setAllContainersChecked(false);
    }
  };

  const renderingStyle = {
    ...TextFontsize18LineHeight28,
    fontSize: "16px",
    lineHeight: "24px",
    color: "var(--gray-600, #475467)",
    alignSelf: "stretch",
    fontWeight: 400,
  };

  const buttonStyling = ({ index }) => {
    const reference = checkConsumerUses.some((element) => element === index);
    let p = {};
    let button = {};
    let fill = null;
    // if (reference) {
    //   p = { ...BlueButtonText };
    //   button = { border: "none", outline: "none" };
    // } else {
    p = { ...GrayButtonText };
    button = { border: "none", outline: "none" };
    // }
    return { p, button, fill };
  };

  const buttonContainerStyling = ({ index }) => {
    const reference = container.some((element) => element === index);
    let p = {};
    let button = {};
    let fill = null;
    // if (reference) {
    //   p = { ...BlueButtonText };
    //   button = { border: "none", outline: "none" };
    //   // fill = "#fff";
    // } else {
    p = { ...GrayButtonText };
    button = { border: "none", outline: "none" };
    // }
    return { p, button, fill };
  };

  const columns = [
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      responsive: ["xs", "sm", "md", "lg"],
      render: (text) => <div style={renderingStyle}>{text}</div>,
    },
    {
      title: "Brand",
      dataIndex: "brand",
      key: "brand",
      responsive: ["sm", "md", "lg"],
      render: (text) => <div style={renderingStyle}>{text}</div>,
    },
    {
      title: "Category",
      dataIndex: "category_name",
      key: "category_name",
      responsive: ["md", "lg"],
      render: (text) => <div style={renderingStyle}>{text}</div>,
    },
    {
      title: "Group",
      dataIndex: "item_group",
      key: "item_group",
      responsive: ["xs", "sm", "md", "lg"],
      render: (text) => <div style={renderingStyle}>{text}</div>,
    },
    {
      title: (
        <Tooltip title="Check to assign all devices for consumer use.">
          <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
            <p style={{ marginBottom: "10px" }}>Assignable for consumer use?</p>
            <Checkbox
              checked={allConsumerUsesChecked}
              onChange={handleSelectAllConsumerUses}
            ><p style={{ fontWeight: 500, lineHeight: "18px", fontSize: "12px" }}>
              Select all
              </p>
            </Checkbox>
          </div>
        </Tooltip>
      ),
      render: (text, record, index) => (
        <div
          style={{
            ...renderingStyle,
            display: "flex",
            alignSelf: "flex-start",
            gap: "8px",
          }}
        >
          <Checkbox
            checked={checkConsumerUses.some((element) => element === index)}
            // style={buttonStyling({ index }).button}
            onClick={() => updateDeviceFeatures(index)}

          >
            <p style={buttonStyling({ index }).p}>
              &nbsp;For consumers use
            </p>
          </Checkbox>
        </div>
      ),
    },
    {
      title: (
        <Tooltip title="Check to mark all devices as containers.">
          <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
            <p style={{ marginBottom: "10px" }}>Does it carry/store other devices inside?</p>
            <Checkbox
              checked={allContainersChecked}
              onChange={handleSelectAllContainers}
            ><p style={{ fontWeight: 500, lineHeight: "18px", fontSize: "12px" }}>
              Select all
              </p>
            </Checkbox>
          </div>
        </Tooltip>
      ),
      render: (text, record, index) => (
        <div
          style={{
            ...renderingStyle,
            display: "flex",
            alignSelf: "flex-start",
            gap: "8px",
          }}
        >
          <Checkbox
            checked={container.some((element) => element === index)}
            // style={buttonContainerStyling({ index }).button}
            onClick={() => updateContainerFeatures(index)}
          >
            <p style={buttonContainerStyling({ index }).p}>
              &nbsp;Is it a container
            </p>
          </Checkbox>
        </div>
      ),
    },
  ];

  const totalDevicesAssigned = () => {
    const initial = 0;
    return deviceSetup.reduce(
      (accu, { quantity }) => accu + Number(quantity),
      initial
    );
  };

  return (
    <Grid
      display={"flex"}
      justifyContent={"flex-start"}
      alignItems={"center"}
      container
    >
      <InputLabel
        style={{
          marginBottom: "0.2rem",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <p
          style={{
            ...TextFontSize20LineHeight30,
            fontWeight: 600,
            color: "var(--gray-600, #475467)",
            alignSelf: "stretch",
          }}
        >
          Devices added&nbsp;
          <span
            style={{
              ...TextFontsize18LineHeight28,
              fontWeight: 400,
              color: "var(--gray-600, #475467)",
              alignSelf: "stretch",
            }}
          >
            ({totalDevicesAssigned()}{" "}
            {totalDevicesAssigned() > 1 ? "units" : "unit"})
          </span>
        </p>
      </InputLabel>

      <Table
        dataSource={dataToRender}
        style={{
          width: "100%",
          border: "none",
          backgroundColor: "transparent",
        }}
        columns={columns}
        pagination={false}
        bordered={false}
      // showHeader={false}
      />
    </Grid>
  );
};

export default Device;
