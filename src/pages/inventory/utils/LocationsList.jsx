import { Table, Typography } from "antd";
import { Subtitle } from "../../../styles/global/Subtitle";

const LocationsList = ({ locations }) => {
  const columns = [
    {
      title: "Location Name",
      dataIndex: "location_name",
      key: "location_name",
    },
    {
      title: "Manager",
      dataIndex: "manager_id",
      key: "manager_id",
      render: (text) => text || "N/A",
    },
     {
      title: "Address Details",
      dataIndex: "address_details",
      key: "address_details",
      render: (text) => text || "N/A",
    },
  ];

  return (
    <div style={{ width: "100%", padding: "20px" }}>
      <Typography style={{ ...Subtitle, marginBottom: "20px" }}>
        Existing Locations
      </Typography>
      <Table
        dataSource={locations}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default LocationsList;
