import { Grid, InputLabel, Typography } from "@mui/material";
import { AutoComplete, Breadcrumb, Divider, Tooltip } from "antd";
import { Controller } from "react-hook-form";
import { renderFields } from "../../../../../inventory/actions/utils/BulkItemsFields";
import { gripingFields, renderingOptionsButtons, renderOptional, stylingComponents } from "../../../../../inventory/actions/utils/BulkComponents";
import ImageUploaderComponent from "../../../../../inventory/actions/utils/uxForm/imageUploaderComponent";
import { QuestionIcon } from "../../../../../../components/icons/QuestionIcon";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import { CheckIcon } from "../../../../../../components/icons/CheckIcon";
import FieldsSections from "../../../../../inventory/actions/utils/uxForm/FieldsSections";
import { BlueButton } from "../../../../../../styles/global/BlueButton";
import { AntSelectorStyle } from "../../../../../../styles/global/AntSelectorStyle";
import Chip from "../../../../../../components/UX/Chip/Chip";
import SerialNumberAndMoreInfoComponentForm from "../../../../../inventory/actions/utils/uxForm/SerialNumberAndMoreInfoComponentForm";
import ButtonsForm from "../../../../../inventory/actions/utils/uxForm/ButtonsForm";

const BulkRentedItems = ({
  acceptImage,
  addingSubLocation,
  addSerialNumberField,
  allSerialNumbersOptions,
  control,
  displayContainerSplotLimitField,
  displayPreviewImage,
  displaySublocationFields,
  errors,
  handleSubmit,
  imageUploadedValue,
  imageUrlGenerated,
  isRented,
  labeling,
  loadingStatus,
  manuallyAddingSerialNumbers,
  moreInfo,
  moreInfoDisplay,
  options,
  OutlinedInputStyle,
  rangeFormat,
  register,
  renderingOptionsForSubLocations,
  renderLocationOptions,
  retrieveItemOptions,
  returningDate,
  savingNewItem,
  scannedSerialNumbers,
  setAddSerialNumberField,
  setImageUploadedValue,
  setMoreInfo,
  setOpenScannedItemView,
  setOpenScanningModal,
  setReturningDate,
  setScannedSerialNumbers,
  setSubLocationsSubmitted,
  subLocationsOptions,
  subLocationsSubmitted,
  suppliersOptions,
  watch,
}) => {
  const renderingErrorMessage = (error) => {
    if (error) {
      return (
        <Typography
          variant="body2"
          color="error"
          style={{ textAlign: "left", marginTop: "1rem" }}
        >
          {error.message}
        </Typography>
      );
    }
    return null;
  };

  return (
    <form onSubmit={handleSubmit(savingNewItem)}>
      <Grid container spacing={1}>
        {renderFields({
          retrieveItemOptions,
          OutlinedInputStyle,
          renderLocationOptions,
          options,
          displayContainerSplotLimitField,
          subLocationsOptions,
          suppliersOptions,
          displaySublocationFields,
          addSerialNumberField,
          rangeFormat,
          labeling,
          loadingStatus,
          setImageUploadedValue,
          renderingOptionsForSubLocations,
          isRented,
          displayPreviewImage,
          allSerialNumbersOptions,
        }).map((item, index) => {
          if (item.displayField) {
            if (item.htmlOption === 6 && item.name === "image_uploader") {
              return (
                <Grid
                  key={item.name}
                  item
                  xs={12}
                  sm={12}
                  md={gripingFields(item.name)}
                  lg={gripingFields(item.name)}
                >
                  <ImageUploaderComponent
                    item={item}
                    gripingFields={gripingFields}
                    stylingComponents={stylingComponents}
                    loadingStatus={loadingStatus}
                    setImageUploadedValue={setImageUploadedValue}
                    QuestionIcon={QuestionIcon}
                  />
                  <InputLabel
                    style={{
                      marginBottom: "0.2rem",
                      width: "100%",
                      display: imageUploadedValue ? "block" : "none",
                    }}
                  >
                    <Tooltip
                      placement="top"
                      title={item.tooltipMessage}
                      style={{
                        width: "100%",
                      }}
                    >
                      <Typography
                        style={stylingComponents({ loadingStatus }).styling}
                      >
                        {item.label} <strong>*</strong>{" "}
                        {item.tooltip && <QuestionIcon />}
                      </Typography>
                    </Tooltip>
                    <div>
                      <img
                        src={imageUploadedValue || ""}
                        alt="image_preview"
                        style={{
                          objectFit: "cover",
                          objectPosition: "center",
                          aspectRatio: "1/1",
                        }}
                        width={150}
                      />{" "}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          width: "100%",
                          marginTop: "1rem",
                          gap: "1rem",
                        }}
                      >
                        <BlueButtonComponent
                          disabled={imageUrlGenerated}
                          func={() => acceptImage()}
                          style={{
                            background: imageUrlGenerated
                              ? "transparent"
                              : BlueButton.background,
                          }}
                          icon={
                            imageUrlGenerated ? (
                              <CheckIcon stroke="#fff" />
                            ) : null
                          }
                          title={
                            imageUrlGenerated
                              ? "Image accepted"
                              : "Accept image"
                          }
                        />
                      </div>
                    </div>
                  </InputLabel>
                </Grid>
              );
            } else if (
              item.htmlOption === 6 &&
              item.name === "image_uploader_preview"
            ) {
              return (
                <Grid
                  key={item.name}
                  style={{
                    textAlign: "left",
                    display:
                      imageUploadedValue ||
                      String(watch("image_url")).startsWith(
                        "https://res.cloudinary",
                      )
                        ? "flex"
                        : "none",
                  }}
                  marginY={1}
                  item
                  xs={12}
                  sm={12}
                  md={gripingFields(item.name)}
                  lg={gripingFields(item.name)}
                ></Grid>
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
                md={gripingFields(item.name)}
                lg={gripingFields(item.name)}
              >
                <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                  <Tooltip
                    placement="top"
                    title={item.tooltipMessage}
                    style={{
                      width: "100%",
                    }}
                  >
                    <Typography
                      style={
                        stylingComponents({
                          loadingStatus,
                        }).styling
                      }
                    >
                      {item.label} <strong>*</strong>{" "}
                      {item.tooltip && <QuestionIcon />}
                    </Typography>
                  </Tooltip>
                </InputLabel>
                {item.htmlElement.length < 1 ? (
                  <Controller
                    control={control}
                    name={item.name}
                    rules={
                      item.required
                        ? {
                            required: `${
                              item.label || "This field"
                            } is required`,
                          }
                        : {}
                    }
                    render={({ field: { value, onChange } }) => {
                      return (
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
                            manuallyAddingSerialNumbers={
                              manuallyAddingSerialNumbers
                            }
                            addingSubLocation={addingSubLocation}
                            setAddSerialNumberField={setAddSerialNumberField}
                            index={index}
                            Divider={Divider}
                            renderingOptionsForSubLocations={
                              renderingOptionsForSubLocations
                            }
                            Breadcrumb={Breadcrumb}
                            displaySublocationFields={displaySublocationFields}
                            Chip={Chip}
                            setSubLocationsSubmitted={setSubLocationsSubmitted}
                            subLocationsSubmitted={subLocationsSubmitted}
                            value={value}
                            onChange={onChange}
                          />
                          <Grid item xs={12} sm={12} md={12} lg={12}>
                            <Breadcrumb
                              style={{
                                display:
                                  item.name === "sub_location" &&
                                  subLocationsSubmitted.length > 0
                                    ? "block"
                                    : "none",
                                width: "100%",
                              }}
                              items={[
                                {
                                  title: (
                                    <p
                                      style={{
                                        backgroundColor: "transparent",
                                        border: "none",
                                        outline: "none",
                                        boxShadow: "none",
                                        margin: "auto",
                                        padding: 0,
                                        fontFamily: "Inter",
                                        width: "fit-content",
                                      }}
                                    >
                                      {watch("location")}
                                    </p>
                                  ),
                                },
                                ...subLocationsSubmitted.map(
                                  (subLocation, index) => {
                                    return {
                                      title: (
                                        <Chip
                                          variant="ghost"
                                          style={{
                                            margin: 0,
                                            padding: 0,
                                            alignItems: "flex-start",
                                          }}
                                          label={subLocation}
                                          onDelete={() =>
                                            setSubLocationsSubmitted(
                                              subLocationsSubmitted.filter(
                                                (_, i) => i !== index,
                                              ),
                                            )
                                          }
                                        />
                                      ),
                                    };
                                  },
                                ),
                              ]}
                            />
                          </Grid>
                        </>
                      );
                    }}
                  />
                ) : (
                  renderOptional({
                    props: item.htmlElement,
                    watch,
                    register,
                    errors,
                    returningDate,
                    setReturningDate,
                  })
                )}{" "}
              </Grid>
            );
          }
        })}
      </Grid>
      <SerialNumberAndMoreInfoComponentForm
        style={{
          ...AntSelectorStyle,
          fontFamily: "Inter",
          fontSize: "14px",
          width: "100%",
        }}
        moreInfo={moreInfo}
        scannedSerialNumbers={scannedSerialNumbers}
        setMoreInfo={setMoreInfo}
        setScannedSerialNumbers={setScannedSerialNumbers}
      />
      <ButtonsForm
        stylingComponents={stylingComponents}
        loadingStatus={loadingStatus}
        moreInfoDisplay={moreInfoDisplay}
        primaryButtonTitle="Save and Continue"
        backLink={'/create-event-page/document-detail'}
      />
    </form>
  );
};

export default BulkRentedItems;
