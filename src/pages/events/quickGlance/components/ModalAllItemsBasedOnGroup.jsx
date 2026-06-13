import { useMemo } from "react";
import ModalUX from "../../../../components/UX/modal/ModalUX";
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

  const sortedAndFilteredData = useMemo(() => {
    if (!database?.receiversInventory) return [];

    try {
      const raw = database.receiversInventory;
      const inventoryData = typeof raw === "string" ? JSON.parse(raw) : raw;

      const filteredData = inventoryData
        .filter((item) => item.type === deviceTitle)
        .sort((a, b) => {
          const deviceA = parseInt(a.device) || 0;
          const deviceB = parseInt(b.device) || 0;
          return deviceA - deviceB;
        })
        .map((item, index) => ({
          ...item,
          key: item.id || index,
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
    <ModalUX
      openDialog={openModalItemList}
      closeModal={closeModal}
      title={`List of all serial numbers of ${deviceTitle} (${sortedAndFilteredData.length} items)`}
      body={
        <BaseTable
          columns={columns}
          dataSource={sortedAndFilteredData}
          style={{
            cursor: "pointer",
          }}
          enablePagination={true}
          pageSize={10}
        />
      }
    />
  );
};

export default ModalAllItemsBasedOnGroup;

