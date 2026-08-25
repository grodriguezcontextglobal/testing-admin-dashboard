import { Typography } from "@mui/material";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import { renderFields } from "../../../utils/BulkItemsFields";
import FieldGrid from "./FieldGrid";
import { cardFootStyle, cardHeadStyle, cardStyle } from "./wizardStyles";

const blockStyle = { padding: "20px 24px", borderBottom: "1px solid var(--gray-200, #eaecf0)" };

/**
 * Step 3: two titled blocks — Assignable, then Ownership. Rent expands
 * Ownership with a return date and a vendor; that gating is already
 * isRented-driven in BulkItemsFields.jsx, unchanged here.
 */
const OwnershipStep = ({
  control,
  errors,
  isRented,
  loadingStatus,
  options,
  OutlinedInputStyle,
  register,
  returningDate,
  setReturningDate,
  suppliersOptions,
  watch,
  goBack,
  goNext,
}) => {
  const allFields = renderFields({
    retrieveItemOptions: () => [],
    OutlinedInputStyle,
    renderLocationOptions: () => [],
    options,
    displayContainerSplotLimitField: false,
    subLocationsOptions: [],
    suppliersOptions,
    isRented,
  }).filter((field) => field.displayField);

  const assignableFields = allFields.filter((field) => field.section === "assignable");
  const ownershipFields = allFields.filter((field) => field.section === "ownership");

  return (
    <div style={cardStyle}>
      <div style={cardHeadStyle}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>How can these units be used?</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Who can take them out, and whether you own them or are renting them from somebody.
        </Typography>
      </div>

      <div style={blockStyle}>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>Assignable</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Whether staff and events can check these units out
        </Typography>
        <FieldGrid
          fields={assignableFields}
          control={control}
          errors={errors}
          loadingStatus={loadingStatus}
          register={register}
          returningDate={returningDate}
          setReturningDate={setReturningDate}
          subLocationsSubmitted={[]}
          watch={watch}
        />
      </div>

      <div style={{ ...blockStyle, borderBottom: "none" }}>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>Ownership</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {isRented
            ? "Rent is selected, so the return date and vendor are part of this step"
            : "Pick Rent and this step also asks for a return date and a vendor"}
        </Typography>
        <FieldGrid
          fields={ownershipFields}
          control={control}
          errors={errors}
          isRented={isRented}
          loadingStatus={loadingStatus}
          register={register}
          returningDate={returningDate}
          setReturningDate={setReturningDate}
          subLocationsSubmitted={[]}
          watch={watch}
        />
      </div>

      <div style={cardFootStyle}>
        <GrayButtonComponent title="Back" buttonType="button" func={goBack} />
        <BlueButtonComponent title="Continue to units" buttonType="button" func={goNext} />
      </div>
    </div>
  );
};

export default OwnershipStep;
