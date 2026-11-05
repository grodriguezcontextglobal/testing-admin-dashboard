import { Grid } from "@mui/material";
import { OWNERSHIP_VALUES } from "./utils/ownershipUtils";
import { itemOptionsFrom } from "./utils/referenceLookup";
import { useQuery } from "@tanstack/react-query";
import { message } from "antd";
import { groupBy } from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { convertToBase64 } from "../../../components/utils/convertToBase64";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import "../../../styles/global/ant-select.css";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import "../../../styles/global/OutlineInput.css";
import "../../../styles/global/reactInput.css";
import costValueInputFormat from "../utils/costValueInputFormat";
import { formatDate } from "../utils/dateFormat";
import useSuppliers from "../utils/hooks/useSuppliers";
import { invalidateInventoryQueries } from "../utils/inventoryQueryKeys";
import "./style.css";
import { renderTitleSingleItem } from "./utils/BulkComponents";
import { storeAndGenerateImageUrl } from "./utils/BulkItemActionsOptions";
import SingleItemForm from "./utils/SingleItemForm";
import { singleItemInserting } from "./utils/singleItemIserting";
import { retrieveExistingSubLocationsForCompanyInventory } from "./utils/SubLocationRenderer";
import NewSupplier from "./utils/suppliers/NewSupplier";
import validatingInputFields from "./utils/validatingInputFields";
import DangerButtonComponent from "../../../components/UX/buttons/DangerButton";
import { useStatusNotification } from "../../../components/notification/alerts/useStatusNotification";
import { referenceGroupFormValues } from "./utils/referenceGroupFill";
import { userFacingError } from "../../../utils/userFacingError";

const options = OWNERSHIP_VALUES.map((value) => ({ value }));
const AddNewItem = () => {
  const {
    supplierList,
    supplierModal,
    providersList,
    setSupplierModal,
    refetchingAfterNewSupplier,
    queryClient,
    dicSuppliers,
  } = useSuppliers();
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [moreInfoDisplay, setMoreInfoDisplay] = useState(false);
  const [moreInfo, setMoreInfo] = useState([]);
  const [keyObject, setKeyObject] = useState("");
  const [valueObject, setValueObject] = useState("");
  const [returningDate, setReturningDate] = useState(new Date());
  const [imageUploadedValue, setImageUploadedValue] = useState(null);
  const [displaySublocationFields, setDisplaySublocationFields] =
    useState(false);
  const [subLocationsSubmitted, setSubLocationsSubmitted] = useState([]);
  const [imageUrlGenerated, setImageUrlGenerated] = useState(null);
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
  // Watched once per render; the effects and memos below depend on these.
  const [watchedLocation, referenceItemGroup, containerValue, costValue, ownershipValue, taxLocation] =
    watch(["location", "reference_item_group", "container", "cost", "ownership", "tax_location"]);
  const displayContainerSplotLimitField = String(containerValue).includes("Yes");
  const isRented = ownershipValue === "Rent";
  const navigate = useNavigate();
  const { notify, contextHolder } = useStatusNotification();
  const openNotificationWithIcon = useCallback(
    (msg) => {
      notify("error", msg);
    },
    [notify]
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

  const companyLocationsListQuery = useQuery({
    queryKey: ["companyLocationsListQuery", user.sqlInfo.company_id],
    queryFn: () =>
      devitrakApi.post(
        `/db_location/companies/${user.sqlInfo.company_id}/locations`,
        {
          company_id: user.sqlInfo.company_id,
          preference:
            user.companyData.employees.find((emp) => emp.user === user.email)
              .preference || [],
        }
      ),
    enabled: !!user.sqlInfo.company_id && !!user.email,
  });

  // Three keys were listed here by hand, and the landing fetch
  // (companyHasInventoryQuery, 5-minute staleTime) was not one of them — so
  // creating an item and going back to /inventory showed the pre-creation
  // count and, on a first item, the empty-state banner.
  const invalidateQueries = () =>
    invalidateInventoryQueries(queryClient, {
      companyId: user.sqlInfo.company_id,
    });
  /* `narrowBy` is what makes the copy-details filters cascade: the panel asks
     for one field's options given what the other two are set to. */
  const retrieveItemOptions = (field, narrowBy) =>
    itemOptionsFrom(itemsInInventoryQuery.data?.data?.items, field, narrowBy);
  const renderLocationOptions = () => {
    if (!companyLocationsListQuery?.data?.data?.data) {
      return [];
    }
    
    if (itemsInInventoryQuery.data) {
      const locations = companyLocationsListQuery?.data?.data?.data
      // groupBy(
      //   itemsInInventoryQuery.data.data.items,
      //   "location"
      // );
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
      const industryData = itemsInInventoryQuery.data.data.items || [];
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
        dicSuppliers,
        queryClient,
      });
      return setLoadingStatus(false);
    } catch (error) {
      // console.log(error);
      openNotificationWithIcon(userFacingError(error));
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
  const inventoryItems = itemsInInventoryQuery.data?.data?.items;
  const subLocationsOptions = useMemo(
    () => retrieveExistingSubLocationsForCompanyInventory(inventoryItems, watchedLocation),
    [inventoryItems, watchedLocation]
  );
const renderingOptionsForSubLocations = (item) => {
    if (typeof displaySublocationFields !== "boolean")
      return {
        addSubLocation: null,
        addEndingSerialNumberSequence: null,
        removeAllSubLocations: null,
      };
    const addSublocationButton = () => {
      if (item === "Main location" && !displaySublocationFields) {
        return (
          <BlueButtonComponent
            func={() => setDisplaySublocationFields(true)}
            title="Add sub location"
            styles={{
              width: "100%",
            }}
          />
        );
      }
      return null;
    };

    const removeAllSubLocationsButton = () => {
      if (item === "Main location" && displaySublocationFields) {
        return (
          <DangerButtonComponent
            func={() => {
              setDisplaySublocationFields(false);
              setSubLocationsSubmitted([]);
            }}
            title="Remove all sub location"
            styles={{
              width: "100%",
            }}
          />
        );
      }
      return null;
    };

    return {
      addSubLocation: addSublocationButton(),
      addEndingSerialNumberSequence: null,
      removeAllSubLocations: removeAllSubLocationsButton(),
    };
  };  const addingSubLocation = (props) => {
    if (String(props).length < 1) return;
    const result = [...subLocationsSubmitted, props];
    setValue("sub_location", "");
    return setSubLocationsSubmitted(result);
  };
  // Fresh company and inventory data when the form opens.
  const { refetch: refetchCompanies } = companiesQuery;
  const { refetch: refetchInventoryItems } = itemsInInventoryQuery;
  useEffect(() => {
    refetchCompanies();
    refetchInventoryItems();
  }, [refetchCompanies, refetchInventoryItems]);
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
  // Picking a reference group fills the form from it (referenceGroupFill.js).
  // Keyed on the reference alone: the inventory list is read when the pick
  // happens, so a background refetch cannot overwrite what the user typed since.
  const itemsByGroupRef = useRef(retrieveItemDataSelected);
  useEffect(() => {
    itemsByGroupRef.current = retrieveItemDataSelected;
  });
  useEffect(() => {
    referenceGroupFormValues(referenceItemGroup, itemsByGroupRef.current()).forEach(
      ([key, value]) => setValue(key, value)
    );
  }, [referenceItemGroup, setValue]);
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
    costValueInputFormat({ props: costValue, setValue });
  }, [costValue, setValue]);
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

  useEffect(() => {
    setValue("location", taxLocation);
  }, [taxLocation, setValue]);

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
        suppliersOptions={supplierList}
      />
      {supplierModal && (
        <NewSupplier
          providersList={providersList}
          queryClient={queryClient}
          setSupplierModal={setSupplierModal}
          supplierModal={supplierModal}
          user={user}
          refetchingAfterNewSupplier={refetchingAfterNewSupplier}
        />
      )}
    </Grid>
  );
};

export default AddNewItem;
