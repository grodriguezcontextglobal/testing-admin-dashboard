import { Badge, Table } from "antd";
export const ExpandedRowRender = ({ event, check }) => {
  const substractingDeviceSetupRecord = () => {
    let result = [];
    for (let data of event) {
      result = [
        ...result,
        {
          device: [...data.deviceSetup],
          eventName: data.eventInfoDetail.eventName,
          status: data.active,
        },
      ];
    }
    return result;
  };
  substractingDeviceSetupRecord();
  const printDeviceRecord = () => {
    let result = [];
    for (let data of substractingDeviceSetupRecord()) {
      for (let item of data.device) {
        if (item._id === check._id) {
          result = [
            {
              event: data.eventName,
              status: data.status,
              quantity: item.quantity,
            },
            ...result,
          ];
        }
      }
    }
    return result;
  };
  const columns = [
    {
      title: "Event",
      dataIndex: "event",
      key: "event",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        if (status) return <Badge status="success" text="Active" />;
        return <Badge status="error" text="Completed" />;
      },
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },
  ];

  return (
      <Table
        key={"nested-item-table"}
        columns={columns}
        dataSource={printDeviceRecord()}
        pagination={false}
      />
  );
};
