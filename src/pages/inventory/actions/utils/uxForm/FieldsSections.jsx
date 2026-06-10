import { Radio } from "antd";
// import { renderOptional } from "../BulkComponents";
import { renderingOptionsForSubLocations } from "../EditBulkComponents";
const FieldsSections = ({
  Grid,
  item,
  AutoComplete,
  AntSelectorStyle,
  errors,
  renderingErrorMessage,
  renderingOptionsButtons,
  watch,
  setOpenScanningModal,
  setOpenScannedItemView,
  manuallyAddingSerialNumbers,
  addingSubLocation,
  setAddSerialNumberField,
  index,
  Divider,
  // renderingOptionsForSubLocations,
  value,
  onChange,
  isChild = false, // Added isChild prop with a default value
}) => {
  const renderComponent = () => {
    if (item.htmlOption === 3) {
      return (
        <Radio.Group
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: "100%" }}
        >
          {item.options.map((option) => (
            <Radio key={option.value} value={option.value}>
              {option.label}
            </Radio>
          ))}
        </Radio.Group>
      );
    }
    return (
      <AutoComplete
        aria-required={true}
        className="custom-autocomplete"
        variant="outlined"
        style={{
          ...AntSelectorStyle,
          border: errors[item.name]
            ? "1px solid red"
            : "solid 0.3 var(--gray600)",
          fontFamily: "Inter",
          fontSize: "14px",
          width: "100%",
        }}
        value={value}
        onChange={(value) => onChange(value)}
        options={item.options?.map((x) =>
          typeof x === "string" ? { value: x } : x
        )}
        placeholder={item.placeholder}
        allowClear
      />
    );
  };

  return (
    <Grid
      container
      spacing={1}
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: isChild ? "10px" : "0", // Add margin bottom for child components
      }}
    >
      <Grid item xs={12} sm={12} md={12} lg={12}>
        {renderComponent()}
        {renderingErrorMessage(errors[item.name])}
        {!isChild &&
          renderingOptionsButtons({
            // Conditionally render buttons
            watch,
            setOpenScanningModal,
            setOpenScannedItemView,
            manuallyAddingSerialNumbers,
            addingSubLocation,
            setAddSerialNumberField,
            label: item.label,
          })}
        {!isChild &&
          index < 2 && ( // Conditionally render divider
            <Divider margin="2.5px 0px 2.5px 0px" style={{ width: "100%" }} />
          )}
      </Grid>
      {!isChild && ( // Conditionally render sub-location options
        <Grid
          display={
            item.label === "Main location" || item.label === "Sub location"
              ? "flex"
              : "none"
          }
          justifyContent={"flex-start"}
          alignItems={"center"}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          {renderingOptionsForSubLocations(item.label).addSubLocation}
          {renderingOptionsForSubLocations(item.label).removeAllSubLocations}        </Grid>
      )}
    </Grid>
  );
};

export default FieldsSections;
