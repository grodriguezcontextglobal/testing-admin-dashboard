import { Icon } from "@iconify/react";
import {
  Chip,
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  TextField,
  Typography,
} from "@mui/material";
import { groupBy } from "lodash";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  AutoComplete,
  Avatar,
  Divider,
  Select,
  Tooltip,
  notification,
} from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { QuestionIcon } from "../../../components/icons/QuestionIcon";
import { UploadIcon } from "../../../components/icons/UploadIcon";
import { convertToBase64 } from "../../../components/utils/convertToBase64";
import { AntSelectorStyle } from "../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { GrayButton } from "../../../styles/global/GrayButton";
import GrayButtonText from "../../../styles/global/GrayButtonText";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import { Subtitle } from "../../../styles/global/Subtitle";
import "../../../styles/global/ant-select.css";
import { formatDate } from "../utils/dateFormat";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { LightBlueButton } from "../../../styles/global/LightBlueButton";
import DatePicker from "react-datepicker";
import { TextFontSize14LineHeight20 } from "../../../styles/global/TextFontSize14LineHeight20";
import "react-datepicker/dist/react-datepicker.css";
import "../../../styles/global/reactInput.css";
import "./style.css";
import costValueInputFormat from "../utils/costValueInputFormat";
import ImageUploaderFormat from "../../../classes/imageCloudinaryFormat";
const options = [{ value: "Permanent" }, { value: "Rent" }, { value: "Sale" }];
const AddNewBulkItems = () => {
  const [selectedItem, setSelectedItem] = useState("");
  const [returningDate, setReturningDate] = useState(new Date());
  const [taxableLocation, setTaxableLocation] = useState("");
  const [valueSelection, setValueSelection] = useState("");
  const [moreInfoDisplay, setMoreInfoDisplay] = useState(false);
  const [moreInfo, setMoreInfo] = useState([]);
  const [keyObject, setKeyObject] = useState("");
  const [valueObject, setValueObject] = useState("");
  const { user } = useSelector((state) => state.admin);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      photo: [],
      category_name: "",
      cost: "",
      brand: "",
      descript_item: "",
      startingNumber: "",
      endingNumber: "",
      container: "false",
      containerSpotLimit: "0",
    },
  });
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (msg, progress, hover) => {
    api.open({
      message: msg,
      placement: "bottomRight",
      duration: 0,
      showProgress: progress,
      pauseOnHover: hover,
    });
  };
  const [loading, setLoading] = useState(false);
  const [locationSelection, setLocationSelection] = useState("");
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
  const retrieveItemOptions = () => {
    const result = new Set();
    if (itemsInInventoryQuery.data) {
      const itemsOptions = itemsInInventoryQuery.data.data.items;
      for (let data of itemsOptions) {
        result.add(data.item_group);
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
    if (retrieveItemDataSelected().has(selectedItem)) {
      const dataToRetrieve = retrieveItemDataSelected().get(selectedItem);
      setValue("category_name", `${dataToRetrieve.category_name}`);
      setValue("cost", `${dataToRetrieve.cost}`);
      setValue("brand", `${dataToRetrieve.brand}`);
      setValue("descript_item", `${dataToRetrieve.descript_item}`);
      setLocationSelection(`${dataToRetrieve.location}`);
      setTaxableLocation(`${dataToRetrieve.main_warehouse}`);
    }

    return () => {
      controller.abort();
    };
  }, [selectedItem]);

  const savingNewItem = async (data) => {
    const dataDevices = itemsInInventoryQuery.data.data.items;
    const groupingByDeviceType = groupBy(dataDevices, "item_group");
    let checkExistingDevice = [];
    let base64;
    if (selectedItem === "")
      return openNotificationWithIcon(
        "A group of item must be provided.",
        false,
        false
      );
    if (taxableLocation === "") {
      return openNotificationWithIcon(
        "A taxable location must be provided.",
        false,
        false
      );
    }
    if (valueSelection === "") {
      return openNotificationWithIcon(
        "Ownership status must be provided.",
        false,
        false
      );
    }

    if (String(valueSelection).toLowerCase() === "rent" && !returningDate) {
      return openNotificationWithIcon(
        "As ownership was set as 'Rent', returning date must be provided.",
        false,
        false
      );
    }
    if (Number(data.startingNumber) > Number(data.endingNumber)) {
      return openNotificationWithIcon(
        "Sequence of serial number must be in ascending order.",
        false,
        false
      );
    }

    for (
      let index = Number(data.startingNumber);
      index < Number(data.endingNumber);
      index++
    ) {
      if (groupingByDeviceType[selectedItem]) {
        const dataRef = groupBy(
          groupingByDeviceType[selectedItem],
          "serial_number"
        );
        if (
          dataRef[
            String(index).padStart(
              data.startingNumber.length,
              `${data.startingNumber[0]}`
            )
          ]
        ) {
          checkExistingDevice = [
            ...checkExistingDevice,
            ...dataRef[
              String(index).padStart(
                data.startingNumber.length,
                `${data.startingNumber[0]}`
              )
            ],
          ];
        }
      }
    }
    if (checkExistingDevice.length > 0) {
      return openNotificationWithIcon(
        `Devices were not stored due to some devices already exists in company records. Please check the data you're trying to store.`,
        false,
        false
      );
    }
    if (data.photo.length > 0 && data.photo[0].size > 1048576) {
      setLoading(false);
      return alert(
        "Image is bigger than allow. Please resize the image or select a new one."
      );
    } else if (data.photo.length > 0) {
      openNotificationWithIcon(
        "We're working on your request. Please wait until the action is finished. We redirect you to main page when request is done.",
        true,
        false
      );
      setLoading(true);
      base64 = await convertToBase64(data.photo[0]);
      const templateImageUpload = new ImageUploaderFormat(
        base64,
        user.companyData.id,
        data.category_name,
        selectedItem,
        "",
        "",
        "",
        ""
      );
      const registerImage = await devitrakApi.post(
        "/cloudinary/upload-image",
        templateImageUpload.item_uploader()
      );
      
      const resp = await devitrakApi.post(`/image/new_image`, {
        source: registerImage.data.secure_url,
        category: data.category_name,
        item_group: selectedItem,
        company: user.company,
      });
      if (resp.data) {
        const template = {
          category_name: data.category_name,
          item_group: selectedItem,
          cost: data.cost,
          brand: data.brand,
          descript_item: data.descript_item,
          ownership: valueSelection,
          min_serial_number: data.startingNumber,
          max_serial_number: data.endingNumber,
          warehouse: true,
          main_warehouse: taxableLocation,
          location: locationSelection,
          current_location: locationSelection,
          created_at: formatDate(new Date()),
          updated_at: formatDate(new Date()),
          company: user.company,
          extra_serial_number: JSON.stringify(moreInfo),
          company_id: user.sqlInfo.company_id,
          return_date: `${valueSelection === "Rent" ? returningDate : null}`,
          enableAssignFeature: true,
          container: data.container === "true",
          containerSpotLimit: data.containerSpotLimit,
        };
        await devitrakApi.post("/db_item/bulk-item", template);
        if (
          !renderLocationOptions().some(
            (element) => element.value === locationSelection
          )
        ) {
          let template = [
            ...companiesQuery.data.data.company.at(-1).location,
            locationSelection,
          ];
          await devitrakApi.patch(
            `/company/update-company/:${
              companiesQuery.data.data.company.at(-1).id
            }`,
            {
              location: template,
            }
          );
        }
        openNotificationWithIcon(
          "items were created and stored in database.",
          false,
          false
  
        );
        setLoading(false);
        api.destroy();
        return navigate("/inventory");
      }
    } else if (data.photo.length < 1) {
      openNotificationWithIcon(
        "We're working on your request. Please wait until the action is finished. We redirect you to main page when request is done.",
        true,
        false
      );
      setLoading(true);

      const template = {
        category_name: data.category_name,
        item_group: selectedItem,
        cost: data.cost,
        brand: data.brand,
        descript_item: data.descript_item,
        ownership: valueSelection,
        min_serial_number: data.startingNumber,
        max_serial_number: data.endingNumber,
        warehouse: true,
        main_warehouse: taxableLocation,
        location: locationSelection,
        current_location: locationSelection,
        created_at: formatDate(new Date()),
        updated_at: formatDate(new Date()),
        company: user.company,
        extra_serial_number: JSON.stringify(moreInfo),
        company_id: user.sqlInfo.company_id,
        return_date: `${valueSelection === "Rent" ? returningDate : null}`,
        enableAssignFeature: true,
        container: data.container === "true",
        containerSpotLimit: data.containerSpotLimit,
      };
      await devitrakApi.post("/db_item/bulk-item", template);
      if (
        !renderLocationOptions().some(
          (element) => element.value === locationSelection
        )
      ) {
        let template = [
          ...companiesQuery.data.data.company.at(-1).location,
          locationSelection,
        ];
        await devitrakApi.patch(
          `/company/update-company/${
            companiesQuery.data.data.company.at(-1).id
          }`,
          {
            location: template,
          }
        );
      }
      openNotificationWithIcon(
        "items were created and stored in database.",
        false,
        false
      );
      setLoading(false);
      return navigate("/inventory");
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
          style={{ marginBottom: "0.2rem", width: "100%" }}
        >
          <Typography
            textAlign={"left"}
            textTransform={"none"}
            style={TextFontSize30LineHeight38}
            color={"var(--gray-600, #475467)"}
          >
            Add a group of devices
          </Typography>
        </InputLabel>
        <InputLabel
          id="eventName"
          style={{ marginBottom: "0.2rem", width: "100%" }}
        >
          <Typography
            textAlign={"left"}
            textTransform={"none"}
            style={{ ...TextFontSize20LineHeight30, textWrap: "pretty" }}
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

  const handleDeleteMoreInfo = (index) => {
    const result = [...moreInfo];
    const removingResult = result.filter((_, i) => i !== index);
    return setMoreInfo(removingResult);
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
      <form
        style={{
          width: "100%",
          justifyContent: "flex-start",
          alignItems: "center",
          textAlign: "left",
          display: "flex",
          padding: "24px",
          flexDirection: "column",
          gap: "24px",
          borderRadius: "8px",
          border: "1px solid var(--gray-300, #D0D5DD)",
          background: "var(--gray-100, #F2F4F7)",
        }}
        onSubmit={handleSubmit(savingNewItem)}
        className="form"
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            textAlign: "left",
            gap: "10px",
          }}
        >
          {" "}
          <div
            style={{
              textAlign: "left",
              width: "50%",
            }}
          >
            <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                style={{ ...Subtitle, fontWeight: 500 }}
              >
                Device name
              </Typography>
            </InputLabel>
            <AutoComplete
              className="custom-autocomplete" // Add a custom className here
              variant="outlined"
              style={{
                ...AntSelectorStyle,
                border: "solid 0.3 var(--gray600)",
                fontFamily: "Inter",
                fontSize: "14px",
                width: "100%",
              }}
              value={selectedItem}
              onChange={(value) => setSelectedItem(value)}
              options={retrieveItemOptions().map((item) => {
                return { value: item };
              })}
              placeholder="Type the name of the device"
              filterOption={(inputValue, option) =>
                option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !==
                -1
              }
            />

            {/* <div
              style={{
                textAlign: "left",
                width: "50%",
              }}
            ></div> */}
          </div>
          <div
            style={{
              textAlign: "left",
              width: "50%",
            }}
          >
            <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                style={{ ...Subtitle, fontWeight: 500 }}
              >
                Category
              </Typography>
            </InputLabel>
            <OutlinedInput
              required
              {...register("category_name")}
              aria-invalid={errors.category_name}
              style={OutlinedInputStyle}
              placeholder="e.g. Electronic"
              fullWidth
            />
            {/* <div
              style={{
                textAlign: "left",
                width: "50%",
              }}
            ></div> */}
          </div>
        </div>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            textAlign: "left",
            gap: "10px",
          }}
        >
          <div
            style={{
              textAlign: "left",
              width: "50%",
            }}
          >
            <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                style={{ ...Subtitle, fontWeight: 500 }}
              >
                Brand
              </Typography>
            </InputLabel>
            <OutlinedInput
              required
              {...register("brand")}
              aria-invalid={errors.brand}
              style={OutlinedInputStyle}
              placeholder="e.g. Apple"
              fullWidth
            />
          </div>
          <div
            style={{
              textAlign: "left",
              width: "50%",
            }}
          >
            <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                style={{ ...Subtitle, fontWeight: 500 }}
              >
                <Tooltip title="Address where tax deduction for equipment will be applied.">
                  Taxable location <QuestionIcon />
                </Tooltip>
              </Typography>
            </InputLabel>
            <AutoComplete
              className="custom-autocomplete"
              style={{ width: "100%", height: "2.5rem" }}
              options={renderLocationOptions()}
              value={taxableLocation}
              placeholder="Select a location"
              filterOption={(inputValue, option) =>
                option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !==
                -1
              }
              onChange={(value) => setTaxableLocation(value)}
            />
          </div>
        </div>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            textAlign: "left",
            gap: "10px",
          }}
        >
          <div
            style={{
              textAlign: "left",
              width: "50%",
            }}
          >
            <InputLabel style={{ width: "100%" }}>
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                style={{ ...Subtitle, fontWeight: 500 }}
              >
                Replacement cost
              </Typography>
            </InputLabel>
            <OutlinedInput
              required
              {...register("cost", { required: true })}
              aria-invalid={errors.cost}
              style={OutlinedInputStyle}
              placeholder="e.g. 12000.54 | 95.44 | 4585"
              startAdornment={
                <InputAdornment position="start">
                  <Typography
                    textTransform={"none"}
                    textAlign={"left"}
                    style={{ ...Subtitle, fontWeight: 400 }}
                  >
                    $
                  </Typography>
                </InputAdornment>
              }
              fullWidth
            />
          </div>
          <div
            style={{
              textAlign: "left",
              width: "50%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                textAlign: "left",
                width: "100%",
                display: "flex",
                alignSelf: "flex-start",
                gap: "5px",
              }}
            >
              <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                <Typography
                  textTransform={"none"}
                  textAlign={"left"}
                  style={{ ...Subtitle, fontWeight: 500 }}
                >
                  Ownership status of items
                </Typography>
                <Select
                  showSearch
                  className="custom-autocomplete"
                  style={{
                    ...AntSelectorStyle,
                    height: "2.4rem",
                    width: "100%",
                  }}
                  placeholder="Select an option"
                  optionFilterProp="children"
                  onChange={(value) => {
                    setValueSelection(value);
                  }}
                  filterOption={(input, option) =>
                    (option?.label ?? "").includes(input)
                  }
                  filterSort={(optionA, optionB) =>
                    (optionA?.label ?? "")
                      .toLowerCase()
                      .localeCompare((optionB?.label ?? "").toLowerCase())
                  }
                  options={options}
                />
              </InputLabel>
              <div
                style={{
                  width: "100%",
                  flexDirection: "column",
                  display: `${
                    valueSelection === "Rent" || valueSelection === ""
                      ? "flex"
                      : "none"
                  }`,
                }}
              >
                <Tooltip
                  placement="top"
                  title="Date when the leased equipment will be returned."
                  style={{
                    width: "100%",
                  }}
                >
                  <Typography
                    style={{
                      ...TextFontSize14LineHeight20,
                      fontWeight: 500,
                      color: "var(--gray700, #344054)",
                    }}
                  >
                    Returning date <QuestionIcon />
                  </Typography>
                </Tooltip>
                <DatePicker
                  id="calender-event"
                  autoComplete="checking"
                  showTimeSelect
                  dateFormat="Pp"
                  minDate={returningDate}
                  selected={returningDate}
                  openToDate={returningDate}
                  startDate={returningDate}
                  onChange={(date) => setReturningDate(date)}
                  style={{
                    ...OutlinedInputStyle,
                    width: "100%",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            textAlign: "left",
            gap: "10px",
          }}
        >
          <div
            style={{
              textAlign: "left",
              width: "50%",
            }}
          >
            <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                style={{ ...Subtitle, fontWeight: 500 }}
              >
                From starting number
              </Typography>
            </InputLabel>
            <OutlinedInput
              required
              {...register("startingNumber")}
              aria-invalid={errors.startingNumber}
              style={OutlinedInputStyle}
              placeholder="e.g. 0001"
              fullWidth
            />
          </div>
          <div
            style={{
              textAlign: "left",
              width: "50%",
            }}
          >
            <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                style={{ ...Subtitle, fontWeight: 500 }}
              >
                To ending number
              </Typography>
            </InputLabel>
            <OutlinedInput
              required
              {...register("endingNumber")}
              aria-invalid={errors.endingNumber}
              style={OutlinedInputStyle}
              placeholder="e.g. 1000"
              fullWidth
            />
          </div>
        </div>
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            textAlign: "left",
          }}
        >
          <InputLabel style={{ width: "100%" }}>
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              style={{ ...Subtitle, fontWeight: 500 }}
            >
              Location{" "}
              <Tooltip title="Where the item is location physically.">
                <QuestionIcon />
              </Tooltip>
            </Typography>
          </InputLabel>
          <AutoComplete
            className="custom-autocomplete"
            value={locationSelection}
            style={{ width: "100%", height: "2.5rem" }}
            options={renderLocationOptions()}
            placeholder="Select a location"
            filterOption={(inputValue, option) =>
              option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !==
              -1
            }
            onChange={(value) => setLocationSelection(value)}
          />
        </div>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            textAlign: "left",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: watch("container") === "true" ? "50%" : "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <div style={{ width: "100%" }}>
              <InputLabel style={{ width: "100%" }}>
                <Tooltip
                  placement="top"
                  title="This item will contain other items inside."
                >
                  <Typography style={styling}>
                    Is it a container?&nbsp;
                    <QuestionIcon />
                  </Typography>
                </Tooltip>
              </InputLabel>
              <select
                {...register("container")}
                style={{
                  width: "100%",
                  ...OutlinedInputStyle,
                  color: Subtitle.color,
                }}
              >
                <option style={{ ...Subtitle }} value={false}>
                  No - It is not a container
                </option>
                <option style={{ ...Subtitle }} value={true}>
                  Yes - It is a container
                </option>
              </select>
            </div>
          </div>
          <div
            style={{
              width: "50%",
              display: watch("container") === "true" ? "flex" : "none",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <div style={{ width: "100%" }}>
              <InputLabel style={{ width: "100%" }}>
                <Tooltip
                  placement="top"
                  title="Limit in number of items that can be stored in the container."
                >
                  <Typography style={styling}>
                    Container cap&nbsp;
                    <QuestionIcon />
                  </Typography>
                </Tooltip>
              </InputLabel>
              <OutlinedInput
                required
                {...register("containerSpotLimit", { required: true })}
                aria-invalid={errors.containerSpotLimit}
                style={OutlinedInputStyle}
                placeholder="e.g. 30"
                fullWidth
              />
            </div>
          </div>
        </div>

        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            textAlign: "left",
          }}
        >
          <InputLabel style={{ width: "100%" }}>
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              style={{ ...Subtitle, fontWeight: 500 }}
            >
              Description of the device
            </Typography>
          </InputLabel>
          <OutlinedInput
            required
            multiline
            minRows={5}
            {...register("descript_item", { required: true })}
            aria-invalid={errors.descript_item}
            style={{
              borderRadius: "12px",
              // border: `${errors.descript_item && "solid 1px #004EEB"}`,
              margin: "0.1rem auto 1rem",
              display: "flex",
              width: "100%",
              justifyContent: "flex-start",
              background: "var(--base-white, #FFF)",
              boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
            }}
            placeholder="Please provide a brief description of the new device to be added."
          />
        </div>

        <Grid
          display={"flex"}
          flexDirection={"column"}
          justifyContent={"center"}
          alignItems={"center"}
          style={{
            width: "100%",
            borderRadius: "12px",
            border: "1px solid var(--gray-200, #EAECF0)",
            background: "var(--base-white, #FFF)",
          }}
          item
          xs={12}
        >
          <Grid
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
            marginY={2}
            item
            xs={12}
          >
            <Avatar
              style={{
                width: "3rem",
                height: "auto",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                border: "6px solid var(--gray-50, #F9FAFB)",
                background: "6px solid var(--gray-50, #F9FAFB)",
                borderRadius: "28px",
              }}
            >
              {" "}
              <UploadIcon />
            </Avatar>
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
            item
            xs={12}
          >
            <TextField
              {...register("photo")}
              id="file-upload"
              type="file"
              className="photo_input"
              accept=".jpeg, .png, .jpg"
              style={{
                outline: "none",
                border: "transparent",
              }}
            />
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
            marginBottom={2}
            item
            xs={12}
          >
            <Typography style={Subtitle}>
              SVG, PNG, JPG or GIF (max. 1MB)
            </Typography>
          </Grid>
        </Grid>
        <Divider />
        <button
          type="button"
          onClick={() => setMoreInfoDisplay(true)}
          style={{
            ...CenteringGrid,
            width: "100%",
            border: `1px solid ${
              loading ? "var(--disabled-blue-button)" : "var(--blue-dark-600)"
            }`,
            borderRadius: "8px",
            background: `${
              loading ? "var(--disabled-blue-button)" : "var(--blue-dark-600)"
            }`,
            boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
            padding: "6px 12px",
            cursor: "pointer",
          }}
        >
          <Typography
            textTransform={"none"}
            style={{
              color: "var(--base-white, #FFF)",
              fontSize: "14px",
              fontWeight: "600",
              fontFamily: "Inter",
              lineHeight: "20px",
              ...CenteringGrid,
            }}
          >
            <Icon
              icon="ic:baseline-plus"
              color="var(--base-white, #FFF)"
              width={20}
              height={20}
            />
            &nbsp; Add more information
          </Typography>
        </button>
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
              onClick={() => handleMoreInfoPerDevice()}
              style={{ ...BlueButton, ...CenteringGrid }}
            >
              <Icon
                icon="ic:baseline-plus"
                color="var(--base-white, #FFF)"
                width={20}
                height={20}
              />{" "}
            </Button>
          </div>
        )}
        <Divider style={{ marginBottom: "-15px" }} />
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignSelf: "flex-start",
          }}
        >
          <p style={Subtitle}>More information</p>
        </div>
        <div
          style={{
            width: "100%",
            display: "flex",
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
        <Divider />

        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            textAlign: "left",
            gap: "10px",
          }}
        >
          <div
            style={{
              textAlign: "left",
              width: "50%",
            }}
          >
            <Link to="/inventory">
              <Button
                disabled={loading}
                style={{ ...GrayButton, width: "100%" }}
              >
                <Typography
                  textTransform={"none"}
                  style={{ ...GrayButtonText, ...CenteringGrid }}
                >
                  <Icon
                    icon="ri:arrow-go-back-line"
                    color="#344054"
                    width={20}
                    height={20}
                  />
                  &nbsp; Go back
                </Typography>
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
              loading={loading}
              disabled={loading}
              htmlType="submit"
              style={{
                ...BlueButton,
                width: "100%",
                backgroundColor: `${
                  loading
                    ? LightBlueButton.background
                    : BlueButtonText.background
                }`,
              }}
            >
              <Typography
                textTransform={"none"}
                style={{ ...BlueButtonText, ...CenteringGrid }}
              >
                <Icon
                  icon="ic:baseline-plus"
                  color="var(--base-white, #FFF)"
                  width={20}
                  height={20}
                />
                &nbsp; Save new item
              </Typography>
            </Button>
          </div>
        </div>
      </form>
    </Grid>
  );
};
export default AddNewBulkItems;
