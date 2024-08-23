import { Icon } from "@iconify/react";
import {
  Button,
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import _ from "lodash";
import { useQuery } from "@tanstack/react-query";
import { AutoComplete, Avatar, Divider, Select, notification } from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { QuestionIcon, UploadIcon } from "../../../components/icons/Icons";
import { convertToBase64 } from "../../../components/utils/convertToBase64";
import { AntSelectorStyle } from "../../../styles/global/AntSelectorStyle";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { formatDate } from "../utils/dateFormat";
import "../../../styles/global/OutlineInput.css";
import "../../../styles/global/ant-select.css";
import { TextFontSize14LineHeight20 } from "../../../styles/global/TextFontSize14LineHeight20";
import { BlueButton } from "../../../styles/global/BlueButton";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../../styles/global/reactInput.css";

const options = [{ value: "Permanent" }, { value: "Rent" }, { value: "Sale" }];
const AddNewItem = () => {
  const [selectedItem, setSelectedItem] = useState("");
  const [taxableLocation, setTaxableLocation] = useState("");
  const [valueSelection, setValueSelection] = useState("");
  const [locationSelection, setLocationSelection] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [moreInfoDisplay, setMoreInfoDisplay] = useState(false);
  const [moreInfo, setMoreInfo] = useState([]);
  const [keyObject, setKeyObject] = useState("");
  const [valueObject, setValueObject] = useState("");
  const [returningDate, setReturningDate] = useState(new Date());
  const { user } = useSelector((state) => state.admin);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, msg) => {
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

  const onChange = (value) => {
    return setValueSelection(value);
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
    const groupingByDeviceType = _.groupBy(dataDevices, "item_group");
    if (selectedItem === "")
      return openNotificationWithIcon(
        "warning",
        "A group of item must be provided."
      );
    if (taxableLocation === "")
      return openNotificationWithIcon(
        "warning",
        "A taxable location must be provided."
      );
    if (valueSelection === "")
      return openNotificationWithIcon(
        "warning",
        "Ownership status must be provided."
      );
    if (groupingByDeviceType[selectedItem]) {
      const dataRef = _.groupBy(
        groupingByDeviceType[selectedItem],
        "serial_number"
      );
      if (dataRef[data.serial_number]?.length > 0) {
        return openNotificationWithIcon(
          "warning",
          "Device serial number already exists in company records."
        );
      }
    }
    try {
      let base64;
      if (data.photo.length > 0 && data.photo[0].size > 1048576) {
        setLoadingStatus(false);
        return alert(
          "Image is bigger than allow. Please resize the image or select a new one."
        );
      } else if (data.photo.length > 0) {
        setLoadingStatus(true);
        base64 = await convertToBase64(data.photo[0]);
        const resp = await devitrakApi.post(`/image/new_image`, {
          source: base64,
          category: data.category_name,
          item_group: selectedItem,
          company: user.company,
        });
        if (resp.data) {
          const respNewItem = await devitrakApi.post("/db_item/new_item", {
            category_name: data.category_name,
            item_group: selectedItem,
            cost: data.cost,
            brand: data.brand,
            descript_item: data.descript_item,
            ownership: valueSelection,
            serial_number: data.serial_number,
            warehouse: true,
            main_warehouse: taxableLocation,
            created_at: formatDate(new Date()),
            updated_at: formatDate(new Date()),
            company: user.company,
            location: locationSelection,
            current_location: locationSelection,
            extra_serial_number: JSON.stringify(moreInfo),
            company_id: user.sqlInfo.company_id,
            return_date: `${valueSelection === "Rent" ? returningDate : null}`,
          });
          if (respNewItem.data.ok) {
            setValue("category_name", "");
            setValue("item_group", "");
            setValue("cost", "");
            setValue("brand", "");
            setValue("descript_item", "");
            setValue("ownership", "");
            setValue("serial_number", "");

            setValueSelection(options[0]);
            openNotificationWithIcon(
              "success",
              "New item was created and stored in database."
            );
            await navigate("/inventory");
          }
        }
      } else if (data.photo.length < 1) {
        setLoadingStatus(true);
        const respNewItem = await devitrakApi.post("/db_item/new_item", {
          category_name: data.category_name,
          item_group: selectedItem,
          cost: data.cost,
          brand: data.brand,
          descript_item: data.descript_item,
          ownership: valueSelection,
          serial_number: data.serial_number,
          warehouse: true,
          main_warehouse: taxableLocation,
          created_at: formatDate(new Date()),
          updated_at: formatDate(new Date()),
          company: user.company,
          location: locationSelection,
          current_location: locationSelection,
          extra_serial_number: JSON.stringify(moreInfo),
          company_id: user.sqlInfo.company_id,
          return_date: `${
            valueSelection === "Rent" ? formatDate(returningDate) : null
          }`,
        });
        if (respNewItem.data.ok) {
          setValue("category_name", "");
          setValue("item_group", "");
          setValue("cost", "");
          setValue("brand", "");
          setValue("descript_item", "");
          setValue("ownership", "");
          setValue("serial_number", "");
          setValueSelection(options[0]);
          openNotificationWithIcon(
            "success",
            "New item was created and stored in database."
          );
          await navigate("/inventory");
        }
      }
    } catch (error) {
      openNotificationWithIcon("error", `${error.message}`);
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
          alignSelf: "stretch",
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
          <div
            style={{
              textAlign: "left",
              width: "50%",
            }}
          >
            <InputLabel style={{ marginBottom: "6px", width: "100%" }}>
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                fontFamily={"Inter"}
                fontSize={"14px"}
                fontStyle={"normal"}
                fontWeight={500}
                lineHeight={"20px"}
                color={"var(--gray-700, #344054)"}
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
            {errors?.category_name && (
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                fontFamily={"Inter"}
                fontSize={"14px"}
                fontStyle={"normal"}
                fontWeight={400}
                lineHeight={"20px"}
                color={"red"}
                width={"100%"}
                padding={"0.5rem 0"}
              >
                {errors.category_name.type}
              </Typography>
            )}
            <div
              style={{
                textAlign: "left",
                width: "50%",
              }}
            ></div>
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
                fontFamily={"Inter"}
                fontSize={"14px"}
                fontStyle={"normal"}
                fontWeight={500}
                lineHeight={"20px"}
                color={"var(--gray-700, #344054)"}
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
                fontFamily={"Inter"}
                fontSize={"14px"}
                fontStyle={"normal"}
                fontWeight={500}
                lineHeight={"20px"}
                color={"var(--gray-700, #344054)"}
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
            {errors?.brand && (
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                fontFamily={"Inter"}
                fontSize={"14px"}
                fontStyle={"normal"}
                fontWeight={400}
                lineHeight={"20px"}
                color={"red"}
                width={"100%"}
                padding={"0.5rem 0"}
              >
                {errors.brand.type}
              </Typography>
            )}
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
                fontFamily={"Inter"}
                fontSize={"14px"}
                fontStyle={"normal"}
                fontWeight={500}
                lineHeight={"20px"}
                color={"var(--gray-700, #344054)"}
              >
                <Tooltip
                  placement="top"
                  title="Address where tax deduction for equipment will be applied."
                  style={{
                    width: "100%",
                  }}
                >
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
                fontFamily={"Inter"}
                fontSize={"14px"}
                fontStyle={"normal"}
                fontWeight={500}
                lineHeight={"20px"}
                color={"var(--gray-700, #344054)"}
              >
                Cost of replace device
              </Typography>
            </InputLabel>
            <OutlinedInput
              required
              {...register("cost", { required: true })}
              aria-invalid={errors.cost}
              style={OutlinedInputStyle}
              placeholder="e.g. $200"
              startAdornment={
                <InputAdornment position="start">
                  <Typography
                    textTransform={"none"}
                    textAlign={"left"}
                    fontFamily={"Inter"}
                    fontSize={"14px"}
                    fontStyle={"normal"}
                    fontWeight={400}
                    lineHeight={"20px"}
                    color={"var(--gray-700, #344054)"}
                  >
                    $
                  </Typography>
                </InputAdornment>
              }
              fullWidth
            />
            {errors?.cost && <Typography>{errors.cost.type}</Typography>}
          </div>
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
                fontFamily={"Inter"}
                fontSize={"14px"}
                fontStyle={"normal"}
                fontWeight={500}
                lineHeight={"20px"}
                color={"var(--gray-700, #344054)"}
              >
                Serial number
              </Typography>
            </InputLabel>
            <OutlinedInput
              required
              {...register("serial_number", { required: true })}
              aria-invalid={errors.serial_number}
              style={OutlinedInputStyle}
              placeholder="e.g. 300"
              fullWidth
            />
            {errors?.serial_number && (
              <Typography>{errors.serial_number.type}</Typography>
            )}
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
          <InputLabel style={{ width: "100%", marginBottom: "6px" }}>
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              fontFamily={"Inter"}
              fontSize={"14px"}
              fontStyle={"normal"}
              fontWeight={500}
              lineHeight={"20px"}
              color={"var(--gray-700, #344054)"}
            >
              Description of the device
            </Typography>
          </InputLabel>
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
          {errors?.descript_item && (
            <Typography>{errors.descript_item.type}</Typography>
          )}
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
            item
            xs={12}
          >
            <Avatar
              style={{
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
            <Typography
              color={"var(--gray-600, #475467)"}
              fontFamily={"Inter"}
              fontSize={"14px"}
              fontStyle={"normal"}
              fontWeight={400}
              lineHeight={"20px"}
            >
              SVG, PNG, JPG or GIF (max. 1MB)
            </Typography>
          </Grid>
        </Grid>
        <Divider />
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <InputLabel style={{ marginBottom: "6px", width: "100%" }}>
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              fontFamily={"Inter"}
              fontSize={"14px"}
              fontStyle={"normal"}
              fontWeight={500}
              lineHeight={"20px"}
              color={"var(--gray-700, #344054)"}
            >
              Ownership status of item
            </Typography>
            <Select
              showSearch
              style={{ ...AntSelectorStyle, width: "100%" }}
              placeholder="Select an option"
              optionFilterProp="children"
              onChange={onChange}
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
              title="Where the item is location physically."
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
              minDate={new Date()}
              selected={returningDate}
              openToDate={new Date()}
              startDate={new Date()}
              onChange={(date) => setReturningDate(date)}
              style={{
                ...OutlinedInputStyle,
                width: "100%",
              }}
            />
          </div>

          <div style={{ width: "100%" }}>
            <InputLabel style={{ width: "100%" }}>
              <Tooltip
                title="Where the item is location physically."
                placement="top"
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
                  Location <QuestionIcon />
                </Typography>
              </Tooltip>
            </InputLabel>
            <AutoComplete
              className="custom-autocomplete"
              style={{ width: "100%", height: "2.5rem" }}
              options={renderLocationOptions()}
              placeholder="Select a location"
              value={locationSelection}
              filterOption={(inputValue, option) =>
                option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !==
                -1
              }
              onChange={(value) => setLocationSelection(value)}
            />
          </div>
        </div>
        <Divider />
        <span
          onClick={() => setMoreInfoDisplay(true)}
          style={{
            ...CenteringGrid,
            width: "100%",
            border: `1px solid ${
              loadingStatus
                ? "var(--disabled-blue-button)"
                : "var(--blue-dark-600)"
            }`,
            borderRadius: "8px",
            background: `${
              loadingStatus
                ? "var(--disabled-blue-button)"
                : "var(--blue-dark-600)"
            }`,
            boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
            padding: "6px 12px",
            cursor: "pointer",
          }}
        >
          <Icon
            icon="ic:baseline-plus"
            color="var(--base-white, #FFF)"
            width={20}
            height={20}
          />
          &nbsp;
          <Typography
            textTransform={"none"}
            style={{
              color: "var(--base-white, #FFF)",
              fontSize: "14px",
              fontWeight: "600",
              fontFamily: "Inter",
              lineHeight: "20px",
            }}
          >
            Add more information
          </Typography>
        </span>
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
        <Divider />
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          {moreInfo.length > 0 &&
            moreInfo.map((item) => (
              <div
                style={{
                  backgroundColor: "var(--whitebase)",
                  padding: "2.5px 5px",
                  margin: "0 1px",
                  border: "solid 0.1px var(--gray900)",
                  borderRadius: "8px",
                }}
                key={`${item.keyObject}-${item.valueObject}`}
              >
                {item.keyObject}:{item.valueObject}
              </div>
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
                disabled={loadingStatus}
                style={{
                  width: "100%",
                  border: "1px solid var(--gray-300, #D0D5DD)",
                  borderRadius: "8px",
                  background: "var(--base-white, #FFF)",
                  boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                }}
              >
                {/* <Icon
                  icon="ri:arrow-go-back-line"
                  color="#344054"
                  width={20}
                  height={20}
                />
                &nbsp; */}
                <Typography
                  textTransform={"none"}
                  style={{
                    color: "#344054",
                    fontSize: "14px",
                    fontWeight: "600",
                    fontFamily: "Inter",
                    lineHeight: "20px",
                  }}
                >
                  Go back
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
              disabled={loadingStatus}
              type="submit"
              style={{
                width: "100%",
                border: `1px solid ${
                  loadingStatus
                    ? "var(--disabled-blue-button)"
                    : "var(--blue-dark-600)"
                }`,
                borderRadius: "8px",
                background: `${
                  loadingStatus
                    ? "var(--disabled-blue-button)"
                    : "var(--blue-dark-600)"
                }`,
                boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
              }}
            >
              <Icon
                icon="ic:baseline-plus"
                color="var(--base-white, #FFF)"
                width={20}
                height={20}
              />
              &nbsp;
              <Typography
                textTransform={"none"}
                style={{
                  color: "var(--base-white, #FFF)",
                  fontSize: "14px",
                  fontWeight: "600",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                }}
              >
                Save new item
              </Typography>
            </Button>
          </div>
        </div>
      </form>
    </Grid>
  );
};

export default AddNewItem;
