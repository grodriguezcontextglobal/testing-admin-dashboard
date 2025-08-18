import { Grid } from "@mui/material";
import { Divider, Modal } from "antd";
import { PropTypes } from "prop-types";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "../../../../../styles/global/ant-select.css";
// import AssignemntNewDeviceInInventory from "./assingmentComponents/AssignemntNewDeviceInInventory";
import AssignmentFromExistingInventory from "./assingmentComponents/AssignmentFromExistingInventory";
import AssignmentNewDeviceToStaffInInventory from "./assingmentComponents/AssignmentNewDeviceToStaffInInventory";
import CustomizedSwitch from "./assingmentComponents/components/CustomizedSwitch";
const Assignment = () => {
  const { profile } = useSelector((state) => state.staffDetail);
  const [existingOption, setExistingOption] = useState(true);
  const navigate = useNavigate();
  const closeModal = () => {
    return navigate(`/staff/${profile.adminUserInfo.id}/main`);
  };

  return (
    <Modal
      open={true}
      onCancel={() => closeModal()}
      width={1000}
      footer={[]}
      style={{ zIndex: 30 }}
    >
      <Grid
        container
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
        marginY={2}
        key={"settingUp-deviceList-event"}
      >
        <Divider>
          <CustomizedSwitch
            state={existingOption}
            handler={setExistingOption}
          />
        </Divider>
        {existingOption ? (
          <AssignmentFromExistingInventory />
        ) : (
          // <AssignemntNewDeviceInInventory />
          <AssignmentNewDeviceToStaffInInventory />
        )}
      </Grid>
    </Modal>
  );
};

Assignment.propTypes = {
  item_group: PropTypes.string,
  startingNumber: PropTypes.string,
  endingNumber: PropTypes.string,
  deviceInfo: PropTypes.string,
  street: PropTypes.string,
  city: PropTypes.string,
  state: PropTypes.string,
  zip: PropTypes.string,
};

export default Assignment;
