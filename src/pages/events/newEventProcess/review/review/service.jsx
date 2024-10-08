import { Grid, InputLabel } from "@mui/material";
import { Table } from "antd";
import { useSelector } from "react-redux";
import TextFontsize18LineHeight28 from "../../../../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize20LineHeight30 } from "../../../../../styles/global/TextFontSize20HeightLine30";

const Service = () => {
  const { extraServiceListSetup } = useSelector((state) => state.event);

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
      title: "Service",
      dataIndex: "service",
      key: "service",
      render: (text) => <div style={renderingStyle}>{text}</div>,
    },
    {
      title: "Cost",
      dataIndex: "deposit",
      key: "deposit",
      render: (text) => <div style={renderingStyle}>${text}</div>,
    },
  ];

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
          Services added&nbsp;
          <span
            style={{
              ...TextFontsize18LineHeight28,
              fontWeight: 400,
              color: "var(--gray-600, #475467)",
              alignSelf: "stretch",
            }}
          >
            ({extraServiceListSetup?.length ?? 0}{" "}
            {extraServiceListSetup && extraServiceListSetup.length > 1 ? "services" : "service"})
          </span>
        </p>
      </InputLabel>

      <Table
        dataSource={extraServiceListSetup}
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

export default Service;
