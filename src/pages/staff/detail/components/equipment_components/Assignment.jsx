import { Grid } from "@mui/material";
import { Divider, Modal, Switch } from "antd";
import { PropTypes } from "prop-types";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import "../../../../../styles/global/ant-select.css";
import AssignemntNewDeviceInInventory from "./assingmentComponents/AssignemntNewDeviceInInventory";
import AssignmentFromExistingInventory from "./assingmentComponents/AssignmentFromExistingInventory";
const Assignment = () => {
  const { profile } = useSelector((state) => state.staffDetail);
  const [existingOption, setExistingOption] = useState(true);
  const navigate = useNavigate();
  const closeModal = () => {
    return navigate(`/staff/${profile.adminUserInfo.id}/main`);
  };
  return (
      <Modal open={true} onCancel={() => closeModal()} width={1000} footer={[]}>
        <Grid
          container
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          marginY={2}
          key={"settingUp-deviceList-event"}
        >
          {/* {contextHolder} */}
          <p
            style={{
              ...Subtitle,
              textTransform: "none",
              margin: "0.2rem auto 0.5rem",
              wordWrap: "break-word",
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            You can select groups of devices from existing inventory in your
            database and assign to this event. When assigning, you can choose
            the whole group of devices, or only a range of serial numbers per
            group. You will see the groups selected as small tags below.
          </p>
          <Divider>
            <Switch
              value={existingOption}
              onChange={() => setExistingOption(!existingOption)}
              checkedChildren="From existing inventory"
              unCheckedChildren="New inventory device"
              defaultChecked
            />
          </Divider>
          {existingOption ? (
            <AssignmentFromExistingInventory />
          ) : (
            <AssignemntNewDeviceInInventory />
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

{
  /* <Grid
              style={{
                borderRadius: "8px",
                border: "1px solid var(--gray-300, #D0D5DD)",
                background: "var(--gray-100, #F2F4F7)",
                padding: "24px",
                width: "100%",
              }}
              item
              xs={12}
              sm={12}
              md={12}
              lg={12}
            >
              <InputLabel style={{ marginBottom: "0.5rem", width: "100%" }}>
                <Typography style={Subtitle}>
                  Location where device is going to be used.
                </Typography>
              </InputLabel>
              <div
                style={{
                  ...CenteringGrid,
                  justifyContent: "space-between",
                  margin: "0 0 20px 0",
                  gap: "1rem",
                }}
              >
                <div style={{ width: "50%" }}>
                  <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                    <Typography style={Subtitle}>Street</Typography>
                  </InputLabel>
                  <OutlinedInput
                    {...register("street")}
                    disabled={loadingStatus}
                    style={{
                      ...OutlinedInputStyle,
                      width: "100%",
                    }}
                    fullWidth
                  />
                </div>
                <div style={{ width: "50%" }}>
                  <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                    <Typography style={Subtitle}>City</Typography>
                  </InputLabel>
                  <OutlinedInput
                    disabled={loadingStatus}
                    {...register("city")}
                    style={{
                      ...OutlinedInputStyle,
                      width: "100%",
                    }}
                    fullWidth
                  />
                </div>
              </div>
              <div
                style={{
                  ...CenteringGrid,
                  justifyContent: "space-between",
                  margin: "0 0 20px 0",
                  gap: "1rem",
                }}
              >
                <div style={{ width: "50%" }}>
                  <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                    <Typography style={Subtitle}>State</Typography>
                  </InputLabel>
                  <OutlinedInput
                    {...register("state")}
                    disabled={loadingStatus}
                    style={{
                      ...OutlinedInputStyle,
                      width: "100%",
                    }}
                    fullWidth
                  />
                </div>
                <div style={{ width: "50%" }}>
                  <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                    <Typography style={Subtitle}>Zip</Typography>
                  </InputLabel>
                  <OutlinedInput
                    disabled={loadingStatus}
                    {...register("zip")}
                    style={{
                      ...OutlinedInputStyle,
                      width: "100%",
                    }}
                    fullWidth
                  />
                </div>
              </div>

              <InputLabel
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                }}
              >
                <Typography
                  textTransform="none"
                  style={{ ...TextFontSize20LineHeight30, fontWeight: 600 }}
                >
                  Device
                </Typography>
              </InputLabel> */
}
{
  /* </Grid> */
}
{
  /* <Grid
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.5rem",
              }}
              marginY={"0.5rem"}
              item
              xs={12}
              sm={12}
              md={12}
              lg={12}
            >
              <Button
                onClick={() =>
                  navigate(`/staff/${profile.adminUserInfo.id}/main`)
                }
                style={{ ...GrayButton, ...CenteringGrid, width: "100%" }}
              >
                <p style={{ ...GrayButtonText, textTransform: "none" }}>
                  Go back
                </p>
              </Button>
              <Button
                onClick={() => assignDeviceToStaffMember()}
                style={{ ...BlueButton, ...CenteringGrid, width: "100%" }}
              >
                <p style={BlueButtonText}>Assign equipment</p>
              </Button>
            </Grid> */
}
