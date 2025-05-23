import { Button, Grid, InputLabel, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Select } from "antd";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import Loading from "../../../../components/animation/Loading";
import { PlusIcon } from "../../../../components/icons/PlusIcon";
import RefreshButton from "../../../../components/utils/UX/RefreshButton";
import {
  onAddDeviceSetup,
  onAddExtraServiceListSetup,
} from "../../../../store/slices/eventSlice";
import { AntSelectorStyle } from "../../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { GrayButton } from "../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../styles/global/GrayButtonText";
import { LightBlueButton } from "../../../../styles/global/LightBlueButton";
import LightBlueButtonText from "../../../../styles/global/LightBlueButtonText";
import { Subtitle } from "../../../../styles/global/Subtitle";
import { TextFontSize20LineHeight30 } from "../../../../styles/global/TextFontSize20HeightLine30";
import "../../../../styles/global/ant-select.css";
import MerchantService from "./components/MerchantService";
import NoMerchantService from "./components/NoMerchantService";
import SelectedItemsRendered from "./components/SelectedItemsRendered";
import Services from "./extra/Services";
const AddingEventCreated = lazy(() =>
  import("../staff/components/AddingEventCreated")
);
const FormDeviceTrackingMethod = lazy(() =>
  import("./newItemSetup/FormDeviceTrackingMethod")
);
const Form = () => {
  const { setValue } = useForm();
  const { user } = useSelector((state) => state.admin);
  const { deviceSetup, staff, eventInfoDetail, extraServiceListSetup } =
    useSelector((state) => state.event);
  const [displayFormToCreateCategory, setDisplayFormToCreateCategory] =
    useState(false);
  const [valueItemSelected, setValueItemSelected] = useState({});
  const [selectedItem, setSelectedItem] = useState(deviceSetup);
  const [extraServiceAdded, setExtraServiceAdded] = useState(
    extraServiceListSetup ?? []
  );
  const [assignAllDevices, setAssignAllDevices] = useState(false);
  const [triggerAddingAdminStaff, setTriggerAddingAdminStaff] = useState(false);
  const [filled, setFilled] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const itemQuery = useQuery({
    queryKey: ["companyInventorySectionQuery", user.sqlInfo.company_id],
    queryFn: () =>
      devitrakApi.post("/db_event/retrieve-item-group-quantity-with-format", {
        company_id: user.sqlInfo.company_id,
        warehouse: 1,
        enableAssignFeature: 1,
      }),
    enabled: !!user.sqlInfo.company_id,
    staleTime: 1 * 60 * 1000, // 1 minute cache
  });

  useEffect(() => {
    const controller = new AbortController();
    if (staff.adminUser.length === 0) {
      return setTriggerAddingAdminStaff(true);
    }
    return () => {
      controller.abort();
    };
  }, []);

  const onChange = (value) => {
    const optionRendering = JSON.parse(value);
    setValueItemSelected(optionRendering);
  };

  const removeItemSelected = (item) => {
    const filter = selectedItem.filter((_, index) => index !== item);
    dispatch(onAddDeviceSetup(filter));
    return setSelectedItem(filter);
  };

  const removeServiceAdded = (item) => {
    const filter = extraServiceAdded.filter((_, index) => index !== item);
    setExtraServiceAdded(filter);
    dispatch(onAddExtraServiceListSetup(filter));
    return null;
  };

  const checkItemToAddAndAvailableQuantity = (props) => {
    const check = selectedItem.some(
      (element) => element.item_group === `${valueItemSelected.item_group}`
    );
    if (check) {
      const item = selectedItem.find(
        (element) => element.item_group === `${valueItemSelected.item_group}`
      );
      const checkQuantity = Number(item.quantity) + Number(props);
      return checkQuantity > valueItemSelected.qty;
    } else {
      return props > valueItemSelected.qty;
    }
  };

  const addingQuantity = (a = 0, b = 0) => {
    return Number(a) + Number(b);
  };

  const updateQuantity = (props) => {
    let resulting = [...selectedItem];
    let eleIndex = selectedItem.findIndex(
      (element) => element.item_group === `${valueItemSelected.item_group}`
    );
    if (eleIndex > -1) {
      resulting[eleIndex] = {
        ...resulting[eleIndex],
        quantity: `${addingQuantity(resulting[eleIndex].quantity, props)}`,
      };
    }
    setSelectedItem(resulting);
    dispatch(onAddDeviceSetup(resulting));
    setValue("quantity", "");
    setAssignAllDevices(false);
    return null;
  };

  const checkIfNewAddedItemAlreadyWasAdded = () => {
    const check = selectedItem.some(
      (element) => element.item_group === `${valueItemSelected.item_group}`
    );
    return check;
  };
  const handleAddingNewItemToDeviceSetupEvent = async (data) => {
    if (
      !assignAllDevices &&
      checkItemToAddAndAvailableQuantity(data.quantity)
    ) {
      return alert("Quantity is not available");
    }
    if (checkIfNewAddedItemAlreadyWasAdded()) {
      return updateQuantity(data.quantity);
    } else {
      const resulting = [
        ...selectedItem,
        {
          ...data,
          ...valueItemSelected,
          cost: eventInfoDetail.merchant ? data.deposit : 0, //valueItemSelected[0].cost,
          quantity: assignAllDevices
            ? valueItemSelected.qty
            : Number(data.quantity),
          existing: true,
          consumerUses: false,
          company: user.company,
          ownership: data.ownership ? data.ownership : "Rent",
        },
      ];
      setSelectedItem(resulting);
      dispatch(onAddDeviceSetup(resulting));
      setValue("quantity", "");
      setAssignAllDevices(false);
      return;
    }
  };

  const handleNextStepEventSetup = () => {
    dispatch(onAddDeviceSetup(selectedItem));
    return navigate("/create-event-page/review-submit");
  };

  const renderingStyle = () => {
    if (filled) {
      return {
        button: {
          ...BlueButton,
          background: "var(--disabled-blue-button)",
          width: "100%",
          border: "transparent",
        },
        text: {
          ...BlueButtonText,
          color: "var(--danger-action)",
          textTransform: "none",
          textWrap: "balance",
        },
      };
    } else {
      return {
        button: {
          ...BlueButton,
          width: "100%",
        },
        text: {
          ...BlueButtonText,
          textTransform: "none",
        },
      };
    }
  };

  const handleExtraService = (data) => {
    const resulting = [...extraServiceAdded, data];
    setExtraServiceAdded(resulting);
    dispatch(onAddExtraServiceListSetup(resulting));
    setValue("deposit", "");
    setValue("service", "");
    return null;
  };

  const filledFields = (props) => {
    return setFilled(props);
  };

  const handleRefresh = async () => {
    return itemQuery.refetch();
  };

  const selectOptions = useMemo(() => {
    const result = [];

    if (itemQuery.data) {
      const groupedInventory = itemQuery.data.data.groupedInventory;
      for (const item of groupedInventory) {
        // Render Location Row with quantity
        result.push({
          key: `${item.item_group}-${item.category_name}`,
          label: (
            <Typography
              textTransform={"capitalize"}
              style={{
                ...Subtitle,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    width: "fit-content",
                    marginRight: "5px",
                  }}
                >
                  {item.category_name}
                </span>
                {item.item_group}
              </div>
              <span style={{ textAlign: "right", width: "50%" }}>
                Available: {item.quantity}
              </span>
            </Typography>
          ),
          value: JSON.stringify({
            category_name: item.category_name,
            item_group: item.item_group,
            brand: item.brand,
            descript_item: item.descript_item,
            qty: item.quantity,
            quantity: item.quantity,
          }),
        });
      }
    }

    return result;
  }, [itemQuery.data]);

  console.log("selectedItem", selectedItem);
  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
        </div>
      }
    >
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
          into the inventory, create a new category of devices for this event;
          or create a new group within an existing category. Then you can enter
          a range of serial numbers starting with a serial number base, to
          register the new devices in your inventory.
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
          <PlusIcon />{" "}
          <Typography textTransform="none" style={LightBlueButtonText}>
            Create a new category or group
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
    </Suspense>
  );
};

export default Form;

// const itemQuery = useQuery({
//   queryKey: ["listOfItems"],
//   queryFn: () =>
//     devitrakApi.get(
//       `/db_item/check-item?company_id=${
//         user.sqlInfo.company_id
//       }&warehouse=${1}&enableAssignFeature=${1}`
//     ),
// });
// const dataFound = itemQuery?.data?.data?.items ?? [];
// const optionsToRenderInSelector = () => {
//   const checkLocation = new Map();
//   const groupingByCategories = groupBy(dataFound, "category_name");
//   for (let [key, value] of Object.entries(groupingByCategories)) {
//     groupingByCategories[key] = groupBy(value, "item_group");
//     for (let [key2, value2] of Object.entries(groupingByCategories[key])) {
//       checkLocation.set(`${key}-${key2}`, {
//         category_name: key,
//         item_group: key2,
//         total: value2.length,
//         data: JSON.stringify(value2),
//       });
//     }
//   }
//   const result = new Set();
//   for (let [, value] of checkLocation) {
//     result.add(value);
//   }
//   return Array.from(result);
// };
