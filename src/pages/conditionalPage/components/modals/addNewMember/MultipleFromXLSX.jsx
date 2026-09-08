import { useQueryClient } from "@tanstack/react-query";
import PropTypes from "prop-types";
import { useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { read, utils, writeFile } from "xlsx";
import { registerStaffActivity } from "../../../../../api/activityLog";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { useStatusNotification } from "../../../../../components/notification/alerts/useStatusNotification";
import BlueButtonConfirmationComponent from "../../../../../components/UX/buttons/BlueButtonConfirmation";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import { ProfileStatTiles, StatusChip } from "../../../../../components/UX/profile";
import BaseTable from "../../../../../components/UX/tables/BaseTable";
import "../../../../../styles/global/actionForm.css";
import {
  annotateImportRows,
  generalIssues,
  importCounts,
} from "../../../utils/memberImportPresentation";
import {
  MEMBER_IMPORT_COLUMNS,
  buildTemplateRow,
  columnRequirementLabel,
  validateAndNormalizeRows,
} from "../../../utils/xlsxImportUtils";

const ROW_STATUS = {
  ready: { label: "Ready", tone: "success" },
  warning: { label: "Check", tone: "warning" },
  blocked: { label: "Blocked", tone: "critical" },
};

const stepClass = (done) =>
  `action-form__step${done ? " action-form__step--done" : ""}`;

/**
 * Importing members from a spreadsheet.
 *
 * The problems were about what the screen told you, not about the parsing —
 * `validateAndNormalizeRows` and its tests are unchanged. Errors were printed
 * as a list of "Row 4: …" sentences beside a preview table with no row numbers,
 * so finding the row a message meant was a counting exercise. Each row now
 * carries its own problems and a status, and the tiles say how many will
 * actually import.
 *
 * Two fixes behind the display: a response of `{ ok: false }` fell through the
 * `if` with no `else`, so a refused import closed nothing, said nothing and
 * left you to press the button again; and success was announced with a native
 * `alert()`.
 */
const MultipleFromXLSX = ({ onClose, companyId = null }) => {
  const { user } = useSelector((state) => state.admin);
  const { notify, contextHolder } = useStatusNotification();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState(null);
  const [importing, setImporting] = useState(false);

  const rows = useMemo(
    () => annotateImportRows(parsed?.rows, parsed?.errors, parsed?.warnings),
    [parsed]
  );
  const counts = useMemo(() => importCounts(rows), [rows]);
  const fileIssues = useMemo(
    () => generalIssues(parsed?.errors, parsed?.warnings),
    [parsed]
  );

  const handleDownloadTemplate = () => {
    // Column order pinned to the spec rather than left to object key order, and
    // `header` listed explicitly so a column whose example is blank (image_url)
    // still gets a header cell instead of vanishing from the sheet.
    const sheet = utils.json_to_sheet([buildTemplateRow()], {
      header: MEMBER_IMPORT_COLUMNS.map((column) => column.header),
    });
    const book = utils.book_new();
    utils.book_append_sheet(book, sheet, "Template");
    writeFile(book, "Member_Import_Template.xlsx");
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const book = read(buffer, { type: "array" });
      const sheet = book.Sheets[book.SheetNames[0]];
      const json = utils.sheet_to_json(sheet, { defval: "" });
      setParsed(
        validateAndNormalizeRows(json, user?.sqlInfo?.company_id || companyId)
      );
    } catch (error) {
      setParsed({
        rows: [],
        errors: [`Failed to read file: ${error?.message || String(error)}`],
        warnings: [],
        columnsDetected: [],
      });
    }
  };

  const handleClear = () => {
    setFileName("");
    setParsed(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImport = async () => {
    if (!rows.length || importing || counts.blocked > 0) return;

    setImporting(true);
    try {
      const response = await devitrakApi.post("/db_member/bulk-members", {
        list: parsed.rows,
        company_id: user?.sqlInfo?.company_id,
      });

      // A refused import used to fall straight through this `if` with no
      // `else`: no message, no close, nothing to distinguish it from a click
      // that never registered.
      if (!response?.data?.ok) {
        notify(
          "error",
          "The members could not be imported.",
          response?.data?.message || "The server refused the file. Nothing was saved."
        );
        return;
      }

      registerStaffActivity({
        action: "IMPORT",
        target_model: "Member",
        details: { count: parsed.rows.length },
      });
      // Same gap as the single-create path: two hundred imported members did
      // not appear in the table behind the modal.
      await queryClient.invalidateQueries({ queryKey: ["membersInfoQuery"] });

      notify(
        "success",
        `${parsed.rows.length} member${
          parsed.rows.length === 1 ? "" : "s"
        } imported.`
      );
      onClose();
    } catch (error) {
      notify(
        "error",
        "The members could not be imported.",
        error?.response?.data?.msg || error?.message || "Nothing was saved."
      );
    } finally {
      setImporting(false);
    }
  };

  const previewColumns = [
    { title: "#", dataIndex: "_rowNumber", key: "row", width: 56 },
    { title: "First name", dataIndex: "first_name", key: "first_name" },
    { title: "Last name", dataIndex: "last_name", key: "last_name" },
    { title: "Email", dataIndex: "email", key: "email", responsive: ["lg"] },
    { title: "Phone", dataIndex: "phone", key: "phone", responsive: ["xl"] },
    { title: "Grade", dataIndex: "grade", key: "grade", responsive: ["xl"] },
    {
      title: "Date of birth",
      dataIndex: "date_of_birth",
      key: "date_of_birth",
      responsive: ["lg"],
    },
    {
      title: "Guardian",
      key: "guardian",
      responsive: ["lg"],
      render: (_, row) =>
        `${row.parent_guardian_first_name ?? ""} ${
          row.parent_guardian_last_name ?? ""
        }`.trim() || "—",
    },
    {
      title: "Status",
      key: "status",
      render: (_, row) => (
        <StatusChip
          label={ROW_STATUS[row._status].label}
          tone={ROW_STATUS[row._status].tone}
          pip
        />
      ),
    },
  ];

  return (
    <div className="action-form">
      {contextHolder}

      {/* 1 — the file */}
      <section className={stepClass(rows.length > 0)}>
        <div className="action-form__step-head">
          <h3 className="action-form__step-title">
            <span className="action-form__step-index">1</span>
            Pick the spreadsheet
          </h3>
          <GrayButtonComponent
            size="sm"
            title="Download template"
            buttonType="button"
            func={handleDownloadTemplate}
          />
        </div>

        <div className="action-form__row" style={{ alignItems: "center", gap: 12 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            disabled={importing}
            aria-label="Spreadsheet to import"
          />
          {fileName && (
            <GrayButtonComponent
              size="sm"
              title="Clear"
              buttonType="button"
              disabled={importing}
              func={handleClear}
            />
          )}
        </div>

        {/* Reference material, folded away until asked for. It used to be a
            guided Tour that replaced this whole dialog, taking the file you had
            already loaded with it. */}
        <details className="action-form__details">
          <summary>What the file needs</summary>
          <p className="action-form__step-note">
            Headers are case-insensitive. A row without a date of birth is
            imported as an adult, so notices go to them rather than to a guardian.
          </p>
          <div className="action-form__scroll">
            <BaseTable
              className="profile-table"
              size="small"
              enablePagination={false}
              rowKey={(column) => column.header}
              dataSource={MEMBER_IMPORT_COLUMNS}
              columns={[
                { title: "Column", dataIndex: "header", key: "header" },
                {
                  title: "Required",
                  key: "required",
                  render: (_, column) => columnRequirementLabel(column),
                },
                { title: "Example", dataIndex: "example", key: "example" },
                {
                  title: "What it is",
                  dataIndex: "description",
                  key: "description",
                  responsive: ["lg"],
                },
              ]}
            />
          </div>
        </details>
      </section>

      {/* 2 — what came out of it */}
      {parsed && (
        <section className={stepClass(counts.blocked === 0 && rows.length > 0)}>
          <div className="action-form__step-head">
            <h3 className="action-form__step-title">
              <span className="action-form__step-index">2</span>
              Check what is in it
            </h3>
          </div>

          {fileIssues.length > 0 && (
            <ul className="action-form__notice">
              {fileIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          )}

          {rows.length > 0 && (
            <>
              <ProfileStatTiles
                tiles={[
                  { label: "Rows in the file", value: counts.total },
                  {
                    label: "Blocked",
                    value: counts.blocked,
                    tone: counts.blocked > 0 ? "critical" : "neutral",
                  },
                  { label: "Worth a look", value: counts.warned },
                ]}
              />

              {parsed.columnsDetected?.length > 0 && (
                <p className="action-form__step-note">
                  Columns read: {parsed.columnsDetected.join(", ")}
                </p>
              )}

              <div className="action-form__scroll">
                <BaseTable
                  className="profile-table"
                  columns={previewColumns}
                  dataSource={rows}
                  rowKey={(row) => row.key}
                  enablePagination={rows.length > 10}
                  pageSize={10}
                  size="small"
                  expandable={{
                    // The messages sit on the row they are about instead of in
                    // a separate list that names row numbers the table did not
                    // show.
                    rowExpandable: (row) =>
                      row._errors.length > 0 || row._warnings.length > 0,
                    expandedRowRender: (row) => (
                      <>
                        {row._errors.map((issue) => (
                          <p
                            key={issue}
                            className="action-form__feedback action-form__feedback--error"
                          >
                            {issue}
                          </p>
                        ))}
                        {row._warnings.map((issue) => (
                          <p key={issue} className="action-form__step-note">
                            {issue}
                          </p>
                        ))}
                      </>
                    ),
                  }}
                />
              </div>
            </>
          )}

          {rows.length === 0 && fileIssues.length === 0 && (
            <p className="action-form__empty">
              That sheet has no rows to import.
            </p>
          )}
        </section>
      )}

      <div className="action-form__footer">
        <p className="action-form__consequence">
          {counts.blocked > 0
            ? `${counts.blocked} row${
                counts.blocked === 1 ? "" : "s"
              } must be fixed in the file before any of it can be imported.`
            : "Every row in the file is created as a member."}
        </p>
        <GrayButtonComponent
          title="Cancel"
          buttonType="button"
          disabled={importing}
          func={onClose}
        />
        <BlueButtonConfirmationComponent
          title={
            counts.total > 0
              ? `Import ${counts.total} member${counts.total === 1 ? "" : "s"}`
              : "Import members"
          }
          buttonType="button"
          disabled={rows.length === 0 || counts.blocked > 0 || importing}
          loadingState={importing}
          confirmationTitle={`Import ${counts.total} member${
            counts.total === 1 ? "" : "s"
          }?`}
          confirmationDescription={
            counts.warned > 0
              ? `${counts.warned} of them had something worth a look.`
              : "They are created straight away."
          }
          okText="Import"
          func={handleImport}
        />
      </div>
    </div>
  );
};

MultipleFromXLSX.propTypes = {
  onClose: PropTypes.func.isRequired,
  companyId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default MultipleFromXLSX;
