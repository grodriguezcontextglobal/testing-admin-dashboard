import { Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
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
import MainBody from "./components/MainBody";
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
    if (!assignAllDevices && (data.quantity === 0 || !data.quantity))
      return alert("Quantity is required.");
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
            ? valueItemSelected.qty ?? valueItemSelected.quantity
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
  console.log(valueItemSelected);
  console.log(selectedItem);
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
        selectOptions={selectOptions}
        setAssignAllDevices={setAssignAllDevices}
        setDisplayFormToCreateCategory={setDisplayFormToCreateCategory}
        setSelectedItem={setSelectedItem}
        setValue={setValue}
        staff={staff}
        triggerAddingAdminStaff={triggerAddingAdminStaff}
      />
    </Suspense>
  );
};

export default Form;
