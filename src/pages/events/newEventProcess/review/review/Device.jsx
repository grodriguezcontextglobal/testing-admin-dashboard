import { Grid, InputLabel } from "@mui/material";
import { Table } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BorderedCloseIcon } from "../../../../../components/icons/BorderedCloseIcon";
import { CheckIcon } from "../../../../../components/icons/CheckIcon";
import { onAddDeviceSetup } from "../../../../../store/slices/eventSlice";
import { GrayButton } from "../../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../../styles/global/GrayButtonText";
import TextFontsize18LineHeight28 from "../../../../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize20LineHeight30 } from "../../../../../styles/global/TextFontSize20HeightLine30";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";

const Device = () => {
  const { deviceSetup } = useSelector((state) => state.event);
  const [dataToRender, setDataToRender] = useState([]);
  const [container, setContainer] = useState([]);
  const [checkConsumerUses, setCheckConsumerUses] = useState([]);
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
      return setDataToRender(Array.from(result));
    };

    formattingData();
    return () => {
      controller.abort();
    };
  }, []);

  const updateGlobalStore = useCallback((data) => {
    return dispatch(onAddDeviceSetup(data));
  }, []);
  const updateDeviceFeatures = (data) => {
    let copyData = [...dataToRender];
    if (checkConsumerUses.some((element) => element === data)) {
      copyData[data] = {
        ...copyData[data],
        consumerUses: false,
      };
      setCheckConsumerUses(
        checkConsumerUses.filter((element) => element !== data)
      );
    } else {
      copyData[data] = {
        ...copyData[data],
        consumerUses: true,
      };
      setCheckConsumerUses([...checkConsumerUses, data]);
    }
    updateGlobalStore(copyData);
    return setDataToRender(copyData);
  };

  const updateContainerFeatures = (data) => {
    let copyData = [...dataToRender];
    if (container.some((element) => element === data)) {
      copyData[data] = {
        ...copyData[data],
        isItSetAsContainerForEvent: false,
      };
      setContainer(container.filter((element) => element !== data));
    } else {
      copyData[data] = {
        ...copyData[data],
        isItSetAsContainerForEvent: true,
      };
      setContainer([...container, data]);
    }
    updateGlobalStore(copyData);
    return setDataToRender(copyData);
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
    if (reference) {
      p = { ...BlueButtonText };
      button = { ...BlueButton };
      fill = "#fff";
    } else {
      p = { ...GrayButtonText };
      button = { ...GrayButton };
      fill = "#000";
    }
    return { p, button, fill };
  };

  const buttonContainerStyling = ({ index }) => {
    const reference = container.some((element) => element === index);
    let p = {};
    let button = {};
    let fill = null;
    if (reference) {
      p = { ...BlueButtonText };
      button = { ...BlueButton };
      fill = "#fff";
    } else {
      p = { ...GrayButtonText };
      button = { ...GrayButton };
      fill = "#000";
    }
    return { p, button, fill };
  };

  const columns = [
    {
      title: "Quantity",
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
      responsive: ["md", "lg"],
      render: (text) => <div style={renderingStyle}>{text}</div>,
    },
    {
      title: "Action",
      render: (text, record, index) => (
        <div
          style={{
            ...renderingStyle,
            display: "flex",
            alignSelf: "flex-start",
            gap: "8px",
          }}
        >
          <BlueButtonComponent
            title={"For consumers use?"}
            func={() => updateDeviceFeatures(index)}
            styles={buttonStyling({ index }).button}
            titleStyles={buttonStyling({ index }).p}
            icon={
              checkConsumerUses.some((element) => element === index) ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    aspectRatio: "1",
                    width: "fit-content",
                    height: "auto",
                  }}
                >
                  <CheckIcon stroke={buttonStyling({ index }).fill} />
                  &nbsp;
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    aspectRatio: "1",
                    width: "fit-content",
                    height: "auto",
                  }}
                >
                  <BorderedCloseIcon fill={buttonStyling({ index }).fill} />
                  &nbsp;
                </div>
              )
            }
          />
          &nbsp;
          <BlueButtonComponent
            title={"Is it a container?"}
            func={() => updateContainerFeatures(index)}
            styles={buttonContainerStyling({ index }).button}
            titleStyles={buttonContainerStyling({ index }).p}
            icon={
              container.some((element) => element === index) ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    aspectRatio: "1",
                    width: "fit-content",
                    height: "auto",
                  }}
                >
                  <CheckIcon stroke={buttonContainerStyling({ index }).fill} />
                  &nbsp;
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    aspectRatio: "1",
                    width: "fit-content",
                    height: "auto",
                  }}
                >
                  <BorderedCloseIcon fill={buttonContainerStyling({ index }).fill} />
                  &nbsp;
                </div>
              )
            }
          />
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
        showHeader={false}
      />
    </Grid>
  );
};

export default Device;
