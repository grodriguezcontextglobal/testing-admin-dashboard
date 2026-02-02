import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message, notification } from "antd";
import { groupBy } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../../../api/devitrakApi";
import { WhiteCirclePlusIcon } from "../../../../../../../components/icons/WhiteCirclePlusIcon";
import { convertToBase64 } from "../../../../../../../components/utils/convertToBase64";
import { formatDate } from "../../../../../../../components/utils/dateFormat";
import BlueButtonComponent from "../../../../../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../../../../../components/UX/buttons/DangerButton";
import { OutlinedInputStyle } from "../../../../../../../styles/global/OutlinedInputStyle";
import { storeAndGenerateImageUrl } from "../../../../../../inventory/actions/utils/EditBulkActionOptions";
import { retrieveExistingSubLocationsForCompanyInventory } from "../../../../../../inventory/actions/utils/SubLocationRenderer";
import validatingInputFields from "../../../../../../inventory/actions/utils/validatingInputFields";
import costValueInputFormat from "../../../../../../inventory/utils/costValueInputFormat";
import {
  addDeviceToEvent,
  createEvent,
} from "../components/newDevice/actions/AddDeviceToEvent";
import { createNewLease } from "../components/newDevice/actions/CreateNewLease";
import { singleItemInserting } from "../components/newDevice/actions/SingleItemInserting";

const options = [{ value: "Permanent" }, { value: "Rent" }, { value: "Sale" }];

export const useAssignmentLogic = () => {
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
  const [addContracts, setAddContracts] = useState(false);
  const [contractList, setContractList] = useState([]);
  const [dicSuppliers, setDicSuppliers] = useState({});
  const [supplierModal, setSupplierModal] = useState(false);
  const [supplierList, setSupplierList] = useState([
    {
      value: (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
          }}
        >
          <BlueButtonComponent
            // disabled={true}
            title={"Add supplier"}
            styles={{ with: "100%" }}
            icon={<WhiteCirclePlusIcon />}
            buttonType="button"
            titleStyles={{
              textTransform: "none",
              with: "100%",
            }}
            func={() => setSupplierModal(true)}
          />
        </div>
      ),
    },
  ]);
  const { user } = useSelector((state) => state.admin);
  const { profile } = useSelector((state) => state.staffDetail);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm();
  const queryClient = useQueryClient();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = useCallback(
    (msg) => {
      api.open({
        message: msg,
      });
    },
    [api],
  );
  const providersList = useQuery({
    queryKey: ["providersCompanyQuery", user?.companyData?.id],
    queryFn: () =>
      devitrakApi.get("/company/provider-companies", {
        params: {
          creator: user?.companyData?.id,
        },
      }),
    enabled: !!user?.companyData?.id,
    refetchOnMount: false,
    staleTime: 60 * 1000 * 5, // 5 minutes
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
    const refetchingAfterNewSupplier = () => {
      queryClient.invalidateQueries({
        queryKey: ["providersCompanyQuery", user?.companyData?.id],
      });
      return providersList.refetch();
    };
  const invalidateQueries = () => {
    queryClient.invalidateQueries({
      queryKey: ["ItemsInInventoryCheckingQuery"],
    });
    queryClient.invalidateQueries({ queryKey: ["listOfItemsInStock"] });
    queryClient.invalidateQueries({
      queryKey: ["RefactoredListInventoryCompany"],
    });
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
  const verificationContractStaffMember = async () => {
    const stampTime = new Date().toISOString();
    const verificationResponse = await devitrakApi.post(
      "/document/verification/staff_member/signed_document",
      {
        staff_member_id: profile.adminUserInfo.id,
        contract_list: contractList,
        company_id: user.companyData.id,
        assigner_staff_member_id: user.id ?? user.uid,
        date: stampTime,
      },
    );
    return verificationResponse;
  };
  const emailNotification = async (props) => {
    const stampTime = new Date().toISOString();
    try {
      await devitrakApi.post(
        "/nodemailer/liability-contract-email-notification",
        {
          company_name: user.companyData.company_name,
          company_id: user.companyData.id,
          email_admin: user.email,
          staff: {
            name: `${profile.firstName ?? ""} ${profile.lastName ?? ""}`,
            email: profile.email,
            staff_member_id: profile.adminUserInfo.id,
          },
          contract_list: contractList,
          items: [
            {
              serial_number: props.serial_number,
              type: props.item_group,
              id: props.device_id,
            },
          ],
          subject: "Device Liability Contract",
          date_reference: stampTime,
          verification_id: props.verification_id,
        },
      );
    } catch (error) {
      return openNotificationWithIcon(`${error.message}`);
    }
  };
  const closeModal = () => {
    return navigate(`/staff/${profile.adminUserInfo.id}/main`);
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
        "Max serial number must be greater than min serial number.",
      );
    }
    if (groupingByDeviceType[data.item_group]) {
      const dataRef = groupBy(
        groupingByDeviceType[data.item_group],
        "serial_number",
      );
      if (dataRef[data.serial_number]?.length > 0) {
        return openNotificationWithIcon(
          "Device serial number already exists in company records.",
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
          "Image is bigger than allow. Please resize the image or select a new one.",
        );
      }
      const newInsertedItem = await singleItemInserting({
        data,
        user,
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
      });
      const verificationID = await verificationContractStaffMember();
      await createNewLease({
        address: {
          street: data.address_street,
          city: data.address_city,
          state: data.address_state,
          zip: data.address_zip,
        },
        profile: profile,
        user,
        formatDate,
        insertId: newInsertedItem.insertId,
        verificationID: verificationID,
      });
      const newEventInfo = await createEvent({
        street: data.address_street,
        city: data.address_city,
        state: data.address_state,
        zip: data.address_zip,
        profile,
        user,
      });
      await addDeviceToEvent({
        eventId: newEventInfo.insertId,
        itemId: newInsertedItem.insertId,
      });
      await emailNotification({
        serial_number: data.serial_number,
        item_group: data.item_group,
        contractList,
        device_id: newInsertedItem.insertId,
        verification_id: verificationID,
      });
      setLoadingStatus(false);
      return closeModal();
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
  const gripingFields = (props) => {
    if (
      props === "min_serial_number" ||
      props === "max_serial_number" ||
      props === "quantity"
    )
      return 6;
    return 6;
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
    if (String(props).trim().length < 1) {
      return openNotificationWithIcon("Sub-location cannot be empty.");
    }
    const result = [...subLocationsSubmitted, props];
    setValue("sub_location", "");
    return setSubLocationsSubmitted(result);
  };

  useEffect(() => {
    const suppliersOptionsRendering = () => {
      let result = [];
      if (providersList?.data?.data?.providerCompanies?.length > 0) {
        providersList?.data?.data?.providerCompanies?.map((item) => {
          result.push({ value: item.companyName });
        });
      }
      return setSupplierList([...supplierList, ...result]);
    };
    const diccionarySuppliers = () => {
      const dic = new Map();
      if (providersList?.data?.data?.providerCompanies?.length > 0) {
        providersList?.data?.data?.providerCompanies?.map((item) => {
          if (!dic.has(item.companyName)) {
            let c = {};
            c[item.companyName] = item.id;
            dic.set(item.companyName, item.id);
          }
        });
      }
      return setDicSuppliers(Array.from(dic));
    };
    suppliersOptionsRendering();
    diccionarySuppliers();
  }, [providersList.data, providersList.isRefetching]);
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
    if (retrieveItemDataSelected().has(watch("reference_item_group"))) {
      const dataToRetrieve = retrieveItemDataSelected().get(
        watch("reference_item_group"),
      );
      if (Object.entries(dataToRetrieve).length > 0) {
        Object.entries(dataToRetrieve).forEach(([key, value]) => {
          if (key === "container") {
            return;
          }
          if (key === "enableAssignFeature") return setValue(key, "Enabled");
          if (key === "sub_location") {
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

    useEffect(() => {
      setValue("location", watch("tax_location"));
    }, [watch("tax_location")]);
  
  return {
    acceptAndGenerateImage,
    addContracts,
    addingSubLocation,
    closeModal,
    contextHolder,
    contractList,
    control,
    convertImageTo64ForPreview,
    displayContainerSplotLimitField,
    displayPreviewImage,
    displaySublocationFields,
    errors,
    gripingFields,
    handleDeleteMoreInfo,
    handleMoreInfoPerDevice,
    handleSubmit,
    imageUploadedValue,
    imageUrlGenerated,
    isRented,
    keyObject,
    loadingStatus,
    moreInfo,
    moreInfoDisplay,
    options,
    OutlinedInputStyle,
    profile,
    providersList,
    queryClient,
    refetchingAfterNewSupplier,
    register,
    renderingOptionsForSubLocations,
    renderLocationOptions,
    retrieveItemOptions,
    returningDate,
    savingNewItem,
    setAddContracts,
    setContractList,
    setImageUploadedValue,
    setKeyObject,
    setMoreInfoDisplay,
    setReturningDate,
    setSubLocationsSubmitted,
    setSupplierModal,
    setValue,
    setValueObject,
    subLocationsOptions,
    subLocationsSubmitted,
    supplierList,
    supplierModal,
    user,
    valueObject,
    watch,
  };
};
