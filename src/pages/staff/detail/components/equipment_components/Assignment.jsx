import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import renderingTitle from "../../../../../components/general/renderingTitle";
import ModalUX from "../../../../../components/UX/modal/ModalUX";
import "../../../../../styles/global/ant-select.css";
import AssignmentFromExistingInventory from "./assingmentComponents/AssignmentFromExistingInventory";

/**
 * Handing a device from the warehouse to this staff member.
 *
 * A route that renders a modal: it opens over the profile now that the profile's
 * own content lives in the shell rather than in a sibling route, so closing it
 * returns you to what you were looking at instead of to a blank page.
 *
 * The MUI Grid wrapper, the commented-out switch between "existing inventory"
 * and "new device", and the two imports it needed are gone — both alternatives
 * had been commented out long enough that one of the two components was the only
 * remaining caller of a 636-line hook nothing else used.
 */
const Assignment = () => {
  const { profile } = useSelector((state) => state.staffDetail);
  const navigate = useNavigate();

  const closeModal = () => navigate(`/staff/${profile?.adminUserInfo?.id}/main`);

  return (
    <ModalUX
      title={renderingTitle("Assign a device from the warehouse")}
      body={<AssignmentFromExistingInventory />}
      openDialog
      closeModal={closeModal}
      footer={null}
      width={1000}
    />
  );
};

export default Assignment;
