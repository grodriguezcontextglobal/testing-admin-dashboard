import { Divider, Radio, Space, Tooltip, Typography } from "antd";
import { useState } from "react";
import { QuestionIcon } from "../../../../../../../components/icons/QuestionIcon";
import { AppSelectingFromExistingAutomatically } from "./AppSelectingFromExistingAutoimatically";
import { UpdateEventInventoryByAddingSerialNumberOneByOne } from "./UpdateEventInventoryByAddingSerialNumberOneByOne";
import { UpdateEventInventorySubmittingStartingSerialNumber } from "./UpdateEventInventorySubmittingStartingSerialNumber";

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
        block
        style={{ width: "100%", alignItems: "center" }}
      >
        <Radio.Button value="OPTION_1" style={{ alignItems: "center" }}>
          <Tooltip title="System will add automatically available devices to event inventory.">
            Auto&nbsp;
            <QuestionIcon />
          </Tooltip>
        </Radio.Button>
        <Radio.Button value="OPTION_2" style={{ alignItems: "center" }}>
          <Tooltip title="System will add devices to event inventory starting from the provided serial number.">
            Starting Serial&nbsp;
            <QuestionIcon />
          </Tooltip>
        </Radio.Button>

        <Radio.Button value="OPTION_3" style={{ alignItems: "center" }}>
          <Tooltip title="System will add devices to event inventory one-by-one.">
            Serials One-by-One&nbsp;
            <QuestionIcon />
          </Tooltip>
        </Radio.Button>
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
            watch={watch}
            UXMandatoryFieldsSign={UXMandatoryFieldsSign}
          />
        )}
        {mode === "OPTION_3" && (
          <UpdateEventInventoryByAddingSerialNumberOneByOne
            closeModal={closeModal}
            handleSubmit={handleSubmit}
            loadingStatus={loadingStatus}
            openNotification={openNotification}
            OutlinedInputStyle={OutlinedInputStyle}
            queryClient={queryClient}
            register={register}
            setLoadingStatus={setLoadingStatus}
            Subtitle={Subtitle}
            watch={watch}
            UXMandatoryFieldsSign={UXMandatoryFieldsSign}
          />
        )}
      </Space>
    </Space>
  );
};

export default Main;
