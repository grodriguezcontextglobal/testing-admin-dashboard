import { Modal } from "antd";
import { RightNarrowInCircle } from "../../../../components/icons/RightNarrowInCircle";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { onAddDeviceToDisplayInQuickGlance } from "../../../../store/slices/devicesHandleSlice";
import ExpandableTable from "../../../../components/UX/tables/ExpandableTable";
import BaseTable from "../../../../components/UX/tables/BaseTable";

const ModalListOfDefectedDevices = ({
  defectedDeviceList,
  setDefectedDeviceList,
  data,
}) => {
  const closeModal = () => {
    return setDefectedDeviceList(false);
  };
  const dispatch = useDispatch();
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
        qty: value?.length,
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
      {
        title: "",
        dataIndex: "action",
        key: "action",
        render: (_, y) => {
          /**
           * {
    "company": [
        "Item1",
        "Invoxia, Inc."
    ],
    "activity": false,
    "status": "Damaged",
    "serialNumber": "986953",
    "user": false,
    "entireData": {
        "eventSelected": "TEST_DOCUMENTS",
        "device": "986953",
        "type": "Item1",
        "status": "Damaged",
        "activity": false,
        "comment": "No comment",
        "provider": "Invoxia, Inc.",
        "company": "684c09f3c88882452719934a",
        "contract_type": "event",
        "id": "68c061570002153f1e5840c8"
    }
}
           */
          const template = {
            activity: y.activity,
            company: [y.type, y.provider],
            serialNumber: y.device,
            user: y.activity,
            entireData: {
              eventSelected: y.eventSelected,
              device: y.device,
              type: y.type,
              status: y.status,
              activity: y.activity,
              comment: y.comment,
              provider: y.provider,
              company: y.company,
              contract_type: y.contract_type,
              id: y.id,
            },
          };
          return (
            <Link to="/device-quick-glance">
              <button
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  margin: 0,
                  padding: 0,
                }}
                onClick={() =>
                  dispatch(onAddDeviceToDisplayInQuickGlance({ ...template }))
                }
              >
                <RightNarrowInCircle />
              </button>
            </Link>
          );
        },
      },
    ];

    return <ExpandableTable columns={columns} dataSource={record.report} />;
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
      style={{ zIndex: 30 }}
    >
      <BaseTable
        columns={columns}
        dataSource={dataToRender()}
        expandable={{
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
