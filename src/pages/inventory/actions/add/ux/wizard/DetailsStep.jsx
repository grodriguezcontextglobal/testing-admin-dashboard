import { Typography } from "@mui/material";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import { renderFields } from "../../../utils/BulkItemsFields";
import CopyFromExistingDevicePanel from "../../../utils/uxForm/CopyFromExistingDevicePanel";
import FieldGrid from "./FieldGrid";
import { cardBodyStyle, cardFootStyle, cardHeadStyle, cardStyle } from "./wizardStyles";

/**
 * Step 1: what the item is and what it costs. The copy-from-an-existing-
 * device shortcut sits above the card, not inside it — it is an optional
 * way into the whole wizard, not one of its steps.
 */
const DetailsStep = ({
  control,
  displayContainerSplotLimitField,
  displayPreviewImage,
  errors,
  handleSearchByReference,
  clearReferenceCopy,
  copiedFrom,
  imageUploadedValue,
  imageUrlGenerated,
  loadingStatus,
  options,
  OutlinedInputStyle,
  register,
  renderLocationOptions,
  retrieveItemOptions,
  returningDate,
  setImageUploadedValue,
  setReturningDate,
  subLocationsOptions,
  suppliersOptions,
  watch,
  goNext,
}) => {
  const fields = renderFields({
    retrieveItemOptions,
    OutlinedInputStyle,
    renderLocationOptions,
    options,
    displayContainerSplotLimitField,
    displayPreviewImage,
    subLocationsOptions,
    suppliersOptions,
  })
    .filter((field) => field.displayField && field.section === "info");

  return (
    <div>
      <CopyFromExistingDevicePanel
        control={control}
        retrieveItemOptions={retrieveItemOptions}
        onSearch={handleSearchByReference}
        onClear={clearReferenceCopy}
        copiedFrom={copiedFrom}
      />
      <div style={cardStyle}>
        <div style={cardHeadStyle}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>What are you adding?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Category, group and brand identify the item. Every unit you add in step 4 shares these values.
          </Typography>
        </div>
        <div style={cardBodyStyle}>
          <FieldGrid
            fields={fields}
            control={control}
            errors={errors}
            imageUploadedValue={imageUploadedValue}
            imageUrlGenerated={imageUrlGenerated}
            loadingStatus={loadingStatus}
            register={register}
            returningDate={returningDate}
            setImageUploadedValue={setImageUploadedValue}
            setReturningDate={setReturningDate}
            subLocationsSubmitted={[]}
            watch={watch}
          />
        </div>
        <div style={cardFootStyle}>
          <span />
          <BlueButtonComponent title="Continue to location" buttonType="button" func={goNext} />
        </div>
      </div>
    </div>
  );
};

export default DetailsStep;
