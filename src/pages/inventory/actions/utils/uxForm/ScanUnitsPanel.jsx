import { Typography } from "@mui/material";
import { Alert } from "antd";
import { useEffect, useRef, useState } from "react";
import Input from "../../../../../components/UX/inputs/Input";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import { acceptScan, SCAN_STATUS } from "../scanQueue";

/**
 * Scan units in, one label at a time.
 *
 * The whole mode is one field that never loses focus. A scanner types the code
 * and sends Enter; the unit is recorded, the field empties, and the caret is
 * already waiting for the next label — so a box of fifty devices is fifty
 * trigger pulls with no mouse and no keyboard.
 *
 * Nothing else is collected. Units created here carry a serial number and no
 * extra identifiers, which is exactly what the insert already expects: the
 * serials become `list` and `extra_serial_number` stays an empty array. No
 * change to the payload, no change to the server.
 *
 * A duplicate does not interrupt the rhythm: it is announced, the field clears,
 * and scanning continues. Anything that required a click to dismiss would be
 * worse than the duplicate.
 */
const ScanUnitsPanel = ({ existingSerials, onScan }) => {
  const [value, setValue] = useState("");
  const [lastResult, setLastResult] = useState(null);
  const inputRef = useRef(null);

  const focusInput = () => inputRef.current?.focus?.();

  // Focused on open and re-focused after every read, plus anywhere in the panel
  // brings it back — but deliberately not on blur. Forcing focus back on blur
  // would make this a focus trap: the user could not reach the mode selector to
  // leave, nor the rest of the form to save.
  useEffect(() => {
    focusInput();
  }, []);

  const submit = () => {
    const result = acceptScan(value, existingSerials);
    if (result.status === SCAN_STATUS.ADDED) onScan(result.serial);
    if (result.status !== SCAN_STATUS.EMPTY) setLastResult(result);
    setValue("");
    focusInput();
  };

  const handleKeyDown = (event) => {
    // Scanners end a read with Enter. So does a person typing one by hand.
    if (event.key !== "Enter") return;
    event.preventDefault();
    submit();
  };

  const scannedCount = existingSerials?.length ?? 0;

  return (
    <div style={{ width: "100%" }} onClick={focusInput}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ width: "100%", textAlign: "left", mb: 2 }}
      >
        Point the scanner at each label and pull the trigger. Every read is
        recorded and the field clears itself, ready for the next one — you never
        have to touch the keyboard. Units added this way carry a serial number
        and nothing else; use <strong>One at a time</strong> if a unit needs
        extra identifiers.
      </Typography>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <Input
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scan or type a serial number and press Enter"
          autoFocus
          fullWidth
        />
        <BlueButtonComponent
          title="Add"
          buttonType="button"
          func={submit}
          styles={{ width: "fit-content" }}
          titleStyles={{ textTransform: "none" }}
        />
      </div>

      <Typography
        variant="body2"
        sx={{ width: "100%", textAlign: "left", mt: 1, fontWeight: 600 }}
      >
        {scannedCount} scanned
      </Typography>

      {lastResult?.status === SCAN_STATUS.ADDED && (
        <Alert
          type="success"
          showIcon
          style={{ marginTop: "8px" }}
          message={`Added ${lastResult.serial}`}
        />
      )}

      {lastResult?.status === SCAN_STATUS.DUPLICATE && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: "8px" }}
          message={`${lastResult.serial} was already scanned — not added again`}
        />
      )}
    </div>
  );
};

export default ScanUnitsPanel;
