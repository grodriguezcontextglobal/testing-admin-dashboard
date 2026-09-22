import { Typography } from "@mui/material";
import BadgeWithDot from "../../../../../../components/base/badges/badges";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import { buildUpdateReviewDiff } from "../../../utils/buildUpdateReviewDiff";
import {
  formatTrackedFieldValue,
  TRACKED_FIELDS,
} from "../../../utils/updateInventoryMatchSummary";

const formatValue = (value) => (value === null || value === undefined ? "—" : value);

const MAX_SERIALS_SHOWN = 10;

/**
 * Step 4: the last click before anything is written. Shows only the fields
 * that actually changed, the exact scope (frozen serial list, or the whole
 * group re-matched at apply time), then submits through the same mutation
 * and 202/jobId/background-tracker flow the page always used.
 */
const ReviewStep = ({
  updateAll,
  scopeSummary,
  scannedSerialNumbers,
  subLocationsSubmitted,
  watch,
  handleSubmit,
  updateGroupItems,
  loadingStatus,
  confirmed,
  setConfirmed,
  goBack,
}) => {
  const formValues = watch();
  // Both sides go through the same formatter before comparing, so a tinyint
  // container/enableAssignFeature value never reads as "changed" just because
  // it disagrees in representation with the form's "Yes"/"No" radio, and
  // sub_location compares the path actually staged in subLocationsSubmitted
  // rather than the (always-blank-after-adding) transient input field.
  const formattedSummaryFields = {};
  const formattedFormValues = {};
  TRACKED_FIELDS.forEach(({ field }) => {
    const afterRaw = field === "sub_location" ? subLocationsSubmitted : formValues[field];
    formattedSummaryFields[field] = {
      value: formatTrackedFieldValue(field, scopeSummary.fields[field]?.value),
    };
    formattedFormValues[field] = formatTrackedFieldValue(field, afterRaw);
  });
  const diff = buildUpdateReviewDiff(formattedSummaryFields, formattedFormValues, TRACKED_FIELDS);
  const count = updateAll ? scopeSummary.matchCount : scannedSerialNumbers.length;
  const shownSerials = scannedSerialNumbers.slice(0, MAX_SERIALS_SHOWN);
  const extraSerials = scannedSerialNumbers.length - shownSerials.length;

  return (
    <div style={{ background: "var(--base-white, #fff)", border: "1px solid var(--gray-200, #eaecf0)", borderRadius: "12px", boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px 24px", background: "var(--action-50, #eff4ff)", borderBottom: "1px solid var(--action-100, #d1e0ff)" }}>
        <span style={{ font: "600 36px/44px Inter, sans-serif", color: "var(--text-link)", letterSpacing: "-0.72px" }}>
          {count}
        </span>
        <div>
          {/* "will be updated", not "will change" — P2 `17:49`, said twice.
              The count stays here on his instruction (`23:19`, "it's nice to
              have 12 items will change at the top… keep that for now") and the
              line under it is what keeps it honest: counted a moment ago, not
              promised. */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            item{count === 1 ? "" : "s"} will be updated
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {updateAll
              ? "Every item that matches this group, counted a moment ago."
              : "The items you picked in the previous step."}
          </Typography>
        </div>
      </div>

      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--gray-200, #eaecf0)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {/* P2 `19:00` — "I think it's really good what you're having here.
                But you should say these are the changes that will be made."
                The panel he liked is unchanged; only its heading. */}
            {diff.length === 0
              ? "No fields were changed"
              : "These are the changes that will be made"}
          </Typography>
          <BadgeWithDot color="gray">{TRACKED_FIELDS.length - diff.length} other fields keep today&rsquo;s value</BadgeWithDot>
        </div>
        {diff.length > 0 && (
          <div style={{ border: "1px solid var(--gray-200, #eaecf0)", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 24px 1.2fr", background: "var(--gray-50, #f9fafb)", borderBottom: "1px solid var(--gray-200, #eaecf0)" }}>
              <span style={{ padding: "12px 16px", font: "500 12px/18px Inter, sans-serif", color: "var(--gray-600, #475467)" }}>Field</span>
              <span style={{ padding: "12px 16px", font: "500 12px/18px Inter, sans-serif", color: "var(--gray-600, #475467)" }}>Today</span>
              <span />
              <span style={{ padding: "12px 16px", font: "500 12px/18px Inter, sans-serif", color: "var(--gray-600, #475467)" }}>After the update</span>
            </div>
            {diff.map(({ field, label, from, to }, index) => (
              <div
                key={field}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.2fr 24px 1.2fr",
                  borderBottom: index === diff.length - 1 ? "none" : "1px solid var(--gray-200, #eaecf0)",
                }}
              >
                <span style={{ padding: "14px 16px", fontWeight: 500 }}>{label}</span>
                <span style={{ padding: "14px 16px", color: "var(--gray-500, #667085)" }}>{formatValue(from)}</span>
                <span />
                <span style={{ padding: "14px 16px", fontWeight: 600 }}>{formatValue(to)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--gray-200, #eaecf0)" }}>
        {updateAll ? (
          <div>
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>The whole group</Typography>
            {/* He spent three minutes on this sentence (P2 `19:46`–`21:41`),
                built the worst case himself — an accountant updating 2,000
                Chromebooks across 50 warehouses while managers keep adding
                stock — and had it confirmed twice that the new units are swept
                in. The old wording buried that in a subclause: "if one was
                added since, it is included too".

                > P2 `22:49` — "if items were added during this process and
                > those items match the initial search criteria, all those items
                > will also be updated per this request."

                It names the three criteria rather than saying "what you
                searched for", because those three are literally the WHERE
                clause: the job runs `UPDATE item_inv SET … WHERE company_id = ?
                AND category_name = ? AND item_group = ? AND brand = ?` when it
                executes, not against the list on this screen. That is also why
                the boundary he set at `22:20` is where it is — the update
                catches whatever matches at the moment it runs, and nothing
                after. */}
            <Typography variant="body2" color="text.secondary">
              Every item with the same category, device name and brand, whatever
              its serial number. There were {scopeSummary.matchCount} when you
              started.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              If someone adds an item matching those three while this is
              running, it is updated too. Items added after it finishes are not.
            </Typography>
          </div>
        ) : (
          <div>
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>The {scannedSerialNumbers.length} items</Typography>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {shownSerials.map((serial) => (
                <span key={serial} style={{ padding: "4px 8px", borderRadius: "6px", background: "var(--gray-100, #f2f4f7)", border: "1px solid var(--gray-300, #d0d5dd)", font: "500 12px/18px Inter, sans-serif" }}>
                  {serial}
                </span>
              ))}
              {extraSerials > 0 && <BadgeWithDot color="gray">and {extraSerials} more</BadgeWithDot>}
            </div>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              This list is frozen — items added to the group after now are not touched.
            </Typography>
          </div>
        )}
      </div>

      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "16px", borderRadius: "8px", border: "1px solid var(--gray-300, #d0d5dd)" }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            style={{ width: "16px", height: "16px", marginTop: "2px" }}
          />
          <div>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              I understand this changes {diff.length} field{diff.length === 1 ? "" : "s"} on {count} item{count === 1 ? "" : "s"}.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {/* His wording, `24:48`: "There is no bulk undo. If additional
                  changes are needed, please run another update." — and `25:31`,
                  "Yeah, that's better."

                  What it replaces told people to re-run the update *with the
                  old values*, which is a recipe for undoing and only works if
                  they still know what those were. This says the same thing
                  without pretending the app can hand them back. */}
              There is no bulk undo. If additional changes are needed, please run
              another update.
            </Typography>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderTop: "1px solid var(--gray-200, #eaecf0)", background: "var(--gray-50, #f9fafb)", borderRadius: "0 0 12px 12px" }}>
        <GrayButtonComponent title="Back to fields" buttonType="button" func={goBack} />
        <BlueButtonComponent
          /* Just "Apply". P2 `22:27` — "don't say apply to 12 items because
             that may not be true. If somebody added more items, then there will
             be more items." The count stays in the heading above, and the
             difference is the point: a heading describes what was found, a
             button promises what it will do, and only the second one can still
             be wrong by the time it is clicked. */
          title="Apply"
          buttonType="button"
          size="lg"
          func={handleSubmit(updateGroupItems)}
          disabled={!confirmed || loadingStatus}
          isLoading={loadingStatus}
        />
      </div>
    </div>
  );
};

export default ReviewStep;
