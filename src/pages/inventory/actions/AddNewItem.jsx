import { Grid } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, message, notification } from "antd";
import { groupBy } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { convertToBase64 } from "../../../components/utils/convertToBase64";
import "../../../styles/global/ant-select.css";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import "../../../styles/global/OutlineInput.css";
import "../../../styles/global/reactInput.css";
import costValueInputFormat from "../utils/costValueInputFormat";
import { formatDate } from "../utils/dateFormat";
import "./style.css";
import { storeAndGenerateImageUrl } from "./utils/BulkItemActionsOptions";
import SingleItemForm from "./utils/SingleItemForm";
import { singleItemInserting } from "./utils/singleItemIserting";
import { retrieveExistingSubLocationsForCompanyInventory } from "./utils/SubLocationRenderer";
import validatingInputFields from "./utils/validatingInputFields";
import { renderTitleSingleItem } from "./utils/BulkComponents";
const options = [{ value: "Permanent" }, { value: "Rent" }, { value: "Sale" }];
const AddNewItem = () => {
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
  const [imageUrlGenerated, setImageUrlGenerated] = useState(null);
  const [isRented, setIsRented] = useState(false);
  const [displayPreviewImage, setDisplayPreviewImage] = useState(false);
  const [convertImageTo64ForPreview, setConvertImageTo64ForPreview] =
    useState(null);
  const { user } = useSelector((state) => state.admin);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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
    enabled: !!user.sqlInfo.company_id,
    refetchOnMount: false,
    staleTime: 3 * 60 * 1000,
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries(["ItemsInInventoryCheckingQuery"]);
    queryClient.invalidateQueries(["listOfItemsInStock"]);
    queryClient.invalidateQueries(["RefactoredListInventoryCompany"]);
  };
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
    if (itemsInInventoryQuery.data) {
      const locations = groupBy(
        itemsInInventoryQuery.data.data.items,
        "location"
      );
      const result = new Set();
      for (let data of Object.keys(locations)) {
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
    const dataDevices = itemsInInventoryQuery.data.data.items;
    const groupingByDeviceType = groupBy(dataDevices, "item_group");
    validatingInputFields({
      data,
      openNotificationWithIcon,
      returningDate,
    });
      if (!data.serial_number || data.serial_number === "")
    return openNotificationWithIcon("A serial number must be provided.");

    if (Number(data.max_serial_number) < Number(data.min_serial_number)) {
      return openNotificationWithIcon(
        "Max serial number must be greater than min serial number."
      );
    }
    if (groupingByDeviceType[data.item_group]) {
      const dataRef = groupBy(
        groupingByDeviceType[data.item_group],
        "serial_number"
      );
      if (dataRef[data.serial_number]?.length > 0) {
        return openNotificationWithIcon(
          "Device serial number already exists in company records."
        );
      }
    }
    try {
      setLoadingStatus(true);
      if (
        imageUploadedValue?.length > 0 &&
        imageUploadedValue[0].size > 5242880
      ) {
        setLoadingStatus(false);
        return alert(
          "Image is bigger than allow. Please resize the image or select a new one."
        );
      }
      await singleItemInserting({
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
        invalidateQueries,
      });
      return setLoadingStatus(false);
    } catch (error) {
      console.log(error);
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

  const gripingFields = (props) => {
    if (
      props === "min_serial_number" ||
      props === "max_serial_number" ||
      props === "quantity"
    )
      return 6;
    return 6;
  };

  const subLocationsOptions = useMemo(() => retrieveExistingSubLocationsForCompanyInventory(
    itemsInInventoryQuery?.data?.data?.items, watch("location")
  ), [watch("location")]);

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

  useEffect(() => {
    const controller = new AbortController();
    companiesQuery.refetch();
    itemsInInventoryQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

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
    if (retrieveItemDataSelected().has(watch("reference_item_group"))) {
      const dataToRetrieve = retrieveItemDataSelected().get(
        watch("reference_item_group")
      );
      if (Object.entries(dataToRetrieve).length > 0) {
        Object.entries(dataToRetrieve).forEach(([key, value]) => {
          if (key === "enableAssignFeature" || key === "container") {
            return;
          }
          if (key === "sub_location") {
            setValue("sub_location", "");
            const checkType =
              typeof value === "string" ? JSON.parse(value) : value;
            if (checkType.length > 0) {
              return setSubLocationsSubmitted([...checkType]);
            }
          }
          if (key === "serial_number") return;
          setValue(key, value);
          setValue("quantity", 0);
        });
      }
    }
    return () => {
      controller.abort();
    };
  }, [watch("reference_item_group")]);

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
    } else {
      setConvertImageTo64ForPreview(null);
      setDisplayPreviewImage(false);
    }
  }, [imageUploadedValue]);

  return (
    <Grid
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
      container
    >
      {contextHolder}
      {renderTitleSingleItem()}
      <SingleItemForm
        acceptImage={acceptAndGenerateImage}
        addingSubLocation={addingSubLocation}
        control={control}
        displayContainerSplotLimitField={displayContainerSplotLimitField}
        displayPreviewImage={displayPreviewImage}
        displaySublocationFields={displaySublocationFields}
        errors={errors}
        gripingFields={gripingFields}
        handleDeleteMoreInfo={handleDeleteMoreInfo}
        handleMoreInfoPerDevice={handleMoreInfoPerDevice}
        handleSubmit={handleSubmit}
        imageUploadedValue={convertImageTo64ForPreview}
        imageUrlGenerated={imageUrlGenerated}
        isRented={isRented}
        keyObject={keyObject}
        loadingStatus={loadingStatus}
        moreInfo={moreInfo}
        moreInfoDisplay={moreInfoDisplay}
        options={options}
        OutlinedInputStyle={OutlinedInputStyle}
        register={register}
        renderingOptionsForSubLocations={renderingOptionsForSubLocations}
        renderLocationOptions={renderLocationOptions}
        retrieveItemOptions={retrieveItemOptions}
        returningDate={returningDate}
        savingNewItem={savingNewItem}
        setImageUploadedValue={setImageUploadedValue}
        setKeyObject={setKeyObject}
        setMoreInfoDisplay={setMoreInfoDisplay}
        setReturningDate={setReturningDate}
        setSubLocationsSubmitted={setSubLocationsSubmitted}
        setValueObject={setValueObject}
        subLocationsOptions={subLocationsOptions}
        subLocationsSubmitted={subLocationsSubmitted}
        valueObject={valueObject}
        watch={watch}
      />
    </Grid>
  );
};

export default AddNewItem;
