import { Modal, Table } from "antd";

const DisplayItemTypesPerLocationModal = ({
  id_key,
  openDetails,
  closeModal,
  nodeName,
  rows,
  columns,
}) => {
//   console.log(id_key, openDetails, closeModal, nodeName, rows, columns);

  return (
    <Modal
      key={id_key}
      open={openDetails}
      onCancel={closeModal}
      footer={null}
      width={600}
      maskClosable={false}
      title={`Item Types in ${nodeName} (${rows?.length} types)`}
    >
      <Table
        columns={columns}
        dataSource={rows}
        rowKey="key"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        scroll={{ y: 400 }}
        size="small"
      />
    </Modal>
  );
};
export default DisplayItemTypesPerLocationModal;
