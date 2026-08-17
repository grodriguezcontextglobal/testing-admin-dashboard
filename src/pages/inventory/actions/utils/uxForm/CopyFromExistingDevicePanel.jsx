import { Grid, Typography } from "@mui/material";
import { Alert, AutoComplete } from "antd";
import { Controller } from "react-hook-form";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import { AntSelectorStyle } from "../../../../../styles/global/AntSelectorStyle";

/**
 * Optional shortcut: fill the form from a device the company already owns.
 *
 * What this replaced was four fields called "Category reference", "Group
 * reference", "Brand reference" and "Search reference", sitting in the same
 * grid and with the same weight as the fields that actually define the new
 * item. Users read them as four more things they had to fill in, and the only
 * explanation — "Set search criteria for searching inventory group in fields
 * above and then click search reference button" — described the mechanics
 * without ever saying what the feature was for or what would happen after.
 *
 * The fix is framing, not new capability. The block is now a bordered panel
 * with a title that states the outcome, a line saying it is optional and
 * reversible, plain field names, and a result that names the unit the details
 * came from — because when a group's units disagree, the first one silently
 * wins and the user deserves to see which one that was.
 */

const FIELDS = [
  {
    name: "reference_category_name",
    label: "Category",
    placeholder: "Any category",
    optionsKey: "category_name",
  },
  {
    name: "reference_item_group",
    label: "Group",
    placeholder: "Any device",
    optionsKey: "item_group",
  },
  {
    name: "reference_brand",
    label: "Brand",
    placeholder: "Any brand",
    optionsKey: "brand",
  },
];

const panelStyle = {
  width: "100%",
  border: "1px solid var(--gray-200, #ddded6)",
  borderRadius: "var(--radius-md, 8px)",
  background: "var(--gray-50, #f7f7f4)",
  padding: "16px",
  margin: "0 0 24px",
};

const CopyFromExistingDevicePanel = ({
  control,
  retrieveItemOptions,
  onSearch,
  onClear,
  copiedFrom,
}) => (
  <div style={panelStyle}>
    <Typography
      variant="subtitle1"
      sx={{ fontWeight: 700, textAlign: "left", width: "100%" }}
    >
      Copy details from a device you already have
    </Typography>
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ textAlign: "left", width: "100%", mb: 2 }}
    >
      Optional. Pick a device already in your inventory and its cost, brand,
      description, ownership and image are filled into the form below, so you
      do not retype them. You can change anything afterwards, and nothing is
      created until you save.
    </Typography>

    <Grid container spacing={1} alignItems="flex-end">
      {FIELDS.map((field) => (
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
                options={(retrieveItemOptions(field.optionsKey) ?? []).map(
                  (option) =>
                    typeof option === "string"
                      ? { value: option }
                      : { value: option.value },
                )}
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

    {copiedFrom && (
      <Alert
        type="success"
        showIcon
        style={{ marginTop: "12px" }}
        message={`Details copied from ${copiedFrom.serial_number || "an existing device"}`}
        description={
          copiedFrom.matchCount > 1
            ? `${copiedFrom.matchCount} devices matched. The details above come from the first of them — if your units differ, check the fields below before saving.`
            : "Review the fields below and change whatever is different for the new units."
        }
      />
    )}
  </div>
);

export default CopyFromExistingDevicePanel;
