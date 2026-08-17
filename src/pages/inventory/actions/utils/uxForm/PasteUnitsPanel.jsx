import { Typography } from "@mui/material";
import { Alert, Checkbox, Table } from "antd";
import { useMemo, useState } from "react";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import TextArea from "../../../../../components/UX/inputs/TextArea";
import parsePastedInventoryRows, {
  MAX_PASTED_LINES,
} from "../parsePastedInventoryRows";

/**
 * Bulk entry by pasting a table of units.
 *
 * The input is whatever the clipboard holds after copying a range in Excel:
 * a header row of column names and one row per unit, tab separated. One column
 * becomes the serial number and the rest become that unit's extra identifiers,
 * which may differ from unit to unit.
 *
 * Nothing is imported straight from the textarea. The preview below it is the
 * point: it shows exactly which units will be created, which column was taken
 * as the serial, and every row that will be skipped together with the reason.
 * A parser that guesses at a malformed row puts wrong serial numbers into
 * inventory, and a wrong serial number is not something the next screen can
 * detect.
 */
const PLACEHOLDER = [
  "Serial Number\tIMEI\tDevice ID",
  "sdffaf1\tkdhfhk\td654f64",
  "sdffaf2\toirl\t65u3rtet6",
].join("\n");

const PasteUnitsPanel = ({ existingSerials, onAdd }) => {
  const [text, setText] = useState("");
  const [hasHeaderRow, setHasHeaderRow] = useState(true);

  const parsed = useMemo(
    () =>
      parsePastedInventoryRows(text, { hasHeaderRow, existingSerials }),
    [text, hasHeaderRow, existingSerials],
  );

  const previewColumns = useMemo(
    () =>
      parsed.columns.map((column, index) => ({
        title: column.isPrimary ? (
          <span>
            {column.label}{" "}
            <span style={{ color: "var(--blue-dark-600, #155dee)" }}>
              · serial number
            </span>
          </span>
        ) : (
          column.label
        ),
        key: `${column.label}-${index}`,
        render: (_, unit) =>
          column.isPrimary
            ? unit.serial
            : (unit.identifiers.find(
                (entry) => entry.keyObject === column.label,
              )?.valueObject ?? (
                <span style={{ color: "var(--gray-400, #98A2B3)" }}>—</span>
              )),
      })),
    [parsed.columns],
  );

  const clear = () => setText("");

  const add = () => {
    onAdd(parsed.items);
    setText("");
  };

  return (
    <div style={{ width: "100%" }}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ width: "100%", textAlign: "left", mb: 1 }}
      >
        Copy the rows straight out of your spreadsheet and paste them here. The
        column named <strong>serial_number</strong> is used as each unit&apos;s
        serial; if there is no such column, the first one is used. Every other
        column becomes an extra identifier, and units do not have to carry the
        same ones. Up to {MAX_PASTED_LINES.toLocaleString()} lines per paste,
        header row included — paste again for the next batch.
      </Typography>

      <TextArea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={PLACEHOLDER}
        rows={8}
        style={{ width: "100%", fontFamily: "monospace", fontSize: "13px" }}
      />

      <Checkbox
        checked={hasHeaderRow}
        onChange={(event) => setHasHeaderRow(event.target.checked)}
        style={{ margin: "12px 0" }}
      >
        The first row is column names
      </Checkbox>

      {text.trim() !== "" && (
        <>
          {parsed.error?.code === "too_many_lines" && (
            <Alert
              type="error"
              showIcon
              style={{ margin: "8px 0" }}
              message={`Too many lines: ${parsed.error.lines.toLocaleString()} (limit ${parsed.error.limit.toLocaleString()}, including the header row)`}
              description="Nothing was read from this paste — none of it is imported, so there is no partial group to reconcile. Split the spreadsheet into smaller batches and paste them one after another; units already added stay in the list below."
            />
          )}

          {!parsed.error && parsed.items.length > 0 && (
            <>
              <Typography
                variant="body1"
                sx={{ fontWeight: 600, textAlign: "left", mb: 1 }}
              >
                {parsed.items.length} unit
                {parsed.items.length === 1 ? "" : "s"} will be added
              </Typography>
              <Table
                columns={previewColumns}
                dataSource={parsed.items}
                rowKey="line"
                size="small"
                className="table-ant-customized"
                scroll={{ x: "max-content", y: 280 }}
                pagination={
                  parsed.items.length > 25
                    ? { pageSize: 25, position: ["bottomCenter"] }
                    : false
                }
              />
            </>
          )}

          {!parsed.error && parsed.items.length === 0 && (
            <Alert
              type="warning"
              showIcon
              style={{ margin: "8px 0" }}
              message="Nothing to add"
              description={
                hasHeaderRow
                  ? "Only a header row was found. If your paste has no column names, untick the checkbox above."
                  : "No rows could be read from this text."
              }
            />
          )}

          {parsed.skipped.length > 0 && (
            <Alert
              type="warning"
              showIcon
              style={{ margin: "8px 0" }}
              message={`${parsed.skipped.length} row${
                parsed.skipped.length === 1 ? "" : "s"
              } will be skipped`}
              description={
                <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
                  {parsed.skipped.slice(0, 10).map((row) => (
                    <li key={row.line}>
                      Line {row.line}: {row.reason}
                    </li>
                  ))}
                  {parsed.skipped.length > 10 && (
                    <li>…and {parsed.skipped.length - 10} more</li>
                  )}
                </ul>
              }
            />
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <BlueButtonComponent
              title={`Add ${parsed.items.length} unit${
                parsed.items.length === 1 ? "" : "s"
              }`}
              buttonType="button"
              func={add}
              disabled={parsed.items.length === 0}
              styles={{ width: "fit-content" }}
            />
            <GrayButtonComponent
              title="Clear"
              buttonType="button"
              func={clear}
              styles={{ width: "fit-content" }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default PasteUnitsPanel;
