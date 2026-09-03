import { Grid, Typography } from "@mui/material";
import { AutoComplete, Checkbox, Divider, message, Radio } from "antd";
import { uniqueId } from "lodash";
import { useState } from "react";
import { WhiteCirclePlusIcon } from "../../../../../components/icons/WhiteCirclePlusIcon";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../../../components/UX/buttons/DangerButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import Input from "../../../../../components/UX/inputs/Input";
import AddedUnitsTable from "./AddedUnitsTable";
import PasteUnitsPanel from "./PasteUnitsPanel";
import ScanUnitsPanel from "./ScanUnitsPanel";
import { matchesTypedText } from "../referenceLookup";

const options = [{ value: "Serial number", label: "Serial number" }];

const newRow = () => ({
  id: uniqueId("identifier-"),
  type: "Serial number",
  value: "",
});

/**
 * The units that make up a new group, and the identifiers each one carries.
 *
 * Three ways in, because the jobs are different:
 *
 *   Paste a table  — the volume case with data. Already in a spreadsheet, so it
 *                    is pasted rather than transcribed. See PasteUnitsPanel.
 *   Scan labels    — the volume case without data. One field that never loses
 *                    focus; a scanner fills it and moves on. See ScanUnitsPanel.
 *   One at a time  — a handful of units, or one that needs identifiers the
 *                    others do not have.
 *
 * All three produce the same thing: `scannedSerialNumbers` (which becomes the
 * insert payload's `list`) and `moreInfo` (which becomes `extra_serial_number`).
 * Units with no identifiers contribute nothing to `moreInfo`, so a group built
 * entirely by scanning sends `extra_serial_number: "[]"` — the existing
 * contract, unchanged, with no server work needed to support the mode.
 *
 * The serial itself is no longer repeated inside a unit's identifiers. It used
 * to be stored both as the unit's serial_number and as an extra identifier
 * named "Serial number", which showed up as a redundant row when editing the
 * item; pasted units never had it, so the two modes disagreed.
 */
const SerialNumberAndMoreInfoComponentForm = ({
  style,
  moreInfo,
  scannedSerialNumbers,
  setScannedSerialNumbers,
  setMoreInfo,
}) => {
  const [mode, setMode] = useState("one");
  /**
   * Seeded from what the parent already holds, because the wizard renders this
   * step conditionally: stepping to Review unmounts it and stepping back gives
   * a fresh component. Starting from [] meant the next commit() republished
   * only the unit just added and silently dropped every earlier one — three
   * staged units plus one more created one item.
   *
   * A lazy initialiser, so it rebuilds on mount and never fights later edits.
   */
  const [units, setUnits] = useState(() =>
    (scannedSerialNumbers ?? []).map((serial) => ({
      id: uniqueId("unit-"),
      serial,
      identifiers:
        (moreInfo ?? []).find(
          (entry) => entry && Object.prototype.hasOwnProperty.call(entry, serial),
        )?.[serial] ?? [],
    })),
  );
  const [identifiers, setIdentifiers] = useState([newRow()]);
  const [primaryRow, setPrimaryRow] = useState(0);

  /**
   * The parent owns both lists, so every change to `units` republishes them.
   * moreInfo is written in the canonical extra_serial_number shape —
   * [{ serial: entries }] — so the insert can stringify it as-is.
   */
  const commit = (next) => {
    setUnits(next);
    setScannedSerialNumbers(next.map((unit) => unit.serial));
    setMoreInfo(
      next
        .filter((unit) => unit.identifiers.length > 0)
        .map((unit) => ({ [unit.serial]: unit.identifiers })),
    );
  };

  const isDuplicate = (serial) =>
    units.some(
      (unit) => unit.serial.toLowerCase() === String(serial).trim().toLowerCase(),
    );

  const addPastedUnits = (parsedItems) => {
    // The parser already dropped duplicates against `existingSerials`, so
    // everything arriving here is new.
    const added = parsedItems.map((item) => ({
      id: uniqueId("unit-"),
      serial: item.serial,
      identifiers: item.identifiers,
    }));
    commit([...units, ...added]);
    message.success(
      `${added.length} unit${added.length === 1 ? "" : "s"} added.`,
    );
  };

  /**
   * One scan, one unit, no identifiers — so it contributes nothing to moreInfo
   * and the payload's extra_serial_number stays "[]". The panel has already
   * rejected duplicates against `scannedSerialNumbers`.
   */
  const addScannedUnit = (serial) =>
    commit([...units, { id: uniqueId("unit-"), serial, identifiers: [] }]);

  const handleIdentifierChange = (id, field, value) =>
    setIdentifiers((rows) =>
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );

  const addIdentifierRow = () => setIdentifiers((rows) => [...rows, newRow()]);

  const removeIdentifierRow = (id) =>
    setIdentifiers((rows) =>
      rows.length === 1 ? rows : rows.filter((row) => row.id !== id),
    );

  const addSingleUnit = () => {
    // A row left completely blank is someone who clicked "+" and changed their
    // mind, not an error worth blocking on.
    const filled = identifiers.filter(
      (row) => row.type?.trim() || row.value?.trim(),
    );
    const halfFilled = filled.find(
      (row) => !row.type?.trim() || !row.value?.trim(),
    );
    if (halfFilled) {
      return message.warning(
        "Every identifier needs both a name and a value.",
      );
    }

    const primary = filled[primaryRow] ?? filled[0];
    const serial = primary?.value?.trim();
    if (!serial) {
      return message.warning("Enter the serial number for this unit.");
    }
    if (isDuplicate(serial)) {
      return message.warning(`${serial} is already in the list.`);
    }

    commit([
      ...units,
      {
        id: uniqueId("unit-"),
        serial,
        identifiers: filled
          .filter((row) => row !== primary)
          .map((row) => ({
            keyObject: row.type.trim(),
            valueObject: row.value.trim(),
          })),
      },
    ]);

    setIdentifiers([newRow()]);
    setPrimaryRow(0);
  };

  /**
   * Enter adds the unit. It used to add another identifier row, which made the
   * mode unusable with a barcode scanner: a scanner types the code and then
   * sends Enter, so every scan produced an empty row instead of a unit.
   * Adding a row is what the + button is for.
   */
  const handleKeyDown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addSingleUnit();
  };

  const removeUnit = (id) => commit(units.filter((unit) => unit.id !== id));

  return (
    <Grid container spacing={1}>
      <Grid item xs={12}>
        <Typography
          variant="h5"
          sx={{ width: "100%", textAlign: "left", mb: 0.5, fontWeight: "bold" }}
        >
          Serial numbers and identifiers
        </Typography>

        <Radio.Group
          value={mode}
          onChange={(event) => setMode(event.target.value)}
          style={{ margin: "0.5rem 0 1rem" }}
        >
          <Radio value="one">One at a time</Radio>
          <Radio value="scan">Scan Serial Numbers</Radio>
          <Radio value="paste">Paste a list</Radio>
        </Radio.Group>

        {mode === "paste" && (
          <PasteUnitsPanel
            existingSerials={scannedSerialNumbers ?? []}
            onAdd={addPastedUnits}
          />
        )}

        {mode === "scan" && (
          <ScanUnitsPanel
            existingSerials={scannedSerialNumbers ?? []}
            onScan={addScannedUnit}
          />
        )}

        {mode === "one" && (
          <div style={{ width: "100%" }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ width: "100%", textAlign: "left", mb: 2 }}
            >
              For a handful of units, or one that carries identifiers the others
              do not. Tick the identifier that holds the serial number; the first
              one is used if you tick none. For serial numbers alone, in volume,
              use <strong>Scan labels</strong>. A scanner works here too — it
              types the
              code and presses Enter, which adds the unit.
            </Typography>

            <Grid container>
              <Grid item xs={12} sm={3} md={1} lg={1}>
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  Serial *
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4} md={4} lg={4}>
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  Identifier *
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4} md={4} lg={4}>
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  Value *
                </Typography>
              </Grid>
            </Grid>

            {identifiers.map((identifier, index) => (
              <Grid
                container
                spacing={1}
                key={identifier.id}
                sx={{ margin: 0, alignItems: "center" }}
              >
                <Grid item xs={12} sm={3} md={1} lg={1}>
                  <Checkbox
                    checked={primaryRow === index}
                    onChange={() => setPrimaryRow(index)}
                  />
                </Grid>
                <Grid item xs={12} sm={4} md={4} lg={4}>
                  <AutoComplete
                    style={{ ...style, margin: "0 0 0 -8px", width: "95%" }}
                    options={options}
                    value={identifier.type}
                    onChange={(value) =>
                      handleIdentifierChange(identifier.id, "type", value)
                    }
                    onKeyDown={handleKeyDown}
                    filterOption={matchesTypedText}
                    placeholder="Select or type a name"
                  />
                </Grid>
                <Grid item xs={12} sm md lg display="flex" gap={0.5}>
                  <Input
                    placeholder="e.g. 3241684981556474651"
                    value={identifier.value}
                    onChange={(event) =>
                      handleIdentifierChange(
                        identifier.id,
                        "value",
                        event.target.value,
                      )
                    }
                    onKeyDown={handleKeyDown}
                    style={{ width: "100%", margin: "0 0 0 -8px" }}
                    allowClear
                  />
                  <BlueButtonComponent
                    title={`Add new identifier`}
                    buttonType="button"
                    func={addIdentifierRow}
                    icon={<WhiteCirclePlusIcon />}
                  />
                  {identifiers.length > 1 && (
                    <DangerButtonComponent
                      title="Remove"
                      buttonType="button"
                      func={() => removeIdentifierRow(identifier.id)}
                    />
                  )}
                </Grid>
              </Grid>
            ))}

            <div style={{ marginTop: "1rem" }}>
              <GrayButtonComponent
                buttonType="button"
                func={addSingleUnit}
                title="Queue this item for creation"
                styles={{ width: "fit-content" }}
              />
            </div>
          </div>
        )}
      </Grid>

      <Divider />
      <AddedUnitsTable units={units} onRemove={removeUnit} />
    </Grid>
  );
};

export default SerialNumberAndMoreInfoComponentForm;
