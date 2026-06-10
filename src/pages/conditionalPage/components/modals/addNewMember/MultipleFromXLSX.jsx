/* eslint-disable no-useless-escape */
import { useCallback, useMemo, useState, useEffect } from "react";
import { Select } from "antd";
import { read, utils } from "xlsx";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { useSelector } from "react-redux";

// Helper to normalize header names to snake_case
const normalizeHeader = (key) =>
  String(key || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

// Map various header variants to target schema keys
const headerAliasMap = {
  "first name": ["first_name", "firstname", "first"],
  "last name": ["last_name", "lastname", "last"],
  email: ["email", "e_mail"],
  phone: ["phone", "phone_number", "phonenumber", "mobile"],
  "external id": ["external_id", "external id", "id"],
  address: ["address", "addr"],
  street: ["address_street", "street", "addr_street", "addres_street"],
  city: ["address_city", "city", "addr_city"],
  state: ["address_state", "state", "addr_state", "province"],
  zip: ["address_zip", "zip", "zip_code", "zipcode", "postal_code"],
  minor: ["minor", "is_minor"],
  "parent guardian first name": [
    "parent_guardian_first_name",
    "guardian_first_name",
  ],
  "parent guardian last name": [
    "parent_guardian_last_name",
    "guardian_last_name",
  ],
  "parent guardian email": ["parent_guardian_email", "guardian_email"],
  "parent guardian phone number": [
    "parent_guardian_phone_number",
    "guardian_phone",
  ],
};

const resolveKey = (normalizedKey) => {
  for (const target in headerAliasMap) {
    if (headerAliasMap[target].includes(normalizedKey)) return target;
  }
  return null;
};

const MultipleFromXLSX = ({ companyId = null }) => {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [columnsDetected, setColumnsDetected] = useState([]);
  const [importing, setImporting] = useState(false);
  const { user } = useSelector((state) => state.admin);

  const requiredCore = useMemo(
    () => ["first name", "last name", "email", "phone"],
    []
  );

  const validateAndNormalize = useCallback(
    (inputRows) => {
      const errs = [];
      const normalized = [];
      const detectedSet = new Set();

      inputRows.forEach((row, idx) => {
        const normalizedRow = {};

        Object.entries(row).forEach(([k, v]) => {
          const nk = normalizeHeader(k);
          const target = resolveKey(nk);
          if (target) {
            normalizedRow[target] = v;
            detectedSet.add(target);
          }
        });

        const missingCore = requiredCore.filter((k) => !normalizedRow[k]);
        if (missingCore.length) {
          errs.push(
            `Row ${idx + 1}: missing required field(s): ${missingCore.join(
              ", "
            )}`
          );
        }

        const isMinor = /true|1|yes/i.test(String(normalizedRow.minor));
        if (isMinor) {
          if (!normalizedRow["parent guardian first name"])
            errs.push(`Row ${idx + 1}: Guardian first name is required for minors.`);
          if (!normalizedRow["parent guardian last name"])
            errs.push(`Row ${idx + 1}: Guardian last name is required for minors.`);
          if (!normalizedRow["parent guardian email"])
            errs.push(`Row ${idx + 1}: Guardian email is required for minors.`);
          if (!normalizedRow["parent guardian phone number"])
            errs.push(
              `Row ${idx + 1}: Guardian phone number is required for minors.`
            );
        }

        const hasParts = ["street", "city", "state", "zip"].every((k) =>
          Boolean(normalizedRow[k])
        );

        const out = {
          first_name: normalizedRow["first name"] || "",
          last_name: normalizedRow["last name"] || "",
          email: normalizedRow.email || "",
          phone: normalizedRow.phone || "",
          external_id: String(normalizedRow["external id"] || ""),
          address:
            normalizedRow.address ||
            (hasParts
              ? `${normalizedRow.street}, ${normalizedRow.city}, ${normalizedRow.state} ${normalizedRow.zip}`
              : ""),
          address_street: normalizedRow.street || "",
          address_city: normalizedRow.city || "",
          address_state: normalizedRow.state || "",
          address_zip: normalizedRow.zip || "",
          company_id: user?.sqlInfo?.company_id || companyId,
          minor: isMinor,
          parent_guardian_first_name:
            normalizedRow["parent guardian first name"] || "",
          parent_guardian_last_name:
            normalizedRow["parent guardian last name"] || "",
          parent_guardian_email: normalizedRow["parent guardian email"] || "",
          parent_guardian_phone_number:
            normalizedRow["parent guardian phone number"] || "",
        };

        normalized.push(out);
      });

      setErrors(errs);
      setColumnsDetected(Array.from(detectedSet));
      setRows(normalized);
    },
    [companyId, requiredCore, user?.sqlInfo?.company_id]
  );

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = read(buf, { type: "array" });
      const wsName = wb.SheetNames[0];
      const ws = wb.Sheets[wsName];
      const json = utils.sheet_to_json(ws, { defval: "" });
      validateAndNormalize(json);
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

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(rows.length / pageSize)),
    [rows, pageSize]
  );
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  const goPrev = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const goNext = useCallback(
    () => setPage((p) => Math.min(totalPages, p + 1)),
    [totalPages]
  );
  const onPageSizeChange = useCallback((val) => {
    setPageSize(parseInt(val, 10) || 10);
    setPage(1);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [rows]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 8 }}>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
        />
        {fileName && <span>{fileName}</span>}
        <GrayButtonComponent
          func={handleClear}
          style={{ marginLeft: "auto", width: "fit-content" }}
          title="Clear"
        />
      </div>

      <div>
        <div>Mandatory columns:</div>
        <ul>
          <li>first name, last name, email, phone</li>
          <li>
            If minor is true, guardian first name, last name, email, and phone
            are required.
          </li>
        </ul>
      </div>

      {columnsDetected.length > 0 && (
        <div>
          <div>Detected columns: {columnsDetected.join(", ")}</div>
        </div>
      )}

      {errors.length > 0 && (
        <div style={{ color: "crimson" }}>
          {errors.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <strong>Preview ({rows.length} rows)</strong>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>Rows per page</span>
              <Select
                value={pageSize}
                onChange={onPageSizeChange}
                options={[
                  { value: 5, label: "5" },
                  { value: 10, label: "10" },
                  { value: 20, label: "20" },
                  { value: 50, label: "50" },
                ]}
                size="small"
                style={{ minWidth: 100 }}
              />
            </label>
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <BlueButtonComponent
                title="Prev"
                func={goPrev}
                disabled={page === 1}
              />
              <span>
                Page {page} / {totalPages}
              </span>
              <BlueButtonComponent
                title={"Next"}
                func={goNext}
                disabled={page === totalPages}
              />
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>External ID</th>
                  <th>Address</th>
                  <th>Minor</th>
                  <th>Guardian Name</th>
                  <th>Guardian Email</th>
                  <th>Guardian Phone</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ borderTop: "1px solid #ddd" }}>{r.first_name}</td>
                    <td style={{ borderTop: "1px solid #ddd" }}>{r.last_name}</td>
                    <td style={{ borderTop: "1px solid #ddd" }}>{r.email}</td>
                    <td style={{ borderTop: "1px solid #ddd" }}>{r.phone}</td>
                    <td style={{ borderTop: "1px solid #ddd" }}>{r.external_id}</td>
                    <td style={{ borderTop: "1px solid #ddd" }}>{r.address}</td>
                    <td style={{ borderTop: "1px solid #ddd" }}>
                      {r.minor ? "Yes" : "No"}
                    </td>
                    <td style={{ borderTop: "1px solid #ddd" }}>
                      {r.parent_guardian_first_name} {r.parent_guardian_last_name}
                    </td>
                    <td style={{ borderTop: "1px solid #ddd" }}>
                      {r.parent_guardian_email}
                    </td>
                    <td style={{ borderTop: "1px solid #ddd" }}>
                      {r.parent_guardian_phone_number}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <BlueButtonComponent
          disabled={!rows.length || importing}
          loadingState={importing}
          func={handleImport}
          title="Import"
        />
      </div>
    </div>
  );
};

export default MultipleFromXLSX;
