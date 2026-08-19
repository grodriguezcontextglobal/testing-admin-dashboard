import { Typography } from "@mui/material";
import { useState } from "react";
import BadgeWithDot from "../../../../../../components/base/badges/badges";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import SelectableTable from "../../../../../../components/UX/tables/SelectableTable";
import ReusableTextArea from "../../../../../../components/UX/inputs/TextArea";
import { matchPastedSerialsToGroup } from "../../../utils/matchPastedSerialsToGroup";
import SerialNumberAndMoreInfoComponentForm from "../SerialNumbersSections";

const TABS = [
  { key: "list", label: "Pick from list" },
  { key: "paste", label: "Paste serials" },
  { key: "scan", label: "Scan" },
];

const statusLabel = (item) => {
  if (item?.logistic_status === "in-stock") return "In warehouse";
  if (item?.logistic_status) return item.logistic_status;
  return Number(item?.warehouse) === 1 ? "In warehouse" : "Elsewhere";
};

const COLUMNS = [
  { title: "Serial number", dataIndex: "serial_number", key: "serial_number" },
  { title: "Location", dataIndex: "location", key: "location", render: (v) => v || "—" },
  { title: "Sub-location", dataIndex: "sub_location", key: "sub_location", render: (v) => v || "—" },
  {
    title: "Status",
    key: "status",
    render: (_, item) => (
      <BadgeWithDot color={item?.logistic_status === "in-stock" || Number(item?.warehouse) === 1 ? "success" : "warning"}>
        {statusLabel(item)}
      </BadgeWithDot>
    ),
  },
  {
    title: "Cost",
    dataIndex: "cost",
    key: "cost",
    render: (v) => (Number.isFinite(Number(v)) ? `$${Number(v).toFixed(2)}` : "—"),
  },
];

/**
 * Step 2: how far the update reaches. This is the one decision that maps
 * directly to the request's `updateAll` flag — whole group true, picked
 * items false + a `list` of serial numbers, exactly as the endpoint expects
 * today, so nothing here changes the contract.
 */
const ScopeStep = ({
  updateAll,
  setUpdateAll,
  scopeMatches,
  scopeSummary,
  scannedSerialNumbers,
  setScannedSerialNumbers,
  setOpenScanningModal,
  generalInfoForSelection,
  moreInfo,
  setMoreInfo,
  goBack,
  goNext,
}) => {
  const [tab, setTab] = useState("list");
  const [pasteText, setPasteText] = useState("");
  const [pasteResult, setPasteResult] = useState(null);

  const picking = !updateAll;

  const addPastedSerials = () => {
    const result = matchPastedSerialsToGroup(pasteText, scopeMatches);
    setPasteResult(result);
    if (result.matchedSerials.length > 0) {
      const merged = [...new Set([...scannedSerialNumbers, ...result.matchedSerials])];
      setScannedSerialNumbers(merged);
    }
    setPasteText("");
  };

  const canContinue = updateAll || scannedSerialNumbers.length > 0;

  return (
    <div style={{ background: "#fff", border: "1px solid var(--gray-200, #eaecf0)", borderRadius: "12px", boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)" }}>
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--gray-200, #eaecf0)" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          How many of the {scopeSummary.matchCount} items are you changing?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Pick one. This is the only thing that decides how far the update reaches.
        </Typography>
      </div>

      <div style={{ padding: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" }}>
          <button
            type="button"
            onClick={() => setUpdateAll(true)}
            style={{
              display: "flex", gap: "12px", padding: "16px", borderRadius: "12px", textAlign: "left",
              border: `1px solid ${updateAll ? "var(--action-600, #155eef)" : "var(--gray-300, #d0d5dd)"}`,
              background: updateAll ? "var(--action-50, #eff4ff)" : "#fff",
              boxShadow: updateAll ? "0 0 0 1px var(--action-600, #155eef)" : "0 1px 2px 0 rgba(16,24,40,0.05)",
              cursor: "pointer",
            }}
          >
            <span style={{ width: "20px", height: "20px", borderRadius: "9999px", border: updateAll ? "6px solid var(--action-600, #155eef)" : "1px solid var(--gray-300, #d0d5dd)", flexShrink: 0, marginTop: "2px" }} />
            <span>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>The whole group</Typography>
              <Typography variant="body2" color="text.secondary">
                All {scopeSummary.matchCount} items that match this selection, whatever their serial number.
              </Typography>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setUpdateAll(false)}
            style={{
              display: "flex", gap: "12px", padding: "16px", borderRadius: "12px", textAlign: "left",
              border: `1px solid ${picking ? "var(--action-600, #155eef)" : "var(--gray-300, #d0d5dd)"}`,
              background: picking ? "var(--action-50, #eff4ff)" : "#fff",
              boxShadow: picking ? "0 0 0 1px var(--action-600, #155eef)" : "0 1px 2px 0 rgba(16,24,40,0.05)",
              cursor: "pointer",
            }}
          >
            <span style={{ width: "20px", height: "20px", borderRadius: "9999px", border: picking ? "6px solid var(--action-600, #155eef)" : "1px solid var(--gray-300, #d0d5dd)", flexShrink: 0, marginTop: "2px" }} />
            <span>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>Only the items I pick</Typography>
              <Typography variant="body2" color="text.secondary">
                Choose them from the list, paste a column of serials, or scan them.
              </Typography>
            </span>
          </button>
        </div>

        {updateAll && (
          <div>
            <div style={{ marginTop: "16px", padding: "24px", border: "1px solid var(--gray-200, #eaecf0)", borderRadius: "12px", background: "var(--gray-50, #f9fafb)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <BadgeWithDot color="warning">{scopeSummary.matchCount} items</BadgeWithDot>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Every item in this group will get the same values
                </Typography>
              </div>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: "720px" }}>
                Serial numbers, locations and per-item identifiers stay as they are. Only the fields you change in step 3 are written, on all {scopeSummary.matchCount} items at once.
              </Typography>
            </div>
            <div style={{ display: "flex", gap: "12px", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--warn-200, #fedf89)", background: "var(--warn-50, #fffaeb)", marginTop: "16px" }}>
              <div>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--warn-700, #b54708)" }}>
                  The group is matched again when the update runs, not now
                </Typography>
                <Typography variant="body2" sx={{ color: "#93370d" }}>
                  If an item is added to this group before the update runs, it is included too. Pick the items one by one if you need the list frozen.
                </Typography>
              </div>
            </div>
          </div>
        )}

        {picking && (
          <div>
            <div style={{ display: "flex", gap: "4px", padding: "4px", background: "var(--gray-100, #f2f4f7)", borderRadius: "8px", width: "fit-content", marginTop: "16px" }}>
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  style={{
                    padding: "6px 12px", borderRadius: "6px", font: "600 14px/20px Inter, sans-serif",
                    color: tab === t.key ? "var(--gray-900, #101828)" : "var(--gray-500, #667085)",
                    background: tab === t.key ? "#fff" : "transparent",
                    boxShadow: tab === t.key ? "0 1px 2px 0 rgba(16,24,40,0.05)" : "none",
                    border: "none", cursor: "pointer",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "list" && (
              <div style={{ marginTop: "16px" }}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
                  <GrayButtonComponent
                    title={`Select all ${scopeMatches.length}`}
                    buttonType="button"
                    size="sm"
                    func={() => setScannedSerialNumbers(scopeMatches.map((m) => m.serial_number))}
                  />
                </div>
                <SelectableTable
                  dataSource={scopeMatches}
                  columns={COLUMNS}
                  rowKey="serial_number"
                  selectionMode="multiple"
                  selectedRowKeys={scannedSerialNumbers}
                  onSelectionChange={(keys) => setScannedSerialNumbers(keys)}
                  pagination={{ defaultPageSize: 8, position: ["bottomCenter"] }}
                />
              </div>
            )}

            {tab === "paste" && (
              <div style={{ marginTop: "16px" }}>
                <ReusableTextArea
                  placeholder={"Paste a column of serial numbers, one per line — a header row is fine.\nSN-1041\nSN-1042"}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  textAreaProps={{ rows: 6 }}
                />
                <div style={{ marginTop: "12px" }}>
                  <BlueButtonComponent title="Add pasted serials" buttonType="button" func={addPastedSerials} disabled={!pasteText.trim()} />
                </div>
                {pasteResult && (
                  <div style={{ marginTop: "12px" }}>
                    <Typography variant="body2" color="text.secondary">
                      {pasteResult.matchedSerials.length} matched this group.
                    </Typography>
                    {pasteResult.unmatched.length > 0 && (
                      <Typography variant="body2" sx={{ color: "var(--warn-700, #b54708)" }}>
                        {pasteResult.unmatched.length} did not match and were skipped: {pasteResult.unmatched.map((u) => u.value).join(", ")}
                      </Typography>
                    )}
                  </div>
                )}
              </div>
            )}

            {tab === "scan" && (
              <div style={{ marginTop: "16px" }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Opens a scanner window. Everything scanned there is added to this same selection.
                </Typography>
                <BlueButtonComponent title="Open scanner" buttonType="button" func={() => setOpenScanningModal(true)} />
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginTop: "16px", padding: "12px 16px", background: "var(--action-50, #eff4ff)", border: "1px solid var(--action-100, #d1e0ff)", borderRadius: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <BadgeWithDot color="blue">
                  {scannedSerialNumbers.length} of {scopeMatches.length} selected
                </BadgeWithDot>
                <Typography variant="body2" color="text.secondary">
                  Paste and Scan add into this same list, so you can mix all three.
                </Typography>
              </div>
              <button
                type="button"
                onClick={() => setScannedSerialNumbers([])}
                style={{ background: "none", border: "none", color: "var(--blue-700, #175cd3)", font: "600 14px/20px Inter, sans-serif", cursor: "pointer" }}
              >
                Clear selection
              </button>
            </div>

            {generalInfoForSelection && (
              <div style={{ marginTop: "16px" }}>
                <SerialNumberAndMoreInfoComponentForm
                  style={{ fontFamily: "Inter", fontSize: "14px", width: "100%" }}
                  moreInfo={moreInfo}
                  scannedSerialNumbers={scannedSerialNumbers}
                  setMoreInfo={setMoreInfo}
                  setScannedSerialNumbers={setScannedSerialNumbers}
                  generalInfoForSelection={generalInfoForSelection}
                  updateAll={updateAll}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderTop: "1px solid var(--gray-200, #eaecf0)", background: "var(--gray-50, #f9fafb)", borderRadius: "0 0 12px 12px" }}>
        <GrayButtonComponent title="Back" buttonType="button" func={goBack} />
        <BlueButtonComponent
          title={updateAll ? `Continue with all ${scopeSummary.matchCount} items` : `Continue with ${scannedSerialNumbers.length} items`}
          buttonType="button"
          func={goNext}
          disabled={!canContinue}
        />
      </div>
    </div>
  );
};

export default ScopeStep;
