import { Grid, InputLabel, Typography } from "@mui/material";
import { AutoComplete, Breadcrumb, Divider, Tooltip } from "antd";
import { Controller } from "react-hook-form";
import { QuestionIcon } from "../../../../../../components/icons/QuestionIcon";
import Chip from "../../../../../../components/UX/Chip/Chip";
import { AntSelectorStyle } from "../../../../../../styles/global/AntSelectorStyle";
import { ImagePreviewClickable } from "../../../../../../components/UX/image/Preview";
import {
  gripingFields,
  renderingOptionsButtons,
  renderOptional,
  stylingComponents,
} from "../../../utils/BulkComponents";
import FieldsSections from "../../../utils/uxForm/FieldsSections";
import ImageUploaderComponent from "../../../utils/uxForm/ImageUploaderComponent";

const renderingErrorMessage = (error) => {
  if (!error) return null;
  return (
    <Typography variant="body2" color="error" style={{ textAlign: "left", marginTop: "1rem" }}>
      {error.message}
    </Typography>
  );
};

/**
 * Renders one section's worth of fields (from BulkItemsFields.jsx, grouped
 * by `section`) inside a wizard step. Shared by the Details, Location and
 * Ownership steps, which are the three that render plain react-hook-form
 * fields — Units and Review do not.
 */
const FieldGrid = ({
  fields,
  addingSubLocation,
  control,
  errors,
  imageUploadedValue,
  imageUrlGenerated,
  isRented,
  loadingStatus,
  manuallyAddingSerialNumbers,
  register,
  returningDate,
  setAddSerialNumberField,
  setImageUploadedValue,
  setOpenScannedItemView,
  setOpenScanningModal,
  setReturningDate,
  setSubLocationsSubmitted,
  subLocationsSubmitted,
  watch,
}) => {
  const renderField = (item, index) => {
    if (item.htmlOption === 6 && item.name === "image_uploader") {
      return (
        <Grid key={item.name} marginBottom={2.5} item xs={12} sm={12} md={gripingFields(item.name)} lg={gripingFields(item.name)}>
          <ImageUploaderComponent
            item={item}
            gripingFields={gripingFields}
            stylingComponents={stylingComponents}
            loadingStatus={loadingStatus}
            setImageUploadedValue={setImageUploadedValue}
            QuestionIcon={QuestionIcon}
          />
          <InputLabel style={{ marginBottom: "1rem", width: "100%", display: imageUploadedValue ? "block" : "none" }}>
            <Tooltip placement="top" title={item.tooltipMessage} style={{ width: "100%" }}>
              <Typography style={stylingComponents({ loadingStatus }).styling}>
                {item.label} <strong>*</strong> {item.tooltip && <QuestionIcon />}
              </Typography>
            </Tooltip>
            <div>
              <img
                src={imageUrlGenerated || ""}
                alt="image_preview"
                style={{ objectFit: "cover", objectPosition: "center", aspectRatio: "1/1" }}
                width={150}
              />
            </div>
          </InputLabel>
        </Grid>
      );
    }
    if (item.htmlOption === 6 && item.name === "image_uploader_preview") {
      return (
        <ImagePreviewClickable key="preview" imageUrlGenerated={imageUploadedValue} width={150} items={[imageUploadedValue]} />
      );
    }
    return (
      <Grid key={item.name} style={{ textAlign: "left" }} marginY={1} item xs={12} sm={12} md={gripingFields(item.name)} lg={gripingFields(item.name)}>
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          <Tooltip placement="top" title={item.tooltipMessage} style={{ width: "100%" }}>
            <Typography style={stylingComponents({ loadingStatus }).styling}>
              {item.label} <strong>*</strong> {item.tooltip && <QuestionIcon />}
            </Typography>
          </Tooltip>
        </InputLabel>
        {item.htmlElement.length < 1 ? (
          <Controller
            control={control}
            name={item.name}
            rules={item.required ? { required: `${item.label || "This field"} is required` } : {}}
            render={({ field: { value, onChange } }) => (
              <>
                <FieldsSections
                  Grid={Grid}
                  item={item}
                  AutoComplete={AutoComplete}
                  AntSelectorStyle={AntSelectorStyle}
                  errors={errors}
                  renderingErrorMessage={renderingErrorMessage}
                  renderingOptionsButtons={renderingOptionsButtons}
                  watch={watch}
                  setOpenScanningModal={setOpenScanningModal}
                  setOpenScannedItemView={setOpenScannedItemView}
                  manuallyAddingSerialNumbers={manuallyAddingSerialNumbers}
                  addingSubLocation={addingSubLocation}
                  setAddSerialNumberField={setAddSerialNumberField}
                  index={index}
                  Divider={Divider}
                  subLocationsSubmitted={subLocationsSubmitted}
                  setSubLocationsSubmitted={setSubLocationsSubmitted}
                  value={value}
                  onChange={onChange}
                />
                <Grid
                  item
                  xs={12}
                  sm={12}
                  md={12}
                  lg={12}
                  style={{ display: item.name === "sub_location" && subLocationsSubmitted.length > 0 ? "block" : "none" }}
                >
                  <Breadcrumb
                    items={[
                      { title: <p style={{ margin: "auto", padding: 0, width: "fit-content" }}>{watch("location")}</p> },
                      ...subLocationsSubmitted.map((subLocation, subIndex) => ({
                        title: (
                          <Chip
                            variant="ghost"
                            style={{ margin: 0, padding: 0, alignItems: "flex-start" }}
                            label={subLocation}
                            onDelete={() =>
                              setSubLocationsSubmitted(subLocationsSubmitted.filter((_, i) => i !== subIndex))
                            }
                          />
                        ),
                      })),
                    ]}
                  />
                </Grid>
              </>
            )}
          />
        ) : (
          renderOptional({ props: item.htmlElement, watch, register, errors, returningDate, setReturningDate })
        )}
        {item.name === "ownership" && item.children && (
          <div
            style={{
              display: isRented ? "flex" : "none",
              gap: "12px",
              padding: "14px 16px",
              borderRadius: "8px",
              border: "1px solid var(--action-100, #d1e0ff)",
              background: "var(--action-50, #eff4ff)",
              marginTop: "16px",
              width: "100%",
            }}
          >
            <div style={{ width: "100%" }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--blue-700, #175cd3)", mb: 1.5 }}>
                Rented equipment needs a return date and a vendor
              </Typography>
              <Grid container spacing={2}>
                {item.children.map((child) => {
                  if (!child.displayField) return null;
                  return (
                    <Grid key={child.name || child.label} style={{ textAlign: "left" }} item xs={12} sm={6}>
                      <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                        <Tooltip placement="top" title={child.tooltipMessage} style={{ width: "100%" }}>
                          <Typography style={stylingComponents({ loadingStatus }).styling}>
                            {child.label} <strong>*</strong> {child.tooltip && <QuestionIcon />}
                          </Typography>
                        </Tooltip>
                      </InputLabel>
                      {child.htmlElement.length < 1 ? (
                        <Controller
                          control={control}
                          name={child.name}
                          rules={child.required ? { required: `${child.label || "This field"} is required` } : {}}
                          render={({ field: { value, onChange } }) => (
                            <FieldsSections
                              Grid={Grid}
                              item={child}
                              AutoComplete={AutoComplete}
                              AntSelectorStyle={AntSelectorStyle}
                              errors={errors}
                              renderingErrorMessage={renderingErrorMessage}
                              watch={watch}
                              value={value}
                              onChange={onChange}
                              isChild
                            />
                          )}
                        />
                      ) : (
                        renderOptional({ props: child.htmlElement, watch, register, errors, returningDate, setReturningDate })
                      )}
                    </Grid>
                  );
                })}
              </Grid>
            </div>
          </div>
        )}
        {item.name === "container" && item.children && (
          <>
            {item.children.map((child) => {
              if (!child.displayField) return null;
              return (
                <Grid key={child.name} style={{ textAlign: "left" }} marginY={1} item xs={12} sm={12} md={12} lg={12}>
                  <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                    <Tooltip placement="top" title={child.tooltipMessage} style={{ width: "100%" }}>
                      <Typography style={stylingComponents({ loadingStatus }).styling}>
                        {child.label} <strong>*</strong> {child.tooltip && <QuestionIcon />}
                      </Typography>
                    </Tooltip>
                  </InputLabel>
                  {child.htmlElement.length < 1 ? (
                    <Controller
                      control={control}
                      name={child.name}
                      rules={child.required ? { required: `${child.label || "This field"} is required` } : {}}
                      render={({ field: { value, onChange } }) => (
                        <FieldsSections
                          Grid={Grid}
                          item={child}
                          AutoComplete={AutoComplete}
                          AntSelectorStyle={AntSelectorStyle}
                          errors={errors}
                          renderingErrorMessage={renderingErrorMessage}
                          watch={watch}
                          value={value}
                          onChange={onChange}
                          isChild
                        />
                      )}
                    />
                  ) : (
                    renderOptional({ props: child.htmlElement, watch, register, errors, returningDate, setReturningDate })
                  )}
                </Grid>
              );
            })}
          </>
        )}
      </Grid>
    );
  };

  return (
    <Grid container spacing={1}>
      {fields.map((item, index) => renderField(item, index))}
    </Grid>
  );
};

export default FieldGrid;
