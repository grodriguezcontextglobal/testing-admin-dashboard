import { Typography } from "@mui/material";
import PropTypes from "prop-types";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";

/**
 * A sub-location typed and not added (meeting 2026-09-29 `20:26`). Without
 * this it was dropped in silence when the group was created; now the step
 * says so, and puts both ways out next to it — add it, or clear it.
 */
const PendingSubLocationNotice = ({ value, onAdd, onClear }) => {
  if (!value) return null;

  return (
    <div
      role="status"
      style={{
        display: "flex",
        gap: "12px",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        padding: "12px 16px",
        borderRadius: "8px",
        border: "1px solid var(--warn-200, #fedf89)",
        background: "var(--warn-50, #fffaeb)",
        marginTop: "16px",
      }}
    >
      <div>
        <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--warn-700, #b54708)" }}>
          “{value}” is not added yet.
        </Typography>
        <Typography variant="body2" sx={{ color: "#93370d" }}>
          Add it as a sub-location, or clear the field, to continue.
        </Typography>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <GrayButtonComponent title="Clear" buttonType="button" size="sm" func={onClear} />
        <BlueButtonComponent
          title="Add sub-location"
          buttonType="button"
          size="sm"
          func={() => onAdd(value)}
        />
      </div>
    </div>
  );
};

PendingSubLocationNotice.propTypes = {
  value: PropTypes.string,
  onAdd: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};

export default PendingSubLocationNotice;
