import {
  Chip,
  Grid,
  InputLabel,
  OutlinedInput,
  Tooltip,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { AutoComplete, Button, Divider, notification } from "antd";
import { groupBy } from "lodash";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Controller, useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import ImageUploaderFormat from "../../../classes/imageCloudinaryFormat";
import { QuestionIcon } from "../../../components/icons/QuestionIcon";
import { WhiteCirclePlusIcon } from "../../../components/icons/WhiteCirclePlusIcon";
import { convertToBase64 } from "../../../components/utils/convertToBase64";
import ImageUploaderUX from "../../../components/utils/UX/ImageUploaderUX";
import "../../../styles/global/ant-select.css";
import { AntSelectorStyle } from "../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { GrayButton } from "../../../styles/global/GrayButton";
import GrayButtonText from "../../../styles/global/GrayButtonText";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import "../../../styles/global/OutlineInput.css";
import "../../../styles/global/reactInput.css";
import { Subtitle } from "../../../styles/global/Subtitle";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import costValueInputFormat from "../utils/costValueInputFormat";
import { formatDate } from "../utils/dateFormat";
import "./style.css";
const options = [{ value: "Permanent" }, { value: "Rent" }, { value: "Sale" }];
const AddNewItem = () => {
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [moreInfoDisplay, setMoreInfoDisplay] = useState(false);
  const [moreInfo, setMoreInfo] = useState([]);
  const [keyObject, setKeyObject] = useState("");
  const [valueObject, setValueObject] = useState("");
  const [returningDate, setReturningDate] = useState(new Date());
  const [imageUploadedValue, setImageUploadedValue] = useState(null);
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
      serial_number: "",
      container: "",
      location: "",
      sub_location: null,
      sub_location_2: null,
      sub_location_3: null,
      tax_location: "",
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
      }
      const template = {
        category_name: data.category_name,
        item_group: data.item_group,
        cost: data.cost,
        brand: data.brand,
        descript_item: data.descript_item,
        ownership: data.ownership,
        serial_number: data.serial_number,
        warehouse: true,
        main_warehouse: data.tax_location,
        created_at: formatDate(new Date()),
        updated_at: formatDate(new Date()),
        company: user.company,
        location: data.location,
        sub_location: JSON.stringify([
          data.sub_location,
          data.sub_location_2,
          data.sub_location_3,
        ]),
        current_location: data.location,
        extra_serial_number: JSON.stringify(moreInfo),
        company_id: user.sqlInfo.company_id,
        return_date: `${
          data.ownership === "Rent" ? formatDate(returningDate) : null
        }`,
        container: String(data.container).includes("Yes"),
        containerSpotLimit: data.containerSpotLimit,
      };
      const respNewItem = await devitrakApi.post("/db_item/new_item", template);
      if (respNewItem.data.ok) {
        setValue("category_name", "");
        setValue("item_group", "");
        setValue("cost", "");
        setValue("brand", "");
        setValue("descript_item", "");
        setValue("ownership", "");
        setValue("serial_number", "");
        setValue("location", "");
        setValue("tax_location", "");
        setValue("container", "");
        openNotificationWithIcon(
          "New item was created and stored in database."
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
            Add one device
          </Typography>
        </InputLabel>
        <InputLabel
          id="eventName"
          style={{ marginBottom: "6px", width: "100%" }}
        >
          <Typography
            textAlign={"left"}
            textTransform={"none"}
            style={TextFontSize20LineHeight30}
            color={"var(--gray-600, #475467)"}
          >
            You can enter all the details manually or use a scanner to enter the
            serial number.
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
      displayedButton: false,
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
      displayedButton: false,
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
      displayedButton: false,
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
      displayedButton: false,
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
      displayedButton: false,
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
      displayedButton: false,
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
      displayedButton: true,
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
      displayedButton: true,
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
      displayedButton: true,
    },
    {
      name: "serial_number",
      placeholder: "e.g. 300",
      label: "Serial number",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: retrieveItemOptions("serial_number"),
      htmlOption: 0,
      tooltip: false,
      tooltipMessage: null,
      displayedButton: false,
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
      displayedButton: false,
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
      displayedButton: false,
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
      displayedButton: false,
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
      displayedButton: false,
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
                  md={renderFields[index].name === "descript_item" ? 12 : 6}
                  lg={renderFields[index].name === "descript_item" ? 12 : 6}
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
                md={renderFields[index].name === "descript_item" ? 12 : 6}
                lg={renderFields[index].name === "descript_item" ? 12 : 6}
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
          htmlType="button"
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

export default AddNewItem;
