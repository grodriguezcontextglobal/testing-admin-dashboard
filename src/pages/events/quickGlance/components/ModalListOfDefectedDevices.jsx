import { Modal, Table } from "antd";

const ModalListOfDefectedDevices = ({
  defectedDeviceList,
  setDefectedDeviceList,
  data
}) => {
  console.log(data)
  const closeModal = () => {
    return setDefectedDeviceList(false);
  };
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
    <Modal
      open={defectedDeviceList}
      onCancel={() => closeModal()}
      footer={null}
      width={1000}
      maskClosable={false}
      title="List of Defected Devices"
    >
      <Table columns={columns} dataSource={data} rowKey="device" />
    </Modal>
  );
};

export default ModalListOfDefectedDevices;
