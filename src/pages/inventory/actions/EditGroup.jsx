import { Icon } from "@iconify/react";
import {
  Button,
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import {
  AutoComplete,
  Avatar,
  Divider,
  Select,
  Tooltip,
  notification,
} from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { QuestionIcon, UploadIcon } from "../../../components/icons/Icons";
import { convertToBase64 } from "../../../components/utils/convertToBase64";
import { AntSelectorStyle } from "../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { GrayButton } from "../../../styles/global/GrayButton";
import GrayButtonText from "../../../styles/global/GrayButtonText";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import _ from "lodash";
import "../../../styles/global/ant-select.css";
import { formatDate } from "../utils/dateFormat";
import { Subtitle } from "../../../styles/global/Subtitle";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../../styles/global/reactInput.css";
import { TextFontSize14LineHeight20 } from "../../../styles/global/TextFontSize14LineHeight20";

const options = [{ value: "Permanent" }, { value: "Rent" }, { value: "Sale" }];
const EditGroup = () => {
  const [returningDate, setReturningDate] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState("");
  const [taxableLocation, setTaxableLocation] = useState("");
  const [valueSelection, setValueSelection] = useState("");
  const [groupData, setGroupData] = useState([]);
  const { user } = useSelector((state) => state.admin);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();
  const submitRef = useRef();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, msg) => {
    api.open({
      message: msg,
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
      const grouopingByItemGroup = _.groupBy(
        itemsInInventoryQuery.data.data.items,
        "item_group"
      );
      return setGroupData(grouopingByItemGroup[selectedItem]);
    }

    return () => {
      controller.abort();
    };
  }, [selectedItem]);

  const getMinAndMax = useCallback(() => {
    if (groupData.length > 0) {
      const serialNumbers = new Set();
      for (let data of groupData) {
        serialNumbers.add(Number(data.serial_number));
      }
      const data = Array.from(serialNumbers);
      const min = Math.min(...data);
      const max = Math.max(...data);
      return {
        min: String(min).padStart(
          groupData[0].serial_number.length,
          `${groupData[0].serial_number[0]}`
        ),
        max: String(max).padStart(
          groupData[0].serial_number.length,
          `${groupData[0].serial_number[0]}`
        ),
      };
    }
    return {
      min: 0,
      max: 0,
    };
  }, [selectedItem, groupData.length]);
  getMinAndMax();
  const savingNewItem = async (data) => {
    submitRef.current = {
      ...data,
      item_group: selectedItem,
      ownership: valueSelection,
      main_warehouse: taxableLocation,
      location: locationSelection,
      company: user.company,
    };
    let base64;
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
      if (
        String(valueSelection).toLowerCase() === "rent" &&
        (!returningDate.getDate() ||
          !returningDate.getFullYear() ||
          !returningDate.getMonth())
      ) {
        return openNotificationWithIcon(
          "warning",
          "As ownership was set as 'Rent', returning date must be provided."
        );
      }
  
    if (data.photo.length > 0 && data.photo[0].size > 1048576) {
      setLoading(false);
      return alert(
        "Image is bigger than allow. Please resize the image or select a new one."
      );
    } else if (data.photo.length > 0) {
      openNotificationWithIcon(
        "warning",
        "We're working on your request. Please wait until the action is finished. We redirect you to main page when request is done."
      );
      setLoading(true);
      base64 = await convertToBase64(data.photo[0]);
      const resp = await devitrakApi.post(`/image/new_image`, {
        source: base64,
        category: data.category_name,
        item_group: selectedItem,
        company: user.company,
      });
      if (resp.data) {
        for (
          let i = Number(submitRef.current.startingNumber);
          i <= Number(submitRef.current.endingNumber);
          i++
        ) {
          try {
            const itemFoundInDB = groupData.find(
              (element) =>
                element.serial_number ===
                String(i).padStart(
                  submitRef.current.startingNumber.length,
                  `${submitRef.current.startingNumber[0]}`
                )
            );
            await devitrakApi.post("/db_item/edit-item", {
              item_id: itemFoundInDB.item_id,
              category_name: submitRef.current.category_name,
              item_group: submitRef.current.item_group,
              cost: submitRef.current.cost,
              brand: submitRef.current.brand,
              descript_item: submitRef.current.descript_item,
              ownership: submitRef.current.ownership,
              status: itemFoundInDB.status,
              serial_number: String(i).padStart(
                submitRef.current.startingNumber.length,
                `${submitRef.current.startingNumber[0]}`
              ),
              warehouse: itemFoundInDB.warehouse,
              main_warehouse: submitRef.current.main_warehouse,
              location: submitRef.current.location,
              current_location: submitRef.current.location,
              updated_at: formatDate(new Date()),
              company: user.company,
              return_date: `${
                submitRef.current.ownership === "Rent" ? formatDate(returningDate) : null
              }`,
            });
            if (
              !renderLocationOptions().some(
                (element) => element.value === submitRef.current.location
              )
            ) {
              let template = [
                ...companiesQuery.data.data.company.at(-1).location,
                submitRef.current.location,
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
            if (
              String(i).padStart(
                submitRef.current.startingNumber.length,
                `${submitRef.current.startingNumber[0]}`
              ) === submitRef.current.endingNumber
            ) {
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
                "items were created and stored in database."
              );
              setLoading(false);
              await navigate("/inventory");
            }
          } catch (error) {
            openNotificationWithIcon("error", `${error.message}`);
            setLoading(false);
          }
        }
      }
    } else if (data.photo.length < 1) {
      openNotificationWithIcon(
        "warning",
        "We're working on your request. Please wait until the action is finished. We redirect you to main page when request is done."
      );
      setLoading(true);
      for (
        let i = Number(submitRef.current.startingNumber);
        i <= Number(submitRef.current.endingNumber);
        i++
      ) {
        try {
          const itemFoundInDB = groupData.find(
            (element) =>
              element.serial_number ===
              String(i).padStart(
                submitRef.current.startingNumber.length,
                `${submitRef.current.startingNumber[0]}`
              )
          );
          await devitrakApi.post("/db_item/edit-item", {
            item_id: itemFoundInDB.item_id,
            category_name: submitRef.current.category_name,
            item_group: submitRef.current.item_group,
            cost: submitRef.current.cost,
            brand: submitRef.current.brand,
            descript_item: submitRef.current.descript_item,
            ownership: submitRef.current.ownership,
            status: itemFoundInDB.status,
            serial_number: String(i).padStart(
              submitRef.current.startingNumber.length,
              `${submitRef.current.startingNumber[0]}`
            ),
            warehouse: itemFoundInDB.warehouse,
            main_warehouse: submitRef.current.main_warehouse,
            location: submitRef.current.location,
            current_location: submitRef.current.location,
            updated_at: formatDate(new Date()),
            company: user.company,
            return_date: `${
              submitRef.current.ownership === "Rent" ? formatDate(returningDate) : null
            }`,
          });
          if (
            !renderLocationOptions().some(
              (element) => element.value === submitRef.current.location
            )
          ) {
            let template = [
              ...companiesQuery.data.data.company.at(-1).location,
              submitRef.current.location,
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
          if (
            String(i).padStart(
              submitRef.current.startingNumber.length,
              `${submitRef.current.startingNumber[0]}`
            ) === submitRef.current.endingNumber
          ) {
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
              "items were created and stored in database."
            );
            setLoading(false);
            await navigate("/inventory");
          }
        } catch (error) {
          console.log("🚀 ~ savingNewItem ~ error:", error);
          // openNotificationWithIcon('error', `item ${String(i).padStart(data.startingNumber.length, `${data.startingNumber[0]}`)} was not stored.`)
          setLoading(false);
        }
      }
    }
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
            Edit a group of devices
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
          // alignSelf: "stretch",
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
                Category
              </Typography>
            </InputLabel>
            <OutlinedInput
              disabled={loading}
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
              disabled={loading}
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

            <div
              style={{
                textAlign: "left",
                width: "50%",
              }}
            ></div>
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
              disabled={loading}
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
                <Tooltip title="Address where tax deduction for equipment will be applied.">
                  Taxable location <QuestionIcon />
                </Tooltip>
              </Typography>
            </InputLabel>
            <AutoComplete
              disabled={loading}
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
              disabled={loading}
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
                  Ownership status of items
                </Typography>
                <Select
                  disabled={loading}
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
                  (valueSelection === "Rent" || valueSelection === "")
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
                fontFamily={"Inter"}
                fontSize={"14px"}
                fontStyle={"normal"}
                fontWeight={500}
                lineHeight={"20px"}
                color={"var(--gray-700, #344054)"}
              >
                From starting number
              </Typography>
            </InputLabel>
            <OutlinedInput
              disabled={loading}
              required
              {...register("startingNumber")}
              aria-invalid={errors.startingNumber}
              style={OutlinedInputStyle}
              placeholder={`Series min for ${selectedItem} ${
                getMinAndMax().min
              }`}
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
                fontFamily={"Inter"}
                fontSize={"14px"}
                fontStyle={"normal"}
                fontWeight={500}
                lineHeight={"20px"}
                color={"var(--gray-700, #344054)"}
              >
                To ending number
              </Typography>
            </InputLabel>
            <OutlinedInput
              disabled={loading}
              required
              {...register("endingNumber")}
              aria-invalid={errors.endingNumber}
              style={OutlinedInputStyle}
              placeholder={`Series max of ${selectedItem} ${
                getMinAndMax().max
              }`}
              fullWidth
            />
            {errors?.endingNumber && (
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
                {errors.endingNumber.type}
              </Typography>
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
              Location{" "}
              <Tooltip title="Where the item is location physically.">
                <QuestionIcon />
              </Tooltip>
            </Typography>
          </InputLabel>
          <AutoComplete
            disabled={loading}
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
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            textAlign: "left",
          }}
        >
          <InputLabel style={{ width: "100%" }}>
            <Typography
              style={{ ...Subtitle, fontWeight: 500 }}
              // textTransform={"none"}
              // textAlign={"left"}
              // fontFamily={"Inter"}
              // fontSize={"14px"}
              // fontStyle={"normal"}
              // fontWeight={500}
              // lineHeight={"20px"}
              // color={"var(--gray-700, #344054)"}
            >
              Description of the device
            </Typography>
          </InputLabel>
          <OutlinedInput
            disabled={loading}
            required
            multiline
            minRows={5}
            {...register("descript_item", { required: true })}
            aria-invalid={errors.descript_item}
            style={{
              borderRadius: "12px",
              border: `${errors.descript_item && "solid 1px #004EEB"}`,
              margin: "0.1rem auto 1rem",
              display: "flex",
              width: "100%",
              justifyContent: "flex-start",
              background: "var(--base-white, #FFF)",
              boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
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
            // boxShadow: "0px 1px 2px rgba(16,24,40,0.05)",
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
            <Typography style={Subtitle}>
              SVG, PNG, JPG or GIF (max. 1MB)
            </Typography>
          </Grid>
        </Grid>
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
                <Icon
                  icon="ri:arrow-go-back-line"
                  color="#344054"
                  width={20}
                  height={20}
                />
                &nbsp;
                <Typography textTransform={"none"} style={GrayButtonText}>
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
              disabled={loading}
              type="submit"
              style={{
                ...BlueButton,
                width: "100%",
              }}
            >
              <Icon
                icon="ic:baseline-plus"
                color="var(--base-white, #FFF)"
                width={20}
                height={20}
              />
              &nbsp;
              <Typography textTransform={"none"} style={BlueButtonText}>
                Update group
              </Typography>
            </Button>
          </div>
        </div>
      </form>
    </Grid>
    // </Modal>
  );
};
export default EditGroup;
