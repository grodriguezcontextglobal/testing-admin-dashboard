import {
  Chip,
  Grid,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { AutoComplete, Button, Divider, Tooltip, notification } from "antd";
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
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { WhiteCirclePlusIcon } from "../../../components/icons/WhiteCirclePlusIcon";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import costValueInputFormat from "../utils/costValueInputFormat";
import DatePicker from "react-datepicker";
import GrayButtonText from "../../../styles/global/GrayButtonText";
import ImageUploaderFormat from "../../../classes/imageCloudinaryFormat";
import ImageUploaderUX from "../../../components/utils/UX/ImageUploaderUX";
const options = [{ value: "Permanent" }, { value: "Rent" }, { value: "Sale" }];
const EditGroup = () => {
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [moreInfoDisplay, setMoreInfoDisplay] = useState(false);
  const [moreInfo, setMoreInfo] = useState([]);
  const [keyObject, setKeyObject] = useState("");
  const [valueObject, setValueObject] = useState("");
  const [returningDate, setReturningDate] = useState(new Date());
  const [imageUploadedValue, setImageUploadedValue] = useState(null);
  const [slicingData, setSlicingData] = useState([]);
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
      enableAssignFeature: "",
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
      const groupingByItemGroup = groupBy(industryData, "item_group");
      for (let [key, value] of Object.entries(groupingByItemGroup)) {
        result.set(key, value);
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
      setValue("category_name", `${dataToRetrieve[0].category_name}`);
      setValue("cost", `${dataToRetrieve[0].cost}`);
      setValue("brand", `${dataToRetrieve[0].brand}`);
      setValue("descript_item", `${dataToRetrieve[0].descript_item}`);
      setValue("location", `${dataToRetrieve[0].location}`);
      setValue("tax_location", `${dataToRetrieve[0].main_warehouse}`);
      setValue("ownership", `${dataToRetrieve[0].ownership}`);
      setValue(
        "container",
        `${
          dataToRetrieve[0].container > 0
            ? "Yes - It is a container"
            : "No - It is not a container"
        }`
      );
      setValue("min_serial_number", `${dataToRetrieve[0].serial_number}`);
      setValue("max_serial_number", `${dataToRetrieve.at(-1).serial_number}`);
      setValue("quantity", `${dataToRetrieve.length}`);
      setSlicingData(dataToRetrieve);
    }
    return () => {
      controller.abort();
    };
  }, [watch("item_group")]);

  useEffect(() => {
    const controller = new AbortController();
    const getRightDataToPass = () => {
      const min = [...slicingData].findIndex(
        (item) =>
          String(item.serial_number) === String(watch("min_serial_number"))
      );
      const max = [...slicingData].findIndex(
        (item) =>
          String(item.serial_number) === String(watch("max_serial_number"))
      );
      if (min === -1 || max === -1) return [];
      const result = slicingData.slice(min, max + 1);
      return setSlicingData(result);
    };
    getRightDataToPass();

    return () => {
      controller.abort();
    };
  }, [watch("max_serial_number")]);

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
    if (Number(qtyDiff()) < 1) {
      return openNotificationWithIcon("Quantity must be greater than 0.");
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
      let img_url = slicingData[0].image_url;
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
        warehouse: true,
        main_warehouse: data.tax_location,
        updated_at: formatDate(new Date()),
        company: user.company,
        location: data.location,
        current_location: data.location,
        sub_location: JSON.stringify([
          data.sub_location,
          data.sub_location_2,
          data.sub_location_3,
        ]),
        extra_serial_number: JSON.stringify(moreInfo),
        return_date: `${
          data.ownership === "Rent" ? formatDate(returningDate) : null
        }`,
        container: String(data.container).includes("Yes") ? 1 : 0,
        containerSpotLimit: data.containerSpotLimit,
        image_url: img_url,
        company_id: user.sqlInfo.company_id,
        enableAssignFeature: String(data.enableAssignFeature).includes("Enabled") ? 1 : 0,
        data: JSON.stringify(slicingData),
      };
      const respNewItem = await devitrakApi.post(
        "/db_company/update-group-items",
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
        openNotificationWithIcon(
          "Group of items edited and stored in database."
        );
        setLoadingStatus(false);
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
            Edit a group of devices
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
            base to define the category of device, and then a range from one
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

  const renderFields = [
    {
      name: "item_group",
      placeholder: "Type the name of the device",
      label: "Device name",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: retrieveItemOptions("item_group"),
      htmlOption: 0,
      tooltip: false,
      tooltipMessage: null,
    },
    {
      name: "category_name",
      placeholder: "e.g. Electronic",
      label: "Category",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: retrieveItemOptions("category_name"),
      htmlOption: 0,
      tooltip: false,
      tooltipMessage: null,
    },
    {
      name: "brand",
      placeholder: "e.g. Apple",
      label: "Brand",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: retrieveItemOptions("brand"),
      htmlOption: 0,
      tooltip: false,
      tooltipMessage: null,
    },
    {
      name: "cost",
      placeholder: "e.g. 12000.54 | 95.44 | 4585",
      label: "Replacement cost",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: retrieveItemOptions("cost"),
      htmlOption: 0,
      tooltip: false,
      tooltipMessage: null,
    },
    {
      name: "tax_location",
      placeholder: "e.g. 12000.54 | 95.44 | 4585",
      label: "Taxable location",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: renderLocationOptions(),
      htmlOption: 2,
      tooltip: true,
      tooltipMessage:
        "Address where tax deduction for equipment will be applied.",
    },
    {
      name: "container",
      placeholder: "e.g. Permanent",
      label: "Is it a container?",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: [
        {
          value: "No - It is not a container",
        },
        {
          value: "Yes - It is a container",
        },
      ],
      htmlOption: 2,
      tooltip: true,
      tooltipMessage: "This item will contain other items inside.",
    },

    {
      name: "location",
      placeholder: "Select a location",
      label: "Main location",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: renderLocationOptions(),
      htmlOption: 2,
      tooltip: true,
      tooltipMessage: "Where the item is location physically.",
    },
    {
      name: "sub_location",
      placeholder: "Select a location",
      label: "Sub location",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: renderLocationOptions(),
      htmlOption: 2,
      tooltip: true,
      tooltipMessage: "Where the item is location physically.",
    },
    {
      name: "sub_location_2",
      placeholder: "Select a location",
      label: "Sub location 2",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: renderLocationOptions(),
      htmlOption: 2,
      tooltip: true,
      tooltipMessage: "Where the item is location physically.",
    },
    {
      name: "sub_location_3",
      placeholder: "Select a location",
      label: "Sub location 3",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: renderLocationOptions(),
      htmlOption: 2,
      tooltip: true,
      tooltipMessage: "Where the item is location physically.",
    },
    {
      name: "min_serial_number",
      placeholder: "e.g. 300",
      label: "Starting Serial number",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: retrieveItemOptions("serial_number"),
      htmlOption: 0,
      tooltip: false,
      tooltipMessage: null,
    },
    {
      name: "max_serial_number",
      placeholder: "e.g. 300",
      label: "Ending Serial number",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: retrieveItemOptions("serial_number"),
      htmlOption: 0,
      tooltip: false,
      tooltipMessage: null,
    },
    {
      name: "quantity",
      placeholder: "e.g. 300",
      label: "Quantity",
      htmlElement: "Quantity",
      style: OutlinedInputStyle,
      required: true,
      options: [],
      htmlOption: 0,
      tooltip: false,
      tooltipMessage:
        "This is the quantity from starting serial number and ending serial number.",
    },
    {
      name: "ownership",
      placeholder: "e.g. Permanent",
      label: "Ownership status of item",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: options,
      htmlOption: 2,
      tooltip: true,
      tooltipMessage: "Date when the leased equipment will be returned.",
    },
    {
      name: "",
      placeholder: "",
      label: "Returning date",
      htmlElement: "Day",
      style: OutlinedInputStyle,
      required: true,
      options: options,
      htmlOption: 2,
      tooltip: true,
      tooltipMessage: "Date when the leased equipment will be returned.",
    },
    {
      name: "image_uploader",
      placeholder: "",
      label: "Image uploader",
      htmlElement: "Day",
      style: OutlinedInputStyle,
      required: true,
      options: [],
      htmlOption: 6,
      tooltip: false,
      tooltipMessage: null,
    },
    {
      name: "enableAssignFeature",
      placeholder: "",
      label: "Assignable to staff/events",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: ["Enabled", "Disabled"],
      htmlOption: 0,
      tooltip: true,
      tooltipMessage:
        "This options is to enable the device to be assigned to staff or events.",
    },
    {
      name: "descript_item",
      placeholder:
        "Please provide a brief description of the new device to be added.",
      label: "Description of the device",
      htmlElement: "TextArea",
      style: OutlinedInputStyle,
      required: true,
      options: options,
      htmlOption: 4,
      tooltip: true,
      tooltipMessage: "Date when the leased equipment will be returned.",
    },
  ];

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
          value={qtyDiff()}
          {...register("quantity" )}
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
      renderFields[props].name === "min_serial_number" ||
      renderFields[props].name === "max_serial_number" ||
      renderFields[props].name === "quantity"
    )
      return 4;
    return 6;
  };

  const qtyDiff = () => {
    return slicingData.length;
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
          {renderFields.map((item, index) => {
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
                    renderFields[index].name === "descript_item"
                      ? 12
                      : gripingFields(index)
                  }
                  lg={
                    renderFields[index].name === "descript_item"
                      ? 12
                      : gripingFields(index)
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
                  renderFields[index].name === "descript_item"
                    ? 12
                    : gripingFields(index)
                }
                lg={
                  renderFields[index].name === "descript_item"
                    ? 12
                    : gripingFields(index)
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
                      />
                    )}
                  />
                ) : (
                  renderOptional(item.htmlElement)
                )}{" "}
              </Grid>
            );
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

export default EditGroup;

// export default EditGroup;
// const fetchingUpdateGroupItems = async (props) => {
//   const { submitRef, groupData, slicingData } = props;
//   const templateUpdate = {
//     category_name: submitRef.current.category_name,
//     item_group: submitRef.current.item_group,
//     cost: submitRef.current.cost,
//     brand: submitRef.current.brand,
//     descript_item: submitRef.current.descript_item,
//     ownership: submitRef.current.ownership,
//     main_warehouse: submitRef.current.main_warehouse,
//     update_at: formatDate(new Date()),
//     location: submitRef.current.location,
//     current_location: submitRef.current.current_location,
//     extra_serial_number: JSON.stringify(groupData[0].extra_serial_number),
//     return_date:
//       submitRef.current.ownership === "Rent"
//         ? formatDate(returningDate)
//         : groupData[0].return_date,
//     enableAssignFeature: submitRef.current.enableAssignFeature,
//     data: JSON.stringify(slicingData),
//   };

//   const updatingGroupItems = await devitrakApi.post(
//     "/db_company/update-group-items",
//     templateUpdate
//   );
//   if (updatingGroupItems.data) {
//     if (
//       !renderLocationOptions().some(
//         (element) => element.value === submitRef.current.location
//       )
//     ) {
//       let template = [
//         ...companiesQuery.data.data.company.at(-1).location,
//         submitRef.current.location,
//       ];
//       await devitrakApi.patch(
//         `/company/update-company/${
//           companiesQuery.data.data.company.at(-1).id
//         }`,
//         {
//           location: template,
//         }
//       );
//     }

//     setValue("category_name", "");
//     setValue("item_group", "");
//     setValue("cost", "");
//     setValue("brand", "");
//     setValue("descript_item", "");
//     setValue("ownership", "");
//     setValue("serial_number", "");
//     setValueSelection(options[0]);
//     openNotificationWithIcon("items were updated.", false);
//     setIsLoadingStatus(false);
//     return navigate("/inventory");
//   }
// };

// const savingNewItem = async (data) => {
//   submitRef.current = {
//     ...data,
//     item_group: selectedItem,
//     ownership: valueSelection,
//     main_warehouse: taxableLocation,
//     location: locationSelection,
//     company: user.company,
//     return_date: formatDate(returningDate),
//     enableAssignFeature: disabling,
//     taxable_location: taxableLocation,
//     current_location: locationSelection,
//   };
//   const starting = groupData.findIndex(
//     (element) =>
//       element.serial_number === `${submitRef.current.startingNumber}`
//   );
//   const ending = groupData.findIndex(
//     (element) => element.serial_number === `${submitRef.current.endingNumber}`
//   );
//   const slicingData = groupData.slice(starting, ending + 1);
//   let base64;
//   if (selectedItem === "")
//     return openNotificationWithIcon(
//       "A group of item must be provided.",
//       false
//     );
//   if (taxableLocation === "")
//     return openNotificationWithIcon(
//       "A taxable location must be provided.",
//       false
//     );
//   if (valueSelection === "")
//     return openNotificationWithIcon(
//       "Ownership status must be provided.",
//       false
//     );
//   if (String(valueSelection).toLowerCase() === "rent" && !returningDate) {
//     return openNotificationWithIcon(
//       "As ownership was set as 'Rent', returning date must be provided.",
//       false
//     );
//   }
//   if (data.photo.length > 0 && data.photo[0].size > 1048576) {
//     setIsLoadingStatus(false);
//     return alert(
//       "Image is bigger than allow. Please resize the image or select a new one."
//     );
//   } else if (data.photo.length > 0) {
//     openNotificationWithIcon(
//       "We're working on your request. Please wait until the action is finished. We redirect you to main page when request is done.",
//       true
//     );
//     setIsLoadingStatus(true);
//     base64 = await convertToBase64(data.photo[0]);
//     // const templateImageUpload = {
//     //   imageFile: base64,
//     //   imageID: `${user.companyData.id}_inventory:${submitRef.current.category_name}_${submitRef.current.item_group}`,
//     // };
//     const templateImageUpload = new ImageUploaderFormat(
//       base64,
//       user.companyData.id,
//       data.category_name,
//       selectedItem,
//       "",
//       "",
//       "",
//       "",
//       ""
//     );
//     const uploadingImage = await devitrakApi.post(
//       `/cloudinary/upload-image`,
//       templateImageUpload.item_uploader()
//     );
//     const resp = await devitrakApi.post(`/image/new_image`, {
//       source: uploadingImage.data.imageUploaded.secure_url,
//       category: data.category_name,
//       item_group: selectedItem,
//       company: user.companyData.id,
//     });
//     if (resp.data) {
//       await fetchingUpdateGroupItems({ submitRef, groupData, slicingData });
//     }
//   } else if (data.photo.length < 1) {
//     openNotificationWithIcon(
//       "We're working on your request. Please wait until the action is finished. We redirect you to main page when request is done.",
//       true
//     );
//     try {
//       setIsLoadingStatus(true);
//       await fetchingUpdateGroupItems({ submitRef, groupData, slicingData });
//     } catch (error) {
//       console.log("error", error);
//       setIsLoadingStatus(false);
//     }
//   }
// };
