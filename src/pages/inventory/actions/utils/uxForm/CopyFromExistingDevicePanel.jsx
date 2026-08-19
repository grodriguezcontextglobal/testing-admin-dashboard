import { Grid, Typography } from "@mui/material";
import { Alert, AutoComplete } from "antd";
import { useEffect, useId, useMemo, useState } from "react";
import { Controller, useWatch } from "react-hook-form";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import { DownNarrow } from "../../../../../components/icons/DownNarrow";
import { RightChevronIcon } from "../../../../../components/icons/RightChevronIcon";
import { AntSelectorStyle } from "../../../../../styles/global/AntSelectorStyle";
import {
  hasReferenceCriteria,
  hasReferenceOptions,
  referenceSourceLabel,
  REFERENCE_FIELDS,
  toOptions,
} from "../referenceLookup";

/**
 * Optional shortcut: fill the form from a device the company already owns.
 *
 * What this replaced was four fields called "Category reference", "Group
 * reference", "Brand reference" and "Search reference", sitting in the same
 * grid and with the same weight as the fields that actually define the new
 * item. Users read them as four more things they had to fill in.
 *
 * It is now collapsed by default, because it is a shortcut and not a step: the
 * form is complete without ever opening it, and an expanded block above the
 * real fields reads like the first thing to fill in. Three rules keep the
 * collapsing from hiding anything that matters:
 *
 * 1. If the company has no inventory yet, the panel does not render at all.
 *    There is nothing to copy from, and three empty dropdowns cannot be told
 *    apart from a broken feature.
 * 2. When a copy has been applied the header says so and offers Undo without
 *    expanding, so prefilled fields are never unexplained. Applying a copy also
 *    opens the panel, so its result is visible where the action happened.
 * 3. "Copy details" is disabled until at least one criterion is set, with the
 *    reason next to it, instead of accepting the click and answering with a
 *    warning notification.
 */

const panelStyle = {
  width: "100%",
  border: "1px solid var(--gray-200, #ddded6)",
  borderRadius: "var(--radius-md, 8px)",
  background: "var(--gray-50, #f7f7f4)",
  padding: "12px 16px",
  margin: "0 0 24px",
};

const triggerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flex: 1,
  minWidth: 0,
  padding: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  textAlign: "left",
  font: "inherit",
};

const CopyFromExistingDevicePanel = ({
  control,
  retrieveItemOptions,
  onSearch,
  onClear,
  copiedFrom,
  mode = "create",
}) => {
  const panelId = useId();
  const [open, setOpen] = useState(Boolean(copiedFrom));

  // A copy applied from the collapsed header would otherwise leave its result
  // out of sight.
  useEffect(() => {
    if (copiedFrom) setOpen(true);
  }, [copiedFrom]);

  const optionsByField = useMemo(
    () => REFERENCE_FIELDS.map((field) => toOptions(retrieveItemOptions(field.optionsKey))),
    [retrieveItemOptions],
  );

  const [category, itemGroup, brand] = useWatch({
    control,
    name: REFERENCE_FIELDS.map((field) => field.name),
  });
  const canCopy = hasReferenceCriteria({ category, itemGroup, brand });

  if (!hasReferenceOptions(optionsByField)) return null;

  const sourceLabel = referenceSourceLabel(copiedFrom);
  // The result belongs in one place at a time: the alert while the panel is
  // open, the header once it is closed and the alert is out of sight. Saying it
  // in both at once is the same sentence twice on one screen.
  const showCopyInHeader = !open && Boolean(copiedFrom);
  const summary = showCopyInHeader
    ? `Details copied from ${sourceLabel}`
    : mode === "edit"
      ? "Optional — reuse the cost, brand, description and image of another device"
      : "Optional — skip retyping the cost, brand, description and image";

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          type="button"
          onClick={() => setOpen((wasOpen) => !wasOpen)}
          aria-expanded={open}
          aria-controls={panelId}
          style={triggerStyle}
        >
          {open ? <DownNarrow /> : <RightChevronIcon />}
          <span style={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, textAlign: "left" }}
            >
              Copy details from a device you already have
            </Typography>
            <Typography
              variant="body2"
              color={showCopyInHeader ? "success.main" : "text.secondary"}
              sx={{ textAlign: "left" }}
            >
              {summary}
            </Typography>
          </span>
        </button>

        {/* Undo has to be reachable without expanding: the copy already changed
            the fields below, so its escape hatch cannot be behind a disclosure. */}
        {!open && copiedFrom && (
          <GrayButtonComponent
            title="Undo"
            buttonType="button"
            func={onClear}
            styles={{ width: "fit-content", flexShrink: 0 }}
            titleStyles={{ textTransform: "none" }}
          />
        )}
      </div>

      {open && (
        <div id={panelId} style={{ marginTop: "16px" }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "left", width: "100%", mb: 2 }}
          >
            Pick a device already in your inventory and its cost, brand,
            description, ownership and image are filled into the form below, so
            you do not retype them. You can change anything afterwards, and
            nothing is {mode === "edit" ? "changed" : "created"} until you save.
          </Typography>

          <Grid container spacing={1} alignItems="flex-end">
            {REFERENCE_FIELDS.map((field, index) => (
              <Grid key={field.name} item xs={12} sm={6} md={3}>
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                  sx={{ fontWeight: 600, textAlign: "left", mb: 0.5 }}
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
                      style={{
                        ...AntSelectorStyle,
                        fontFamily: "Inter",
                        fontSize: "14px",
                        width: "100%",
                      }}
                      value={value}
                      onChange={onChange}
                      options={optionsByField[index]}
                      placeholder={field.placeholder}
                      allowClear
                    />
                  )}
                />
              </Grid>
            ))}

            <Grid item xs={12} sm={6} md={3}>
              <div style={{ display: "flex", gap: "8px" }}>
                <BlueButtonComponent
                  title="Copy details"
                  buttonType="button"
                  func={onSearch}
                  disabled={!canCopy}
                  styles={{ width: "100%" }}
                  titleStyles={{ textTransform: "none" }}
                />
                {copiedFrom && (
                  <GrayButtonComponent
                    title="Undo"
                    buttonType="button"
                    func={onClear}
                    styles={{ width: "fit-content" }}
                    titleStyles={{ textTransform: "none" }}
                  />
                )}
              </div>
            </Grid>
          </Grid>

          {!canCopy && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", textAlign: "left", mt: 1 }}
            >
              Fill in at least one of the three to search. Any combination
              narrows the search — leaving one blank means &quot;any&quot;.
            </Typography>
          )}

          {copiedFrom && (
            <Alert
              type="success"
              showIcon
              style={{ marginTop: "12px" }}
              message={`Details copied from ${sourceLabel}`}
              description={
                copiedFrom.matchCount > 1
                  ? `${copiedFrom.matchCount} devices matched. The details above come from the first of them — if your units differ, check the fields below before saving.`
                  : "Review the fields below and change whatever is different for the new units."
              }
            />
          )}
        </div>
      )}
    </div>
  );
};

export default CopyFromExistingDevicePanel;
