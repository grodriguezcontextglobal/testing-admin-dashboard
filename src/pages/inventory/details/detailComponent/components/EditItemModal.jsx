import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, message, notification } from "antd";
import { groupBy } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { convertToBase64 } from "../../../../../components/utils/convertToBase64";
import ReusableCard from "../../../../../components/UX/cards/ReusableCard";
import ModalUX from "../../../../../components/UX/modal/ModalUX";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import "../../../../../styles/global/reactInput.css";
import "../../../actions/style.css";
import { storeAndGenerateImageUrl } from "../../../actions/utils/EditBulkActionOptions";
import { retrieveExistingSubLocationsForCompanyInventory } from "../../../actions/utils/SubLocationRenderer";
import NewSupplier from "../../../actions/utils/suppliers/NewSupplier";
import costValueInputFormat from "../../../utils/costValueInputFormat";
import { formatDate } from "../../../utils/dateFormat";
import useSuppliers from "../../../utils/hooks/useSuppliers";
import { renderTitle } from "./ux/EditItemComponents";
import EditItemForm from "./ux/EditItemForm";

const options = [{ value: "Permanent" }, { value: "Rent" }, { value: "Sale" }];
const EditItemModal = ({
  dataFound,
  openEditItemModal,
  setOpenEditItemModal,
  refetchingFn,
}) => {
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
  const [isRented, setIsRented] = useState(false);
  const [displayPreviewImage, setDisplayPreviewImage] = useState(false);
  const [convertImageTo64ForPreview, setConvertImageTo64ForPreview] =
    useState(null);
  const [imageUrlGenerated, setImageUrlGenerated] = useState(null);
  const [removeImage, setRemoveImage] = useState(null);
  const { user } = useSelector((state) => state.admin);
  const {
    dicSuppliers,
    refetchingAfterNewSupplier,
    setSupplierModal,
    supplierList,
    supplierModal,
    providersList,
    queryClient,
  } = useSuppliers();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm();
  const closeModal = () => {
    return setOpenEditItemModal(false);
  };
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
    enabled: !!user.sqlInfo.company_id,
    staleTime: 2 * 60 * 1000,
  });

  const editingItemMutation = useMutation({
    mutationFn: (template) =>
      devitrakApi.post(
        "/db_company/update-items-based-on-alphanumeric-serial-number",
        template,
      ),
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

      const resetTemplate = {
        category_name: "",
        item_group: "",
        cost: "",
        brand: "",
        descript_item: "",
        ownership: "",
        warehouse: "",
        main_warehouse: "",
        update_at: "",
        company: "",
        location: "",
        sub_location: "",
        current_location: "",
        extra_serial_number: "",
        return_date: "",
        container: "",
        containerSpotLimit: "",
        image_url: "",
        supplier_info: "",
        enableAssignFeature: "",
      };

      Object.keys(resetTemplate).map((key) => {
        setValue(key, "");
      });

      message.success("Item was successfully updated.");
      setLoadingStatus(false);
      refetchingFn();
      return closeModal();
    },
    onError: (error) => {
      openNotificationWithIcon(`${error.message}`);
      setLoadingStatus(false);
    }
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
    if (itemsInInventoryQuery.data) {
      const locations = groupBy(
        itemsInInventoryQuery.data.data.items,
        "location",
      );
      const result = new Set();
      for (let data of Object.keys(locations)) {
        result.add({ value: data });
      }
      return Array.from(result);
    }
    return [];
  };

  const existingExtraInfoEntries = () => {
    try {
      const raw = dataFound[0]?.extra_serial_number;
      if (!raw) return [];
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!Array.isArray(parsed)) return [];
      const wrapped = parsed.find(
        (entry) => entry && typeof entry === "object" && !("keyObject" in entry),
      );
      const entries = wrapped
        ? wrapped[String(dataFound[0].serial_number)]
        : parsed;
      return Array.isArray(entries)
        ? entries.filter((entry) => entry?.keyObject !== "item_id")
        : [];
    } catch {
      return [];
    }
  };

  const mergedExtraInfoEntries = () => {
    const merged = new Map();
    existingExtraInfoEntries().forEach(({ keyObject, valueObject }) =>
      merged.set(keyObject, valueObject),
    );
    moreInfo.forEach(({ keyObject, valueObject }) =>
      merged.set(keyObject, valueObject),
    );
    return Array.from(merged, ([keyObject, valueObject]) => ({
      keyObject,
      valueObject,
    }));
  };

  const savingNewItem = async (data) => {
    if (
      !data.tax_location ||
      !data.category_name ||
      !data.brand ||
      !data.container ||
      !data.ownership ||
      !data.enableAssignFeature
    )
      return alert("All fields are required.");
    try {
      setLoadingStatus(true);
      const template = {
        updateAll: false,
        list: [dataFound[0].serial_number],
        category_name: data.category_name,
        item_group: data.item_group,
        cost: data.cost,
        brand: data.brand,
        descript_item: data.descript_item,
        ownership: data.ownership,
        warehouse: true,
        main_warehouse: data.tax_location,
        update_at: formatDate(new Date()),
        company: user.company,
        location: data.location,
        current_location: data.location,
        sub_location: JSON.stringify(subLocationsSubmitted),
        extra_serial_number: JSON.stringify(
          moreInfo.length > 0
            ? [{ [dataFound[0].serial_number]: mergedExtraInfoEntries() }]
            : [],
        ),
        company_id: user.sqlInfo.company_id,
        return_date:
          data.ownership === "Rent" ? formatDate(returningDate) : null,
        returnedRentedInfo: JSON.stringify([]),
        container: String(data.container).includes("Yes"),
        containerSpotLimit: data.containerSpotLimit,
        display_item: 1,
        enableAssignFeature: data.enableAssignFeature === "YES" ? 1 : 0,
        image_url: imageUrlGenerated ? imageUrlGenerated : data.image_url,
        supplier_info: data.supplier
          ? dicSuppliers.find(([key]) => key === data.supplier)[1]
          : null,
        reference: {},
      };
      return await editingItemMutation.mutateAsync(template);
    } catch (error) {
      openNotificationWithIcon(`${error.message}`);
    } finally {
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

  const subLocationsOptions = useMemo(
    () =>
      retrieveExistingSubLocationsForCompanyInventory(
        itemsInInventoryQuery?.data?.data?.items,
        watch("location"),
      ),
    [watch("location")],
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
      removeAllSubLocations: removeAllSubLocationsButton(),
    };
  };

  const addingSubLocation = (props) => {
    if (String(props).length < 1) return;
    const result = [...subLocationsSubmitted, props];
    setValue("sub_location", "");
    return setSubLocationsSubmitted(result);
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
    if (dataFound.length > 0) {
      Object.entries(dataFound[0]).forEach(([key, value]) => {
        if (key === "enableAssignFeature") {
          let valueToSet = value > 0 ? "YES" : "NO";
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
        if (key === "sub_location") {
          setValue("sub_location", "");
          const checkType =
            typeof value === "string" ? JSON.parse(value) : value;
          if (checkType.length > 0) {
            return setSubLocationsSubmitted([...checkType]);
          }
        }
      });
    }
    return () => {
      controller.abort();
    };
  }, [dataFound.length]);

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
  const modalBodyUI = () => {
    return (
      <ReusableCard>
        {contextHolder}
        <EditItemForm
          acceptImage={acceptAndGenerateImage}
          addingSubLocation={addingSubLocation}
          control={control}
          displayContainerSplotLimitField={displayContainerSplotLimitField}
          displayPreviewImage={displayPreviewImage}
          displaySublocationFields={displaySublocationFields}
          errors={errors}
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
          removeImage={removeImage}
          renderingOptionsForSubLocations={renderingOptionsForSubLocations}
          renderLocationOptions={renderLocationOptions}
          retrieveItemOptions={retrieveItemOptions}
          returningDate={returningDate}
          savingNewItem={savingNewItem}
          setImageUploadedValue={setImageUploadedValue}
          setKeyObject={setKeyObject}
          setMoreInfoDisplay={setMoreInfoDisplay}
          setRemoveImage={setRemoveImage}
          setReturningDate={setReturningDate}
          setSubLocationsSubmitted={setSubLocationsSubmitted}
          setValueObject={setValueObject}
          subLocationsOptions={subLocationsOptions}
          subLocationsSubmitted={subLocationsSubmitted}
          valueObject={valueObject}
          watch={watch}
          suppliersOptions={supplierList}
          closeModal={setOpenEditItemModal}
        />
      </ReusableCard>
    );
  };
  return (
    <>
      <ModalUX
        title={renderTitle()}
        key={dataFound[0].item_id}
        openDialog={openEditItemModal}
        closeModal={() => closeModal()}
        style={{ top: "20dv", zIndex: 30 }}
        width={1000}
        footer={[]}
        body={modalBodyUI()}
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
    </>
  );
};

export default EditItemModal;
