import { Alert } from "antd";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../components/UX/modal/ModalUX";
import TourModal from "../utils/TourModal";

import DocumentInventoryXLSXUpload from "../../../components/documents/DocumentInventoryXLSXUpload";

/**
 * AddInventoryFromXLSXFile Component
 *
 * Modal interface for bulk inventory import via Excel files.
 *
 * Responsibilities:
 * - Provides a guided tour for file formatting.
 * - Handles file upload and processing via `DocumentXLSXUpload`.
 * - Enforces access control by blocking the upload interface for unauthorized users.
 *
 * Permission Logic:
 * - Checks if the user has `create: true` in at least one location in `managerLocation`.
 * - Displays an error alert if no create permissions are found.
 *
 * @param {Object} props
 * @param {boolean} props.openModal - Controls modal visibility.
 * @param {Function} props.closeModal - Callback to close the modal.
 */
const AddInventoryFromXLSXFile = ({ openModal, closeModal }) => {
  const [tourModal, setTourModal] = useState(false);
  const { role, locations } = useSelector(state => state.permission)
  const canCreate = useMemo(() => {
    if (role === "0") {
      return true;
    }
    if (Array.isArray(locations)) {
      return locations.some(
        (location) => location.assign || location.create || location.update
      );
    }
    return false;
  }, [role, locations]);

  const closingModal = () => {
    return closeModal(false);
  };
  const bodyModal = () => {
    if (!canCreate) {
      return (
        <Alert
          message="Permission Denied"
          description="You do not have permission to create inventory items in any location."
          type="error"
          showIcon
        />
      );
    }
    return (
      <>{tourModal && <TourModal open={tourModal} setOpen={setTourModal} />}</>
    );
  };
  return (
    <ModalUX
      openDialog={openModal}
      closeModal={closingModal}
      title="Add Inventory from file (.xlsx, .xls)"
      body={bodyModal()}
      footer={[
        <div key="footer-buttons" style={{ display: "flex", gap: "8px" }}>
          <GrayButtonComponent
            key="tour-button"
            title="Inventory Import Template Guide"
            func={() => setTourModal(true)}
          />
          {canCreate && <DocumentInventoryXLSXUpload closeModal={closeModal} key="upload-button" />}
        </div>,
      ]}
    />
  );
};

export default AddInventoryFromXLSXFile;
