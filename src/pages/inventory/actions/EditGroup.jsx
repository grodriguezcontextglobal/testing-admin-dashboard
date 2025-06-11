import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Button, message, notification } from "antd";
import { groupBy, orderBy } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { convertToBase64 } from "../../../components/utils/convertToBase64";
import { formatDate } from "../../../components/utils/dateFormat";
import "../../../styles/global/ant-select.css";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import "../../../styles/global/reactInput.css";
import costValueInputFormat from "../utils/costValueInputFormat";
import "./style.css";
import { renderingModals } from "./utils/BulkComponents";
import { storeAndGenerateImageUrl } from "./utils/BulkItemActionsOptions";
import {
  bulkItemUpdateAlphanumeric,
  bulkItemUpdateSequential,
  updateAllItemsBasedOnParameters,
} from "./utils/EditBulkActionOptions";
import { renderTitle } from "./utils/EditBulkComponents";
import EditBulkForm from "./utils/EditBulkForm";
import { retrieveExistingSubLocationsForCompanyInventory } from "./utils/SubLocationRenderer";
import validatingInputFields from "./utils/validatingInputFields";
const options = [{ value: "Permanent" }, { value: "Rent" }, { value: "Sale" }];
const EditGroup = () => {
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [moreInfoDisplay, setMoreInfoDisplay] = useState(false);
  const [moreInfo, setMoreInfo] = useState([]);
  const [keyObject, setKeyObject] = useState("");
  const [valueObject, setValueObject] = useState("");
  const [returningDate, setReturningDate] = useState(new Date());
  const [imageUploadedValue, setImageUploadedValue] = useState(null);
  const [displayContainerSplotLimitField, setDisplayContainerSplotLimitField] =
    useState(false);
  const [displaySublocationFields, setDisplaySublocationFields] =
    useState(false);
  const [subLocationsSubmitted, setSubLocationsSubmitted] = useState([]);
  const [addSerialNumberField, setAddSerialNumberField] = useState(false);
  const [rangeFormat, setRangeFormat] = useState(false);
  const [scannedSerialNumbers, setScannedSerialNumbers] = useState([]);
  const [openScanningModal, setOpenScanningModal] = useState(false);
  const [openScannedItemView, setOpenScannedItemView] = useState(false);
  const [labeling, setLabeling] = useState("Scanning all serial numbers here");
  const [isRented, setIsRented] = useState(false);
  const [displayPreviewImage, setDisplayPreviewImage] = useState(false);
  const [convertImageTo64ForPreview, setConvertImageTo64ForPreview] =
    useState(null);
  const [updateAllItems, setUpdateAllItems] = useState(false);
  const [allSerialNumbersOptions, setAllSerialNumbersOptions] = useState([]);
  const [imageUrlGenerated, setImageUrlGenerated] = useState(null);
  const [removeImage, setRemoveImage] = useState(null);
  const { user } = useSelector((state) => state.admin);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();
  const refTemplateToUpdate = useRef(null);
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = useCallback(
    (msg) => {
      api.open({
        message: msg,
      });
    },
    [api]
  );
  const companiesQuery = useQuery({
    queryKey: ["locationOptionsPerCompany"],
    queryFn: () =>
      devitrakApi.post("/company/search-company", {
        _id: user.companyData.id,
      }),
    refetchOnMount: false,
  });

  const itemsInInventoryQuery = useQuery({
    queryKey: ["ItemsInInventoryCheckingQuery"],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
      }),
    refetchOnMount: false,
  });

  const retrieveItemOptions = (props) => {
    const result = new Set();
    if (itemsInInventoryQuery.data) {
      const itemsOptions = itemsInInventoryQuery.data.data.items;
      const groupingBy = groupBy(itemsOptions, `${props}`);
      for (let data of Object.keys(groupingBy)) {
        result.add(data);
      }
    }
    return Array.from(result);
  };

  const renderLocationOptions = () => {
    if (companiesQuery.data) {
      const locations = companiesQuery.data.data.company?.at(-1).location ?? [];
      const result = new Set();
      for (let data of locations) {
        result.add({ value: data });
      }
      return Array.from(result);
    }
    return [];
  };

  const retrieveItemDataSelected = () => {
    const result = new Map();
    if (itemsInInventoryQuery.data) {
      const industryData = itemsInInventoryQuery.data.data.items;
      for (let data of industryData) {
        result.set(data.item_group, data);
      }
    }
    return result;
  };

  const savingNewItem = async (data) => {
    // const dataDevices = itemsInInventoryQuery.data.data.items;
    // const groupingByDeviceType = groupBy(dataDevices, "item_group");
    validatingInputFields({
      data,
      openNotificationWithIcon,
      returningDate,
    });
    if (
      !data.tax_location ||
      !data.category_name ||
      !data.brand ||
      !data.container ||
      !data.ownership ||
      !data.enableAssignFeature
    )
    if (
      !updateAllItems &&
      scannedSerialNumbers.length === 0 &&
      Number(data.max_serial_number) < Number(data.min_serial_number)
    ) {
      return openNotificationWithIcon(
        "Max serial number must be greater than min serial number."
      );
    }
    try {
      setLoadingStatus(true);
      if (updateAllItems) {
        await updateAllItemsBasedOnParameters({
          data,
          user,
          navigate,
          openNotificationWithIcon,
          setLoadingStatus,
          setValue,
          img_url: imageUrlGenerated ? imageUrlGenerated : data.image_url,
          moreInfo,
          formatDate,
          returningDate,
          subLocationsSubmitted,
          originalTemplate: refTemplateToUpdate.current,
        });
        return setLoadingStatus(false);
      }
      if (scannedSerialNumbers.length > 0) {
        await bulkItemUpdateAlphanumeric({
          data,
          user,
          navigate,
          openNotificationWithIcon,
          setLoadingStatus,
          setValue,
          img_url: imageUrlGenerated ? imageUrlGenerated : data.image_url,
          moreInfo,
          formatDate,
          returningDate,
          subLocationsSubmitted,
          scannedSerialNumbers,
          setScannedSerialNumbers,
          originalTemplate: refTemplateToUpdate.current,
        });
      } else {
        await bulkItemUpdateSequential({
          data,
          user,
          navigate,
          openNotificationWithIcon,
          setLoadingStatus,
          setValue,
          img_url: imageUrlGenerated ? imageUrlGenerated : data.image_url,
          moreInfo,
          formatDate,
          returningDate,
          subLocationsSubmitted,
          originalTemplate: refTemplateToUpdate.current,
        });
      }
      return setLoadingStatus(false);
    } catch (error) {
      openNotificationWithIcon(`${error.message}`);
      setLoadingStatus(false);
    }
  };

  const handleMoreInfoPerDevice = () => {
    const result = [...moreInfo, { keyObject, valueObject }];
    setKeyObject("");
    setValueObject("");
    return setMoreInfo(result);
  };

  const handleDeleteMoreInfo = (index) => {
    const result = [...moreInfo];
    const removingResult = result.filter((_, i) => i !== index);
    return setMoreInfo(removingResult);
  };

  const qtyDiff = useCallback(() => {
    if (watch("format_range_serial_number") === "Alphanumeric")
      return setValue("quantity", scannedSerialNumbers.length);
    if (watch("format_range_serial_number") === "Sequential number")
      return setValue(
        "quantity",
        Number(watch("max_serial_number")) -
          Number(watch("min_serial_number")) +
          1
      );
    return 0; // Alphanumeric
  }, [
    watch("max_serial_number"),
    watch("min_serial_number"),
    watch("format_range_serial_number"),
    scannedSerialNumbers.length,
  ]);
  qtyDiff();

  const subLocationsOptions = retrieveExistingSubLocationsForCompanyInventory(
    itemsInInventoryQuery?.data?.data?.items
  );

  const renderingOptionsForSubLocations = (item) => {
    const addSublocationButton = () => {
      return (
        <Button
          onClick={() => setDisplaySublocationFields(true)}
          style={{
            ...BlueButton,
            ...CenteringGrid,
            alignSelf: "stretch",
            display:
              item === "Main location" && !displaySublocationFields
                ? "flex"
                : "none",
            width: "100%",
            borderRadius: "8px",
          }}
        >
          <p style={BlueButtonText}>Add sub location</p>
        </Button>
      );
    };

    const addEndingSerialNumberSequenceButton = () => {
      return (
        <Button
          onClick={() => setDisplaySublocationFields(true)}
          style={{
            ...BlueButton,
            ...CenteringGrid,
            alignSelf: "stretch",
            display:
              item === "Main location" && !displaySublocationFields
                ? "flex"
                : "none",
            width: "100%",
            borderRadius: "8px",
          }}
        >
          <p style={BlueButtonText}>Add sub location</p>
        </Button>
      );
    };

    const removeAllSubLocationsButton = () => {
      return (
        <Button
          onClick={() => {
            setDisplaySublocationFields(false);
            setSubLocationsSubmitted([]);
          }}
          style={{
            ...BlueButton,
            ...CenteringGrid,
            alignSelf: "stretch",
            display:
              item === "Main location" && displaySublocationFields
                ? "flex"
                : "none",
            width: "100%",
            borderRadius: "8px",
          }}
        >
          <p style={BlueButtonText}>Remove all sub location</p>
        </Button>
      );
    };
    return {
      addSubLocation: addSublocationButton(),
      addEndingSerialNumberSequence: addEndingSerialNumberSequenceButton(),
      removeAllSubLocations: removeAllSubLocationsButton(),
    };
  };

  const addingSubLocation = (props) => {
    if (String(props).length < 1) return;
    const result = [...subLocationsSubmitted, props];
    setValue("sub_location", "");
    return setSubLocationsSubmitted(result);
  };

  const manuallyAddingSerialNumbers = () => {
    if (String(watch("serial_number_list")).length < 1) return;
    if (scannedSerialNumbers.includes(watch("serial_number_list")))
      return message.warning(
        "Serial number is already scanned or invalid for this transaction."
      );
    const result = [...scannedSerialNumbers, watch("serial_number_list")];
    return setScannedSerialNumbers(result);
  };

  const acceptAndGenerateImage = async () => {
    try {
      if (
        imageUploadedValue?.length > 0 &&
        imageUploadedValue[0].size > 5242880
      ) {
        return alert(
          "Image is bigger than allow. Please resize the image or select a new one."
        );
      }
      if (!watch("category_name") || !watch("item_group")) {
        return alert("Category name and item group are required.");
      }
      const data = {
        category_name: watch("category_name"),
        item_group: watch("item_group"),
      };

      const img_url = await storeAndGenerateImageUrl({
        data,
        imageUploadedValue,
        user,
      });

      setImageUrlGenerated(img_url);
      return message.success("Image was successfully accepted.");
    } catch (error) {
      message.error("Failed to upload image: " + error.message);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    companiesQuery.refetch();
    itemsInInventoryQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (retrieveItemDataSelected().has(watch("item_group"))) {
      const dataToRetrieve = retrieveItemDataSelected().get(
        watch("item_group")
      );
      refTemplateToUpdate.current = dataToRetrieve;
      if (Object.entries(dataToRetrieve).length > 0) {
        Object.entries(dataToRetrieve).forEach(([key, value]) => {
          if (key === "enableAssignFeature") {
            let valueToSet = value > 0 ? "Enabled" : "Disabled";
            return setValue(key, `${valueToSet}`);
          }
          if (key === "container") {
            let valueToSet =
              value > 0
                ? "Yes - It is a container"
                : "No - It is not a container";
            return setValue(key, `${valueToSet}`);
          }
          setValue(key, value);
          setValue("quantity", 0);
          const grouping = groupBy(
            itemsInInventoryQuery?.data?.data?.items,
            "item_group"
          );
          if (grouping[watch("item_group")]) {
            const dataToRetrieve = orderBy(
              grouping[watch("item_group")],
              "serial_number",
              "asc"
            );
            setAllSerialNumbersOptions([
              ...dataToRetrieve.map((x) => {
                return x.serial_number;
              }),
            ]);
          }
        });
      }
    }
    return () => {
      controller.abort();
    };
  }, [watch("item_group")]);

  useEffect(() => {
    qtyDiff();
  }, [
    watch("max_serial_number"),
    watch("min_serial_number"),
    watch("format_range_serial_number"),
    scannedSerialNumbers.length,
    qtyDiff,
  ]);

  useEffect(() => {
    const controller = new AbortController();
    if (String(watch("container")).includes("Yes")) {
      setDisplayContainerSplotLimitField(true);
    } else {
      setDisplayContainerSplotLimitField(false);
    }
    return () => {
      controller.abort();
    };
  }, [watch("container")]);

  useEffect(() => {
    const controller = new AbortController();
    if (!moreInfoDisplay) {
      setMoreInfo([]);
    }
    return () => {
      controller.abort();
    };
  }, [moreInfoDisplay]);

  useEffect(() => {
    const controller = new AbortController();
    costValueInputFormat({ props: watch("cost"), setValue });
    return () => {
      controller.abort();
    };
  }, [watch("cost")]);

  useEffect(() => {
    if (watch("format_range_serial_number") === "Alphanumeric") {
      setRangeFormat(true);
      setAddSerialNumberField(false);
    }
    if (watch("format_range_serial_number") === "Sequential number") {
      setRangeFormat(false);
      setAddSerialNumberField(true);
      setValue("feed_serial_number", "Typing");
    }
    if (watch("format_range_serial_number") === "") {
      setRangeFormat(false);
      setAddSerialNumberField(false);
      setValue("feed_serial_number", "");
    }
  }, [watch("format_range_serial_number")]);

  useEffect(() => {
    if (
      watch("format_range_serial_number") === "Alphanumeric" &&
      watch("feed_serial_number") === "Typing"
    ) {
      setLabeling("Typing all serial numbers here");
    }
    if (
      watch("format_range_serial_number") === "Alphanumeric" &&
      watch("feed_serial_number") === "Scanning"
    ) {
      setLabeling("Scanning all serial numbers here");
    }
  }, [watch("feed_serial_number")]);

  useEffect(() => {
    setValue("serial_number_list", "");
    setValue("min_serial_number", "");
    setValue("max_serial_number", "");
    setValue("quantity", 0);
    setScannedSerialNumbers([]);
  }, [watch("format_range_serial_number"), watch("feed_serial_number")]);

  useEffect(() => {
    if (watch("ownership") === "Rent") {
      setIsRented(true);
    } else {
      setIsRented(false);
    }
  }, [watch("ownership")]);

  useEffect(() => {
    if (imageUploadedValue?.length > 0) {
      const triggerImageInto64 = async () => {
        const base64 = await convertToBase64(imageUploadedValue[0]);
        setConvertImageTo64ForPreview(base64);
        setDisplayPreviewImage(true);
      };
      triggerImageInto64();
    }
    if (!imageUploadedValue) {
      setConvertImageTo64ForPreview(null);
      setDisplayPreviewImage(false);
      setImageUrlGenerated(null);
    }
  }, [
    watch("image_uploader")?.length,
    imageUploadedValue?.length,
    removeImage,
  ]);

  useEffect(() => {
    setValue("serial_number_list", scannedSerialNumbers.join(", "));
  }, [scannedSerialNumbers.length]);

  useEffect(() => {
    const groupByGroupName = groupBy(
      itemsInInventoryQuery?.data?.data?.items,
      "item_group"
    );
    if (updateAllItems) {
      const total = groupByGroupName[watch("item_group")].length;
      setValue("quantity", total);
    } else {
      setValue("quantity", 0);
    }
  }, [updateAllItems]);

  return (
    <Grid
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
      container
    >
      {contextHolder}
      {renderTitle()}
      <EditBulkForm
        acceptImage={acceptAndGenerateImage}
        addingSubLocation={addingSubLocation}
        addSerialNumberField={addSerialNumberField}
        allSerialNumbersOptions={allSerialNumbersOptions}
        control={control}
        displayContainerSplotLimitField={displayContainerSplotLimitField}
        displayPreviewImage={displayPreviewImage}
        displaySublocationFields={displaySublocationFields}
        errors={errors}
        handleDeleteMoreInfo={handleDeleteMoreInfo}
        handleMoreInfoPerDevice={handleMoreInfoPerDevice}
        handleSubmit={handleSubmit}
        imageUploadedValue={convertImageTo64ForPreview}
        isRented={isRented}
        keyObject={keyObject}
        labeling={labeling}
        loadingStatus={loadingStatus}
        manuallyAddingSerialNumbers={manuallyAddingSerialNumbers}
        moreInfo={moreInfo}
        moreInfoDisplay={moreInfoDisplay}
        options={options}
        OutlinedInputStyle={OutlinedInputStyle}
        rangeFormat={rangeFormat}
        register={register}
        removeImage={removeImage}
        renderingOptionsForSubLocations={renderingOptionsForSubLocations}
        renderLocationOptions={renderLocationOptions}
        retrieveItemOptions={retrieveItemOptions}
        returningDate={returningDate}
        savingNewItem={savingNewItem}
        setAddSerialNumberField={setAddSerialNumberField}
        setImageUploadedValue={setImageUploadedValue}
        setKeyObject={setKeyObject}
        setMoreInfoDisplay={setMoreInfoDisplay}
        setOpenScannedItemView={setOpenScannedItemView}
        setOpenScanningModal={setOpenScanningModal}
        setRemoveImage={setRemoveImage}
        setReturningDate={setReturningDate}
        setSubLocationsSubmitted={setSubLocationsSubmitted}
        setUpdateAllItems={setUpdateAllItems}
        setValueObject={setValueObject}
        subLocationsOptions={subLocationsOptions}
        subLocationsSubmitted={subLocationsSubmitted}
        updateAllItems={updateAllItems}
        valueObject={valueObject}
        watch={watch}
        imageUrlGenerated={imageUrlGenerated}
      />
      {renderingModals({
        openScanningModal,
        setOpenScanningModal,
        openScannedItemView,
        setOpenScannedItemView,
        scannedSerialNumbers,
        setScannedSerialNumbers,
      })}
    </Grid>
  );
};

export default EditGroup;
