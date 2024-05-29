import { Icon } from "@iconify/react/dist/iconify.js";
import { Modal, Table } from "antd";

const ModalListOfDefectedDevices = ({
  defectedDeviceList,
  setDefectedDeviceList,
  data,
}) => {
  const closeModal = () => {
    return setDefectedDeviceList(false);
  };

  const dataToRender = () => {
    const result = new Map();
    for (let item of data) {
      if (!result.has(item.status)) {
        result.set(item.status, [item]);
      } else {
        result.set(item.status, [...result.get(item.status), item]);
      }
    }
    const final = new Set();
    for (let [status, value] of result) {
      final.add({
        key: status,
        status: status,
        qty: value.length,
        report: value,
      });
    }
    return Array.from(final);
  };
  const internalRow = (record) => {
    const columns = [
      {
        title: "Device ID",
        dataIndex: "device",
        key: "device",
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
      },
      {
        title: "Device type",
        dataIndex: "type",
        key: "type",
      },
      {
        title: "Comment",
        dataIndex: "comment",
        key: "comment",
      },
    ];

    return (
      <Table columns={columns} dataSource={record.report} rowKey={record.key} />
    );
  };

  const columns = [
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Qty",
      dataIndex: "qty",
      key: "qty",
    },
  ];
  return (
    <Modal
      open={defectedDeviceList}
      onCancel={() => closeModal()}
      footer={null}
      width={1000}
      maskClosable={false}
      title="List of Defected Devices"
    >
      <Table
        columns={columns}
        dataSource={dataToRender()}
        rowKey="device"
        expandable={{
          expandIcon: (record) => {
            if (record.expanded) {
              return (
                <Icon
                  icon="mdi:arrow-collapse"
                  width={20}
                  color="var(--gray300)"
                />
              );
            } else {
              return (
                <Icon
                  icon="mdi:arrow-expand"
                  width={20}
                  color="var(--gray300)"
                />
              );
            }
          },
          expandRowByClick: true,
          expandedRowRender: (record) => internalRow(record),
        }}
        style={{
          cursor: "pointer",
        }}
      />
    </Modal>
  );
};

export default ModalListOfDefectedDevices;
