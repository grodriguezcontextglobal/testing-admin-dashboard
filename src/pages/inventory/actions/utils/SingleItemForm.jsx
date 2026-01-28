import { Grid, InputLabel, Typography } from "@mui/material";
import { AutoComplete, Breadcrumb, Button, Divider, Tooltip } from "antd";
import { Controller } from "react-hook-form";
import { Link } from "react-router-dom";
import { CheckIcon } from "../../../../components/icons/CheckIcon";
import { QuestionIcon } from "../../../../components/icons/QuestionIcon";
import { WhiteCirclePlusIcon } from "../../../../components/icons/WhiteCirclePlusIcon";
import ImageUploaderUX from "../../../../components/utils/UX/ImageUploaderUX";
import { AntSelectorStyle } from "../../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { renderFields } from "../utils/SingleItemFields";

import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import Chip from "../../../../components/UX/Chip/Chip";
import {
  addingExtraInfo,
  renderingMoreInfoSubmitted,
  renderingOptionsButtons,
  renderOptional,
  stylingComponents,
} from "./BulkComponents";

const SingleItemForm = ({
  acceptImage,
  addingSubLocation,
  addSerialNumberField,
  control,
  displayContainerSplotLimitField,
  displayPreviewImage,
  displaySublocationFields,
  errors,
  gripingFields,
  handleDeleteMoreInfo,
  handleMoreInfoPerDevice,
  handleSubmit,
  imageUploadedValue,
  imageUrlGenerated,
  isRented,
  keyObject,
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
  setAddSerialNumberField,
  setImageUploadedValue,
  setKeyObject,
  setMoreInfoDisplay,
  setReturningDate,
  setSubLocationsSubmitted,
  setValueObject,
  subLocationsOptions,
  subLocationsSubmitted,
  valueObject,
  watch,
  suppliersOptions,
  // isLoadingLocations,
  // isLocationSetupAllowed,
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
    <form onSubmit={handleSubmit(savingNewItem)} className="form">
      <Grid container spacing={1}>
        {/* style={styleDivParent} */}
        {renderFields({
          OutlinedInputStyle,
          retrieveItemOptions,
          renderLocationOptions,
          options,
          displayContainerSplotLimitField,
          subLocationsOptions,
          displaySublocationFields,
          addSerialNumberField,
          rangeFormat,
          labeling,
          gripingFields,
          loadingStatus,
          setImageUploadedValue,
          renderingOptionsForSubLocations,
          isRented,
          displayPreviewImage,
          suppliersOptions,
        }).map((item) => {
          if (item.displayField) {
            if (item.htmlOption === 6 && item.name === "image_uploader") {
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
                  md={
                    item.name === "descript_item"
                      ? 12
                      : gripingFields(item.name)
                  }
                  lg={
                    item.name === "descript_item"
                      ? 12
                      : gripingFields(item.name)
                  }
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
                        style={stylingComponents({ loadingStatus }).styling}
                      >
                        {item.label} {item.tooltip && <QuestionIcon />}
                      </Typography>
                    </Tooltip>
                  </InputLabel>

                  <ImageUploaderUX
                    setImageUploadedValue={setImageUploadedValue}
                    imageUploadedValue={imageUploadedValue}
                  />
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
                    display: displayPreviewImage ? "flex" : "none",
                  }}
                  marginY={1}
                  item
                  xs={12}
                  sm={12}
                  md={
                    item.name === "descript_item"
                      ? 12
                      : gripingFields(item.name)
                  }
                  lg={
                    item.name === "descript_item"
                      ? 12
                      : gripingFields(item.name)
                  }
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
                        style={stylingComponents({ loadingStatus }).styling}
                      >
                        {item.label} {item.tooltip && <QuestionIcon />}
                      </Typography>
                    </Tooltip>
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: "8px",
                        backgroundColor: "#F9F5FF",
                        padding: "1rem",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "1rem",
                      }}
                    >
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
                        <Button
                          disabled={imageUrlGenerated}
                          onClick={() => acceptImage()}
                          style={{
                            ...BlueButton,
                            background: imageUrlGenerated
                              ? "transparent"
                              : BlueButton.background,
                          }}
                        >
                          <p
                            style={{
                              ...BlueButtonText,
                              color: imageUrlGenerated
                                ? "var(--gray-600, #475467)"
                                : BlueButtonText.color,
                            }}
                          >
                            {imageUrlGenerated ? <CheckIcon /> : null}
                            {imageUrlGenerated
                              ? "Image accepted"
                              : "Accept image"}
                          </p>
                        </Button>
                      </div>
                    </div>
                  </InputLabel>
                </Grid>
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
                md={
                  item.name === "descript_item" ||
                  item.name === "reference_item_group"
                    ? 12
                    : gripingFields(item.name)
                }
                lg={
                  item.name === "descript_item" ||
                  item.name === "reference_item_group"
                    ? 12
                    : gripingFields(item.name)
                }
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
                      {item.label} {item.tooltip && <QuestionIcon />}
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
                    render={({ field: { value, onChange } }) => (
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
                            aria-required={item.required}
                            className="custom-autocomplete" // Add a custom
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
                            manuallyAddingSerialNumbers,
                            addingSubLocation,
                            setAddSerialNumberField,
                            label: item.label,
                          })}
                        </Grid>
                        <Grid
                          display={
                            item.label === "Main location" ||
                            item.label === "Sub location"
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
                          {
                            renderingOptionsForSubLocations(item.label)
                              .addSubLocation
                          }
                          {
                            renderingOptionsForSubLocations(item.label)
                              .removeAllSubLocations
                          }
                        </Grid>
                        <Grid item xs={12} sm={12} md={12} lg={12}>
                          <Breadcrumb
                            style={{
                              display:
                                item.label === "Sub location" ||
                                displaySublocationFields.length > 0
                                  ? "flex"
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
                              ...subLocationsSubmitted.map((item, index) => ({
                                title: (
                                  <Chip
                                    variant="ghost"
                                    style={{
                                      margin: 0,
                                      padding: 0,
                                      alignItems: "flex-start",
                                    }}
                                    label={item}
                                    onDelete={() =>
                                      setSubLocationsSubmitted(
                                        subLocationsSubmitted.filter(
                                          (_, i) => i !== index,
                                        ),
                                      )
                                    }
                                  />
                                ),
                              })),
                            ]}
                          />
                        </Grid>
                      </Grid>
                    )}
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
      <Divider />
      <Tooltip title="This information will be applied to all serial numbers created for this device.">
        <div style={{ width: "100%" }}>
          <BlueButtonComponent
            title={"Add more information"}
            func={() => setMoreInfoDisplay(!moreInfoDisplay)}
            icon={<WhiteCirclePlusIcon stroke="var(--basewhite)" />}
            styles={{ width: "100%" }}
            buttonType="button"
          />
        </div>
      </Tooltip>
      {moreInfoDisplay &&
        addingExtraInfo({
          keyObject,
          valueObject,
          setKeyObject,
          setValueObject,
          handleMoreInfoPerDevice,
        })}
      {renderingMoreInfoSubmitted({
        moreInfo,
        moreInfoDisplay,
        handleDeleteMoreInfo,
      })}{" "}
      <Divider style={{ display: moreInfoDisplay ? "" : "none" }} />
      <div style={stylingComponents({ loadingStatus }).styleDivParent}>
        <div
          style={{
            textAlign: "left",
            width: "50%",
          }}
        >
          <Link to="/inventory" style={{ width: "100%" }}>
            <GrayButtonComponent
              title={"Go back"}
              func={() => null}
              buttonType="reset"
              styles={{ width: "100%" }}
              titleStyles={{ textTransform: "none" }}
            />
          </Link>
        </div>
        <div
          style={{
            textAlign: "right",
            width: "50%",
          }}
        >
          <BlueButtonComponent
            title={"Save and exit"}
            loadingState={loadingStatus}
            disabled={loadingStatus}
            styles={stylingComponents({ loadingStatus }).buttonStyleLoading}
            titleStyles={{ ...CenteringGrid, textTransform: "none" }}
            buttonType="submit"
          />
        </div>
      </div>
    </form>
  );
};

export default SingleItemForm;
