const ItemForm = ({
  handleSubmit,
  register,
  itemQuery,
  selectOptions,
  onChange,
  checkIfSerialNumberExists,
  valueItemSelected,
  listOfLocations,
  removeItem,
  blockingButton,
  addingDeviceFromLocations,
  Subtitle,
  AntSelectorStyle,
  QuestionIcon,
  CheckIcon,
  BorderedCloseIcon,
  Tooltip,
  InputLabel,
  OutlinedInput,
  OutlinedInputStyle,
  LightBlueButton,
  LightBlueButtonText,
  CenteringGrid,
  RectangleBluePlusIcon,
  Typography,
  Select,
  Space,
  Chip,
  InputAdornment,
}) => {
  return (
    <form
      style={{
        width: "100%",
        justifyContent: "flex-start",
        alignItems: "center",
        textAlign: "left",
        padding: 0,
      }}
      onSubmit={handleSubmit(addingDeviceFromLocations)}
    >
      {/* <Typography style={{ ...Subtitle, margin: "0px auto 1rem" }}>
          Enter serial number range for <strong>{deviceTitle}</strong> to assign
          to this event.
        </Typography> */}
      <div style={{ margin: "0px auto 1rem", width: "100%" }}>
        <label style={{ ...Subtitle, margin: "0px auto 1rem" }}>
          Select location from where items will be added to inventory.
        </label>
        <Select
          className="custom-autocomplete"
          showSearch
          placeholder="Search item to add to inventory."
          optionFilterProp="children"
          style={{ ...AntSelectorStyle, width: "100%" }}
          onChange={onChange}
          options={selectOptions}
          loading={itemQuery.isLoading}
          virtual={true} // Enable virtual scrolling for better performance
          filterOption={(input, option) => {
            return option.key.toLowerCase().includes(input.toLowerCase());
          }}
          getPopupContainer={(triggerNode) => triggerNode.parentNode}
        />
      </div>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          textAlign: "left",
          gap: "10px",
        }}
      >
        <div
          style={{
            textAlign: "left",
            width: "100%",
            margin: "0.5rem 0",
          }}
        >
          <InputLabel style={{ marginBottom: "3px", width: "100%" }}>
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              style={{ ...Subtitle, fontWeight: 500, textWrap: "pretty" }}
            >
              <Tooltip title="The check icon means the serial number does exist in company's inventory. The x icon means the serial number does not exist in company's inventory.">
                Starting from serial number <QuestionIcon />
              </Tooltip>
            </Typography>
          </InputLabel>
          <OutlinedInput
            required
            {...register("serial_number")}
            style={OutlinedInputStyle}
            placeholder="e.g. 154580"
            endAdornment={
              <InputAdornment position="end">
                <span>
                  {checkIfSerialNumberExists() ? (
                    <CheckIcon />
                  ) : (
                    <BorderedCloseIcon />
                  )}
                </span>
              </InputAdornment>
            }
          />
        </div>
        <div
          style={{
            textAlign: "left",
            width: "100%",
            margin: "0.5rem 0",
          }}
        >
          <InputLabel style={{ marginBottom: "3px", width: "100%" }}>
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              style={{ ...Subtitle, fontWeight: 500, textWrap: "pretty" }}
            >
              Qty of devices from {valueItemSelected[0]?.location}
            </Typography>
          </InputLabel>
          <OutlinedInput
            required
            {...register("quantity", {
              required: true,
              requiredMessage: "Quantity is required",
            })}
            style={OutlinedInputStyle}
            placeholder="e.g. 150"
            inputProps={{ min: 0 }}
            type="number" // Better input type for quantities
          />
        </div>
      </div>
      <span style={{ width: "100%", textAlign: "right" }}>
        <p style={Subtitle}>
          series starts: {valueItemSelected?.start} - series ends:{" "}
          {valueItemSelected?.end}
        </p>
      </span>

      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          margin: "0.5rem 0",
          gap: "5px",
        }}
      >
        <Space size={[8, 16]} wrap>
          {listOfLocations.map((item, index) => (
            <Chip
              key={`${item.startingNumber}-${index}`}
              label={`${item.location || "Unknown"} - ${item.quantity}`}
              onDelete={() => removeItem(index)}
            />
          ))}
        </Space>
      </div>
      <div
        style={{
          textAlign: "left",
          width: "100%",
          margin: "0.5rem 0",
        }}
      >
        <InputLabel style={{ marginBottom: "3px", width: "100%" }}>
          <Typography
            textTransform={"none"}
            textAlign={"left"}
            style={{
              ...Subtitle,
              color: "transparent",
              fontWeight: 500,
              textWrap: "pretty",
            }}
          >
            Qty of devices from {valueItemSelected[0]?.location}
          </Typography>
        </InputLabel>
        <button
          disabled={blockingButton}
          type="submit"
          style={{
            ...LightBlueButton,
            ...CenteringGrid,
            display: blockingButton ? "none" : "flex",
            width: "100%",
          }}
        >
          <Typography textTransform="none" style={LightBlueButtonText}>
            <RectangleBluePlusIcon />
            &nbsp; Add qty from location
          </Typography>
        </button>
      </div>
    </form>
  );
};

export default ItemForm;
