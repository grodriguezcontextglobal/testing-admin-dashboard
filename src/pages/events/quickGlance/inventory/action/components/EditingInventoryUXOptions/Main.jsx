import { Divider, Radio, Space, Tooltip, Typography } from "antd";
import { useState } from "react";
import { QuestionIcon } from "../../../../../../../components/icons/QuestionIcon";
import { AppSelectingFromExistingAutomatically } from "./AppSelectingFromExistingAutoimatically";
import { UpdateEventInventoryByAddingSerialNumberOneByOne } from "./UpdateEventInventoryByAddingSerialNumberOneByOne";
import { UpdateEventInventorySubmittingStartingSerialNumber } from "./UpdateEventInventorySubmittingStartingSerialNumber";
import { Box } from "@mui/material";

const Main = ({
  assignAllDevices,
  closeModal,
  handleSubmit,
  loadingStatus,
  openNotification,
  OutlinedInputStyle,
  queryClient,
  RefreshButton,
  register,
  setAssignAllDevices,
  setLoadingStatus,
  Subtitle,
  valueItemSelected,
  watch,
}) => {
  const [mode, setMode] = useState("OPTION_1"); // OPTION_1, OPTION_2, OPTION_3
  const UXMandatoryFieldsSign = (
    <strong style={{ color: "red", fontWeight: 600 }}>*</strong>
  );
  return (
    <Space
      direction="vertical"
      size="large"
      style={{ width: "100%", margin: "0.5rem auto" }}
    >
      <Typography.Title level={5} style={{ margin: "1rem 0 0" }}>
        Update Event Inventory
      </Typography.Title>

      <Radio.Group
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        optionType="button"
        style={{ width: "100%" }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
            gap: 2,
            width: "100%",
          }}
        >
          <Radio.Button
            value="OPTION_1"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              width: "100%",
              height: "auto",
              padding: "8px 0",
              borderRadius: "8px",
            }}
          >
            <Tooltip title="System will add automatically available devices to event inventory.">
              Auto&nbsp;
              <QuestionIcon />
            </Tooltip>
          </Radio.Button>
          <Radio.Button
            value="OPTION_2"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              width: "100%",
              height: "auto",
              padding: "8px 0",
              borderRadius: "8px",
            }}
          >
            <Tooltip title="System will add devices to event inventory starting from the provided serial number.">
              Starting Serial&nbsp;
              <QuestionIcon />
            </Tooltip>
          </Radio.Button>

          <Radio.Button
            value="OPTION_3"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              width: "100%",
              height: "auto",
              padding: "8px 0",
              borderRadius: "8px",
            }}
          >
            <Tooltip title="System will add devices to event inventory one-by-one.">
              Serials One-by-One&nbsp;
              <QuestionIcon />
            </Tooltip>
          </Radio.Button>
        </Box>
      </Radio.Group>

      <Divider style={{ margin: "8px 0" }} />
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {mode === "OPTION_1" && (
          <AppSelectingFromExistingAutomatically
            handleSubmit={handleSubmit}
            assignAllDevices={assignAllDevices}
            closeModal={closeModal}
            setAssignAllDevices={setAssignAllDevices}
            loadingStatus={loadingStatus}
            register={register}
            OutlinedInputStyle={OutlinedInputStyle}
            Subtitle={Subtitle}
            valueItemSelected={valueItemSelected}
            setLoadingStatus={setLoadingStatus}
            watch={watch}
            RefreshButton={RefreshButton}
            queryClient={queryClient}
            openNotification={openNotification}
            UXMandatoryFieldsSign={UXMandatoryFieldsSign}
          />
        )}

        {mode === "OPTION_2" && (
          <UpdateEventInventorySubmittingStartingSerialNumber
            assignAllDevices={assignAllDevices}
            closeModal={closeModal}
            handleSubmit={handleSubmit}
            loadingStatus={loadingStatus}
            openNotification={openNotification}
            OutlinedInputStyle={OutlinedInputStyle}
            queryClient={queryClient}
            register={register}
            setAssignAllDevices={setAssignAllDevices}
            setLoadingStatus={setLoadingStatus}
            Subtitle={Subtitle}
            valueItemSelected={valueItemSelected}
            watch={watch}
            UXMandatoryFieldsSign={UXMandatoryFieldsSign}
          />
        )}

        {mode === "OPTION_3" && (
          <UpdateEventInventoryByAddingSerialNumberOneByOne
            handleSubmit={handleSubmit}
            loadingStatus={loadingStatus}
            register={register}
            OutlinedInputStyle={OutlinedInputStyle}
            Subtitle={Subtitle}
            valueItemSelected={valueItemSelected}
            closeModal={closeModal}
            openNotification={openNotification}
            queryClient={queryClient}
            setLoadingStatus={setLoadingStatus}
            watch={watch}
            UXMandatoryFieldsSign={UXMandatoryFieldsSign}
          />
        )}
      </Space>
    </Space>
  );
};

export default Main;
