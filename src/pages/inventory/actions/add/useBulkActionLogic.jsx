import { useCallback, useEffect, useMemo, useState } from "react";
import { convertToBase64 } from "../../../../components/utils/convertToBase64";
import costValueInputFormat from "../../utils/costValueInputFormat";
import { groupBy, orderBy } from "lodash";
import { message, notification } from "antd";
import {
  bulkItemInsertAlphanumeric,
  bulkItemInsertSequential,
  storeAndGenerateImageUrl,
} from "../utils/BulkItemActionsOptions";
import { retrieveExistingSubLocationsForCompanyInventory } from "../utils/SubLocationRenderer";
import validatingInputFields from "../utils/validatingInputFields";
import { devitrakApi } from "../../../../api/devitrakApi";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import useSuppliers from "../../utils/hooks/useSuppliers";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../../components/UX/buttons/DangerButton";
import { formatDate } from "../../utils/dateFormat";

const useBulkActionLogic = () => {
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
  const [displayContainerSplotLimitField, setDisplayContainerSplotLimitField] =
    useState(false);
  const [displaySublocationFields, setDisplaySublocationFields] =
    useState(false);
  const [subLocationsSubmitted, setSubLocationsSubmitted] = useState([]);
  const [allSerialNumbersOptions, setAllSerialNumbersOptions] = useState([]);
  const [addSerialNumberField, setAddSerialNumberField] = useState(false);
  const [rangeFormat, setRangeFormat] = useState(false);
  const [scannedSerialNumbers, setScannedSerialNumbers] = useState([]);
  const [openScanningModal, setOpenScanningModal] = useState(false);
  const [openScannedItemView, setOpenScannedItemView] = useState(false);
  const [labeling, setLabeling] = useState("Scanning all serial numbers here");
  const [isRented, setIsRented] = useState(false);
  const [displayPreviewImage, setDisplayPreviewImage] = useState(false);
  const [imageUrlGenerated, setImageUrlGenerated] = useState(null);
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
  } = useForm({
    defaultValues: {
      item_group: "",
      photo: [],
      category_name: "",
      cost: "",
      brand: "",
      descript_item: "",
      min_serial_number: "",
      max_serial_number: "",
      sub_location: "",
      quantity: 0,
      container: "",
      containerSpotLimit: "0",
    },
  });

  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = useCallback(
    (msg) => {
      api.open({
        message: msg,
      });
    },
    [api],
  );

  const itemsInInventoryQuery = useQuery({
    queryKey: ["ItemsInInventoryCheckingQuery"],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
      }),
    refetchOnMount: false,
  });

  const companyLocationsListQuery = useQuery({
    queryKey: ["companyLocationsListQuery", user.sqlInfo.company_id],
    queryFn: () =>
      devitrakApi.post(
        `/db_location/companies/${user.sqlInfo.company_id}/locations`,
        {
          company_id: user.sqlInfo.company_id,
          role: Number(
            user.companyData.employees.find((emp) => emp.user === user.email)
              .role,
          ),
          preference:
            user.companyData.employees.find((emp) => emp.user === user.email)
              .preference || [],
        },
      ),
    enabled: !!user.sqlInfo.company_id && !!user.email,
  });
  // console.log(companyLocationsListQuery?.data?.data?.data)
  const alphaNumericInsertItemMutation = useMutation({
    mutationFn: (template) =>
      devitrakApi.post("/db_item/bulk-item-alphanumeric", template),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["listOfItemsInStock"],
        exact: true,
        refetchType: "active",
      });
      queryClient.invalidateQueries({
        queryKey: ["ItemsInInventoryCheckingQuery"],
        exact: true,
        refetchType: "active",
      });
      queryClient.invalidateQueries({
        queryKey: ["RefactoredListInventoryCompany"],
        exact: true,
        refetchType: "active",
      });
    },
  });

  const sequencialNumbericInsertItemMutation = useMutation({
    mutationFn: (template) => devitrakApi.post("/db_item/bulk-item", template),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["listOfItemsInStock"],
        exact: true,
        refetchType: "active",
      });
      queryClient.invalidateQueries({
        queryKey: ["ItemsInInventoryCheckingQuery"],
        exact: true,
        refetchType: "active",
      });
      queryClient.invalidateQueries({
        queryKey: ["RefactoredListInventoryCompany"],
        exact: true,
        refetchType: "active",
      });
    },
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
    if (!companyLocationsListQuery?.data?.data?.data) {
      return [];
    }

    if (itemsInInventoryQuery.data) {
      const locations = companyLocationsListQuery?.data?.data?.data;
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
      const industryData = itemsInInventoryQuery?.data?.data?.items || [];
      for (let data of industryData) {
        result.set(data.item_group, data);
      }
    }
    return result;
  };

  const savingNewItem = async (data) => {
    validatingInputFields({
      data,
      openNotificationWithIcon,
      returningDate,
    });
    if (
      scannedSerialNumbers.length === 0 &&
      Number(data.max_serial_number) < Number(data.min_serial_number)
    ) {
      return openNotificationWithIcon(
        "Max serial number must be greater than min serial number.",
      );
    }
    try {
      if (scannedSerialNumbers.length > 0) {
        await bulkItemInsertAlphanumeric({
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
          alphaNumericInsertItemMutation,
          dicSuppliers,
          queryClient,
        });
      } else {
        await bulkItemInsertSequential({
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
          sequencialNumbericInsertItemMutation,
          dicSuppliers,
          queryClient,
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
    if (watch("format_range_serial_number") === "Custom format")
      return setValue("quantity", scannedSerialNumbers.length);
    if (watch("format_range_serial_number") === "Sequential number")
      return setValue(
        "quantity",
        Number(watch("max_serial_number")) -
          Number(watch("min_serial_number")) +
          1,
      );
    return 0; // Alphanumeric
  }, [
    watch("max_serial_number"),
    watch("min_serial_number"),
    watch("format_range_serial_number"),
    scannedSerialNumbers.length,
  ]);
  qtyDiff();
  const subLocationsOptions = useMemo(
    () =>
      retrieveExistingSubLocationsForCompanyInventory(
        itemsInInventoryQuery?.data?.data?.items,
        watch("location"),
      ),
    [watch("location")],
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
        "Serial number is already scanned or invalid for this transaction.",
      );
    const result = [...scannedSerialNumbers, watch("serial_number_list")];
    setValue("serial_number_list", "");
    return setScannedSerialNumbers(result);
  };

  const acceptAndGenerateImage = async () => {
    try {
      if (
        imageUploadedValue?.length > 0 &&
        imageUploadedValue[0].size > 5242880
      ) {
        return alert(
          "Image is bigger than allow. Please resize the image or select a new one.",
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
    itemsInInventoryQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const newReference = watch("reference_item_group");
    if (retrieveItemDataSelected().has(watch("reference_item_group"))) {
      const dataToRetrieve = retrieveItemDataSelected().get(
        watch("reference_item_group"),
      );
      if (Object.entries(dataToRetrieve).length > 0) {
        Object.entries(dataToRetrieve).forEach(([key, value]) => {
          if (
            key === "enableAssignFeature" ||
            key === "container" ||
            key === "sub_location" ||
            key === "location"
          ) {
            return;
          }
          setValue(key, value);
          setValue("quantity", 0);
          const grouping = groupBy(
            itemsInInventoryQuery?.data?.data?.items,
            "item_group",
          );
          if (grouping[watch("reference_item_group")]) {
            const dataToRetrieve = orderBy(
              grouping[watch("reference_item_group")],
              "serial_number",
              "asc",
            );
            setAllSerialNumbersOptions([
              ...dataToRetrieve.map((x) => {
                return x.serial_number;
              }),
            ]);
          }
          // if (key === "sub_location") {
          //   setValue("sub_location", "");
          //   const checkType =
          //     typeof value === "string" ? JSON.parse(value) : value;
          //   if (checkType.length > 0) {
          //     return setSubLocationsSubmitted([...checkType]);
          //   }
          // }
        });
      }
    } else {
      setValue("item_group", newReference);
    }
    if (newReference?.length === 0) {
      setValue("item_group", "");
      setValue("photo", []);
      setValue("category_name", "");
      setValue("cost", "");
      setValue("brand", "");
      setValue("descript_item", "");
      setValue("min_serial_number", "");
      setValue("max_serial_number", "");
      setValue("sub_location", "");
      setValue("quantity", 0);
      setValue("container", "");
      setValue("containerSpotLimit", "0");
      setValue("enabledAssignFeature", 1);
    }

    return () => {
      controller.abort();
    };
  }, [watch("reference_item_group")]);

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
    if (watch("format_range_serial_number") === "Custom format") {
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
      watch("format_range_serial_number") === "Custom format" &&
      watch("feed_serial_number") === "Typing"
    ) {
      setLabeling("All typed serial numbers are displayed here.");
    }
    if (
      watch("format_range_serial_number") === "Custom format" &&
      watch("feed_serial_number") === "Scanning"
    ) {
      setLabeling("All scanned serial numbers are displayed here.");
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
    } else {
      setConvertImageTo64ForPreview(null);
      setDisplayPreviewImage(false);
      setImageUrlGenerated(null);
    }
  }, [imageUploadedValue]);

  useEffect(() => {
    setValue("serial_number_list", scannedSerialNumbers.join(", "));
  }, [scannedSerialNumbers.length]);

  useEffect(() => {
    setValue("location", watch("tax_location"));
  }, [watch("tax_location")]);

  useEffect(() => {
    if (watch("location") !== watch("tax_location")) {
      alert(
        "Location and Tax Location are not the same. Are you sure you want to continue?",
      );
    }
  }, [watch("location")]);

  return {
    supplierList,
    supplierModal,
    providersList,
    setSupplierModal,
    refetchingAfterNewSupplier,
    queryClient,
    dicSuppliers,
    loadingStatus,
    setLoadingStatus,
    moreInfoDisplay,
    setMoreInfoDisplay,
    moreInfo,
    setMoreInfo,
    keyObject,
    setKeyObject,
    valueObject,
    setValueObject,
    returningDate,
    setReturningDate,
    imageUploadedValue,
    setImageUploadedValue,
    displayContainerSplotLimitField,
    setDisplayContainerSplotLimitField,
    displaySublocationFields,
    setDisplaySublocationFields,
    subLocationsSubmitted,
    setSubLocationsSubmitted,
    allSerialNumbersOptions,
    setAllSerialNumbersOptions,
    addSerialNumberField,
    setAddSerialNumberField,
    rangeFormat,
    setRangeFormat,
    scannedSerialNumbers,
    setScannedSerialNumbers,
    openScanningModal,
    setOpenScanningModal,
    openScannedItemView,
    setOpenScannedItemView,
    labeling,
    setLabeling,
    isRented,
    setIsRented,
    displayPreviewImage,
    setDisplayPreviewImage,
    imageUrlGenerated,
    setImageUrlGenerated,
    convertImageTo64ForPreview,
    setConvertImageTo64ForPreview,
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    errors,
    contextHolder,
    retrieveItemOptions,
    renderLocationOptions,
    savingNewItem,
    handleMoreInfoPerDevice,
    handleDeleteMoreInfo,
    subLocationsOptions,
    renderingOptionsForSubLocations,
    addingSubLocation,
    manuallyAddingSerialNumbers,
    acceptAndGenerateImage,
    user
  };
};

export default useBulkActionLogic;
