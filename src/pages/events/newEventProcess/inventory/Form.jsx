import {
  Button,
  Grid,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Select, Space, Tag, Tooltip } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import { CheckIcon, PlusIcon } from "../../../../components/icons/Icons";
import CenteringGrid from '../../../../styles/global/CenteringGrid';
import { LightBlueButton } from '../../../../styles/global/LightBlueButton';
import LightBlueButtonText from '../../../../styles/global/LightBlueButtonText';
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../styles/global/Subtitle";
import { TextFontSize20LineHeight30 } from "../../../../styles/global/TextFontSize20HeightLine30";
import { AntSelectorStyle } from "../../../../styles/global/AntSelectorStyle";
import "../../../../styles/global/ant-select.css"
import { useNavigate } from "react-router-dom";
import { onAddDeviceSetup } from "../../../../store/slices/eventSlice";
import FormDeviceTrackingMethod from "./newItemSetup/FormDeviceTrackingMethod";
const Form = () => {
  const {
    register,
    watch,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();
  const { user } = useSelector((state) => state.admin);
  const { deviceSetup } = useSelector((state) => state.event);
  const [displayFormToCreateCategory, setDisplayFormToCreateCategory] =
    useState(false);
  const [valueItemSelected, setValueItemSelected] = useState({});
  const [selectedItem, setSelectedItem] = useState(deviceSetup);
  const navigate = useNavigate();
  const dispatch = useDispatch()
  const itemQuery = useQuery({
    queryKey: ["listOfItems"],
    queryFn: () => devitrakApi.post("/db_item/warehouse-items", { company: user.company, warehouse: true }),
  });

  const dataFound = itemQuery?.data?.data?.items ?? []
  const groupingItemByCategoriesToRenderThemInSelector = () => {
    const result = new Map()
    for (let data of dataFound) {
      if (!result.has(data.category_name)) {
        result.set(data.category_name, [data])
      } else {
        result.set(data.category_name, [...result.get(data.category_name), data])
      }
    }
    return result
  }
  const optionsToRenderInSelector = () => {
    const result = new Set()
    for (let [, value] of groupingItemByCategoriesToRenderThemInSelector()) {
      result.add(value)
    }
    const checkLocation = new Map()
    for (let data of Array.from(result)) {
      for (let item of data) {
        if (!checkLocation.has(`${item.category_name}-${item.item_group}-${item.location}`)) {
          checkLocation.set(`${item.category_name}-${item.item_group}-${item.location}`, [item])
        } else {
          checkLocation.set(`${item.category_name}-${item.item_group}-${item.location}`, [...checkLocation.get(`${item.category_name}-${item.item_group}-${item.location}`), item])
        }
      }
    }
    let finalResultAfterSortValueByLocation = []
    for (const [, value] of checkLocation) {
      finalResultAfterSortValueByLocation = [...finalResultAfterSortValueByLocation, value]
    }
    return finalResultAfterSortValueByLocation
  }

  const onChange = (value) => {
    const optionRendering = JSON.parse(value);
    setValueItemSelected(optionRendering);
  };

  const substractingRangesSelectedItem = () => {
    const gettingValues = new Set()
    if (valueItemSelected.length > 0) {
      for (let data of valueItemSelected) {
        gettingValues.add(Number(data.serial_number))
      }
      const toArray = Array.from(gettingValues)
      const maxRange = Math.max(...toArray)
      const minRange = Math.min(...toArray)
      return {
        min: String(minRange).padStart(valueItemSelected[0].serial_number?.length, '0') ?? 0,
        max: String(maxRange).padStart(valueItemSelected[0].serial_number?.length, '0') ?? 0
      }
    }
  }
  const removeItemSelected = (item) => {
    const filter = selectedItem.filter((_, index) => index !== item);
    dispatch(onAddDeviceSetup(filter));
    return setSelectedItem(filter);
  };
  const handleAddingNewItemToInventoryEvent = (data) => {
    const resulting = [...selectedItem, { ...data, ...valueItemSelected[0], quantity: `${data.endingNumber - (data.startingNumber - 1)}`, existing: true }]
    setSelectedItem(resulting)
    setValue('startingNumber', '')
    setValue('endingNumber', '')
    return;
  }

  const handleNextStepEventSetup = () => {
    dispatch(onAddDeviceSetup(selectedItem))
    return navigate("/create-event-page/review-submit")
  }
  return (
    <Grid
      container
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
      key={"settingUp-deviceList-event"}
    >
      <InputLabel
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <Typography
          textTransform="none"
          style={AntSelectorStyle}
        >
          Assign from existing groups in the inventory
        </Typography>
      </InputLabel>
      <Typography
        textTransform="none"
        textAlign="justify"
        fontFamily="Inter"
        fontSize="14px"
        fontStyle="normal"
        fontWeight={400}
        lineHeight="20px"
        color="var(--gray-600, #475467)"
        margin={'0.2rem auto 0.5rem'}
        style={{
          wordWrap: "break-word",
          width: "100%",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        You can select groups of devices from existing inventory in your database and assign to this event. When assigning, you can choose the whole group of devices, or only a range of serial numbers per group. You will see the groups selected as small tags below.
      </Typography>
      <Grid
        style={{
          borderRadius: "8px",
          border: "1px solid var(--gray300, #D0D5DD)",
          background: "var(--gray100, #F2F4F7)",
          padding: "24px",
          width: "100%",
        }} item xs={12} sm={12} md={12} lg={12}>
        <InputLabel
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          <Typography
            textTransform="none"
            style={{ ...TextFontSize20LineHeight30, fontWeight: 600 }}
          >
            Existing groups
          </Typography>
        </InputLabel>
        <InputLabel
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          <Typography
            textTransform="none"
            style={{ ...TextFontSize20LineHeight30, fontWeight: 600, fontSize: "14px", color: "#000" }}
          >
            Select from existing category
          </Typography>
        </InputLabel>
        <Select
          className="custom-autocomplete"
          showSearch
          placeholder="Search item to add to inventory."
          optionFilterProp="children"
          style={{ ...AntSelectorStyle, width: "100%" }}
          onChange={onChange}
          options={optionsToRenderInSelector().map((item) => {
            return {
              label: <Typography textTransform={'capitalize'} style={{ ...Subtitle, display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <span><span style={{ fontWeight: 700 }}>{item[0].category_name}</span> {item[0].item_group}</span>
                <span style={{ textAlign: "left" }}>Location: <span style={{ fontWeight: 700 }}>{item[0].location}</span></span>
                <span>Total available: {item.length}</span>
              </Typography>, //renderOptionAsNeededFormat(JSON.stringify(option))
              value: JSON.stringify(item),
            };
          })}
        />
        <form
          onSubmit={handleSubmit(handleAddingNewItemToInventoryEvent)}
          style={{
            width: "100%",
          }}
        >
          <Grid
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            marginY={2}
            gap={2}
            style={{
              width: "100%",
            }}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >

            <Grid item xs={6} sm={6} md={6} lg={6}>
              <InputLabel
                style={{ marginBottom: "0.2rem", width: "100%" }}
              >
                <Typography
                  textTransform={"none"}
                  textAlign={"left"}
                  style={{ ...Subtitle, fontWeight: 500 }}
                >
                  From starting number
                </Typography>
              </InputLabel>
              <OutlinedInput
                {...register("startingNumber", { required: true })}
                aria-invalid={errors.startingNumber}
                style={{
                  ...OutlinedInputStyle,
                  border: `${errors.startingNumber && "solid 1px #004EEB"
                    }`,
                  width: "100%",
                }}
                placeholder={`Selected category min value: ${substractingRangesSelectedItem()?.min}`}
                fullWidth
              />
            </Grid>
            <Grid item xs={6} sm={6} md={6} lg={6}>
              <InputLabel
                style={{ marginBottom: "0.2rem", width: "100%" }}
              >
                <Typography
                  textTransform={"none"}
                  textAlign={"left"}
                  style={{ ...Subtitle, fontWeight: 500 }}
                >
                  To ending number
                </Typography>
              </InputLabel>
              <OutlinedInput
                {...register("endingNumber", { required: true })}
                aria-invalid={errors.endingNumber}
                style={{
                  ...OutlinedInputStyle,
                  border: `${errors.endingNumber && "solid 1px #004EEB"}`,
                  width: "100%",
                }}
                placeholder={`Selected category max value: ${substractingRangesSelectedItem()?.max}`}
                fullWidth
              />
            </Grid>
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            marginY={2}
            gap={2}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >

            <Grid item xs={6} sm={6} md={6} lg={6}>
              <InputLabel
                style={{ marginBottom: "0.2rem", width: "100%" }}
              >
                <Typography
                  textTransform={"none"}
                  textAlign={"left"}
                  style={{ ...Subtitle, fontWeight: 500 }}
                >
                  Quantity
                </Typography>
              </InputLabel>
              <OutlinedInput
                disabled
                style={{
                  ...OutlinedInputStyle,
                  width: "100%",
                }}
                placeholder={`${isNaN(watch('endingNumber') - watch('startingNumber')) ? 0 : watch('endingNumber') - (watch('startingNumber') - 1)}`}
                fullWidth
              />
              {errors?.quantity && (
                <Typography
                  textTransform={"none"}
                  textAlign={"left"}
                  style={{ ...Subtitle, fontWeight: 500 }}
                  color={"red"}
                  width={"100%"}
                  padding={"0.5rem 0"}
                >
                  {errors.quantity.type}
                </Typography>
              )}
            </Grid>
            <Grid style={{ alignSelf: "baseline" }} item xs={6} sm={6} md={6} lg={6}>
              <InputLabel
                style={{ marginBottom: "0.2rem", width: "100%" }}
              >
                <Typography
                  textTransform={"none"}
                  textAlign={"left"}
                  style={{ ...Subtitle, fontWeight: 500 }}
                  color={"transparent"}
                >
                  Quantity
                </Typography>
              </InputLabel>
              <Button
                type="submit"
                style={{ ...LightBlueButton, ...CenteringGrid, width: "100%", }}
              >
                <PlusIcon /><Typography
                  textTransform="none"
                  style={LightBlueButtonText}
                >
                  Add item
                </Typography>
              </Button>
            </Grid>
          </Grid>
        </form>

        <Grid item xs={12}>
          <InputLabel
            style={{ marginBottom: "0.2rem", width: "100%" }}
          >
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              style={{ ...Subtitle, fontWeight: 500 }}
            >
              Groups selected
            </Typography>
          </InputLabel>
          <Space
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
            size={[0, "small"]}
            wrap
          >
            {selectedItem.map((item, index) => {
              return (
                <Tooltip key={index} title={`${item.consumerUses ? "" : "Item set up for internal use."}`}>
                  <Tag
                    bordered={false}
                    closable
                    icon={<CheckIcon />}
                    style={{
                      display: "flex",
                      padding: "2px 4px 2px 5px",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "3px",
                      borderRadius: "6px",
                      border: "1px solid var(--gray-300, #D0D5DD)",
                      background: "var(--base-white, #FFF)",
                      margin: "5px",
                    }}
                    onClose={() => removeItemSelected(index)}
                    key={`${item._id}${index}`}
                  >
                    &nbsp;{item.item_group}
                    {"      "}&nbsp;Qty: {item.quantity}
                    <br />
                    {item.startingNumber} - {item.endingNumber}
                  </Tag>
                </Tooltip>

              );
            })}
          </Space>
        </Grid>
      </Grid >

      <InputLabel
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          margin: "2rem auto 0.5rem"
        }}
      >
        <Typography
          textTransform="none"
          style={{ ...TextFontSize20LineHeight30, fontWeight: 600 }}
          color="var(--gray600)"
        >
          Generate a new category or group of devices
        </Typography>
      </InputLabel>
      <Typography
        textTransform="none"
        textAlign="justify"
        fontFamily="Inter"
        fontSize="14px"
        fontStyle="normal"
        fontWeight={400}
        lineHeight="20px"
        color="var(--gray-600, #475467)"
        style={{
          wordWrap: "break-word",
          width: "100%",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        If you haven&apos;t added the devices you&apos;re taking to this event into the inventory, create a new category of devices for this event; or create a new group within an existing category. Then you can enter a range of serial numbers starting with a serial number base, to register the new devices in your inventory.
      </Typography>

      <Tooltip title="Section in construction">
        <Button
          // disabled
          onClick={() =>
            setDisplayFormToCreateCategory(!displayFormToCreateCategory)
          }
          style={{
            ...LightBlueButton, width: "fit-content", margin: "1rem auto"
          }}
        >
          <PlusIcon /> <Typography
            textTransform="none"
            style={LightBlueButtonText}
          >
            Create a new category or group
          </Typography>
        </Button>
      </Tooltip>
      {
        displayFormToCreateCategory && (
          <FormDeviceTrackingMethod
            existingData={optionsToRenderInSelector()}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            setDisplayFormToCreateCategory={setDisplayFormToCreateCategory}
          />
        )
      }
      <Grid
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.5rem",
        }}
        marginY={"0.5rem"}
        item
        xs={12}
        sm={12}
        md={12}
        lg={12}
      >
        <Button
        onClick={() => navigate("/create-event-page/review-submit")}
          style={{
            display: "flex",
            padding: "12px 20px",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
            flex: "1 0 0",
            borderRadius: "8px",
            border: "1px solid var(--gray-300, #D0D5DD)",
            background: "var(--base-white, #FFF)",
            boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
            width: "100%",
          }}
        >
          <Typography
            textTransform={"none"}
            fontFamily={"Inter"}
            fontSize={"16px"}
            fontStyle={"normal"}
            fontWeight={600}
            lineHeight={"24px"}
            color={"var(--gray-700, #344054)"}
          >
            Skip this step
          </Typography>
        </Button>
        <Button
          onClick={(e) => handleNextStepEventSetup(e)}
          style={{
            display: "flex",
            padding: "12px 20px",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
            flex: "1 0 0",
            borderRadius: "8px",
            border: "1px solid var(--blue-dark-600, #155EEF)",
            background: "var(--blue-dark-600, #155EEF)",
            boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
            width: "100%",
          }}
        >
          <Typography
            textTransform={"none"}
            fontFamily={"Inter"}
            fontSize={"16px"}
            fontStyle={"normal"}
            fontWeight={600}
            lineHeight={"24px"}
            color={"var(--base-white, #FFF)"}
          >
            Next step
          </Typography>
        </Button>
      </Grid>
    </Grid >
  );
};

export default Form;