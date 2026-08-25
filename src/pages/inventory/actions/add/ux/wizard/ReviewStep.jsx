import { Typography } from "@mui/material";
import { useState } from "react";
import BadgeWithDot from "../../../../../../components/base/badges/badges";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import { cardStyle } from "./wizardStyles";

const MAX_SERIALS_SHOWN = 10;

const kvCellStyle = { padding: "12px 16px", borderRight: "1px solid var(--gray-200, #eaecf0)", borderBottom: "1px solid var(--gray-200, #eaecf0)" };
const kvKeyStyle = { margin: "0 0 2px" };
const kvValStyle = { margin: 0 };

const Cell = ({ label, value, style }) => (
  <div style={{ ...kvCellStyle, ...style }}>
    <Typography variant="caption" color="text.secondary" sx={kvKeyStyle}>{label}</Typography>
    <Typography variant="body2" sx={kvValStyle}>{value}</Typography>
  </div>
);

/**
 * Step 5: the only click that writes anything. Shows exactly what every
 * unit will get and the frozen list of serials, then submits through the
 * unchanged savingNewItem -> bulkItemInsertAlphanumeric -> POST
 * /db_item/bulk-item-alphanumeric flow (202 + jobId, tracked in the
 * background), same as before this redesign.
 */
const ReviewStep = ({
  watch,
  scannedSerialNumbers,
  moreInfo,
  subLocationsSubmitted,
  imageUrlGenerated,
  handleSubmit,
  savingNewItem,
  loadingStatus,
  goToStep,
}) => {
  const [confirmed, setConfirmed] = useState(false);

  const categoryName = watch("category_name");
  const itemGroup = watch("item_group");
  const brand = watch("brand");
  const cost = watch("cost");
  const location = watch("location");
  const taxLocation = watch("tax_location");
  const ownership = watch("ownership");
  const supplier = watch("supplier");
  const isRent = ownership === "Rent";
  const isContainer = String(watch("container")).includes("Yes");
  const isAssignable = watch("enableAssignFeature") === "YES";
  const count = scannedSerialNumbers.length;
  const withIdentifiers = moreInfo?.length ?? 0;
  const shownSerials = scannedSerialNumbers.slice(0, MAX_SERIALS_SHOWN);
  const extraSerials = count - shownSerials.length;

  // The exact string bulkItemInsertAlphanumeric composes and sends as
  // descript_item — shown as-is, including its double space when ownership
  // is not Rent, so review never disagrees with what actually gets written.
  const description = `${categoryName} ${itemGroup} ${brand} ${isRent ? "for rent" : ""} ${location}`;

  return (
    <div style={cardStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          padding: "20px 24px",
          background: "var(--action-50, #eff4ff)",
          borderBottom: "1px solid var(--action-100, #d1e0ff)",
          borderRadius: "12px 12px 0 0",
        }}
      >
        <span style={{ font: "600 36px/44px Inter, sans-serif", color: "var(--blue-700, #175cd3)", letterSpacing: "-0.72px" }}>
          {count}
        </span>
        <div>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            unit{count === 1 ? "" : "s"} will be created in {categoryName} / {itemGroup}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Each one is a separate item, all sharing the details below.
          </Typography>
        </div>
      </div>

      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--gray-200, #eaecf0)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>What every unit gets</Typography>
          <GrayButtonComponent title="Change details" buttonType="button" size="sm" func={() => goToStep(0)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", border: "1px solid var(--gray-200, #eaecf0)", borderRadius: "12px", overflow: "hidden" }}>
          <Cell label="Category" value={categoryName || "—"} />
          <Cell label="Group" value={itemGroup || "—"} />
          <Cell label="Brand" value={brand || "—"} />
          <Cell label="Replacement cost" value={cost ? `$${Number(cost).toFixed(2)}` : "—"} style={{ borderRight: "none" }} />

          <Cell label="Main location" value={location || "—"} />
          <Cell label="Sub-location" value={subLocationsSubmitted.length > 0 ? subLocationsSubmitted.join(" / ") : "—"} />
          <Cell label="Taxable location" value={taxLocation || "—"} />
          <Cell label="Container" value={isContainer ? "Yes" : "No"} style={{ borderRight: "none" }} />

          <Cell label="Assignable" value={isAssignable ? "Yes" : "No"} style={isRent ? {} : { borderBottom: "none" }} />
          <Cell label="Ownership" value={ownership || "—"} style={isRent ? {} : { borderBottom: "none" }} />
          <Cell label="Photo" value={imageUrlGenerated ? "1 image, shared by all" : "No photo"} style={isRent ? {} : { borderBottom: "none" }} />
          <Cell label="Stock status" value="In warehouse" style={{ borderRight: "none", borderBottom: isRent ? undefined : "none" }} />

          {isRent && (
            <>
              <Cell label="Return date" value="Set in step 3" style={{ borderBottom: "none" }} />
              <Cell label="Supplier" value={supplier || "—"} style={{ borderBottom: "none" }} />
            </>
          )}
          <div style={{ ...kvCellStyle, gridColumn: isRent ? "span 2" : "span 4", borderRight: "none", borderBottom: "none" }}>
            <Typography variant="caption" color="text.secondary" sx={kvKeyStyle}>Description</Typography>
            <Typography variant="body2" sx={kvValStyle}>
              {description} <BadgeWithDot color="gray" style={{ marginLeft: "4px" }}>Built for you</BadgeWithDot>
            </Typography>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--gray-200, #eaecf0)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>The {count} unit{count === 1 ? "" : "s"}</Typography>
          <GrayButtonComponent title="Change units" buttonType="button" size="sm" func={() => goToStep(3)} />
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {shownSerials.map((serial) => (
            <span key={serial} style={{ padding: "4px 8px", borderRadius: "6px", background: "var(--gray-100, #f2f4f7)", border: "1px solid var(--gray-300, #d0d5dd)", font: "500 12px/18px Inter, sans-serif" }}>
              {serial}
            </span>
          ))}
          {extraSerials > 0 && <BadgeWithDot color="gray">and {extraSerials} more</BadgeWithDot>}
          {withIdentifiers > 0 && (
            <BadgeWithDot color="blue">{withIdentifiers} carr{withIdentifiers === 1 ? "ies" : "y"} extra identifiers</BadgeWithDot>
          )}
        </div>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          A serial number that already exists in your inventory is rejected by the server, not silently merged — you get told which one.
        </Typography>
      </div>

      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--gray-200, #eaecf0)" }}>
        <Typography variant="body1" sx={{ fontWeight: 600, mb: 1.5 }}>What happens after you create</Typography>
        <div style={{ display: "flex", gap: "12px" }}>
          {[
            { t: "1. Queued", d: "You get a note that the group was registered. You can leave this page right away." },
            { t: "2. Processing", d: "The units are written in the background, and the location is registered if it was new." },
            { t: "3. Done", d: "A notification tells you it finished, and the inventory list refreshes itself." },
          ].map(({ t, d }) => (
            <div key={t} style={{ flexGrow: 1, padding: "12px 16px", border: "1px solid var(--gray-200, #eaecf0)", borderRadius: "8px", background: "var(--gray-50, #f9fafb)" }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{t}</Typography>
              <Typography variant="caption" color="text.secondary">{d}</Typography>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "16px", borderRadius: "8px", border: "1px solid var(--gray-300, #d0d5dd)" }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            style={{ width: "16px", height: "16px", marginTop: "2px" }}
          />
          <div>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              I understand this creates {count} new item{count === 1 ? "" : "s"} in inventory.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              There is no bulk undo. Removing them afterwards means deleting the units one group at a time.
            </Typography>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderTop: "1px solid var(--gray-200, #eaecf0)",
          background: "var(--gray-50, #f9fafb)",
          borderRadius: "0 0 12px 12px",
        }}
      >
        <GrayButtonComponent title="Back to units" buttonType="button" func={() => goToStep(3)} />
        <BlueButtonComponent
          title={`Create ${count} item${count === 1 ? "" : "s"}`}
          buttonType="button"
          size="lg"
          func={handleSubmit(savingNewItem)}
          disabled={!confirmed || loadingStatus}
          isLoading={loadingStatus}
        />
      </div>
    </div>
  );
};

export default ReviewStep;
