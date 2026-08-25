import { OutlinedInput } from "@mui/material";
import { AlertTriangle, Check } from "lucide-react";
import PropTypes from "prop-types";
import { useRef, useState } from "react";
import Chip from "../../../../../../../../components/UX/Chip/Chip";
import { OutlinedInputStyle } from "../../../../../../../../styles/global/OutlinedInputStyle";
import { describeScan, summarizeSelection } from "../../../../utils/deviceScan";
import "../../../../consumerDetail.css";

/**
 * Scan the serials being handed over, one at a time.
 *
 * Replaces "starting serial + quantity", which resolved the request with
 * `pool.slice(index, index + qty)` — no availability check, no check that qty
 * devices existed past that index, and no `else` when the starting serial was
 * not found, in which case the transaction was still saved with nothing
 * assigned to it.
 *
 * Every scan is validated against the pool before it joins the list, and the
 * reason for a rejection is shown under the input where it happened rather than
 * as a toast in the corner. The field keeps focus and clears itself, so a
 * barcode gun can fire straight down a stack of devices.
 */
const SerialScanner = ({
  pool,
  group,
  quantity,
  picked,
  onChange,
  disabled,
}) => {
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState(null);
  const inputRef = useRef(null);

  const progress = summarizeSelection({ picked, quantity });
  const percent =
    progress.quantity === 0
      ? 0
      : Math.min(Math.round((progress.picked / progress.quantity) * 100), 100);

  const commit = (raw) => {
    const result = describeScan({ serial: raw, pool, group, picked, quantity });
    setFeedback(result);
    if (result.ok) {
      onChange([...picked, result.serial]);
      setDraft("");
    }
    // Keep the gun pointed at the field either way: a rejected scan is usually
    // followed immediately by the next device, not by a mouse click.
    inputRef.current?.focus();
  };

  const remove = (serial) => {
    onChange(picked.filter((entry) => entry !== serial));
    setFeedback(null);
    inputRef.current?.focus();
  };

  return (
    <div className="txn__step" style={{ gap: "8px" }}>
      <OutlinedInput
        inputRef={inputRef}
        value={draft}
        disabled={disabled || progress.isComplete}
        autoFocus
        fullWidth
        size="small"
        style={OutlinedInputStyle}
        placeholder={
          progress.isComplete
            ? "All devices scanned"
            : "Scan or type a serial number, then press Enter"
        }
        aria-label="Serial number to add to this transaction"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          // A scanner emits Enter; without this the modal's form would submit
          // the whole transaction on the first device.
          event.preventDefault();
          commit(draft);
        }}
      />

      {picked.length > 0 && (
        <div className="scan__picked">
          {picked.map((serial) => (
            <Chip
              key={serial}
              label={serial}
              variant="filled"
              // `color`, not `variantColor` — the older call sites passed
              // `variantColor="blue"`, which Chip spreads into ...rest and
              // ignores, so every chip in the app rendered as "default".
              color="primary"
              onDelete={disabled ? undefined : () => remove(serial)}
            />
          ))}
        </div>
      )}

      <div
        className={`scan__meter${
          progress.isComplete ? " scan__meter--complete" : ""
        }`}
        role="progressbar"
        aria-valuenow={progress.picked}
        aria-valuemin={0}
        aria-valuemax={progress.quantity}
        aria-label="Serial numbers scanned"
      >
        <span style={{ width: `${percent}%` }} />
      </div>

      {feedback && feedback.code !== "empty" && (
        <p
          className={`scan__feedback scan__feedback--${
            feedback.ok ? "ok" : "error"
          }`}
          role={feedback.ok ? "status" : "alert"}
        >
          {feedback.ok ? (
            <Check size={15} style={{ flex: "none", marginTop: 1 }} />
          ) : (
            <AlertTriangle size={15} style={{ flex: "none", marginTop: 1 }} />
          )}
          {feedback.message}
        </p>
      )}
    </div>
  );
};

SerialScanner.propTypes = {
  pool: PropTypes.array,
  group: PropTypes.string,
  quantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  picked: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

SerialScanner.defaultProps = {
  pool: [],
  group: null,
  quantity: 1,
  disabled: false,
};

export default SerialScanner;
