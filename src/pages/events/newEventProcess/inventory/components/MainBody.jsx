import { Grid, InputLabel, Typography } from "@mui/material";
import { Select } from "antd";
import { useState } from "react";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import RefreshButton from "../../../../../components/utils/UX/RefreshButton";
import { AntSelectorStyle } from "../../../../../styles/global/AntSelectorStyle";
import { TextFontSize20LineHeight30 } from "../../../../../styles/global/TextFontSize20HeightLine30";
import { useStaffRoleAndLocations } from "../../../../../utils/checkStaffRoleAndLocations";
import Services from "../extra/Services";
import MerchantService from "./MerchantService";
import NoMerchantService from "./NoMerchantService";
import SelectedItemsRendered from "./SelectedItemsRendered";
import BannerReusableComponentUntitleUI from "../../../../../components/UX/banner/BannerReusableComponentUntitleUI";

const MainBody = ({
  AddingEventCreated,
  assignAllDevices,
  eventInfoDetail,
  extraServiceAdded,
  filled,
  filledFields,
  handleAddingNewItemToDeviceSetupEvent,
  handleExtraService,
  handleNextStepEventSetup,
  handleRefresh,
  navigate,
  onChange,
  removeItemSelected,
  removeServiceAdded,
  selectedItem,
  selectOptions,
  setAssignAllDevices,
  // setSelectedItem,
  setValue,
  staff,
  triggerAddingAdminStaff,
  register,
  handleSubmit,
}) => {
  const { isAdmin, locationsAssignPermission } = useStaffRoleAndLocations();
  const [openDrawer, setOpenDrawer] = useState(
    locationsAssignPermission.length === 0,
  );
  return (
    <Grid
      container
      display={"flex"}
      // justifyContent={"center"}
      // alignItems={"flex-start"}
      selfAlign={"flex-start"}
      key={"settingUp-deviceList-event"}
      height={"100%"}
    >
      {triggerAddingAdminStaff && <AddingEventCreated />}
      <Grid
        style={{
          borderRadius: "8px",
          border: "1px solid var(--gray300, #D0D5DD)",
          background: "var(--gray100, #F2F4F7)",
          padding: "24px",
          width: "100%",
        }}
        item
        xs={12}
        sm={12}
        md={12}
        lg={12}
      >
        <InputLabel
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            textTransform="none"
            style={{ ...TextFontSize20LineHeight30, fontWeight: 600 }}
          >
            Select from existing inventory
          </Typography>
          <RefreshButton propsFn={handleRefresh} />
        </InputLabel>
        <Select
          className="custom-autocomplete"
          showSearch
          placeholder="Search item to add to inventory."
          optionFilterProp="children"
          style={{ ...AntSelectorStyle, width: "100%" }}
          onChange={onChange}
          options={selectOptions}
        />
        {eventInfoDetail.merchant ? (
          <MerchantService
            assignAllDevices={assignAllDevices}
            setAssignAllDevices={setAssignAllDevices}
            handleAddingNewItemToDeviceSetupEvent={
              handleAddingNewItemToDeviceSetupEvent
            }
            register={register}
            handleSubmit={handleSubmit}
          />
        ) : (
          <NoMerchantService
            assignAllDevices={assignAllDevices}
            setAssignAllDevices={setAssignAllDevices}
            handleAddingNewItemToDeviceSetupEvent={
              handleAddingNewItemToDeviceSetupEvent
            }
            register={register}
            handleSubmit={handleSubmit}
          />
        )}
        <SelectedItemsRendered
          selectedItem={selectedItem}
          removeItemSelected={removeItemSelected}
        />
      </Grid>
      {/* other services component */}
      {eventInfoDetail.merchant && (
        <Services
          handleExtraService={handleExtraService}
          extraServiceAdded={extraServiceAdded}
          removeServiceAdded={removeServiceAdded}
          checkFilledFields={filledFields}
          setValue={setValue}
        />
      )}
      <Grid
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
        {!filled && <GrayButtonComponent
          title={"Skip this step"}
          disabled={
            (!eventInfoDetail.eventName && !eventInfoDetail.building) ||
            staff.adminUser.length === 0
          }
          func={() => navigate("/create-event-page/review-submit")}
          styles={{ width: "100%", maxHeight:"35px" }}
        />}
        {!filled && <BlueButtonComponent
          title={"Next step"}
          disabled={
            (!eventInfoDetail.eventName && !eventInfoDetail.building) || filled
          }
          func={(e) => handleNextStepEventSetup(e)}
          styles={{ width: "100%" }}
          titleStyles={{ textWrap: "balance", width: "100%" }}
        />}
      </Grid>
    </Grid>
  );
};

export default MainBody;
