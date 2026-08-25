import { Typography } from "@mui/material";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import { renderFields } from "../../../utils/BulkItemsFields";
import FieldGrid from "./FieldGrid";
import { cardBodyStyle, cardFootStyle, cardHeadStyle, cardStyle } from "./wizardStyles";

/**
 * Step 2: where the units live, and where they are deductible for taxes —
 * they do not have to be the same place. Today a mismatch between the two
 * only surfaces as a native alert() inside bulkItemInsertAlphanumeric, fired
 * AFTER Create is pressed; this step says so inline, before that click.
 */
const LocationStep = ({
  addingSubLocation,
  control,
  errors,
  loadingStatus,
  OutlinedInputStyle,
  register,
  renderLocationOptions,
  retrieveItemOptions,
  returningDate,
  setReturningDate,
  setSubLocationsSubmitted,
  subLocationsOptions,
  subLocationsSubmitted,
  watch,
  goBack,
  goNext,
}) => {
  const fields = renderFields({
    retrieveItemOptions,
    OutlinedInputStyle,
    renderLocationOptions,
    options: [],
    displayContainerSplotLimitField: false,
    subLocationsOptions,
    suppliersOptions: [],
  })
    .filter((field) => field.displayField && field.section === "location");

  const mismatch =
    watch("location") && watch("tax_location") && watch("location") !== watch("tax_location");

  return (
    <div style={cardStyle}>
      <div style={cardHeadStyle}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Where do these units live?</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          The physical location, and the one they are deductible in — they do not have to be the same place.
        </Typography>
      </div>
      <div style={cardBodyStyle}>
        <FieldGrid
          fields={fields}
          addingSubLocation={addingSubLocation}
          control={control}
          errors={errors}
          loadingStatus={loadingStatus}
          register={register}
          returningDate={returningDate}
          setReturningDate={setReturningDate}
          setSubLocationsSubmitted={setSubLocationsSubmitted}
          subLocationsSubmitted={subLocationsSubmitted}
          watch={watch}
        />

        {mismatch && (
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "flex-start",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid var(--warn-200, #fedf89)",
              background: "var(--warn-50, #fffaeb)",
              marginTop: "16px",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#b54708" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px" }}>
              <path d="M10 7.5v3.75M10 14h.01M8.7 3.3 1.9 15a1.5 1.5 0 0 0 1.3 2.25h13.6A1.5 1.5 0 0 0 18.1 15L11.3 3.3a1.5 1.5 0 0 0-2.6 0Z" />
            </svg>
            <div>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--warn-700, #b54708)" }}>
                The two locations are different
              </Typography>
              <Typography variant="body2" sx={{ color: "#93370d" }}>
                That is allowed — units can sit in one place and be deductible in another.
              </Typography>
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid var(--action-100, #d1e0ff)",
            background: "var(--action-50, #eff4ff)",
            marginTop: "16px",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#175cd3" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px" }}>
            <path d="M10 13.3V9.2M10 6.7h.01M17.5 10a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
          </svg>
          <Typography variant="body2" sx={{ color: "var(--gray-600, #475467)" }}>
            A location that does not exist yet is created for you — type a new name and it is registered when you create the group.
          </Typography>
        </div>
      </div>
      <div style={cardFootStyle}>
        <GrayButtonComponent title="Back" buttonType="button" func={goBack} />
        <BlueButtonComponent title="Continue to ownership" buttonType="button" func={goNext} />
      </div>
    </div>
  );
};

export default LocationStep;
