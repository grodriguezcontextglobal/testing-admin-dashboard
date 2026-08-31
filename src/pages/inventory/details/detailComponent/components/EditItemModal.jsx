import { useMutation, useQuery } from "@tanstack/react-query";
import { message } from "antd";
import { groupBy } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { convertToBase64 } from "../../../../../components/utils/convertToBase64";
import ReusableCard from "../../../../../components/UX/cards/ReusableCard";
import ModalUX from "../../../../../components/UX/modal/ModalUX";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import { onTrackBackgroundJob } from "../../../../../store/slices/backgroundJobsSlice";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import "../../../../../styles/global/reactInput.css";
import "../../../actions/style.css";
import { storeAndGenerateImageUrl } from "../../../actions/utils/EditBulkActionOptions";
import { retrieveExistingSubLocationsForCompanyInventory } from "../../../actions/utils/SubLocationRenderer";
import NewSupplier from "../../../actions/utils/suppliers/NewSupplier";
import costValueInputFormat from "../../../utils/costValueInputFormat";
import { formatDate } from "../../../utils/dateFormat";
import useSuppliers from "../../../utils/hooks/useSuppliers";
import generateIdempotencyKey from "../../../../../utils/actions/generateIdempotencyKey";
import { renderTitle } from "./ux/EditItemComponents";
import EditItemForm from "./ux/EditItemForm";
import { useStatusNotification } from "../../../../../components/notification/alerts/useStatusNotification";
import { deviceProfileKeys } from "../../deviceProfile/hooks/useDeviceProfile";
import { inventoryPageQueryKeys } from "../../../utils/inventoryQueryKeys";
import {
  buildEditItemFormValues,
  buildExtraSerialNumberPayload,
  parseExtraInfoEntries,
  parseReturnDate,
  parseSubLocations,
  resolveStockFields,
  resolveSupplierId,
  resolveSupplierName,
} from "../../utils/editItemFormModel";

const options = [{ value: "Permanent" }, { value: "Rent" }, { value: "Sale" }];
const EditItemModal = ({
  dataFound,
  openEditItemModal,
  setOpenEditItemModal,
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
  const dispatch = useDispatch();
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
    getValues,
    watch,
    control,
    formState: { errors },
  } = useForm();
  const closeModal = () => {
    return setOpenEditItemModal(false);
  };
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
    enabled: !!user.sqlInfo.company_id,
    staleTime: 2 * 60 * 1000,
  });

  const editingItemMutation = useMutation({
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

  /**
   * The Supplier field is a free-text AutoComplete seeded with the item's
   * current supplier name, so three things can come out of it:
   *   cleared      -> the user dropped the supplier on purpose, write null
   *   known name   -> its provider id
   *   unknown name -> a name typed by hand that no provider matches. Keep the
   *                   id the item already had rather than silently dropping it;
   *                   a genuinely new supplier is created with "Add supplier".
   *
   * Before this the field was never seeded at all, so it was blank on open and
   * every edit wrote supplier_info: null — and `.find(...)[1]` threw outright
   * on a hand-typed name.
   */
  const resolveSupplierInfo = (typedName) => {
    const typed = String(typedName ?? "").trim();
    if (!typed) return null;
    return (
      resolveSupplierId(dicSuppliers, typed) ??
      dataFound[0]?.supplier_info ??
      null
    );
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
        /* Was `warehouse: true`. Saving a description change on a device that
           was out with a member put it back on the shelf in the item table
           while the lease still said somebody held it. An out-of-stock unit now
           gets its own values back unchanged; where it is belongs to the lease,
           not to this form. */
        ...resolveStockFields({
          item: dataFound[0],
          requestedState: data.stock_state,
        }),
        main_warehouse: data.tax_location,
        update_at: formatDate(new Date()),
        company: user.company,
        location: data.location,
        current_location: data.location,
        sub_location: JSON.stringify(subLocationsSubmitted),
        // moreInfo is seeded with the item's stored identifiers on open, so it
        // is the complete list — additions and deletions both. It used to be
        // sent as [] unless the panel had been opened, which erased them.
        extra_serial_number: buildExtraSerialNumberPayload({
          serialNumber: dataFound[0].serial_number,
          entries: moreInfo,
        }),
        company_id: user.sqlInfo.company_id,
        return_date:
          data.ownership === "Rent" ? formatDate(returningDate) : null,
        returnedRentedInfo: JSON.stringify([]),
        container: String(data.container).includes("Yes"),
        containerSpotLimit: data.containerSpotLimit,
        display_item: 1,
        enableAssignFeature: data.enableAssignFeature === "YES" ? 1 : 0,
        image_url: imageUrlGenerated ? imageUrlGenerated : data.image_url,
        // Falls back to the id already on the item: the field is a free-text
        // AutoComplete, so a name the provider list does not know is a normal
        // thing to type — and `.find(...)[1]` used to throw on it.
        supplier_info: resolveSupplierInfo(data.supplier),
        reference: {},
      };
      const idempotencyKey = generateIdempotencyKey();
      const { data: response } = await editingItemMutation.mutateAsync({
        template,
        idempotencyKey,
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

      openNotificationWithIcon(
        "Your update was registered and is processing in the background. We'll notify you when it's ready."
      );
      dispatch(
        onTrackBackgroundJob({
          jobId: response.jobId,
          type: "inventory-item-update",
          successMessage: "Item was successfully updated.",
          failureMessage: "The item update failed.",
          // BackgroundJobsTracker invalidates with `exact: true`, and the
          // device-profile keys carry the item id — ["trackingItemActivity"]
          // alone matched nothing, so a finished edit never refreshed the page
          // it was made from. Build the full keys.
          invalidateKeys: [
            ...inventoryPageQueryKeys(user.sqlInfo.company_id),
            deviceProfileKeys.tracking(dataFound[0].item_id),
            deviceProfileKeys.item(dataFound[0].item_id),
          ],
        })
      );
      return closeModal();
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
  /**
   * The two sub-location buttons, rendered into one row by EditItemForm.
   *
   * They are mutually exclusive: add while the fields are hidden, remove once
   * they are shown. Conditional rendering rather than the `display: none` juggle
   * that was here before, which kept both in the layout and made the row's width
   * depend on the wider of the two.
   *
   * Sizing: `flex: 1 1 auto` with `minWidth: 0`, not `width: 100%` with
   * `alignSelf: stretch`. A percentage width resolves against the flex
   * container's content box and then adds the button's own padding on top, so it
   * hung over the edge; `flex` lets the row hand out the space it actually has.
   */
  const renderingOptionsForSubLocations = () => {
    const addSublocationButton = () => {
      if (displaySublocationFields) return null;
      return (
        <BlueButtonComponent
          onClick={() => setDisplaySublocationFields(true)}
          styles={{
            flex: "1 1 auto",
            minWidth: 0,
            boxSizing: "border-box",
            borderRadius: "8px",
          }}
        >
          Add sub location
        </BlueButtonComponent>
      );
    };

    const removeAllSubLocationsButton = () => {
      if (!displaySublocationFields) return null;
      return (
        <BlueButtonComponent
          onClick={() => {
            setDisplaySublocationFields(false);
            setSubLocationsSubmitted([]);
          }}
          styles={{
            flex: "1 1 auto",
            minWidth: 0,
            boxSizing: "border-box",
            borderRadius: "8px",
          }}
        >
          Remove all sub location
        </BlueButtonComponent>
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

  /**
   * Open the form on the item as it actually is.
   *
   * This used to walk the record's keys and setValue(key, value) each one,
   * which only fills fields named after a column. tax_location (column
   * main_warehouse) and supplier (column supplier_info) are not, so both opened
   * blank — and a blank tax_location is rejected by savingNewItem, so editing
   * anything failed on a value that was never missing.
   *
   * Keyed on the item, not on dicSuppliers: the provider list arrives
   * asynchronously, and re-running this whole seed when it lands would throw
   * away whatever the user had already typed. The supplier name is filled in by
   * the follow-up effect below.
   */
  useEffect(() => {
    const item = dataFound[0];
    if (!item) return;

    const values = buildEditItemFormValues(item, {
      supplierName: resolveSupplierName(dicSuppliers, item.supplier_info),
    });
    Object.entries(values).forEach(([key, value]) => setValue(key, value));

    setSubLocationsSubmitted(parseSubLocations(item.sub_location));

    // Load the extra identifiers the item already has into the editor, and open
    // the panel when there are any. They were invisible here before, which is
    // why the save had to guess and ended up sending [] — erasing them.
    // Seeding them means the delete button on a chip now genuinely deletes.
    const storedExtraInfo = parseExtraInfoEntries(item);
    setMoreInfo(storedExtraInfo);
    if (storedExtraInfo.length > 0) setMoreInfoDisplay(true);

    // Rented units carry a due date. It lives in component state, which the old
    // key-walking seed could not reach, so it reset to today on every edit and
    // the save wrote that back.
    const storedReturnDate = parseReturnDate(item.return_date);
    if (storedReturnDate) setReturningDate(storedReturnDate);
  }, [dataFound[0]?.item_id]);

  /**
   * Supplier name, once the provider list resolves.
   *
   * Only fills a field that is still empty, so a list that lands late cannot
   * overwrite a supplier the user just picked.
   */
  useEffect(() => {
    const item = dataFound[0];
    if (!item || getValues("supplier")) return;
    const name = resolveSupplierName(dicSuppliers, item.supplier_info);
    if (name) setValue("supplier", name);
  }, [dataFound[0]?.item_id, dicSuppliers]);

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

  // Collapsing the "Add more information" panel used to empty moreInfo. That
  // was survivable while the list only ever held newly typed entries; now that
  // it is seeded with the item's stored identifiers, wiping it on collapse
  // would delete them. The panel toggle shows and hides — the delete button on
  // each entry is what removes one.

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
          item={dataFound[0]}
          setValue={setValue}
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
