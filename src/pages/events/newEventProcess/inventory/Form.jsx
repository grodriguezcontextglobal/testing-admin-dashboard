import { Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import Loading from "../../../../components/animation/Loading";
import {
  onAddDeviceSetup,
  onAddExtraServiceListSetup,
} from "../../../../store/slices/eventSlice";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { Subtitle } from "../../../../styles/global/Subtitle";
import "../../../../styles/global/ant-select.css";
import { useStaffRoleAndLocations } from "../../../../utils/checkStaffRoleAndLocations";
import MainBody from "./components/MainBody";
const AddingEventCreated = lazy(() =>
  import("../staff/components/AddingEventCreated")
);
const FormDeviceTrackingMethod = lazy(() =>
  import("./newItemSetup/FormDeviceTrackingMethod")
);
const Form = () => {
  const { setValue, register, handleSubmit } = useForm();
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
  const { role, locationsAssignPermission } = useStaffRoleAndLocations();
  const bodyFetchRequest = () => {
    if (role === "0" || role === 0) {
      return {
        company_id: user.sqlInfo.company_id,
        warehouse: 1,
        enableAssignFeature: 1,
        logistic_status:"in-stock"
      };
    }
    return {
      company_id: user.sqlInfo.company_id,
      warehouse: 1,
      enableAssignFeature: 1,
      location: locationsAssignPermission,
      logistic_status:"in-stock"
    };
  };
  // const itemQuery = useQuery({
  //   queryKey: ["companyInventorySectionQuery", user.sqlInfo.company_id],
  //   queryFn: () =>
  //     devitrakApi.post(
  //       "/db_event/retrieve-item-group-quantity-with-format",
  //       bodyFetchRequest()
  //     ),
  //   enabled: !!user.sqlInfo.company_id,
  //   staleTime: 1 * 60 * 1000, // 1 minute cache
  // });
  const itemsInInventoryQuery = useQuery({
    queryKey: ["itemGroupExistingLocationList", user.sqlInfo.company_id],
    queryFn: () =>
      devitrakApi.post("/db_event/retrieve-item-group-location-quantity",
        bodyFetchRequest()
        //   {
        //   company_id: user.sqlInfo.company_id,
        //   warehouse: 1,
        //   enableAssignFeature: 1,
        // }
      ),
    enabled: !!user.sqlInfo.company_id,
    staleTime: 1 * 60 * 100, // 1 minutes
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
      return checkQuantity > valueItemSelected.total;
    } else {
      return props > valueItemSelected.total;
    }
  };

  const addingQuantity = (a = 0, b = 0) => {
    return Number(a) + Number(b);
  };

  const updateQuantity = (props) => {
    let resulting = [...selectedItem];
    let eleIndex = selectedItem.findIndex(
      (element) => element.item_group === `${valueItemSelected.item_group}` && element.location === valueItemSelected.location
    );
    if (eleIndex > -1) {
      resulting[eleIndex] = {
        ...resulting[eleIndex],
        quantity: addingQuantity(resulting[eleIndex].quantity, props),
      };
    }
    setSelectedItem(resulting);
    dispatch(onAddDeviceSetup(resulting));
    setValue("quantity", 0);
    setAssignAllDevices(false);
    setValueItemSelected(null);
    return;
  };

  const checkIfNewAddedItemAlreadyWasAdded = () => {
    console.log(selectedItem);
    const check = selectedItem.some(
      (element) => element.item_group === `${valueItemSelected.item_group}` && element.location === valueItemSelected.location
    );
    return check;
  };

  const handleAddingNewItemToDeviceSetupEvent = async (data) => {
    if (
      checkItemToAddAndAvailableQuantity(data.quantity)
    ) {
      return alert("Quantity is not available");
    }
    if (!assignAllDevices && (data.quantity === 0 || !data.quantity))
      return alert("Quantity is required.");
    if (checkIfNewAddedItemAlreadyWasAdded()) {
      return updateQuantity(Number(data.quantity));
    } else {
      const resulting = [
        ...selectedItem,
        {
          ...data,
          ...valueItemSelected,
          cost: eventInfoDetail.merchant ? data.deposit : 0, //valueItemSelected[0].cost,
          quantity: Number(data.quantity),
          ownership: data.ownership ? data.ownership : "Rent",
        },
      ];
      setSelectedItem(resulting);
      dispatch(onAddDeviceSetup(resulting));
      setValueItemSelected(null);
      setValue("quantity", "");
      setAssignAllDevices(false);
      return selectOptions();
    }
  };

  useEffect(() => {
  }, [selectedItem.length]);

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
    return itemsInInventoryQuery.refetch();
  };

  const selectOptions = useCallback(() => {
    const result = [];
    if (itemsInInventoryQuery.data) {
      const groupedInventory = itemsInInventoryQuery.data.data.groupedInventory ?? {};
      // Iterate through categories (Category1, Category2, etc.)
      for (const [categoryName, categoryData] of Object.entries(
        groupedInventory
      )) {
        // Iterate through items within each category (Item1, Item2, etc.)
        for (const [itemGroup, itemData] of Object.entries(categoryData)) {
          // Iterate through locations within each item
          for (const [location, quantity] of Object.entries(itemData)) {
            // Render Location Row with quantity
            result.push({
              key: `${itemGroup}-${categoryName}-${location}`,
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
                  <span style={{ width: "50%" }}>
                    <span style={{ fontWeight: 700 }}>
                      {categoryName}
                    </span>{" "}
                    {itemGroup}
                  </span>
                  <span style={{ textAlign: "left", width: "30%" }}>
                    Location:{" "}
                    <span style={{ fontWeight: 700 }}>
                      {location}
                    </span>
                  </span>
                  <span
                    style={{ textAlign: "right", width: "20%" }}
                  >
                    Available: {quantity}
                  </span>
                </Typography>
              ),
              value: JSON.stringify({
                category_name: categoryName,
                item_group: itemGroup,
                location: location,
                total: quantity,
                data: JSON.stringify({
                  category_name: categoryName,
                  item_group: itemGroup,
                  location: location,
                  quantity: quantity,
                }),
              }),
            });
          }
        }
      }
    }
    return result;
  }, [itemsInInventoryQuery.data]);

  useEffect(() => {
    if (deviceSetup.length > 0) {
      setSelectedItem(deviceSetup);
    }
  }, [deviceSetup, selectedItem]);

  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
        </div>
      }
    >
      <MainBody
        AddingEventCreated={AddingEventCreated}
        FormDeviceTrackingMethod={FormDeviceTrackingMethod}
        assignAllDevices={assignAllDevices}
        displayFormToCreateCategory={displayFormToCreateCategory}
        eventInfoDetail={eventInfoDetail}
        extraServiceAdded={extraServiceAdded}
        filled={filled}
        filledFields={filledFields}
        handleAddingNewItemToDeviceSetupEvent={
          handleAddingNewItemToDeviceSetupEvent
        }
        handleExtraService={handleExtraService}
        handleNextStepEventSetup={handleNextStepEventSetup}
        handleRefresh={handleRefresh}
        navigate={navigate}
        onChange={onChange}
        removeItemSelected={removeItemSelected}
        removeServiceAdded={removeServiceAdded}
        renderingStyle={renderingStyle}
        selectedItem={selectedItem}
        selectOptions={selectOptions()}
        setAssignAllDevices={setAssignAllDevices}
        setDisplayFormToCreateCategory={setDisplayFormToCreateCategory}
        setSelectedItem={setSelectedItem}
        setValue={setValue}
        staff={staff}
        triggerAddingAdminStaff={triggerAddingAdminStaff}
        register={register}
        handleSubmit={handleSubmit}
      />
    </Suspense>
  );
};

export default Form;
