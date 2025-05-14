import {
  Chip,
  Grid,
  InputLabel,
  OutlinedInput,
  Tooltip,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { AutoComplete, Button, Divider, Modal, notification } from "antd";
import { groupBy } from "lodash";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Controller, useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import ImageUploaderFormat from "../../../../../classes/imageCloudinaryFormat";
import { EditIcon } from "../../../../../components/icons/EditIcon";
import { QuestionIcon } from "../../../../../components/icons/QuestionIcon";
import { WhiteCirclePlusIcon } from "../../../../../components/icons/WhiteCirclePlusIcon";
import { checkValidJSON } from "../../../../../components/utils/checkValidJSON";
import { convertToBase64 } from "../../../../../components/utils/convertToBase64";
import ImageUploaderUX from "../../../../../components/utils/UX/ImageUploaderUX";
import { AntSelectorStyle } from "../../../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { GrayButton } from "../../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../../styles/global/GrayButtonText";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import "../../../../../styles/global/reactInput.css";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import { TextFontSize30LineHeight38 } from "../../../../../styles/global/TextFontSize30LineHeight38";
import "../../../actions/style.css";
import { renderFields } from "../../../actions/utils/SingleItemFields";
import { retrieveExistingSubLocationsForCompanyInventory } from "../../../actions/utils/SubLocationRenderer";
import costValueInputFormat from "../../../utils/costValueInputFormat";
import { formatDate } from "../../../utils/dateFormat";

const options = [{ value: "Permanent" }, { value: "Rent" }, { value: "Sale" }];
const EditItemModal = ({
  dataFound,
  openEditItemModal,
  setOpenEditItemModal,
  refetchingFn,
}) => {
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [moreInfoDisplay, setMoreInfoDisplay] = useState(true);
  const [moreInfo, setMoreInfo] = useState([]);
  const [keyObject, setKeyObject] = useState("");
  const [valueObject, setValueObject] = useState("");
  const [returningDate, setReturningDate] = useState(new Date());
  const [imageUploadedValue, setImageUploadedValue] = useState(null);
  const [displayContainerSplotLimitField, setDisplayContainerSplotLimitField] =
    useState(false);
  const [subLocationsOptions, setSubLocationsOptions] = useState({
    0: [],
    1: [],
    2: [],
  });
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
      item_group: dataFound[0].item_group,
      photo: dataFound[0].image_url,
      category_name: dataFound[0].category_name,
      cost: dataFound[0].cost,
      brand: dataFound[0].brand,
      descript_item: dataFound[0].descript_item,
      serial_number: dataFound[0].serial_number,
      container:
        dataFound[0].container > 0
          ? "Yes - It is a container"
          : "No - It is not a container",
      location: dataFound[0].location,
      sub_location: null,
      sub_location_2: null,
      sub_location_3: null,
      tax_location: dataFound[0].main_warehouse,
      containerSpotLimit: dataFound[0].containerSpotLimit,
      ownership: dataFound[0].ownership,
      status: dataFound[0].status,
    },
  });
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

  useEffect(() => {
    const controller = new AbortController();
    if (dataFound.length > 0) {
      const subLocations = checkValidJSON(dataFound[0].sub_location);
      if (subLocations.length > 0) {
        subLocations.map((item, index) => {
          if (index === 0) return setValue("sub_location", item);
          else return setValue(`sub_location_${index + 1}`, item);
        });
      }
    }
    return () => {
      controller.abort();
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    if (dataFound.length > 0) {
      const extraInfo = checkValidJSON(dataFound[0].extra_serial_number);
      if (extraInfo.length > 0) {
        setMoreInfo(extraInfo);
      }
    }
    return () => {
      controller.abort();
    };
  }, []);

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
    setSubLocationsOptions(
      retrieveExistingSubLocationsForCompanyInventory(
        itemsInInventoryQuery?.data?.data?.items
      )
    );
    return () => {
      controller.abort();
    };
  }, [itemsInInventoryQuery.data]);

  const savingNewItem = async (data) => {
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
    try {
      let base64;
      let img_url = data.photo;
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
        item_id: dataFound[0].item_id,
        category_name: data.category_name,
        item_group: data.item_group,
        cost: data.cost,
        brand: data.brand,
        descript_item: data.descript_item,
        ownership: data.ownership,
        serial_number: data.serial_number,
        warehouse: true,
        status: data.status,
        main_warehouse: data.tax_location,
        update_at: formatDate(new Date()),
        company: user.company,
        location: data.location,
        sub_location: JSON.stringify([
          data.sub_location,
          data.sub_location_2,
          data.sub_location_3,
        ]),
        current_location: data.location,
        extra_serial_number: JSON.stringify(moreInfo),
        return_date:
          data.ownership === "Rent" ? formatDate(returningDate) : null,
        container: String(data.container).includes("Yes") ? 1 : 0,
        containerSpotLimit: data.containerSpotLimit,
        image_url: img_url,
      };

      const respNewItem = await devitrakApi.post(
        "/db_item/edit-item",
        template
      );
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
        setValue("containerSpotLimit", "0");
        openNotificationWithIcon(
          "New item was created and stored in database."
        );
        setLoadingStatus(false);
        refetchingFn();
        return closeModal();
      }
      refetchingFn();
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
            Edit item
          </Typography>
        </InputLabel>
        <InputLabel
          id="eventName"
          style={{ marginBottom: "6px", width: "100%" }}
        >
          {/* <Typography
            textAlign={"left"}
            textTransform={"none"}
            style={TextFontSize20LineHeight30}
            color={"var(--gray-600, #475467)"}
          >
            You can enter all the details manually or use a scanner to enter the
            serial number.
          </Typography> */}
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

  const closeModal = () => {
    return setOpenEditItemModal(false);
  };

  return (
    <Modal
      key={dataFound[0].item_id}
      open={openEditItemModal}
      onCancel={() => closeModal()}
      style={{ top: "20dv", zIndex: 30 }}
      width={1000}
      footer={[]}
    >
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
            {renderFields({
              OutlinedInputStyle,
              retrieveItemOptions,
              options,
              renderLocationOptions,
              displayContainerSplotLimitField,
              subLocationsOptions,
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
                      md={item.name === "descript_item" ? 12 : 6}
                      lg={item.name === "descript_item" ? 12 : 6}
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
                    md={item.name === "descript_item" ? 12 : 6}
                    lg={item.name === "descript_item" ? 12 : 6}
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
              }
            })}
            <Grid
              key={"status"}
              style={{
                textAlign: "left",
              }}
              marginY={1}
              item
              xs={12}
              sm={12}
              md={6}
              lg={6}
            >
              <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                <Tooltip
                  placement="top"
                  title={"The condition of the item."}
                  style={{
                    width: "100%",
                  }}
                >
                  <Typography style={styling}>
                    Item condition <QuestionIcon />
                  </Typography>
                </Tooltip>
              </InputLabel>
              <Controller
                control={control}
                name={"status"}
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
                    options={[
                      { value: "Operational" },
                      { value: "Damaged" },
                      { value: "Lost" },
                      { value: "Network" },
                      { value: "Battery" },
                      { value: "Broken" },
                      { value: "Out of stock" },
                    ]}
                    placeholder={"e.g. Operational | Damaged"}
                    filterOption={(inputValue, option) =>
                      option.value
                        .toUpperCase()
                        .indexOf(inputValue.toUpperCase()) !== -1
                    }
                  />
                )}
              />
            </Grid>
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
              <Button
                htmlType="reset"
                onClick={() => closeModal()}
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
                  <EditIcon
                    stroke={"var(--basewhite)"}
                    fill={"var(--basewhite)"}
                  />
                  &nbsp; Update item
                </p>
              </Button>
            </div>
          </div>
        </form>
      </Grid>
    </Modal>
  );
};

export default EditItemModal;
