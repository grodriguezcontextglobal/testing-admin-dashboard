import {
  Chip,
  Grid,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import {
  AutoComplete,
  Breadcrumb,
  Button,
  Divider,
  Tooltip,
  notification,
  Popconfirm,
} from "antd";
import "../../../styles/global/ant-select.css";
import "../../../styles/global/reactInput.css";
import "./style.css";
import "react-datepicker/dist/react-datepicker.css";
import { AntSelectorStyle } from "../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { Controller, useForm } from "react-hook-form";
import { convertToBase64 } from "../../../components/utils/convertToBase64";
import { devitrakApi } from "../../../api/devitrakApi";
import { formatDate } from "../utils/dateFormat";
import { GrayButton } from "../../../styles/global/GrayButton";
import { groupBy } from "lodash";
import { Link, useNavigate } from "react-router-dom";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import { QuestionIcon } from "../../../components/icons/QuestionIcon";
import { Subtitle } from "../../../styles/global/Subtitle";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { WhiteCirclePlusIcon } from "../../../components/icons/WhiteCirclePlusIcon";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import costValueInputFormat from "../utils/costValueInputFormat";
import DatePicker from "react-datepicker";
import GrayButtonText from "../../../styles/global/GrayButtonText";
import ImageUploaderFormat from "../../../classes/imageCloudinaryFormat";
import ImageUploaderUX from "../../../components/utils/UX/ImageUploaderUX";
import { renderFields } from "./utils/BulkItemsFields";
import { retrieveExistingSubLocationsForCompanyInventory } from "./utils/SubLocationRenderer";
const options = [{ value: "Permanent" }, { value: "Rent" }, { value: "Sale" }];
const AddNewBulkItems = () => {
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
      sub_location: null,
      sub_location_2: null,
      sub_location_3: null,
      quantity: 0,
      container: "",
      containerSpotLimit: "0",
    },
  });
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (msg) => {
    api.open({
      message: msg,
    });
  };
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

  useEffect(() => {
    const controller = new AbortController();
    companiesQuery.refetch();
    itemsInInventoryQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

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

  useEffect(() => {
    const controller = new AbortController();
    if (retrieveItemDataSelected().has(watch("item_group"))) {
      const dataToRetrieve = retrieveItemDataSelected().get(
        watch("item_group")
      );
      setValue("category_name", `${dataToRetrieve.category_name}`);
      setValue("cost", `${dataToRetrieve.cost}`);
      setValue("brand", `${dataToRetrieve.brand}`);
      setValue("descript_item", `${dataToRetrieve.descript_item}`);
      setValue("location", `${dataToRetrieve.location}`);
      setValue("tax_location", `${dataToRetrieve.main_warehouse}`);
      setValue("ownership", `${dataToRetrieve.ownership}`);
      setValue("container", "");
    }
    return () => {
      controller.abort();
    };
  }, [watch("item_group")]);

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

  const savingNewItem = async (data) => {
    const dataDevices = itemsInInventoryQuery.data.data.items;
    const groupingByDeviceType = groupBy(dataDevices, "item_group");
    if (data.item_group === "")
      return openNotificationWithIcon("A group of item must be provided.");
    if (data.tax_location === "")
      return openNotificationWithIcon("A taxable location must be provided.");
    if (data.ownership === "")
      return openNotificationWithIcon("Ownership status must be provided.");
    if (String(data.ownership).toLowerCase() === "rent" && !returningDate) {
      return openNotificationWithIcon(
        "As ownership was set as 'Rent', returning date must be provided."
      );
    }

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
      let base64;
      let img_url;
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
      if (imageUploadedValue?.length > 0) {
        base64 = await convertToBase64(imageUploadedValue[0]);
        const templateImageUpload = new ImageUploaderFormat(
          base64,
          user.companyData.id,
          data.category_name,
          data.item_group,
          "",
          "",
          "",
          "",
          ""
        );
        const registerImage = await devitrakApi.post(
          "/cloudinary/upload-image",
          templateImageUpload.item_uploader()
        );

        await devitrakApi.post(`/image/new_image`, {
          source: registerImage.data.imageUploaded.secure_url,
          category: data.category_name,
          item_group: data.item_group,
          company: user.companyData.id,
        });

        img_url = registerImage.data.imageUploaded.secure_url;
      }
      const template = {
        category_name: data.category_name,
        item_group: data.item_group,
        cost: data.cost,
        brand: data.brand,
        descript_item: data.descript_item,
        ownership: data.ownership,
        min_serial_number: data.min_serial_number,
        max_serial_number: data.max_serial_number,
        warehouse: true,
        main_warehouse: data.tax_location,
        created_at: formatDate(new Date()),
        update_at: formatDate(new Date()),
        company: user.company,
        location: data.location,
        current_location: data.location,
        sub_location: JSON.stringify(subLocationsSubmitted),
        extra_serial_number: JSON.stringify(moreInfo),
        company_id: user.sqlInfo.company_id,
        return_date:
          data.ownership === "Rent" ? formatDate(returningDate) : null,
        container: String(data.container).includes("Yes"),
        containerSpotLimit: data.containerSpotLimit,
        image_url: img_url,
      };
      const respNewItem = await devitrakApi.post(
        "/db_item/bulk-item",
        template
      );
      if (respNewItem.data.ok) {
        setValue("category_name", "");
        setValue("item_group", "");
        setValue("cost", "");
        setValue("brand", "");
        setValue("descript_item", "");
        setValue("ownership", "");
        setValue("min_serial_number", "");
        setValue("max_serial_number", "");
        setValue("quantity", 0);
        setValue("location", "");
        setValue("tax_location", "");
        setValue("container", "");
        setValue("containerSpotLimit", "0");
        openNotificationWithIcon(
          "New group of items were created and stored in database."
        );
        setLoadingStatus(false);
        await devitrakApi.post("/cache_update/remove-cache", {
          key: `company_id=${user.companyData.id}&warehouse=true&enableAssignFeature=1`,
        });

        return navigate("/inventory");
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

  const renderTitle = () => {
    return (
      <>
        <InputLabel
          id="eventName"
          style={{ marginBottom: "6px", width: "100%" }}
        >
          <Typography
            textAlign={"left"}
            style={TextFontSize30LineHeight38}
            color={"var(--gray-600, #475467)"}
          >
            Add a group of items
          </Typography>
        </InputLabel>
        <InputLabel
          id="eventName"
          style={{ marginBottom: "6px", width: "100%" }}
        >
          <Typography
            textAlign={"left"}
            textTransform={"none"}
            style={{ ...TextFontSize20LineHeight30, textWrap: "balance" }}
            color={"var(--gray-600, #475467)"}
          >
            Devices serial numbers can be created by inputting a serial number
            base to define the category of items, and then a range from one
            number to another, depending on your inventory.
          </Typography>
        </InputLabel>
      </>
    );
  };

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

  const styling = {
    textTransform: "none",
    textAlign: "left",
    fontFamily: "Inter",
    fontSize: "14px",
    fontStyle: "normal",
    fontWeight: 500,
    lineHeight: "20px",
    color: "var(--gray-700, #344054)",
  };

  const buttonStyleLoading = {
    ...BlueButton,
    ...CenteringGrid,
    width: "100%",
    border: `1px solid ${
      loadingStatus ? "var(--disabled-blue-button)" : "var(--blue-dark-600)"
    }`,
    borderRadius: "8px",
    background: `${
      loadingStatus ? "var(--disabled-blue-button)" : "var(--blue-dark-600)"
    }`,
    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
    padding: "6px 12px",
    cursor: "pointer",
  };

  const handleDeleteMoreInfo = (index) => {
    const result = [...moreInfo];
    const removingResult = result.filter((_, i) => i !== index);
    return setMoreInfo(removingResult);
  };

  const styleDivParent = {
    width: "100%",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    textAlign: "left",
    gap: "10px",
  };

  const renderOptional = (props) => {
    if (props === "Day") {
      return (
        <div
          style={{
            width: "100%",
            display: watch("ownership") === "Rent" ? "flex" : "none",
          }}
        >
          <DatePicker
            id="calender-event"
            autoComplete="checking"
            showTimeSelect
            dateFormat="Pp"
            minDate={new Date()}
            selected={returningDate}
            openToDate={new Date()}
            startDate={new Date()}
            onChange={(date) => setReturningDate(date)}
            style={{
              ...OutlinedInputStyle,
              width: "100%",
              borderRadius: "8px",
            }}
          />
        </div>
      );
    }
    if (props === "Quantity") {
      return (
        <OutlinedInput
          readOnly
          {...register("quantity")}
          fullWidth
          style={{
            ...OutlinedInputStyle,
            width: "100%",
            borderRadius: "8px",
          }}
        />
      );
    }

    return (
      <OutlinedInput
        required
        multiline
        minRows={5}
        {...register("descript_item", { required: true })}
        fullWidth
        aria-invalid={errors.descript_item}
        style={{
          borderRadius: "8px",
          backgroundColor: "#fff",
          color: "#000",
          verticalAlign: "center",
          boxShadow: "1px 1px 2px rgba(16, 24, 40, 0.05)",
          outline: "none",
        }}
        placeholder="Please provide a brief description of the new device to be added."
      />
    );
  };

  const gripingFields = (props) => {
    if (
      props === "min_serial_number" ||
      props === "max_serial_number" ||
      props === "quantity"
    )
      return 4;
    return 6;
  };

  const qtyDiff = useCallback(() => {
    if (watch("max_serial_number").length < 1) return 0;
    const result =
      Number(watch("max_serial_number")) - Number(watch("min_serial_number"));
    return setValue("quantity", result + 1);
  }, [watch("max_serial_number"), watch("min_serial_number")]);
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

    return {
      addSubLocation: addSublocationButton(),
      addEndingSerialNumberSequence: addEndingSerialNumberSequenceButton(),
    };
  };

  const addingSubLocation = (props) => {
    if (String(props).length < 1) return;
    const result = [...subLocationsSubmitted, props];
    setValue("sub_location", "");
    return setSubLocationsSubmitted(result);
  };

  return (
    <Grid
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
      container
    >
      {contextHolder}
      {renderTitle()}
      <form onSubmit={handleSubmit(savingNewItem)} className="form">
        <Grid container spacing={1}>
          {/* style={styleDivParent} */}
          {renderFields({
            OutlinedInputStyle,
            retrieveItemOptions,
            renderLocationOptions,
            options,
            displayContainerSplotLimitField,
            subLocationsOptions,
            displaySublocationFields,
          }).map((item) => {
            if (item.displayField) {
              if (item.htmlOption === 6) {
                return (
                  <Grid
                    key={item.name}
                    style={{
                      textAlign: "left",
                    }}
                    marginY={1}
                    item
                    xs={12}
                    sm={12}
                    md={
                      item.name === "descript_item"
                        ? 12
                        : gripingFields(item.name)
                    }
                    lg={
                      item.name === "descript_item"
                        ? 12
                        : gripingFields(item.name)
                    }
                  >
                    <InputLabel
                      style={{ marginBottom: "0.2rem", width: "100%" }}
                    >
                      <Tooltip
                        placement="top"
                        title={item.tooltipMessage}
                        style={{
                          width: "100%",
                        }}
                      >
                        <Typography style={styling}>
                          {item.label} {item.tooltip && <QuestionIcon />}
                        </Typography>
                      </Tooltip>
                    </InputLabel>

                    <ImageUploaderUX
                      setImageUploadedValue={setImageUploadedValue}
                    />
                  </Grid>
                );
              }
              return (
                <Grid
                  key={item.name}
                  style={{
                    textAlign: "left",
                  }}
                  marginY={1}
                  item
                  xs={12}
                  sm={12}
                  md={
                    item.name === "descript_item"
                      ? 12
                      : gripingFields(item.name)
                  }
                  lg={
                    item.name === "descript_item"
                      ? 12
                      : gripingFields(item.name)
                  }
                >
                  <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                    <Tooltip
                      placement="top"
                      title={item.tooltipMessage}
                      style={{
                        width: "100%",
                      }}
                    >
                      <Typography style={styling}>
                        {item.label} {item.tooltip && <QuestionIcon />}
                      </Typography>
                    </Tooltip>
                  </InputLabel>
                  {item.htmlElement.length < 1 ? (
                    <Controller
                      control={control}
                      name={item.name}
                      render={({ field: { value, onChange } }) => (
                        <Grid
                          container
                          spacing={1}
                          style={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Grid item xs={12} sm={12} md={12} lg={12}>
                            <AutoComplete
                              aria-required={true}
                              className="custom-autocomplete" // Add a custom className here
                              variant="outlined"
                              style={{
                                ...AntSelectorStyle,
                                border: "solid 0.3 var(--gray600)",
                                fontFamily: "Inter",
                                fontSize: "14px",
                                width: "100%",
                              }}
                              value={value}
                              onChange={(value) => onChange(value)}
                              options={item.options.map((x) => {
                                if (item.htmlOption === 0) {
                                  return { value: x };
                                } else {
                                  return { value: x.value };
                                }
                              })}
                              placeholder={item.placeholder}
                              filterOption={(inputValue, option) =>
                                option.value
                                  .toUpperCase()
                                  .indexOf(inputValue.toUpperCase()) !== -1
                              }
                              allowClear
                            />
                            <Button
                              style={{
                                display:
                                  item.label === "Sub location"
                                    ? "flex"
                                    : "none",
                                margin: "10px 0 0",
                              }}
                              onClick={() =>
                                addingSubLocation(watch("sub_location"))
                              }
                            >
                              Add sub location
                            </Button>
                          </Grid>
                          <Grid
                            display={
                              item.label === "Main location" ||
                              item.label === "Sub location"
                                ? "flex"
                                : "none"
                            }
                            justifyContent={"flex-start"}
                            alignItems={"center"}
                            item
                            xs={12}
                            sm={12}
                            md={12}
                            lg={12}
                          >
                            {
                              renderingOptionsForSubLocations(item.label)
                                .addSubLocation
                            }
                          </Grid>
                          <Grid item xs={12} sm={12} md={12} lg={12}>
                            <Breadcrumb
                              style={{
                                display:
                                  item.label === "Sub location" ||
                                  displaySublocationFields.length > 0
                                    ? "flex"
                                    : "none",
                                width: "100%",
                              }}
                              items={[
                                {
                                  title: (
                                    <p
                                      style={{
                                        backgroundColor: "transparent",
                                        border: "none",
                                        outline: "none",
                                        boxShadow: "none",
                                        margin: "auto",
                                        padding: 0,
                                        fontFamily: "Inter",
                                        width: "fit-content",
                                      }}
                                    >
                                      {watch("location")}
                                    </p>
                                  ),
                                },
                                ...subLocationsSubmitted.map((item, index) => ({
                                  title: (
                                    <Popconfirm
                                      title="Are you sure you want to delete this sub location?"
                                      onConfirm={() =>
                                        setSubLocationsSubmitted(
                                          subLocationsSubmitted.filter(
                                            (_, i) => i !== index
                                          )
                                        )
                                      }
                                    >
                                      <Button
                                        style={{
                                          border: "none",
                                          outline: "none",
                                          margin: 0,
                                          padding: 0,
                                          backgroundColor: "transparent",
                                          boxShadow: "none",
                                          alignItems: "flex-start",
                                        }}
                                      >
                                        {item}
                                      </Button>
                                    </Popconfirm>
                                  ),
                                })),
                              ]}
                            />
                          </Grid>
                        </Grid>
                      )}
                    />
                  ) : (
                    renderOptional(item.htmlElement)
                  )}{" "}
                </Grid>
              );
            }
          })}
        </Grid>
        <Divider />
        <Button
          type="button"
          onClick={() => setMoreInfoDisplay(!moreInfoDisplay)}
          style={buttonStyleLoading}
        >
          <Typography textTransform={"none"} style={BlueButtonText}>
            <WhiteCirclePlusIcon /> &nbsp; Add more information
          </Typography>
        </Button>
        {moreInfoDisplay && (
          <div
            style={{
              width: "100%",
              ...CenteringGrid,
              justifyContent: "space-between",
              gap: "5px",
            }}
          >
            <OutlinedInput
              style={{ ...OutlinedInputStyle, width: "100%" }}
              placeholder="e.g IMEI"
              name="key"
              value={keyObject}
              onChange={(e) => setKeyObject(e.target.value)}
            />
            <OutlinedInput
              style={{ ...OutlinedInputStyle, width: "100%" }}
              placeholder="e.g YABSDA56AKJ"
              name="key"
              value={valueObject}
              onChange={(e) => setValueObject(e.target.value)}
            />
            <Button
              htmlType="button"
              onClick={() => handleMoreInfoPerDevice()}
              style={{ ...BlueButton, ...CenteringGrid }}
            >
              <WhiteCirclePlusIcon />
            </Button>
          </div>
        )}
        <Divider
          style={{
            marginBottom: "-15px",
            display: moreInfoDisplay ? "" : "none",
          }}
        />
        <div
          style={{
            width: "100%",
            display: moreInfoDisplay ? "flex" : "none",
            justifyContent: "flex-start",
            alignSelf: "flex-start",
          }}
        >
          <p style={Subtitle}>More information</p>
        </div>
        <div
          style={{
            width: "100%",
            display: moreInfoDisplay ? "flex" : "none",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          {moreInfo.length > 0 &&
            moreInfo.map((item, index) => (
              <Chip
                style={{
                  backgroundColor: "var(--basewhite)",
                  padding: "2.5px 5px",
                  margin: "0 1px",
                  border: "solid 0.1px var(--gray900)",
                  borderRadius: "8px",
                }}
                key={`${item.keyObject}-${item.valueObject}`}
                label={`${item.keyObject}:${item.valueObject}`}
                onDelete={() => handleDeleteMoreInfo(index)}
              >
                {item.keyObject}:{item.valueObject}
              </Chip>
            ))}
        </div>
        <Divider style={{ display: moreInfoDisplay ? "" : "none" }} />
        <div style={styleDivParent}>
          <div
            style={{
              textAlign: "left",
              width: "50%",
            }}
          >
            <Link to="/inventory" style={{ width: "100%" }}>
              <Button
                htmlType="reset"
                disabled={loadingStatus}
                style={{
                  ...GrayButton,
                  ...CenteringGrid,
                  width: "100%",
                }}
              >
                <p
                  style={{
                    ...GrayButtonText,
                    ...CenteringGrid,
                    textTransform: "none",
                  }}
                >
                  Go back
                </p>
              </Button>
            </Link>
          </div>
          <div
            style={{
              textAlign: "right",
              width: "50%",
            }}
          >
            <Button
              disabled={loadingStatus}
              loading={loadingStatus}
              htmlType="submit"
              style={buttonStyleLoading}
            >
              <p
                style={{
                  ...BlueButtonText,
                  ...CenteringGrid,
                  textTransform: "none",
                }}
              >
                <WhiteCirclePlusIcon />
                &nbsp; Save new item
              </p>
            </Button>
          </div>
        </div>
      </form>
    </Grid>
  );
};

export default AddNewBulkItems;
