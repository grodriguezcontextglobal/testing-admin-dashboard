import { Grid, InputLabel } from "@mui/material";
import { Switch, Table } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { onAddDeviceSetup } from "../../../../../store/slices/eventSlice";
import TextFontsize18LineHeight28 from "../../../../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize20LineHeight30 } from "../../../../../styles/global/TextFontSize20HeightLine30";
import GrayButtonText from "../../../../../styles/global/GrayButtonText";

const Device = () => {
  const { deviceSetup } = useSelector((state) => state.event);
  const [dataToRender, setDataToRender] = useState([]);
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

  const updateDeviceFeatures = (data) => {
    let copyData = [...dataToRender];
    copyData[data] = {
      ...copyData[data],
      consumerUses: !copyData[data].consumerUses,
    };
    dispatch(onAddDeviceSetup(copyData));
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
        <div style={renderingStyle}>
          <button
            style={{
              margin: 0,
              padding: 0,
              backgroundColor: "transparent",
              border: "none",
              outline: "none",
            }}
            onClick={() => updateDeviceFeatures(index)}
          >
            <p style={GrayButtonText}>For consumers use?</p>
            <Switch
              checkedChildren="Consumer"
              unCheckedChildren="Internal"
              defaultChecked={record.consumerUses}
            />
          </button>
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
