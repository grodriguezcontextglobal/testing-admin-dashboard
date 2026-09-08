import { MenuItem, Select, Typography } from "@mui/material";
import PropTypes from "prop-types";

import Label from "../../../../../../components/UX/inputs/Label";
import { AntSelectorStyle } from "../../../../../../styles/global/AntSelectorStyle";
import {
  EDITABLE_STOCK_STATES,
  isItemInStock,
} from "../../../utils/editItemFormModel";

/**
 * Where the unit is, on the edit form.
 *
 * This field exists because the form used to answer the question silently and
 * wrongly: every save sent `warehouse: true`, so editing the description of a
 * device that was out with a member put it back on the shelf in the item table
 * while the lease still recorded somebody holding it. Two records, one fact,
 * disagreeing — and nothing on screen said it had happened.
 *
 * While the unit is out, the field is read-only on purpose. That fact is the
 * lease's, written by the assignment and return flows, and a record edit has no
 * business restating it. Read-only rather than hidden: the operator asked "can
 * I change this?" and the honest answer is "no, and here is why", not silence.
 */
const StockStateField = ({ item, value, onChange, disabled }) => {
  const inStock = isItemInStock(item);
  const current = String(item?.logistic_status ?? "").trim();

  if (!inStock) {
    return (
      <div className="action-form__field">
        <Label htmlFor="edit-item-stock-state">Where this unit is</Label>
        <div className="edit-item__locked" id="edit-item-stock-state">
          <Typography className="edit-item__locked-value">
            {current === "lost" ? "Lost" : "Out with someone"}
            {current && current !== "lost" ? ` · ${current}` : ""}
          </Typography>
          <Typography className="edit-item__locked-note">
            Set by the handover, not here. Return the unit to change it — every
            other field on this form can still be edited.
          </Typography>
        </div>
      </div>
    );
  }

  const chosen =
    EDITABLE_STOCK_STATES.find((state) => state.value === value) ??
    EDITABLE_STOCK_STATES[0];

  return (
    <div className="action-form__field">
      <Label htmlFor="edit-item-stock-state">Where this unit is</Label>
      <Select
        id="edit-item-stock-state"
        className="custom-autocomplete"
        value={chosen.value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        style={{ ...AntSelectorStyle, width: "100%" }}
      >
        {EDITABLE_STOCK_STATES.map((state) => (
          <MenuItem key={state.value} value={state.value}>
            <Typography>{state.label}</Typography>
          </MenuItem>
        ))}
      </Select>
      <Typography className="edit-item__hint">{chosen.hint}</Typography>
    </div>
  );
};

StockStateField.propTypes = {
  item: PropTypes.object,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

StockStateField.defaultProps = {
  item: null,
  value: "in-stock",
  disabled: false,
};

export default StockStateField;
