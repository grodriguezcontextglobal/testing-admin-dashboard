import { Modal } from "antd";
import { useMemo } from "react";
import BaseTable from "../../../../components/ux/tables/BaseTable";

const ModalAllItemsBasedOnGroup = ({
  openModalItemList,
  setOpenModalItemList,
  deviceTitle,
  database,
}) => {
  const closeModal = () => {
    return setOpenModalItemList(false);
  };
  // Function to sort and filter data based on deviceTitle
  const sortedAndFilteredData = useMemo(() => {
    if (!database?.database?.receiversInventory) return [];

    try {
      // Parse the JSON string from receiversInventory
      const inventoryData = JSON.parse(database?.database?.receiversInventory);
      // Filter data by deviceTitle (type field) and sort by device ID
      const filteredData = inventoryData
        .filter((item) => item.type === deviceTitle)
        .sort((a, b) => {
          // Sort by device ID numerically
          const deviceA = parseInt(a.device) || 0;
          const deviceB = parseInt(b.device) || 0;
          return deviceA - deviceB;
        })
        .map((item, index) => ({
          ...item,
          key: item.id || index, // Add key for React table rendering
        }));
      return filteredData;
    } catch (error) {
      console.error("Error parsing receiversInventory:", error);
      return [];
    }
  }, [database, deviceTitle]);

  const columns = [
    {
      title: "Device ID",
      dataIndex: "device",
      key: "device",
      sorter: (a, b) => {
        const deviceA = parseInt(a.device) || 0;
        const deviceB = parseInt(b.device) || 0;
        return deviceA - deviceB;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Operational", value: "Operational" },
        { text: "Non-operational", value: "Non-operational" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Device type",
      dataIndex: "type",
      key: "type",
    },
  ];

  return (
    <Modal
      open={openModalItemList}
      onCancel={() => closeModal()}
      footer={null}
      width={1200}
      maskClosable={false}
      title={`List of all serial numbers of ${deviceTitle} (${sortedAndFilteredData.length} items)`}
      style={{ zIndex: 30 }}
    >
      <BaseTable
        columns={columns}
        dataSource={sortedAndFilteredData}
        style={{
          cursor: "pointer",
        }}
        enablePagination={true}
        // pagination={{
        //   pageSize: 10,
        //   showSizeChanger: true,
        //   showQuickJumper: true,
        //   showTotal: (total, range) =>
        //     `${range[0]}-${range[1]} of ${total} items`,
        // }}
        // scroll={{ y: 400 }}
      />
    </Modal>
  );
};

export default ModalAllItemsBasedOnGroup;
