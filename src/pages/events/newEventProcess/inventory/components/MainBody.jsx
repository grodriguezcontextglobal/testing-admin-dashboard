import { Grid, InputLabel, Typography } from "@mui/material";
import { Button, Select } from "antd";
import GrayButtonText from "../../../../../styles/global/GrayButtonText";
import { GrayButton } from "../../../../../styles/global/GrayButton";
import LightBlueButtonText from "../../../../../styles/global/LightBlueButtonText";
import { PlusIcon } from "../../../../../components/icons/PlusIcon";
import { LightBlueButton } from "../../../../../styles/global/LightBlueButton";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import { TextFontSize20LineHeight30 } from "../../../../../styles/global/TextFontSize20HeightLine30";
import Services from "../extra/Services";
import SelectedItemsRendered from "./SelectedItemsRendered";
import NoMerchantService from "./NoMerchantService";
import MerchantService from "./MerchantService";
import { AntSelectorStyle } from "../../../../../styles/global/AntSelectorStyle";
import RefreshButton from "../../../../../components/utils/UX/RefreshButton";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";

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
  renderingStyle,
  selectedItem,
  selectOptions,
  setAssignAllDevices,
  setDisplayFormToCreateCategory,
  setSelectedItem,
  setValue,
  staff,
  triggerAddingAdminStaff,
}) => {
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
              style={{
                ...TextFontSize20LineHeight30,
                color: "var(--gray600)",
              }}
            >
              Assign from existing groups in the inventory
            </Typography>
          </InputLabel>
          <Typography
            textTransform="none"
            textAlign="justify"
            style={{
              ...Subtitle,
              color: "var(--gray600)",
              wordWrap: "break-word",
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              margin: "0.2rem auto 1rem",
            }}
          >
            You can select groups of devices from existing inventory in your
            database and assign to this event. When assigning, you can choose
            the whole group of devices, or only a range of serial numbers per
            group. You will see the groups selected as small tags below.
          </Typography>
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
                justifyContent: "flex-start",
                alignItems: "center",
              }}
            >
              <Typography
                textTransform="none"
                style={{ ...TextFontSize20LineHeight30, fontWeight: 600 }}
              >
                Existing groups
              </Typography>
            </InputLabel>
            <InputLabel
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                margin: "0 0 0.5rem",
              }}
            >
              <Typography
                textTransform="none"
                style={{
                  ...TextFontSize20LineHeight30,
                  fontWeight: 600,
                  fontSize: "14px",
                  color: "#000",
                }}
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
          Generate a new category or group of devices
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
        If you haven&apos;t added the devices you&apos;re taking to this event
        into the inventory, create a new category of devices for this event; or
        create a new group within an existing category. Then you can enter a
        range of serial numbers starting with a serial number base, to register
        the new devices in your inventory.
      </Typography>
      <Button
        // disabled
        onClick={() =>
          setDisplayFormToCreateCategory(!displayFormToCreateCategory)
        }
        style={{
          ...LightBlueButton,
          width: "fit-content",
          margin: "1rem auto",
        }}
      >
        <Typography textTransform="none" style={{ ...LightBlueButtonText,  ...CenteringGrid }}>
          <PlusIcon /> Create a new category or group
        </Typography>
      </Button>
      {displayFormToCreateCategory && (
        <FormDeviceTrackingMethod
          // existingData={optionsToRenderInSelector()}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
          setDisplayFormToCreateCategory={setDisplayFormToCreateCategory}
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
        <Button
          disabled={staff.adminUser.length === 0}
          onClick={() => navigate("/create-event-page/review-submit")}
          style={{
            ...GrayButton,
            width: "100%",
          }}
        >
          <Typography
            style={{
              ...GrayButtonText,
              color:
                staff.adminUser.length === 0 &&
                "var(--disabled-gray-button-text)",
              textTransform: "none",
            }}
          >
            Skip this step
          </Typography>
        </Button>
        <Button
          disabled={filled}
          onClick={(e) => handleNextStepEventSetup(e)}
          style={renderingStyle().button}
        >
          <Typography style={renderingStyle().text}>
            {filled
              ? "Service fields are filled. Please clear the fields or add service to continue."
              : "Next step"}
          </Typography>
        </Button>
      </Grid>
    </Grid>
  );
};

export default MainBody;
