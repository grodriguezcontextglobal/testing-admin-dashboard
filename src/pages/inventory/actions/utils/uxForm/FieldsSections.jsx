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
  renderingOptionsForSubLocations,
  value,
  onChange,
}) => {
  return (
    <Grid
      container
      spacing={1}
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Grid item xs={12} sm={12} md={12} lg={12}>
        <AutoComplete
          aria-required={true}
          className="custom-autocomplete" // Add a custom className here
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
            typeof x === "string" ? { value: x } : x,
          )}
          placeholder={item.placeholder}
          allowClear
        />
        {renderingErrorMessage(errors[item.name])}
        {renderingOptionsButtons({
          watch,
          setOpenScanningModal,
          setOpenScannedItemView,
          manuallyAddingSerialNumbers,
          addingSubLocation,
          setAddSerialNumberField,
          label: item.label,
        })}
        {index < 2 && (
          <Divider margin="2.5px 0px 2.5px 0px" style={{ width: "100%" }} />
        )}
      </Grid>
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
        {renderingOptionsForSubLocations(item.label).removeAllSubLocations}
      </Grid>
    </Grid>
  );
};

export default FieldsSections;
