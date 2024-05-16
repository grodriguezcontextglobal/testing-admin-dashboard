import { Icon } from "@iconify/react/dist/iconify.js";
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
import { AutoComplete, Avatar, Divider, Tooltip } from "antd";
import _ from 'lodash';
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { QuestionIcon, UploadIcon } from "../../../../../components/icons/Icons";
import { convertToBase64 } from "../../../../../components/utils/convertToBase64";
import { AntSelectorStyle } from "../../../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import { GrayButton } from "../../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../../styles/global/GrayButtonText";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import { TextFontSize20LineHeight30 } from "../../../../../styles/global/TextFontSize20HeightLine30";
import '../../../../../styles/global/ant-select.css';
import { formatDate } from "../../../../inventory/utils/dateFormat";

const FormDeviceTrackingMethod = ({
  selectedItem,
  setSelectedItem,
  setDisplayFormToCreateCategory,
  existingData
}) => {
  const [taxableLocation, setTaxableLocation] = useState('')
  const [choose, setChoose] = useState([])
  const { user } = useSelector((state) => state.admin);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false)
  const [locationSelection, setLocationSelection] = useState('')

  const companiesQuery = useQuery({
    queryKey: ['locationOptionsPerCompany'],
    queryFn: () => devitrakApi.post('/company/search-company', {
      company_name: user.company
    }),
    enabled: false,
    refetchOnMount: false
  })
  const itemsInInventoryQuery = useQuery({
    queryKey: ['ItemsInInventoryCheckingQuery'],
    queryFn: () => devitrakApi.post("/db_item/consulting-item", {
      company: user.company
    }),
    enabled: false,
    refetchOnMount: false
  })
  useEffect(() => {
    const controller = new AbortController()
    companiesQuery.refetch()
    itemsInInventoryQuery.refetch()
    return () => {
      controller.abort()
    }
  }, [])

  const retrieveItemOptions = () => {
    const result = new Set()
    if (existingData) {
      for (let [, value] of existingData) {
        result.add(value.item_group)
      }
    }
    return Array.from(result)
  }
  const renderLocationOptions = () => {
    if (companiesQuery.data) {
      const locations = companiesQuery?.data?.data?.company?.at(-1)?.location ?? []
      const result = new Set()
      for (let data of locations) {
        result.add({ value: data })
      }
      return Array.from(result)
    }
    return []
  }
  const retrieveItemDataSelected = () => {
    const result = new Map()
    if (itemsInInventoryQuery.data) {
      const industryData = itemsInInventoryQuery?.data?.data?.items
      for (let data of industryData) {
        result.set(data.item_group, data)
      }
    }
    return result
  }

  useEffect(() => {
    const controller = new AbortController()
    if (retrieveItemDataSelected().has(choose)) {
      const dataToRetrieve = retrieveItemDataSelected().get(choose)
      setValue('category_name', `${dataToRetrieve.category_name}`)
      setValue('cost', `${dataToRetrieve.cost}`)
      setValue('brand', `${dataToRetrieve.brand}`)
      setValue('descript_item', `${dataToRetrieve.descript_item}`)
      setLocationSelection(`${dataToRetrieve.location}`)
      setTaxableLocation(`${dataToRetrieve.main_warehouse}`)
    }

    return () => {
      controller.abort()
    }
  }, [choose])

  const savingNewItem = async (data) => {
    const dataDevices = itemsInInventoryQuery.data.data.items
    const groupingByDeviceType = _.groupBy(dataDevices, "item_group")
    let checkExistingDevice = []
    let base64;
    if (choose === "") return alert("A group of item must be provided.");
    if (taxableLocation === "") return alert("A taxable location must be provided.");
    for (let index = Number(data.startingNumber); index < Number(data.endingNumber); index++) {
      if (groupingByDeviceType[choose]) {
        const dataRef = _.groupBy(groupingByDeviceType[choose], "serial_number")
        if (dataRef[String(index).padStart(data.startingNumber.length, `${data.startingNumber[0]}`)]) {
          checkExistingDevice = [...checkExistingDevice, ...dataRef[String(index).padStart(data.startingNumber.length, `${data.startingNumber[0]}`)]]
        }
      }
    }
    if (checkExistingDevice.length > 0) {
      return alert("Devices were not stored due to some devices already exists in company records. Please check the data you're trying to store.")
    }
    if (data.photo.length > 0 && data.photo[0].size > 1048576) {
      setLoading(false)
      return alert(
        "Image is bigger than allow. Please resize the image or select a new one."
      );
    } else if (data.photo.length > 0) {
      setLoading(true)
      base64 = await convertToBase64(data.photo[0]);
      const resp = await devitrakApi.post(`/image/new_image`, {
        source: base64,
        category: data.category_name,
        item_group: choose,
        company: user.company,
      });
      if (resp.data) {
        try {
          const resulting = [...selectedItem, {
            category_name: data.category_name,
            item_group: choose,
            cost: data.cost,
            brand: data.brand,
            descript_item: data.descript_item,
            ownership: "Rent",
            startingNumber: data.startingNumber,
            endingNumber: data.endingNumber,
            main_warehouse: taxableLocation,
            location: locationSelection,
            current_location: locationSelection,
            created_at: formatDate(new Date()),
            updated_at: formatDate(new Date()),
            company: user.company, quantity: `${data.endingNumber - (data.startingNumber - 1)}`,
            existing: false

          }]
          setSelectedItem(resulting)
          setLoading(false)
          if (!renderLocationOptions().some(element => element.value === locationSelection)) {
            let template = [...companiesQuery.data.data.company.at(-1).location, locationSelection]
            await devitrakApi.patch(`/company/update-company/:${companiesQuery.data.data.company.at(-1).id}`, {
              location: template
            })
          }
          setValue("category_name", "");
          setValue("item_group", "");
          setValue("cost", "");
          setValue("brand", "");
          setValue("descript_item", "");
          setValue("ownership", "");
          setValue("startingNumber", "")
          setValue("endingNumber", "")
          setLoading(false)
          setDisplayFormToCreateCategory(false)
        } catch (error) {
          setLoading(false)
        }
      }
    } else if (data.photo.length < 1) {
      setLoading(true)
      try {
        const resulting = [...selectedItem, {
          category_name: data.category_name,
          item_group: choose,
          cost: data.cost,
          brand: data.brand,
          descript_item: data.descript_item,
          ownership: "Rent",
          startingNumber: data.startingNumber,
          endingNumber: data.endingNumber,
          main_warehouse: taxableLocation,
          location: locationSelection,
          current_location: locationSelection,
          created_at: formatDate(new Date()),
          updated_at: formatDate(new Date()),
          company: user.company,
          quantity: `${data.endingNumber - (data.startingNumber - 1)}`,
          existing: false

        }]
        if (!renderLocationOptions().some(element => element.value === locationSelection)) {
          let template = [...companiesQuery.data.data.company.at(-1).location, locationSelection]
          await devitrakApi.patch(`/company/update-company/${companiesQuery.data.data.company.at(-1).id}`, {
            location: template
          })
        }
        setSelectedItem(resulting)
        setLoading(false)
        setDisplayFormToCreateCategory(false)
      } catch (error) {
        setLoading(false)
      }
      // }
    }
  };
  const renderTitle = () => {
    return (<>
      <InputLabel
        id="eventName"
        style={{ marginBottom: "0.2rem", width: "100%" }}
      >
        <Typography
          textAlign={'left'}
          textTransform={"none"}
          style={TextFontSize20LineHeight30}
          color={"var(--gray600, #475467)"}
        >
          Add a group of devices
        </Typography>
      </InputLabel>
      <InputLabel
        id="eventName"
        style={{ marginBottom: "0.2rem", width: "100%" }}
      >
        <Typography
          textAlign={'left'}
          textTransform={"none"}
          style={{ ...TextFontSize20LineHeight30, textWrap: "pretty" }}
          color={"var(--gray600, #475467)"}
        >
          Devices serial numbers can be created by inputting a serial number base
          to define the category of device, and then a range from one number to
          another, depending on your inventory.
        </Typography>
      </InputLabel>
    </>
    )
  }
  return (
    <Grid
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
      container
    >
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
          border: "1px solid var(--gray300, #D0D5DD)",
          background: "var(--gray100, #F2F4F7)",
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
            <div
              style={{
                textAlign: "left",
                width: "50%",
              }}
            >
            </div>
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
                Device name
              </Typography>
            </InputLabel>
            <AutoComplete
              className="custom-autocomplete" // Add a custom className here
              variant="outlined"
              style={{
                ...AntSelectorStyle,
                border: "solid 0.3 var(--gray600)",
                fontFamily: 'Inter',
                fontSize: "14px",
                width: "100%"
              }}

              value={choose}
              onChange={(value) => setChoose(value)}
              options={retrieveItemOptions().map(item => { return ({ value: item }) })}
              placeholder="Type the name of the device"
              filterOption={(inputValue, option) =>
                option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
            />

            <div

              style={{
                textAlign: "left",
                width: "50%",
              }}
            >
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
                <Tooltip title="Address where tax deduction for equipment will be applied.">Taxable location <QuestionIcon /></Tooltip>
              </Typography>
            </InputLabel>
            <AutoComplete
              className="custom-autocomplete"
              style={{ width: "100%", height: "2.5rem" }}
              options={renderLocationOptions()}
              value={taxableLocation}
              placeholder="Select a location"
              filterOption={(inputValue, option) =>
                option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
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
              alignItems: "center"
            }}
          >
            <div style={{
              textAlign: "left",
              width: "100%",
              display: "flex",
              alignSelf: "flex-start",
            }}>
              <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                <Typography
                  textTransform={"none"}
                  textAlign={"left"}
                  style={{ ...Subtitle, fontWeight: 500 }}
                >
                  Ownership status of items <Tooltip title="Device added from this option would be set as rented Device."><strong><QuestionIcon /></strong></Tooltip>
                </Typography>
                <OutlinedInput
                  disabled
                  style={OutlinedInputStyle}
                  readOnly
                  value={'Rent'}
                  fullWidth
                />
              </InputLabel>
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
              Location <Tooltip title="Where the item is location physically."><QuestionIcon /></Tooltip>
            </Typography>
          </InputLabel>
          <AutoComplete
            className="custom-autocomplete"
            value={locationSelection}
            style={{ width: "100%", height: "2.5rem" }}
            options={renderLocationOptions()}
            placeholder="Select a location"
            filterOption={(inputValue, option) =>
              option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
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
            border: "1px solid var(--gray200, #EAECF0)",
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
                border: "6px solid var(--gray50, #F9FAFB)",
                background: "6px solid var(--gray50, #F9FAFB)",
                borderRadius: "28px",
              }}
            > <UploadIcon />
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
              style={Subtitle}
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
            }}>
            <Button
              disabled={loading}
              onClick={() => setDisplayFormToCreateCategory(false)}
              style={{ ...GrayButton, width: "100%" }}
            >
              <Icon
                icon="ri:arrow-go-back-line"
                color="#344054"
                width={20}
                height={20}
              />
              &nbsp;
              <Typography
                textTransform={"none"}
                style={GrayButtonText}
              >
                Go back
              </Typography>
            </Button>
          </div>
          <div
            style={{
              textAlign: "right",
              width: "50%",
            }}
          ><Button
            disabled={loading}
            type="submit"
            style={{
              ...BlueButton, width: "100%",
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
                style={BlueButtonText}
              >
                Save new item
              </Typography>
            </Button></div>
        </div>
      </form>
    </Grid>
  );
};

export default FormDeviceTrackingMethod;
