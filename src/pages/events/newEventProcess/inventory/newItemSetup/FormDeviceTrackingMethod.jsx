import {
  Button,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { nanoid } from "@reduxjs/toolkit";
import { Divider, Select, Switch, Tooltip } from "antd";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
const options = [{ label: 'Permanent', value: 'Permanent' }, { label: 'Rent', value: 'Rent' }]
import '../../../../../styles/global/ant-select.css'

const FormDeviceTrackingMethod = ({
  selectedItem,
  setSelectedItem,
  listOfItems,
}) => {
  const { user } = useSelector((state) => state.admin);
  const displayCategoryPill = useRef(false);
  const displayGroupPill = useRef(false);
  const [consumerUses, setConsumerUses] = useState(true);
  const [valueSelection, setValueSelection] = useState(options[0]);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm();
  const key = useRef(nanoid(10));
  const onChange = (value) => {
    return setValueSelection(value);
  };
  const handleEventInfo = (data) => {
    if (String(data.startingNumber).length !== String(data.endingNumber).length) return alert(
      `The length of starting number and ending number does not match. Please verify the serial numbers. ${data.startingNumber} - ${data.endingNumber}`
    );

    setSelectedItem([
      ...selectedItem,
      {
        key: key.current,
        category: data.newCategory,
        group: data.newGroup,
        value: data.deviceValue,
        description: data.deviceDescription,
        ownership: "Permanent", //valueSelection,
        company: user.company,
        quantity: data.quantity,
        startingNumber: data.startingNumber,
        endingNumber: data.endingNumber,
        createdBy: user.email,
        dateCreated: `${new Date()}`,
        consumerUses: consumerUses,
        resume: `${data.newCategory} ${data.newGroup} ${data.deviceValue} ${data.quantity
          } ${data.deviceDescription} ${valueSelection} use:${consumerUses ? "for external use only" : "for internal use only"} ${new Date()} ${user.email} ${key.current}`,
        reference: 0,
      },

    ]);
    setValue("newCategory", "");
    setValue("deviceDescription", "");
    setValue("newGroup", "");
    setValue("quantity", "");
    setValue("deviceValue", "");
    setValue("endingNumber", "");
    setValue("startingNumber", "");
    setValueSelection(options[0])
    setConsumerUses(true)
    key.current = nanoid(10)
  };

  const categoryFound = useMemo(() => {
    if (watch("newCategory") !== "") {
      const result = new Set();
      for (let data of listOfItems) {
        result.add(data.category);
      }
      const finalResult = Array.from(result).find(
        (element) =>
          `${element}`.toLocaleLowerCase() ===
          `${watch("newCategory")}`.toLocaleLowerCase()
      );
      if (finalResult) {
        displayCategoryPill.current = true;
        return finalResult;
      }
      return null;
    }
  }, [watch("newCategory"), listOfItems, watch]);

  const groupFound = useMemo(() => {
    if (watch("newGroup") !== "") {
      const result = new Set();
      for (let data of listOfItems) {
        result.add(data.group);
      }
      const finalResult = Array.from(result).find(
        (element) =>
          `${element}`.toLowerCase() ===
          `${watch("newGroup")}`.toLocaleLowerCase()
      );
      if (finalResult) {
        displayGroupPill.current = true;
        return finalResult;
      }
      return null;
    }
  }, [watch("newGroup"), listOfItems, watch]);

  return (
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
      onSubmit={handleSubmit(handleEventInfo)}
      className="form"
    >
      <InputLabel
        id="eventName"
        style={{ marginBottom: "0.2rem", width: "100%" }}
      >
        <Typography
          textTransform={"none"}
          textAlign={"left"}
          fontFamily={"Inter"}
          fontSize={"20px"}
          fontStyle={"normal"}
          fontWeight={600}
          lineHeight={"30px"}
          color={"var(--gray-600, #475467)"}
        >
          New category details
        </Typography>
      </InputLabel>
      <Typography
        textTransform={"none"}
        textAlign={"left"}
        fontFamily={"Inter"}
        fontSize={"14px"}
        fontStyle={"normal"}
        fontWeight={400}
        lineHeight={"20px"}
        color={"var(--gray-600, #475467)"}
      >
        Devices serial numbers can be created by inputting a serial number base
        to define the category of device, and then a range from one number to
        another, depending on your inventory.
      </Typography>
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
              New category
            </Typography>
          </InputLabel>
          <OutlinedInput
            {...register("newCategory")}
            aria-invalid={errors.newCategory}
            style={{
              borderRadius: "12px",
              border: `${errors.newCategory && "solid 1px #004EEB"}`,
              margin: "0.1rem auto 1rem",
              width: "100%",
              background: "var(--base-white, #FFF)",
              boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
            }}
            placeholder="e.g. Electronic"
            fullWidth
          />
          {errors?.newCategory && (
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
              {errors.newCategory.type}
            </Typography>
          )}
          <div
            style={{
              textAlign: "left",
              width: "50%",
            }}
          >
            {watch("newCategory") !== "" && displayCategoryPill.current && (
              <Typography
                style={{
                  background: "#D1E0FF",
                  cursor: "pointer",
                  display: `${displayCategoryPill === null && "none"}`,
                }}
                border={"solid 1px #D1E0FF"}
                borderRadius={"12px"}
                marginY={1}
                padding={1}
                color={"var(--gray-700, #344054)"}
                fontFamily={"Inter"}
                fontSize={"14px"}
                fontStyle={"normal"}
                fontWeight={"500"}
                lineHeight={"20px"}
                onClick={() => {
                  setValue("newCategory", `${categoryFound}`);
                  displayCategoryPill.current = false;
                }}
              >
                {categoryFound}
              </Typography>
            )}
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
              fontFamily={"Inter"}
              fontSize={"14px"}
              fontStyle={"normal"}
              fontWeight={500}
              lineHeight={"20px"}
              color={"var(--gray-700, #344054)"}
            >
              New group
            </Typography>
          </InputLabel>
          <OutlinedInput
            {...register("newGroup")}
            aria-invalid={errors.newGroup}
            style={{
              borderRadius: "12px",
              border: `${errors.newGroup && "solid 1px #004EEB"}`,
              margin: "0.1rem auto 1rem",
              width: "100%",
              background: "var(--base-white, #FFF)",
              boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
            }}
            placeholder="e.g. Laptop"
            fullWidth
          />
          {errors?.newGroup && (
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
              {errors.newGroup.type}
            </Typography>
          )}
          <div
            style={{
              textAlign: "left",
              width: "50%",
            }}
          >
            {watch("newGroup") !== "" && displayGroupPill.current && (
              <Typography
                style={{
                  background: "#D1E0FF",
                  cursor: "pointer",
                  display: `${displayGroupPill.current && "none"}`,
                }}
                border={"solid 1px #D1E0FF"}
                borderRadius={"12px"}
                marginY={1}
                padding={1}
                color={"var(--gray-700, #344054)"}
                fontFamily={"Inter"}
                fontSize={"14px"}
                fontStyle={"normal"}
                fontWeight={"500"}
                lineHeight={"20px"}
                onClick={() => {
                  setValue("newGroup", `${groupFound}`);
                  displayGroupPill.current = false;
                }}
              >
                {groupFound}
              </Typography>
            )}
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
              Value of each device
            </Typography>
          </InputLabel>
          <OutlinedInput
            {...register("deviceValue", { required: true })}
            aria-invalid={errors.deviceValue}
            style={{
              borderRadius: "12px",
              border: `${errors.deviceValue && "solid 1px #004EEB"}`,
              margin: "0.1rem auto 1rem",
              display: "flex",
              width: "100%",
              justifyContent: "flex-start",
              background: "var(--base-white, #FFF)",
              boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
            }}
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
          />
          {errors?.deviceValue && (
            <Typography>{errors.deviceValue.type}</Typography>
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
              Quantity
            </Typography>
          </InputLabel>
          <OutlinedInput
            {...register("quantity", { required: true })}
            aria-invalid={errors.deviceQuantity}
            style={{
              borderRadius: "12px",
              border: `${errors.deviceQuantity && "solid 1px #004EEB"}`,
              margin: "0.1rem auto 1rem",
              display: "flex",
              width: "100%",
              justifyContent: "flex-start",
              background: "var(--base-white, #FFF)",
              boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
            }}
            placeholder="e.g. 300"
          />
          {errors?.deviceQuantity && (
            <Typography>{errors.deviceQuantity.type}</Typography>
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
            Description of the device
          </Typography>
        </InputLabel>
        <OutlinedInput
          multiline
          minRows={5}
          {...register("deviceDescription", { required: true })}
          aria-invalid={errors.deviceDescription}
          style={{
            borderRadius: "12px",
            border: `${errors.deviceDescription && "solid 1px #004EEB"}`,
            margin: "0.1rem auto 1rem",
            display: "flex",
            width: "100%",
            justifyContent: "flex-start",
            background: "var(--base-white, #FFF)",
            boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
          }}
          placeholder="Please provide a brief description of the new device to be added."
        />
        {errors?.deviceDescription && (
          <Typography>{errors.deviceDescription.type}</Typography>
        )}
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
            {...register("startingNumber")}
            aria-invalid={errors.startingNumber}
            style={{
              borderRadius: "12px",
              border: `${errors.startingNumber && "solid 1px #004EEB"}`,
              margin: "0.1rem auto 1rem",
              width: "100%",
              background: "var(--base-white, #FFF)",
              boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
            }}
            placeholder="e.g. 0001"
            fullWidth
          />
          {errors?.startingNumber && (
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
              {errors.startingNumber.type}
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
              To ending number
            </Typography>
          </InputLabel>
          <OutlinedInput
            {...register("endingNumber")}
            aria-invalid={errors.endingNumber}
            style={{
              borderRadius: "12px",
              border: `${errors.endingNumber && "solid 1px #004EEB"}`,
              margin: "0.1rem auto 1rem",
              width: "100%",
              background: "var(--base-white, #FFF)",
              boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
            }}
            placeholder="e.g. 1000"
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
          <Tooltip title={`${consumerUses ? "" : "You've checked this item for internal use."}`} color={'#ff0000'}>
            <Switch
              checkedChildren="Consumers"
              unCheckedChildren="Internal use"
              defaultChecked
              onChange={() => setConsumerUses(!consumerUses)}
              style={{
                background: `${consumerUses ? "#1677ff" : "#ff0000"}`
              }}
            />
          </Tooltip>
        </div>
        <div
          style={{
            textAlign: "right",
            width: "50%",
          }}
        >
          <Select
          className="custom-autocomplete"
            showSearch
            style={{
              height: "16.5px",
              display: "flex",
              alignItems: "center"
            }}
            placeholder="Select an option"
            optionFilterProp="children"
            onChange={onChange}
            filterOption={(input, option) => (option?.label ?? '').includes(input)}
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
            }
            options={options}
          />
        </div>
      </div>


      <Button
        type="submit"
        style={{
          display: "flex",
          padding: "12px 20px",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
          alignSelf: "stretch",
          border: "1px solid var(--gray-300, #D0D5DD)",
          borderRadius: "8px",
          background: "var(--base-white, #FFF)",
          boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
          margin: "1.5dvh 0",
        }}
      >
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
          Add item
        </Typography>
      </Button>
    </form>
  );
};

export default FormDeviceTrackingMethod;
