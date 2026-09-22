import { Typography } from "@mui/material";
import { useMemo } from "react";
import { continueLabel } from "../../editWizardSteps";
import { AutoComplete } from "antd";
import { Controller, useWatch } from "react-hook-form";
import BadgeWithDot from "../../../../../../components/base/badges/badges";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import { AntSelectorStyle } from "../../../../../../styles/global/AntSelectorStyle";
import {
  hasReferenceOptions,
  matchesTypedText,
  REFERENCE_FIELDS,
  toOptions,
} from "../../../utils/referenceLookup";
import {
  formatTrackedFieldValue,
  TRACKED_FIELDS,
} from "../../../utils/updateInventoryMatchSummary";

const formatCost = (value) =>
  Number.isFinite(value) ? `$${value.toFixed(2)}` : null;

const formatFieldValue = (fieldName, field) =>
  formatTrackedFieldValue(fieldName, field.value) ?? "—";

/**
 * Step 1: find which items this update reaches. Category + group name the
 * items; brand narrows it further when a group holds more than one make.
 * Reuses findReferenceMatches() (via the wizard hook) — the same matching
 * logic the old "copy from an existing device" shortcut used — so the live
 * counter here and the prefill on Continue never disagree.
 */
const TargetSearchStep = ({
  control,
  retrieveItemOptions,
  searched,
  matchSummary,
  confirmTarget,
  setValue,
}) => {
  const clearBrand = () => setValue("reference_brand", "");

  const [category, itemGroup, brand] = useWatch({
    control,
    name: REFERENCE_FIELDS.map((field) => field.name),
  });

  /* Each list narrowed by the other two, the same as the create wizard's copy
     panel since item 7 — pick a brand and the category and device lists follow
     it, so a combination no unit satisfies is never offered:

     > P2 `11:04` — "if I put laptops here, I should not be able to do
     > disinfectant wipes."

     Never by its own value, or choosing a brand would leave that brand as the
     only one on offer and no way back. `narrowReferenceOptions` has the rule;
     this step and the copy panel now behave identically, which matters because
     they are the same three fields doing the same job on two screens. */
  const optionsByField = useMemo(
    () =>
      REFERENCE_FIELDS.map((field) =>
        toOptions(
          retrieveItemOptions(field.optionsKey, {
            ...{ category, itemGroup, brand },
            [field.criteriaKey]: "",
          }),
        ),
      ),
    [retrieveItemOptions, category, itemGroup, brand],
  );

  if (!hasReferenceOptions(optionsByField)) {
    return (
      <div style={{ background: "var(--base-white, #fff)", border: "1px solid var(--gray-200, #eaecf0)", borderRadius: "12px" }}>
        <div style={{ padding: "32px", textAlign: "center" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Your inventory is empty
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            There is nothing to update yet — add items to inventory first.
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--base-white, #fff)", border: "1px solid var(--gray-200, #eaecf0)", borderRadius: "12px", boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)" }}>
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--gray-200, #eaecf0)" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Which items do you want to update?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Category and device group identify the items. Brand narrows it further when one group holds more than one make.
        </Typography>
      </div>

      <div style={{ padding: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px" }}>
          {REFERENCE_FIELDS.map((field, index) => (
            <div key={field.name}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, textAlign: "left", mb: 0.75 }}
              >
                {field.label}
              </Typography>
              <Controller
                control={control}
                name={field.name}
                render={({ field: { value, onChange } }) => (
                  <AutoComplete
                    className="custom-autocomplete"
                    variant="outlined"
                    style={{ ...AntSelectorStyle, fontFamily: "Inter", fontSize: "14px", width: "100%" }}
                    value={value}
                    onChange={onChange}
                    options={optionsByField[index]}
                    placeholder={field.name === "reference_brand" ? "Any brand" : field.placeholder}
                    filterOption={matchesTypedText}
                    allowClear
                  />
                )}
              />
            </div>
          ))}
        </div>
        {!searched && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            Fill in at least one of the three to search. Any combination narrows the search — leaving one blank means &quot;any&quot;.
          </Typography>
        )}

        {searched && matchSummary.matchCount > 0 && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginTop: "24px",
                padding: "16px",
                border: "1px solid var(--action-100, #d1e0ff)",
                background: "var(--action-50, #eff4ff)",
                borderRadius: "12px",
              }}
            >
              <span style={{ font: "600 30px/38px Inter, sans-serif", color: "var(--text-link)", letterSpacing: "-0.72px" }}>
                {matchSummary.matchCount}
              </span>
              <div style={{ flexGrow: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  items match this selection
                </Typography>
                <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                  <BadgeWithDot color="gray">
                    {matchSummary.locationCount} location{matchSummary.locationCount === 1 ? "" : "s"}
                  </BadgeWithDot>
                  <BadgeWithDot color="gray">
                    {matchSummary.ownershipTypeCount} ownership type{matchSummary.ownershipTypeCount === 1 ? "" : "s"}
                  </BadgeWithDot>
                  {matchSummary.costRange && (
                    <BadgeWithDot color="gray">
                      cost {formatCost(matchSummary.costRange.min)} to {formatCost(matchSummary.costRange.max)}
                    </BadgeWithDot>
                  )}
                  <BadgeWithDot color="success">
                    {matchSummary.inWarehouseCount} in warehouse
                  </BadgeWithDot>
                  {matchSummary.elsewhereCount > 0 && (
                    <BadgeWithDot color="warning">
                      {matchSummary.elsewhereCount} out on an event or assigned
                    </BadgeWithDot>
                  )}
                </div>
              </div>
            </div>

            {matchSummary.elsewhereCount > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--warn-200, #fedf89)",
                  background: "var(--warn-50, #fffaeb)",
                  marginTop: "12px",
                }}
              >
                <div>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--warn-700, #b54708)" }}>
                    {matchSummary.elsewhereCount} of these items are out on an event or assigned right now
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#93370d" }}>
                    They get updated the same as the rest. Their location is whatever the event or assignment set, so changing location in this update overwrites it.
                  </Typography>
                </div>
              </div>
            )}

            <div style={{ marginTop: "24px", border: "1px solid var(--gray-200, #eaecf0)", borderRadius: "12px", overflow: "hidden" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "var(--gray-50, #f9fafb)",
                  borderBottom: "1px solid var(--gray-200, #eaecf0)",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  What these {matchSummary.matchCount} items have today
                </Typography>
                <BadgeWithDot color="gray">Read-only here — you edit them in step 3</BadgeWithDot>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
                {TRACKED_FIELDS.map(({ field, label }) => {
                  const info = matchSummary.fields[field];
                  return (
                    <div
                      key={field}
                      style={{ padding: "12px 16px", borderRight: "1px solid var(--gray-200, #eaecf0)", borderBottom: "1px solid var(--gray-200, #eaecf0)" }}
                    >
                      <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                        {label}
                      </Typography>
                      <Typography variant="body2">
                        {formatFieldValue(field, info)}
                        {info?.mixed && (
                          <BadgeWithDot color="warning" style={{ marginLeft: "6px" }}>
                            {info.distinctCount} values
                          </BadgeWithDot>
                        )}
                      </Typography>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {searched && matchSummary.matchCount === 0 && (
          <div style={{ marginTop: "24px", padding: "32px", textAlign: "center", border: "1px dashed var(--gray-300, #d0d5dd)", borderRadius: "12px", background: "var(--gray-50, #f9fafb)" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              No items match that selection
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              Nothing was cleared. Change the fields above, or clear brand to widen the search.
            </Typography>
            <GrayButtonComponent title="Clear brand" buttonType="button" func={clearBrand} />
          </div>
        )}
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
        <span />
        <BlueButtonComponent
          title={
            searched && matchSummary.matchCount > 0
              ? continueLabel("target")
              : "Continue"
          }
          buttonType="button"
          func={confirmTarget}
          disabled={!searched || matchSummary.matchCount === 0}
        />
      </div>
    </div>
  );
};

export default TargetSearchStep;
