import { Modal } from "antd";
import renderingTitle from "../../../../../components/general/renderingTitle";
// const renderingTitle = lazy(() =>
//   import("../../../../../components/general/renderingTitle")
// );
const ReportDetailModal = ({
  setOpenLostReportModal,
  openLostReportDetail,
  dataInfo,
}) => {
  const closeModal = () => {
    return setOpenLostReportModal(false);
  };
  return (
    <Modal
      title={renderingTitle("Detail of lost fee collected")}
      centered
      open={openLostReportDetail}
      onCancel={() => closeModal()}
      footer={[]}
      style={{ zIndex: 30 }}
    >
      <div key={dataInfo?.id}>
        <h2>Attendee: {dataInfo?.attendee}</h2>
        <p>Admin: {dataInfo?.admin}</p>
        <p>Device Lost:</p>
        <ul>
          {dataInfo?.deviceLost?.map((device, deviceIndex) => (
            <li key={deviceIndex}>
              {device.label} - {device.deviceType}
            </li>
          ))}
        </ul>
        <p>Amount: ${dataInfo?.amount}</p>
        <p>Type Collection: {dataInfo?.typeCollection}</p>
        <p>ID: {dataInfo?.id}</p>
        <hr />
      </div>
    </Modal>
  );
};

export default ReportDetailModal;
