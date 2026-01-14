import { Grid, InputLabel, Typography } from "@mui/material";
import { Select } from "antd";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import LightBlueButtonComponent from "../../../../../components/UX/buttons/LigthBlueButton";
import { RectangleBluePlusIcon } from "../../../../../components/icons/RectangleBluePlusIcon";
import RefreshButton from "../../../../../components/utils/UX/RefreshButton";
import { AntSelectorStyle } from "../../../../../styles/global/AntSelectorStyle";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import { TextFontSize20LineHeight30 } from "../../../../../styles/global/TextFontSize20HeightLine30";
import Services from "../extra/Services";
import MerchantService from "./MerchantService";
import NoMerchantService from "./NoMerchantService";
import SelectedItemsRendered from "./SelectedItemsRendered";
import { useStaffRoleAndLocations } from "../../../../../utils/checkStaffRoleAndLocations";

const MainBody = ({
  AddingEventCreated,
  FormDeviceTrackingMethod,
  assignAllDevices,
  displayFormToCreateCategory,
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
  // renderingStyle,
  selectedItem,
  selectOptions,
  setAssignAllDevices,
  setDisplayFormToCreateCategory,
  setSelectedItem,
  setValue,
  staff,
  triggerAddingAdminStaff,
}) => {
  const { locationsManagePermission } = useStaffRoleAndLocations();
  return (
    <Grid
      container
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
      key={"settingUp-deviceList-event"}
    >
      {triggerAddingAdminStaff && <AddingEventCreated />}
      {!displayFormToCreateCategory && (
        <>
          {" "}
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
              />
            ) : (
              <NoMerchantService
                assignAllDevices={assignAllDevices}
                setAssignAllDevices={setAssignAllDevices}
                handleAddingNewItemToDeviceSetupEvent={
                  handleAddingNewItemToDeviceSetupEvent
                }
              />
            )}
            <SelectedItemsRendered
              selectedItem={selectedItem}
              removeItemSelected={removeItemSelected}
            />
          </Grid>
        </>
      )}{" "}
      <InputLabel
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          margin: "2rem auto 0.5rem",
        }}
      >
        <Typography
          textTransform="none"
          style={{ ...TextFontSize20LineHeight30, fontWeight: 600 }}
          color="var(--gray600)"
        >
          Add new inventory for company
        </Typography>
      </InputLabel>
      <Typography
        style={{
          ...Subtitle,
          wordWrap: "break-word",
          width: "100%",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        Use this section to create new company inventory that can be used in
        this event. Inventory created here is classified as Rental equipment
        (not owned company equipment) and will be available to be assigned to
        the event. If you need to create owned company inventory, please go to
        the Inventory page, add the new owned inventory there, and then assign
        it to this event.
      </Typography>
      {locationsManagePermission.length > 0 && (
        <LightBlueButtonComponent
          title={
            displayFormToCreateCategory
              ? "Close form for new inventory"
              : "Add new category or group"
          }
          buttonType="button"
          func={() =>
            setDisplayFormToCreateCategory(!displayFormToCreateCategory)
          }
          styles={{ width: "100%", margin: "1rem auto" }}
          icon={displayFormToCreateCategory ? null : <RectangleBluePlusIcon />}
        />
      )}
      {displayFormToCreateCategory && (
        <FormDeviceTrackingMethod
          // existingData={optionsToRenderInSelector()}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
          setDisplayFormToCreateCategory={setDisplayFormToCreateCategory}
          eventInfoDetail={eventInfoDetail}
        />
      )}
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
          display: `${displayFormToCreateCategory ? "none" : "flex"}`,
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
        <GrayButtonComponent
          title={"Skip this step"}
          disabled={
            (!eventInfoDetail.eventName && !eventInfoDetail.building) ||
            staff.adminUser.length === 0
          }
          func={() => navigate("/create-event-page/review-submit")}
          styles={{ width: "100%" }}
        />
        <BlueButtonComponent
          title={
            filled
              ? "Service fields are filled. Please clear the fields or add service to continue."
              : "Next step"
          }
          disabled={
            (!eventInfoDetail.eventName && !eventInfoDetail.building) || filled
          }
          func={(e) => handleNextStepEventSetup(e)}
          styles={{ width: "100%" }}
          titleStyles={{ textWrap: "balance", width: "100%" }}
        />
      </Grid>
    </Grid>
  );
};

export default MainBody;
