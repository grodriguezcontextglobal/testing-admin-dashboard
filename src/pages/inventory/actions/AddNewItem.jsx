import { Icon } from "@iconify/react";
import {
  Button,
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography
} from "@mui/material";
import { Divider, Select, notification } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { formatDate } from "../utils/dateFormat";
import '../../../styles/global/OutlineInput.css'
import '../../../styles/global/ant-select.css'
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import { AntSelectorStyle } from "../../../styles/global/AntSelectorStyle";
const options = [{ value: 'Permanent' }, { value: 'Rent' }, { value: 'Sale' }]
const AddNewItem = () => {
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
    api[type]({
      message: msg,
    });
  };
  const [valueSelection, setValueSelection] = useState(options[0]);

  const onChange = (value) => {
    return setValueSelection(value);
  };
  const savingNewItem = async (data) => {
    try {
      const respNewItem = await devitrakApi.post("/db_item/new_item", {
        category_name: data.category_name,
        item_group: data.item_group,
        cost: data.cost,
        descript_item: data.descript_item,
        ownership: valueSelection,
        serial_number: data.serial_number,
        warehouse: true,
        created_at: formatDate(new Date()),
        updated_at: formatDate(new Date()),
        company: user.company
      });
      if (respNewItem.data.ok) {
        setValue("category_name", "");
        setValue("item_group", "");
        setValue("cost", "");
        setValue("descript_item", "");
        setValue("ownership", "");
        setValue("serial_number", "")

        setValueSelection(options[0]);
        openNotificationWithIcon(
          "success",
          "New item was created and stored in database."
        );
        setTimeout(() => {
          navigate("/inventory");
        }, 3000);
      }

    } catch (error) {
      console.log("🚀 ~ file: AddNewItem.jsx:138 ~ savingNewItem ~ error:", error)
      openNotificationWithIcon('error', `${error.message}`)
    }
  };
  return (
    <Grid
      // margin={'15dvh auto 0'}
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
      container
    >
      {contextHolder}
      {/* <Grid
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
        margin={"auto"}
        flexWrap={"wrap"}
        item
        xs={10}
      > */}
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
          <InputLabel
            id="eventName"
            style={{ marginBottom: "6px", width: "100%" }}
          >
            <Typography
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
              textTransform={"none"}
              style={TextFontSize20LineHeight30}
              color={"var(--gray-600, #475467)"}
            >
              You can enter all the details manually or use a scanner to enter the serial number.
            </Typography>
          </InputLabel>
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
              >
              </div>
            </div>
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
                  Group
                </Typography>
              </InputLabel>
              <OutlinedInput
                {...register("item_group")}
                aria-invalid={errors.item_group}
                style={OutlinedInputStyle}
                placeholder="e.g. Laptop"
                fullWidth
              />
              {errors?.item_group && (
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
                  {errors.item_group.type}
                </Typography>
              )}
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
              {errors?.cost && (
                <Typography>{errors.cost.type}</Typography>
              )}
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
              multiline
              minRows={5}
              {...register("descript_item", { required: true })}
              fullWidth
              aria-invalid={errors.descript_item}
              style={{
                borderRadius: '8px',
                backgroundColor: '#fff',
                color: '#000',
                verticalAlign: 'center',
                boxShadow: '1px 1px 2px rgba(16, 24, 40, 0.05)',
                outline: 'none',
              }}
              placeholder="Please provide a brief description of the new device to be added."
            />
            {errors?.descript_item && (
              <Typography>{errors.descript_item.type}</Typography>
            )}
          </div>
          <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
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
                style={{...AntSelectorStyle, width:"100%"}}
                placeholder="Select an option"
                optionFilterProp="children"
                onChange={onChange}
                filterOption={(input, option) => (option?.label ?? '').includes(input)}
                filterSort={(optionA, optionB) =>
                  (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
                }
                options={options}
              />            </InputLabel>


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
              </Link></div>
            <div
              style={{
                textAlign: "right",
                width: "50%",
              }}
            ><Button
              type="submit"
              style={{
                width: "100%",
                border: "1px solid var(--blue-dark-600, #155EEF)",
                borderRadius: "8px",
                background: "var(--blue-dark-600, #155EEF)",
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
              </Button></div>
          </div>
        </form>
      {/* </Grid> */}
    </Grid >
  );
};

export default AddNewItem;