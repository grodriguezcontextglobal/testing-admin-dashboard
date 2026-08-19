/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useMemo, useState } from "react";
import { convertToBase64 } from "../../../../components/utils/convertToBase64";
import costValueInputFormat from "../../utils/costValueInputFormat";
import { groupBy, orderBy } from "lodash";
import { message } from "antd";
import {
  bulkItemInsertAlphanumeric,
  // bulkItemInsertSequential,
  storeAndGenerateImageUrl,
} from "../utils/BulkItemActionsOptions";
import { retrieveExistingSubLocationsForCompanyInventory } from "../utils/SubLocationRenderer";
import validatingInputFields from "../utils/validatingInputFields";
import { devitrakApi } from "../../../../api/devitrakApi";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import useSuppliers from "../../utils/hooks/useSuppliers";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../../components/UX/buttons/DangerButton";
import { useStatusNotification } from "../../../../components/notification/alerts/useStatusNotification";
import { formatDate } from "../../utils/dateFormat";
import { bulkItemUpdateAlphanumeric } from "../utils/EditBulkActionOptions";
import {
  findReferenceMatches,
  hasReferenceCriteria,
} from "../utils/referenceLookup";

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
  const [updateAll, setUpdateAll] = useState(true)
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
  const [subLocationInputs, setSubLocationInputs] = useState([
    { id: Date.now(), value: "" },
  ]);
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
  const [generalInfoForSelection, setGeneralInfoForSelection] = useState(null)
  // { serial_number, matchCount } — what the "copy from an existing device"
  // panel reports back, so the user can see which unit the form was filled
  // from and undo it.
  const [copiedFrom, setCopiedFrom] = useState(null)
  const { user } = useSelector((state) => state.admin);
  const locationInApp = useLocation()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    trigger,
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
  const dispatch = useDispatch();
  const { notify, contextHolder } = useStatusNotification();
  const openNotificationWithIcon = useCallback(
    (msg) => {
      notify("error", msg);
    },
    [notify],
  );

  const itemsInInventoryQuery = useQuery({
    queryKey: ["ItemsInInventoryCheckingQuery"],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
      }),
    enabled: !!user.sqlInfo.company_id && !!user.email,
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

  // Registered sub-location paths per location (includes empty ones with no
  // items yet) so the "Sub location" dropdown can list a location's defined
  // sub-locations, not only those inferred from existing inventory.
  const locationPathsTreeQuery = useQuery({
    queryKey: ["locationPathsTree", user.sqlInfo.company_id],
    queryFn: () =>
      devitrakApi.get(
        `/db_location/companies/${user.sqlInfo.company_id}/location-paths-tree`,
      ),
    enabled: !!user.sqlInfo.company_id,
    staleTime: 2 * 60 * 1000,
  });

  const alphaNumericInsertItemMutation = useMutation({
    mutationFn: ({ template, idempotencyKey }) =>
      devitrakApi.post("/db_item/bulk-item-alphanumeric", template, {
        headers: { "Idempotency-Key": idempotencyKey },
      }),
  });

  const alphaNumericUpdateItemMutation = useMutation({
    mutationFn: ({ template, idempotencyKey }) =>
      devitrakApi.post(
        "/db_company/update-items-based-on-alphanumeric-serial-number",
        template,
        { headers: { "Idempotency-Key": idempotencyKey } },
      ),
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
    try {
      if (scannedSerialNumbers.length > 0) {
        await bulkItemInsertAlphanumeric({
          data,
          user,
          navigate,
          dispatch,
          openNotificationWithIcon,
          setLoadingStatus,
          setValue,
          img_url: imageUrlGenerated ? imageUrlGenerated : data.image_url,
          moreInfo,
          formatDate,
          returningDate,
          subLocationsSubmitted: subLocationsSubmitted,
            // .map((item) => item.value)
            // .filter((val) => val.trim() !== ""),
          scannedSerialNumbers,
          setScannedSerialNumbers,
          alphaNumericInsertItemMutation,
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

  const updateGroupItems = async (data) => {
    validatingInputFields({
      data,
      openNotificationWithIcon,
      returningDate,
    });
    try {
      setLoadingStatus(true);
      await bulkItemUpdateAlphanumeric({
        data,
        user,
        navigate,
        dispatch,
        openNotificationWithIcon,
        setLoadingStatus,
        setValue,
        img_url: imageUrlGenerated ? imageUrlGenerated : data.image_url,
        moreInfo,
        formatDate,
        returningDate,
        subLocationsSubmitted: subLocationsSubmitted,
          // .map((item) => item.value)
          // .filter((val) => val.trim() !== ""),
        scannedSerialNumbers,
        setScannedSerialNumbers,
        alphaNumericUpdateItemMutation,
        dicSuppliers,
        queryClient,
        updateAll,
      });
    } catch (error) {
      openNotificationWithIcon(`${error.message}`);
      setLoadingStatus(false);
    } finally {
      setLoadingStatus(false);
    }
  }
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

  // Sub-location names DEFINED for a location via registered paths (from the
  // paths tree), collected across every depth so the dropdown lists them even
  // when the location holds no inventory yet.
  const definedSubLocationsForLocation = (locationName) => {
    if (!locationName) return [];
    const body = locationPathsTreeQuery?.data?.data;
    const tree = body?.locations || body?.data || body || {};
    const node = tree?.[locationName];
    if (!node || !node.children) return [];
    const names = new Set();
    const walk = (children) => {
      Object.keys(children || {}).forEach((seg) => {
        if (seg && seg !== "null") names.add(seg);
        if (children[seg]?.children) walk(children[seg].children);
      });
    };
    walk(node.children);
    return Array.from(names);
  };

  const subLocationsOptions = useMemo(
    () => {
      const selected = watch("location");
      const fromItems = retrieveExistingSubLocationsForCompanyInventory(
        itemsInInventoryQuery?.data?.data?.items,
        selected,
      );
      const fromDefined = definedSubLocationsForLocation(selected).map((v) => ({
        value: v,
      }));
      const seen = new Set();
      const merged = [];
      [...fromDefined, ...fromItems].forEach((opt) => {
        if (opt?.value && !seen.has(opt.value)) {
          seen.add(opt.value);
          merged.push(opt);
        }
      });
      return merged.sort((a, b) => a.value.localeCompare(b.value));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [watch("location"), locationPathsTreeQuery.data, itemsInInventoryQuery.data],
  );

  const handleAddSubLocationInput = () => {
    setSubLocationInputs([...subLocationInputs, { id: Date.now(), value: "" }]);
  };

  const handleRemoveSubLocationInput = (id) => {
    if (subLocationInputs.length > 1) {
      setSubLocationInputs(subLocationInputs.filter((item) => item.id !== id));
    } else {
      setSubLocationInputs([{ id: Date.now(), value: "" }]);
      setDisplaySublocationFields(false);
    }
  };

  const handleSubLocationInputChange = (id, value) => {
    const newInputs = subLocationInputs.map((item) => {
      if (item.id === id) {
        return { ...item, value };
      }
      return item;
    });
    setSubLocationInputs(newInputs);
  };

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
              setSubLocationInputs([{ id: Date.now(), value: "" }]);
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


  /**
   * Clears everything the copy filled in, including the criteria that produced
   * it. The panel offers this as "Undo": copying pulls a dozen fields at once,
   * and without a way back the only recovery was reloading the page and losing
   * the rest of the form.
   */
  const clearReferenceCopy = () => {
    [
      "reference_category_name",
      "reference_item_group",
      "reference_brand",
      "item_group",
      "category_name",
      "brand",
      "cost",
      "descript_item",
      "ownership",
      "supplier",
      "container",
      "image_url",
    ].forEach((field) => setValue(field, ""));
    setValue("containerSpotLimit", "0");
    setValue("quantity", 0);
    setDisplayPreviewImage(false);
    setImageUrlGenerated(null);
    setConvertImageTo64ForPreview(null);
    setImageUploadedValue(null);
    setGeneralInfoForSelection(null);
    setCopiedFrom(null);
  };

  const handleSearchByReference = () => {
    const criteria = {
      category: watch("reference_category_name"),
      itemGroup: watch("reference_item_group"),
      brand: watch("reference_brand"),
    };

    if (!hasReferenceCriteria(criteria)) {
      notify(
        "warning",
        "Pick a category, device name or brand first so we know what to copy.",
      );
      return;
    }

    const inventoryItems = itemsInInventoryQuery?.data?.data?.items || [];
    const { matches: filteredItems, source, matchCount, imageUrl, imageConflict } =
      findReferenceMatches(inventoryItems, criteria);

    // Reset image state before processing new search
    setValue("image_url", "");
    setDisplayPreviewImage(false);
    setImageUrlGenerated(null);
    setConvertImageTo64ForPreview(null);
    setImageUploadedValue(null);

    let infoToSet = null;
    if (source) {
      const dataToRetrieve = source;
      infoToSet = dataToRetrieve;

      if (imageUrl) {
        setValue("image_url", imageUrl);
        setDisplayPreviewImage(true);
        setConvertImageTo64ForPreview(imageUrl); // This should make it appear in the preview
        setImageUrlGenerated(imageUrl); // This marks it as "accepted"
      } else if (imageConflict) {
        // Not an error: the group genuinely has more than one picture, and
        // picking one for the user would quietly restandardize their catalogue.
        notify(
          "info",
          "Those devices use more than one image, so none was copied. Upload one if you want the new units to share it.",
        );
      }

      Object.entries(dataToRetrieve).forEach(([key, value]) => {
        if (
          key === "enableAssignFeature" ||
          key === "container" ||
          key === "sub_location" ||
          key === "location" ||
          key === "image_url" // Don't overwrite the image we just set
        ) {
          return;
        }
        if (locationInApp.pathname === "/create-event-page/device-detail") {
          setValue("ownership", "Rent");
        }
        setValue("quantity", 0);
        setValue(key, value);
      });

      const grouping = groupBy(inventoryItems, "item_group");
      const itemGroup = dataToRetrieve.item_group;
      if (grouping[itemGroup]) {
        const sortedData = orderBy(grouping[itemGroup], "serial_number", "asc");
        setAllSerialNumbersOptions(sortedData.map((x) => x.serial_number));
      }
      // The panel states which unit the details came from and how many matched,
      // so this stays a quiet confirmation. It used to be routed through
      // openNotificationWithIcon, which renders every message as an error —
      // a successful copy announced itself in red.
      setCopiedFrom({
        serial_number: dataToRetrieve.serial_number,
        matchCount,
      });
      notify("success", `Details copied from ${filteredItems.length} matching device${filteredItems.length === 1 ? "" : "s"}.`);
    } else {
      setCopiedFrom(null);
      notify(
        "warning",
        "No device in your inventory matches that. Fill the form in below instead.",
      );
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
      infoToSet = null;
    }

    setGeneralInfoForSelection(infoToSet);
  };

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

        // Automatically generate image URL
        try {
          if (imageUploadedValue[0].size > 5242880) {
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
          message.success("Image was successfully accepted.");
        } catch (error) {
          message.error("Failed to upload image: " + error.message);
        }
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

  // Pre-fill the location / sub-location when the user arrived here from a
  // specific location or sub-location page (the caller passes them via
  // react-router navigation state). Runs once on mount; runs after the
  // tax_location sync above so the pre-filled location wins on load.
  useEffect(() => {
    const prefill = locationInApp.state;
    if (!prefill) return;
    if (prefill.location) {
      setValue("location", prefill.location);
    }
    const subs = (Array.isArray(prefill.sub_location) ? prefill.sub_location : [])
      .map((s) => String(s).trim())
      .filter((s) => s && s !== "undefined" && s !== "null");
    if (subs.length > 0) {
      // Put the leaf in the visible field and keep any ancestors as chips;
      // buildSubLocationPath recombines them on submit.
      const ancestors = subs.slice(0, -1);
      if (ancestors.length > 0) {
        setSubLocationsSubmitted(ancestors);
      }
      setValue("sub_location", subs[subs.length - 1]);
      setDisplaySublocationFields(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // acceptAndGenerateImage,
    addingSubLocation,
    addSerialNumberField,
    allSerialNumbersOptions,
    contextHolder,
    openNotificationWithIcon,
    clearReferenceCopy,
    control,
    convertImageTo64ForPreview,
    copiedFrom,
    dicSuppliers,
    displayContainerSplotLimitField,
    displayPreviewImage,
    displaySublocationFields,
    errors,
    generalInfoForSelection,
    handleAddSubLocationInput,
    handleDeleteMoreInfo,
    handleMoreInfoPerDevice,
    handleRemoveSubLocationInput,
    handleSubLocationInputChange,
    handleSubmit,
    imageUploadedValue,
    imageUrlGenerated,
    isRented,
    keyObject,
    labeling,
    loadingStatus,
    manuallyAddingSerialNumbers,
    moreInfo,
    moreInfoDisplay,
    openScannedItemView,
    openScanningModal,
    providersList,
    queryClient,
    rangeFormat,
    refetchingAfterNewSupplier,
    register,
    renderingOptionsForSubLocations,
    renderLocationOptions,
    retrieveItemOptions,
    returningDate,
    savingNewItem,
    scannedSerialNumbers,
    setAddSerialNumberField,
    setAllSerialNumbersOptions,
    setConvertImageTo64ForPreview,
    setDisplayContainerSplotLimitField,
    setDisplayPreviewImage,
    setDisplaySublocationFields,
    setImageUploadedValue,
    setImageUrlGenerated,
    setIsRented,
    setKeyObject,
    setLabeling,
    setLoadingStatus,
    setMoreInfo,
    setMoreInfoDisplay,
    setOpenScannedItemView,
    setOpenScanningModal,
    setRangeFormat,
    setReturningDate,
    setScannedSerialNumbers,
    setSubLocationInputs,
    setSubLocationsSubmitted,
    setSupplierModal,
    setValue,
    setValueObject,
    subLocationInputs,
    subLocationsOptions,
    subLocationsSubmitted,
    supplierList,
    supplierModal,
    updateGroupItems,
    user,
    valueObject,
    watch,
    trigger,
    updateAll,
    setUpdateAll,
    retrieveItemDataSelected,
    handleSearchByReference,
    itemsInInventoryQuery,
  };
};

export default useBulkActionLogic;
