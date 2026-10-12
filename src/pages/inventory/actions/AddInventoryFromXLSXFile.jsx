import { Alert } from "antd";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { inventoryPageActions } from "../utils/inventoryPageActions";
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
 * - Allows the upload when inventoryPageActions grants create: the role's
 *   permission, narrowed by the location rows in the permission slice.
 * - Displays an error alert otherwise.
 *
 * @param {Object} props
 * @param {boolean} props.openModal - Controls modal visibility.
 * @param {Function} props.closeModal - Callback to close the modal.
 */
const AddInventoryFromXLSXFile = ({ openModal, closeModal }) => {
  const [tourModal, setTourModal] = useState(false);
  const { roleType, locations } = useSelector((state) => state.permission);
  const { canCreate } = useMemo(
    () => inventoryPageActions({ roleType, locations }),
    [roleType, locations]
  );

  const closingModal = () => {
    return closeModal(false);
  };
  const bodyModal = () => {
    if (!canCreate) {
      return (
        <Alert
          message="Permission Denied"
          description="You do not have permission to add inventory items in any location."
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
