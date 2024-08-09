import { Icon } from "@iconify/react/dist/iconify.js";
import {
  Button,
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  TextField,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AutoComplete,
  Avatar,
  Divider,
  Tooltip,
  notification,
  Select,
} from "antd";
import _ from "lodash";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import {
  QuestionIcon,
  UploadIcon,
} from "../../../../../../components/icons/Icons";
import { convertToBase64 } from "../../../../../../components/utils/convertToBase64";
import { AntSelectorStyle } from "../../../../../../styles/global/AntSelectorStyle";
import { OutlinedInputStyle } from "../../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../../styles/global/Subtitle";
import { TextFontSize20LineHeight30 } from "../../../../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../../../../styles/global/TextFontSize30LineHeight38";
import { formatDate } from "../../../../../inventory/utils/dateFormat";
import CenteringGrid from "../../../../../../styles/global/CenteringGrid";
import { BlueButton } from "../../../../../../styles/global/BlueButton";

const options = [
  { value: "Select an option" },
  { value: "Permanent" },
  { value: "Rent" },
  { value: "Sale" },
];

const AssignemntNewDeviceInInventory = () => {
  const [selectedItem, setSelectedItem] = useState("");
  const [taxableLocation, setTaxableLocation] = useState("");
  const [valueSelection, setValueSelection] = useState(options[0].value);
  const [locationSelection, setLocationSelection] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [moreInfoDisplay, setMoreInfoDisplay] = useState(false);
  const [moreInfo, setMoreInfo] = useState([]);
  const [keyObject, setKeyObject] = useState("");
  const [valueObject, setValueObject] = useState("");
  const { user } = useSelector((state) => state.admin);
  const { profile } = useSelector((state) => state.staffDetail);
  const newEventInfo = {};
  const queryClient = useQueryClient();
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
  const handleMoreInfoPerDevice = () => {
    const result = [...moreInfo, { keyObject, valueObject }];
    setKeyObject("");
    setValueObject("");
    return setMoreInfo(result);
  };

  const createNewLease = async (props) => {
    const staffMember = await devitrakApi.post("/db_staff/consulting-member", {
      email: profile.email,
    });
    for (let data of props.deviceInfo) {
      await devitrakApi.post("/db_lease/new-lease", {
        staff_admin_id: user.sqlMemberInfo.staff_id,
        company_id: user.sqlInfo.company_id,
        subscription_expected_return_data: formatDate(new Date()),
        location: `${props.street} ${props.city} ${props.state} ${props.zip}`,
        staff_member_id: staffMember.data.member.at(-1).staff_id,
        device_id: data.item_id,
      });
    }
  };
  const createEvent = async (props) => {
    try {
      const respoNewEvent = await devitrakApi.post("/db_event/new_event", {
        event_name: `${profile.firstName} ${profile.lastName} / ${
          profile.email
        } / ${new Date().toLocaleDateString()}`,
        venue_name: `${profile.firstName} ${profile.lastName} / ${
          profile.email
        } / ${new Date().toLocaleDateString()}`,
        street_address: props.street,
        city_address: props.city,
        state_address: props.state,
        zip_address: props.zip,
        email_company: profile.email,
        phone_number: profile.adminUserInfo.phone,
        company_assigned_event_id: user.sqlInfo.company_id,
        contact_name: `${user.name} ${user.lastName}`,
      });
      if (respoNewEvent.data) {
        return (newEventInfo.insertId = respoNewEvent.data.consumer.insertId);
      }
    } catch (error) {
      console.log("🚀 ~ createEvent ~ error:", error);
    }
  };

  const addDeviceToEvent = async (props) => {
    for (let data of props) {
      for (let item of data.selectedList) {
        await devitrakApi.post("/db_event/event_device_directly", {
          event_id: newEventInfo.insertId,
          item_id: item.item_id,
        });
      }
    }
  };

  const closingProcess = async () => {
    setValue("category_name", "");
    setValue("item_group", "");
    setValue("cost", "");
    setValue("brand", "");
    setValue("descript_item", "");
    setValue("ownership", "");
    setValue("serial_number", "");
    setValueSelection(options[0]);
    openNotificationWithIcon("Equipment assigned to staff member.");
    setLoadingStatus(false);
    queryClient.invalidateQueries({
      queryKey: ["staffMemberInfo"],
      exact: true,
    });
    queryClient.invalidateQueries({
      queryKey: ["imagePerItemList"],
      exact: true,
    });
    queryClient.invalidateQueries({
      queryKey: ["ItemsInventoryCheckingQuery"],
      exact: true,
    });

    await navigate(`/staff/${profile.adminUserInfo._id}/main`);
  };
  const option1 = async (props) => {
    await createEvent(props.template);
    const deviceInfo = props.deviceInfo; //*array of existing devices in sql db
    if (newEventInfo.insertId) {
      await createNewLease({ ...props.template, deviceInfo });
      await addDeviceToEvent([
        {
          item_group: deviceInfo[0].item_group,
          category_name: deviceInfo[0].category_name,
          min_serial_number: deviceInfo.at(-1).serial_number,
          quantity: props.quantity,
          selectedList: deviceInfo,
        },
      ]);
      await closingProcess();
    }
  };
  const retrieveDataNewAddedItem = async (props) => {
    const newAddedItem = await devitrakApi.post("/db_item/consulting-item", {
      company_id: user.sqlInfo.company_id,
      item_group: selectedItem,
      category_name: props.category_name,
      serial_number: props.serial_number,
    });
    if (newAddedItem.data) {
      return await option1({
        template: props.template,
        deviceInfo: newAddedItem.data.items,
        quantity: "1",
      });
    }
  };
  const savingNewItem = async (data) => {
    const template = {
      street: data.street,
      city: data.city,
      state: data.state,
      zip: data.zip,
    };
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
            warehouse: false,
            main_warehouse: taxableLocation,
            created_at: formatDate(new Date()),
            updated_at: formatDate(new Date()),
            company: user.company,
            location: locationSelection,
            current_location: locationSelection,
            extra_serial_number: JSON.stringify(moreInfo),
            company_id: user.sqlInfo.company_id,
          });
          if (respNewItem.data.ok) {
            await retrieveDataNewAddedItem({
              ...data,
              template: template,
              quantity: "1",
            });
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
          warehouse: false,
          main_warehouse: taxableLocation,
          created_at: formatDate(new Date()),
          updated_at: formatDate(new Date()),
          company: user.company,
          location: locationSelection,
          current_location: locationSelection,
          extra_serial_number: JSON.stringify(moreInfo),
          company_id: user.sqlInfo.company_id,
        });
        if (respNewItem.data.ok) {
          await retrieveDataNewAddedItem({
            ...data,
            template: template,
            quantity: "1",
          });
        }
      }
    } catch (error) {
      openNotificationWithIcon("error", `${error.message}`);
      setLoadingStatus(false);
    }
  };

  const renderTitle = () => {
    return (
      <>
        <InputLabel
          id="eventName"
          style={{ marginBottom: "6px", width: "100%" }}
        >
          <p
            style={{
              ...TextFontSize30LineHeight38,
              textAlign: "left",
              color: "var(--gray600, #475467)",
            }}
          >
            Add one device to inventory and assign it to staff member
          </p>
        </InputLabel>
        <InputLabel
          id="eventName"
          style={{ marginBottom: "6px", width: "100%" }}
        >
          <p
            style={{
              ...TextFontSize20LineHeight30,
              color: "var(--gray600, #475467)",
              textAlign: "left",
              textTransform: "none",
            }}
          >
            You can enter all the details manually or use a scanner to enter the
            serial number.
          </p>
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
        <div style={{ width: "100%" }}>
          <InputLabel style={{ marginBottom: "0.5rem", width: "100%" }}>
            <p style={Subtitle}>Location where device is going to be used.</p>
          </InputLabel>
          <div
            style={{
              ...CenteringGrid,
              justifyContent: "space-between",
              margin: "0 0 20px 0",
              gap: "1rem",
            }}
          >
            <div style={{ width: "50%" }}>
              <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                <p style={Subtitle}>Street</p>
              </InputLabel>
              <OutlinedInput
                {...register("street")}
                disabled={loadingStatus}
                style={{
                  ...OutlinedInputStyle,
                  width: "100%",
                }}
                fullWidth
              />
            </div>
            <div style={{ width: "50%" }}>
              <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                <p style={Subtitle}>City</p>
              </InputLabel>
              <OutlinedInput
                disabled={loadingStatus}
                {...register("city")}
                style={{
                  ...OutlinedInputStyle,
                  width: "100%",
                }}
                fullWidth
              />
            </div>
          </div>
          <div
            style={{
              ...CenteringGrid,
              justifyContent: "space-between",
              margin: "0 0 20px 0",
              gap: "1rem",
            }}
          >
            <div style={{ width: "50%" }}>
              <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                <p style={Subtitle}>State</p>
              </InputLabel>
              <OutlinedInput
                {...register("state")}
                disabled={loadingStatus}
                style={{
                  ...OutlinedInputStyle,
                  width: "100%",
                }}
                fullWidth
              />
            </div>
            <div style={{ width: "50%" }}>
              <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                <p style={Subtitle}>Zip</p>
              </InputLabel>
              <OutlinedInput
                disabled={loadingStatus}
                {...register("zip")}
                style={{
                  ...OutlinedInputStyle,
                  width: "100%",
                }}
                fullWidth
              />
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
            <InputLabel style={{ marginBottom: "6px", width: "100%" }}>
              <p
                style={{
                  ...Subtitle,
                  textAlign: "left",
                  textTransform: "none",
                }}
              >
                Category
              </p>
            </InputLabel>
            <OutlinedInput
              required
              {...register("category_name")}
              aria-invalid={errors.category_name}
              style={OutlinedInputStyle}
              placeholder="e.g. Electronic"
              fullWidth
            />
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
              <p
                style={{
                  ...Subtitle,
                  textAlign: "left",
                  textTransform: "none",
                }}
              >
                Device name
              </p>
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
              <p
                style={{
                  ...Subtitle,
                  textAlign: "left",
                  textTransform: "none",
                }}
              >
                Brand
              </p>
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
              <p style={{ ...Subtitle, textAlign: "left" }}>
                <Tooltip title="Address where tax deduction for equipment will be applied.">
                  Taxable location <QuestionIcon />
                </Tooltip>
              </p>
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
              <p style={{ ...Subtitle, textAlign: "left" }}>
                Cost of replace device
              </p>
            </InputLabel>
            <OutlinedInput
              required
              {...register("cost", { required: true })}
              aria-invalid={errors.cost}
              style={OutlinedInputStyle}
              placeholder="e.g. $200"
              startAdornment={
                <InputAdornment position="start">
                  <p style={{ ...Subtitle, textAlign: "left" }}>$</p>
                </InputAdornment>
              }
              fullWidth
            />
          </div>
          <div
            style={{
              textAlign: "left",
              width: "50%",
            }}
          >
            <InputLabel style={{ width: "100%" }}>
              <p style={{ ...Subtitle, textAlign: "left" }}>Serial number</p>
            </InputLabel>
            <OutlinedInput
              required
              {...register("serial_number", { required: true })}
              aria-invalid={errors.serial_number}
              style={OutlinedInputStyle}
              placeholder="e.g. 300"
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
          <InputLabel style={{ width: "100%", marginBottom: "6px" }}>
            <p style={{ ...Subtitle, textAlign: "left" }}>
              Description of the device
            </p>
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
            <p style={{ ...Subtitle, textAlign: "left" }}>
              SVG, PNG, JPG or GIF (max. 1MB)
            </p>
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
            <p style={{ ...Subtitle, textAlign: "left" }}>
              Ownership status of item
            </p>
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
          <div style={{ width: "100%" }}>
            <InputLabel style={{ width: "100%" }}>
              <p style={{ ...Subtitle, textAlign: "left" }}>
                Location{" "}
                <Tooltip title="Where the item is location physically.">
                  <QuestionIcon />
                </Tooltip>
              </p>
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
          <p
            style={{
              color: "var(--base-white, #FFF)",
              fontSize: "14px",
              fontWeight: "600",
              fontFamily: "Inter",
              lineHeight: "20px",
              textTransform: "none",
            }}
          >
            Add more information
          </p>
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
            <Button
              disabled={loadingStatus}
              onClick={() =>
                navigate(`/staff/${profile.adminUserInfo._id}/main`)
              }
              style={{
                width: "100%",
                border: "1px solid var(--gray-300, #D0D5DD)",
                borderRadius: "8px",
                background: "var(--base-white, #FFF)",
                boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
              }}
            >
              <Icon
                icon="ri:arrow-go-back-line"
                color="#344054"
                width={20}
                height={20}
              />
              &nbsp;
              <p
                style={{
                  textTransform: "none",
                  color: "#344054",
                  fontSize: "14px",
                  fontWeight: "600",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                }}
              >
                Go back
              </p>
            </Button>
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
              <p
                style={{
                  textTransform: "none",
                  color: "var(--base-white, #FFF)",
                  fontSize: "14px",
                  fontWeight: "600",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                }}
              >
                Save and assign new item
              </p>
            </Button>
          </div>
        </div>
      </form>
    </Grid>
  );
};

export default AssignemntNewDeviceInInventory;
