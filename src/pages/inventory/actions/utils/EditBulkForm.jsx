import { Grid, InputLabel, Typography } from "@mui/material";
import {
  AutoComplete,
  Breadcrumb,
  Button,
  Divider,
  Popconfirm,
  Tooltip,
} from "antd";
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
import { GrayButton } from "../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../styles/global/GrayButtonText";
import {
  addingExtraInfo,
  gripingFields,
  renderingMoreInfoSubmitted,
  renderingOptionsButtons,
  renderOptional,
  stylingComponents,
} from "./BulkComponents";
import { renderFields } from "./BulkItemsFields";
import { renderingResultUX, styleUpdateAllItemsButton } from "./EditBulkComponents";

const EditBulkForm = ({
  acceptImage,
  addingSubLocation,
  addSerialNumberField,
  allSerialNumbersOptions,
  control,
  displayContainerSplotLimitField,
  displayPreviewImage,
  displaySublocationFields,
  errors,
  handleDeleteMoreInfo,
  handleMoreInfoPerDevice,
  handleSubmit,
  imageUploadedValue,
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
  setOpenScannedItemView,
  setOpenScanningModal,
  setReturningDate,
  setSubLocationsSubmitted,
  setUpdateAllItems,
  setValueObject,
  subLocationsOptions,
  subLocationsSubmitted,
  updateAllItems,
  valueObject,
  watch,
}) => {
  return (
    <form onSubmit={handleSubmit(savingNewItem)} className="form">
      <Grid container spacing={1}>
        {/* style={styleDivParent} */}
        {renderFields({
          retrieveItemOptions,
          OutlinedInputStyle,
          renderLocationOptions,
          options,
          displayContainerSplotLimitField,
          subLocationsOptions,
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
                          onClick={() => acceptImage()}
                          style={BlueButton}
                        >
                          <p style={BlueButtonText}>Accept image</p>
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
                  item.name === "descript_item" ? 12 : gripingFields(item.name)
                }
                lg={
                  item.name === "descript_item" ? 12 : gripingFields(item.name)
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
                    render={({ field: { value, onChange } }) => {
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
                              disabled={
                                (item.name === "format_range_serial_number" ||
                                  item.name === "feed_serial_number") &&
                                updateAllItems
                              }
                              aria-required={true}
                              className="custom-autocomplete" // Add a custom className here
                              variant="outlined"
                              style={{
                                ...AntSelectorStyle,
                                border: "solid 0.3 var(--gray600)",
                                fontFamily: "Inter",
                                fontSize: "14px",
                                width: "100%",
                              }}
                              value={renderingResultUX({ name: item.name, value })}
                              onChange={(value) => onChange(value)}
                              options={item.options?.map((x) => {
                                if (item.htmlOption === 0) {
                                  return { value: x };
                                } else {
                                  return { value: x.value };
                                }
                              })}
                              placeholder={item.placeholder}
                              //   filterOption={(inputValue, option) =>
                              //     option.value
                              //       .toUpperCase()
                              //       .indexOf(inputValue.toUpperCase()) !== -1
                              //   }
                              allowClear
                            />
                            {item.label === "Serial number range format" && (
                              <Button
                                style={
                                  styleUpdateAllItemsButton(updateAllItems)
                                    .button
                                }
                                onClick={() =>
                                  setUpdateAllItems(!updateAllItems)
                                }
                              >
                                <p
                                  style={
                                    styleUpdateAllItemsButton(updateAllItems).p
                                  }
                                >
                                  {updateAllItems ? <CheckIcon /> : null}
                                  &nbsp;Update all items
                                </p>
                              </Button>
                            )}
                            {renderingOptionsButtons({
                              watch,
                              setOpenScanningModal,
                              setOpenScannedItemView,
                              manuallyAddingSerialNumbers,
                              addingSubLocation,
                              setAddSerialNumberField,
                              label: item.label,
                              setUpdateAllItems,
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
                                    <Popconfirm
                                      title="Are you sure you want to delete this sub location?"
                                      onConfirm={() =>
                                        setSubLocationsSubmitted(
                                          subLocationsSubmitted.filter(
                                            (_, i) => i !== index
                                          )
                                        )
                                      }
                                    >
                                      <Button
                                        style={{
                                          border: "none",
                                          outline: "none",
                                          margin: 0,
                                          padding: 0,
                                          backgroundColor: "transparent",
                                          boxShadow: "none",
                                          alignItems: "flex-start",
                                        }}
                                      >
                                        {item}
                                      </Button>
                                    </Popconfirm>
                                  ),
                                })),
                              ]}
                            />
                          </Grid>
                        </Grid>
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
      <Divider />
      <Button
        type="button"
        onClick={() => setMoreInfoDisplay(!moreInfoDisplay)}
        style={
          stylingComponents({
            loadingStatus,
          }).buttonStyleLoading
        }
      >
        <Typography textTransform={"none"} style={BlueButtonText}>
          <WhiteCirclePlusIcon /> &nbsp; Add more information
        </Typography>
      </Button>
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
            <Button
              htmlType="reset"
              disabled={loadingStatus}
              style={{
                ...GrayButton,
                ...CenteringGrid,
                width: "100%",
              }}
            >
              <p
                style={{
                  ...GrayButtonText,
                  ...CenteringGrid,
                  textTransform: "none",
                }}
              >
                Go back
              </p>
            </Button>
          </Link>
        </div>
        <div
          style={{
            textAlign: "right",
            width: "50%",
          }}
        >
          <Button
            disabled={loadingStatus}
            loading={loadingStatus}
            htmlType="submit"
            style={stylingComponents({ loadingStatus }).buttonStyleLoading}
          >
            <p
              style={{
                ...BlueButtonText,
                ...CenteringGrid,
                textTransform: "none",
              }}
            >
              Update
            </p>
          </Button>
        </div>
      </div>
    </form>
  );
};

export default EditBulkForm;
