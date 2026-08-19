import { Grid, InputLabel, Typography } from "@mui/material";
import { AutoComplete, Breadcrumb, Divider, Tooltip } from "antd";
import { groupBy } from "lodash";
import { Controller } from "react-hook-form";
import { QuestionIcon } from "../../../../../../components/icons/QuestionIcon";
import BadgeWithDot from "../../../../../../components/base/badges/badges";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import Chip from "../../../../../../components/UX/Chip/Chip";
import { ImagePreviewClickable } from "../../../../../../components/UX/image/Preview";
import { AntSelectorStyle } from "../../../../../../styles/global/AntSelectorStyle";
import {
  gripingFieldsUpdateFN,
  renderingOptionsButtons,
  renderOptional,
  stylingComponents,
} from "../../../utils/BulkComponents";
import { renderFields } from "../../../utils/EditBulkFields";
import ImageUploaderComponent from "../../../utils/uxForm/ImageUploaderComponent";
import FieldsSections from "../../../utils/uxForm/FieldsSections";
import { formatTrackedFieldValue } from "../../../utils/updateInventoryMatchSummary";

const SECTIONS = [
  { key: "identity", title: "Identity", hint: "What the item is called across the app" },
  { key: "commercial", title: "Commercial", hint: "Cost, ownership and where the units came from" },
  { key: "location", title: "Location", hint: "Where the units live and where they are taxed" },
  { key: "handling", title: "Handling", hint: "How the units can be packed and handed out" },
  { key: "photo", title: "Photo", hint: "Shared by every unit in the group" },
];

/**
 * Step 3: what changes on the matched/selected items. Every field prefills
 * from the group's representative value (set in step 1's Continue, via the
 * existing handleSearchByReference()) — this step only reorganizes those
 * same fields into sections and makes two things visible that the old single
 * form never showed: which fields the group actually disagrees on today, and
 * which ones this session has changed so far.
 */
const EditFieldsStep = ({
  addingSubLocation,
  control,
  displayContainerSplotLimitField,
  displayPreviewImage,
  errors,
  handleSubmit,
  imageUploadedValue,
  isRented,
  loadingStatus,
  manuallyAddingSerialNumbers,
  matchSummary,
  options,
  OutlinedInputStyle,
  register,
  renderingOptionsForSubLocations,
  renderLocationOptions,
  retrieveItemOptions,
  returningDate,
  setAddSerialNumberField,
  setImageUploadedValue,
  setOpenScannedItemView,
  setOpenScanningModal,
  setReturningDate,
  setSubLocationsSubmitted,
  subLocationsOptions,
  subLocationsSubmitted,
  suppliersOptions,
  watch,
  goBack,
  goNext,
}) => {
  const renderingErrorMessage = (error) => {
    if (!error) return null;
    return (
      <Typography variant="body2" color="error" style={{ textAlign: "left", marginTop: "1rem" }}>
        {error.message}
      </Typography>
    );
  };

  const fields = renderFields({
    displayContainerSplotLimitField,
    displayPreviewImage,
    isRented,
    options,
    OutlinedInputStyle,
    renderLocationOptions,
    retrieveItemOptions,
    subLocationsOptions,
    suppliersOptions,
  }).filter((item) => item.displayField);

  const grouped = groupBy(fields, "section");

  const changeBadge = (name) => {
    const info = matchSummary?.fields?.[name];
    if (!info) return null;
    // sub_location is staged into subLocationsSubmitted (a path of chips) —
    // the plain form field is only the transient "next segment to add" box,
    // so it is never the value that actually gets submitted.
    const current =
      name === "sub_location" ? subLocationsSubmitted : watch(name);
    const changed =
      (formatTrackedFieldValue(name, current) ?? "") !==
      (formatTrackedFieldValue(name, info.value) ?? "");
    if (changed) {
      return (
        <BadgeWithDot color="blue" style={{ marginLeft: "6px" }}>
          Changed
        </BadgeWithDot>
      );
    }
    if (info.mixed) {
      return (
        <BadgeWithDot color="warning" style={{ marginLeft: "6px" }}>
          {info.distinctCount} values in the group
        </BadgeWithDot>
      );
    }
    return null;
  };

  const renderField = (item, index) => {
    if (item.htmlOption === 6 && item.name === "image_uploader") {
      return (
        <Grid key={item.name} item xs={12} sm={12} md={gripingFieldsUpdateFN(item.name)} lg={gripingFieldsUpdateFN(item.name)}>
          <ImageUploaderComponent
            item={item}
            gripingFields={gripingFieldsUpdateFN}
            stylingComponents={stylingComponents}
            loadingStatus={loadingStatus}
            setImageUploadedValue={setImageUploadedValue}
            QuestionIcon={QuestionIcon}
          />
          <InputLabel style={{ marginBottom: "0.2rem", width: "100%", display: imageUploadedValue ? "block" : "none" }}>
            <Tooltip placement="top" title={item.tooltipMessage} style={{ width: "100%" }}>
              <Typography style={stylingComponents({ loadingStatus }).styling}>
                {item.label} {item.required && <strong>*</strong>} {item.tooltip && <QuestionIcon />}
              </Typography>
            </Tooltip>
            <div>
              <img
                src={imageUploadedValue || ""}
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
      return <ImagePreviewClickable key="preview" imageUrlGenerated={imageUploadedValue} width={150} />;
    }
    return (
      <Grid
        key={item.name}
        style={{ textAlign: "left" }}
        marginY={1}
        item
        xs={12}
        sm={12}
        md={gripingFieldsUpdateFN(item.name)}
        lg={gripingFieldsUpdateFN(item.name)}
      >
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          <Tooltip placement="top" title={item.tooltipMessage} style={{ width: "100%" }}>
            <Typography style={stylingComponents({ loadingStatus }).styling}>
              {item.label} {item.required && <strong>*</strong>} {item.tooltip && <QuestionIcon />}
              {changeBadge(item.name)}
            </Typography>
          </Tooltip>
        </InputLabel>
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
                renderingOptionsForSubLocations={renderingOptionsForSubLocations}
                value={value}
                onChange={onChange}
              />
              <Grid item xs={12} sm={12} md={12} lg={12}>
                <Breadcrumb
                  style={{
                    display: item.name === "sub_location" && subLocationsSubmitted.length > 0 ? "block" : "none",
                    width: "100%",
                  }}
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
        {item.children &&
          item.children.map((child) => {
            if (!child.displayField) return null;
            return (
              <Grid key={child.name || child.label} style={{ textAlign: "left" }} marginY={1} item xs={12} sm={12} md={12} lg={12}>
                <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                  <Tooltip placement="top" title={child.tooltipMessage} style={{ width: "100%" }}>
                    <Typography style={stylingComponents({ loadingStatus }).styling}>
                      {child.label} {child.required && <strong>*</strong>} {child.tooltip && <QuestionIcon />}
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
    );
  };

  return (
    <div style={{ background: "#fff", border: "1px solid var(--gray-200, #eaecf0)", borderRadius: "12px", boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)" }}>
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--gray-200, #eaecf0)" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          What changes on these {matchSummary?.matchCount ?? 0} items?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Everything starts on the value the group has today. Whatever you do not touch stays the way it is.
        </Typography>
      </div>

      {SECTIONS.map(({ key, title, hint }) => {
        const sectionFields = grouped[key];
        if (!sectionFields || sectionFields.length === 0) return null;
        return (
          <div key={key} style={{ padding: "20px 24px", borderBottom: "1px solid var(--gray-200, #eaecf0)" }}>
            <div style={{ marginBottom: "16px" }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{title}</Typography>
              <Typography variant="body2" color="text.secondary">{hint}</Typography>
            </div>
            <Grid container spacing={1}>
              {sectionFields.map((item, index) => renderField(item, index))}
            </Grid>
          </div>
        );
      })}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px" }}>
        <GrayButtonComponent title="Back" buttonType="button" func={goBack} />
        <BlueButtonComponent title="Review changes" buttonType="button" func={handleSubmit(goNext)} />
      </div>
    </div>
  );
};

export default EditFieldsStep;
