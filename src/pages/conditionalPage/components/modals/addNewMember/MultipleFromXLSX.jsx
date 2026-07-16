import { useState } from "react";
import { useSelector } from "react-redux";
import { read, utils } from "xlsx";
import { devitrakApi } from "../../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import BaseTable from "../../../../../components/UX/tables/BaseTable";
import { validateAndNormalizeRows } from "../../../utils/xlsxImportUtils";

const sectionText = {
  fontFamily: "Inter",
  fontSize: "14px",
  fontWeight: 400,
  color: "var(--gray-600, #475467)",
  margin: 0,
};

const cellStyle = {
  fontFamily: "Inter",
  fontSize: "12px",
  fontWeight: 400,
  color: "var(--gray-600, #475467)",
};

const columns = [
  { title: "First Name", dataIndex: "first_name", key: "first_name" },
  { title: "Last Name", dataIndex: "last_name", key: "last_name" },
  { title: "Email", dataIndex: "email", key: "email", responsive: ["lg"] },
  { title: "Phone", dataIndex: "phone", key: "phone", responsive: ["lg"] },
  { title: "External ID", dataIndex: "external_id", key: "external_id", responsive: ["lg"] },
  { title: "Address", dataIndex: "address", key: "address", responsive: ["lg"] },
  {
    title: "Minor",
    dataIndex: "minor",
    key: "minor",
    render: (minor) => (minor ? "Yes" : "No"),
  },
  {
    title: "Guardian",
    key: "guardian",
    responsive: ["lg"],
    render: (_, r) =>
      `${r.parent_guardian_first_name} ${r.parent_guardian_last_name}`.trim(),
  },
].map((c) => ({
  ...c,
  render: c.render || ((v) => <span style={cellStyle}>{v}</span>),
}));

const MultipleFromXLSX = ({ companyId = null }) => {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [columnsDetected, setColumnsDetected] = useState([]);
  const [importing, setImporting] = useState(false);
  const { user } = useSelector((state) => state.admin);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = utils.sheet_to_json(ws, { defval: "" });
      const result = validateAndNormalizeRows(
        json,
        user?.sqlInfo?.company_id || companyId
      );
      setErrors(result.errors);
      setColumnsDetected(result.columnsDetected);
      setRows(result.rows);
    } catch (err) {
      setErrors([`Failed to read file: ${err?.message || String(err)}`]);
      setRows([]);
    }
  };

  const handleClear = () => {
    setFileName("");
    setRows([]);
    setErrors([]);
    setColumnsDetected([]);
  };

  const handleImport = async () => {
    if (!rows.length || importing) return;
    try {
      setImporting(true);
      const fetching = await devitrakApi.post("/db_member/bulk-members", {
        list: rows,
        company_id: user?.sqlInfo?.company_id,
      });
      if (fetching?.data?.ok) {
        setErrors([]);
        alert(fetching?.data?.message || "Successfully imported rows.");
      }
    } catch (error) {
      setErrors([`Failed to import rows: ${error?.message || String(error)}`]);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          border: "1px solid var(--gray-200, #EAECF0)",
          borderRadius: "12px",
          padding: "12px 16px",
          background: "var(--gray-50, #F9FAFB)",
        }}
      >
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          style={{ fontFamily: "Inter", fontSize: "14px" }}
        />
        {fileName && <span style={sectionText}>{fileName}</span>}
        <GrayButtonComponent
          func={handleClear}
          style={{ marginLeft: "auto", width: "fit-content" }}
          title="Clear"
          size="sm"
        />
      </div>

      <div>
        <p style={{ ...sectionText, fontWeight: 600, color: "var(--gray-700, #344054)" }}>
          Mandatory columns
        </p>
        <ul style={{ margin: "4px 0 0", paddingLeft: "20px" }}>
          <li style={sectionText}>first name, last name, email, phone</li>
          <li style={sectionText}>
            If minor is true, guardian first name, last name, email, and phone
            are required.
          </li>
        </ul>
      </div>

      {columnsDetected.length > 0 && (
        <p style={sectionText}>Detected columns: {columnsDetected.join(", ")}</p>
      )}

      {errors.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {errors.map((e, i) => (
            <span
              key={i}
              style={{ ...cellStyle, color: "var(--error, #B42318)" }}
            >
              {e}
            </span>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <div>
          <p
            style={{
              ...sectionText,
              fontWeight: 600,
              color: "var(--gray-900, #101828)",
              marginBottom: "8px",
            }}
          >
            Preview ({rows.length} row{rows.length !== 1 ? "s" : ""})
          </p>
          <BaseTable
            style={{ width: "100%" }}
            dataSource={rows.map((r, i) => ({ ...r, key: i }))}
            columns={columns}
            rowClassName="editable-row"
            className="table-ant-customized"
            enablePagination={true}
            pageSize={5}
          />
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
          paddingTop: "16px",
          borderTop: "1px solid var(--gray-200, #EAECF0)",
        }}
      >
        <BlueButtonComponent
          isDisabled={!rows.length || importing}
          isLoading={importing}
          func={handleImport}
          title="Import"
          styles={{ width: "fit-content" }}
        />
      </div>
    </div>
  );
};

export default MultipleFromXLSX;
