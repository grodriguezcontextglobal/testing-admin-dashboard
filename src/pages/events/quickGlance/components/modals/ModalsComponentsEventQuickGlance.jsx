import { CreateNewConsumer } from "../../../../consumers/utils/CreateNewUser";
import EditingServiceInEvent from "../../inventory/action/components/EditingServiceInEvent";
import EditingInventory from "../../inventory/action/EditingForEventInventory";
import EditingStaff from "../../staff/components/EditingStaff";

const ModalsComponentsEventQuickGlance = ({
  editingInventory,
  setEditingInventory,
  editingServiceInEvent,
  setEditingServiceInEvent,
  editingStaff,
  setEditingStaff,
  createUserButton,
  setCreateUserButton,
}) => {
  return (
    <>
      {editingInventory && (
        <EditingInventory
          editingInventory={editingInventory}
          setEditingInventory={setEditingInventory}
        />
      )}
      {editingServiceInEvent && (
        <EditingServiceInEvent
          editingServicesInEvent={editingServiceInEvent}
          setEditingServicesInEvent={setEditingServiceInEvent}
        />
      )}
      {editingStaff && (
        <EditingStaff
          editingStaff={editingStaff}
          setEditingStaff={setEditingStaff}
        />
      )}
      {createUserButton && (
        <CreateNewConsumer
          createUserButton={createUserButton}
          setCreateUserButton={setCreateUserButton}
        />
      )}
    </>
  );
};

export default ModalsComponentsEventQuickGlance;
