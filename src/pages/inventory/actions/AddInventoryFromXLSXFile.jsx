import { useState, useMemo } from "react";
import DocumentXLSXUpload from "../../../components/documents/DocumentXLSXUpload";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../components/UX/modal/ModalUX";
import TourModal from "../utils/TourModal";
import { useSelector } from "react-redux";
import { Alert } from "antd";

import { getPermittedLocations } from "./utils/permissionUtils";

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
  const { user } = useSelector((state) => state.admin);

  // Check if user has create permission in ANY location
  const canCreate = useMemo(() => {
    const permittedLocations = getPermittedLocations(user, "create");
    // If null, it means ALL locations (Role 0)
    // If array, check if it has length > 0
    return permittedLocations === null || permittedLocations.length > 0;
  }, [user]);

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
          {canCreate && <DocumentXLSXUpload key="upload-button" />}
        </div>,
      ]}
    />
  );
};

export default AddInventoryFromXLSXFile;
