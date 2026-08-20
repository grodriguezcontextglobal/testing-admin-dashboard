import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../../../components/UX/buttons/GrayButton";
import useAddingByStartingSerialNumber from "../EditingEventInventoryActions/addingByStartingSerialNumber";
import useAddingItemsToEventInventoryOneByOne from "../EditingEventInventoryActions/addingOneByOne";
import "./addStockWizard.css";
import {
  buildReviewRows,
  describeRangePreview,
  describeScanList,
  describeStepper,
  describeWizardFooter,
  filterStockRows,
} from "../../utils/eventStockFlow";

/* ── icons ─────────────────────────────────────────────────────────────── */

const IconRows = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16M4 12h16M4 17h10" />
  </svg>
);

const IconScan = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M11 8v8M15 8v8" />
  </svg>
);

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const IconWarn = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

const IconInfo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

const IconDone = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/* ── the wizard ────────────────────────────────────────────────────────── */

/**
 * Adding company stock to an event, in three steps: pick the stock, say how
 * many, review what will be written.
 *
 * The write path is untouched — both submits still go through
 * `useAddingByStartingSerialNumber` and `useAddingItemsToEventInventoryOneByOne`
 * with the same inputs they always took (`data.starting`, `data.quantity`,
 * `data.deposit`, and the `serialNumbers` option), so every payload the server
 * receives is unchanged.
 *
 * The two preview reads are the SAME read-only queries those submits already
 * run — `inventory.assignableFromSerial` and `inventory.assignableBySerials` —
 * just issued earlier, so the person can see which devices they are about to
 * commit instead of finding out afterwards.
 */
const AddStockWizard = ({
  closeModal,
  handleSubmit,
  loadingStatus,
  openNotification,
  queryClient,
  register,
  setLoadingStatus,
  stockRows,
  valueItemSelected,
  setValueItemSelected,
  watch,
}) => {
  const { user } = useSelector((state) => state.admin);
  const [step, setStep] = useState("1");
  const [mode, setMode] = useState("range");
  const [query, setQuery] = useState("");
  const [scanned, setScanned] = useState([]);
  const [scanDraft, setScanDraft] = useState("");
  const [addedCount, setAddedCount] = useState(0);

  const startSerial = watch("starting");
  const quantity = watch("quantity");
  const deposit = watch("deposit");

  const picked = useMemo(() => {
    if (!valueItemSelected || !valueItemSelected.item_group) return null;
    return {
      category: valueItemSelected.category_name,
      group: valueItemSelected.item_group,
      location: valueItemSelected.location,
      qty: Number(valueItemSelected.qty) || 0,
    };
  }, [valueItemSelected]);

  const scopeParams = picked
    ? {
        location: picked.location,
        itemGroup: picked.group,
        categoryName: picked.category,
      }
    : null;

  /* ── the consecutive-run preview: the submit's own query, run early ──── */
  const trimmedStart = String(startSerial ?? "").trim();
  const wantedQty = Number(quantity);
  const canPreview =
    Boolean(scopeParams) &&
    trimmedStart !== "" &&
    Number.isFinite(wantedQty) &&
    wantedQty > 0;

  const rangeQuery = useQuery({
    queryKey: ["assignableFromSerial", scopeParams, trimmedStart, wantedQty],
    queryFn: async () => {
      const response = await devitrakApi.post("/db_event/inventory-query", {
        queryName: "inventory.assignableFromSerial",
        params: {
          ...scopeParams,
          startingSerial: trimmedStart,
          quantity: wantedQty,
        },
      });
      const rows = response.data?.result ?? [];
      return rows.map((row) => row.serial_number);
    },
    enabled: canPreview && mode === "range",
    refetchOnWindowFocus: false,
  });

  // Distinguishes "that serial is not here" from "it is here but last", which
  // are different things to tell someone. Same query the submit runs first.
  const exactQuery = useQuery({
    queryKey: ["assignableExactSerial", scopeParams, trimmedStart],
    queryFn: async () => {
      const response = await devitrakApi.post("/db_event/inventory-query", {
        queryName: "inventory.assignableExactSerial",
        params: { ...scopeParams, serialNumber: trimmedStart },
      });
      return (response.data?.result ?? []).length > 0;
    },
    enabled: canPreview && mode === "range",
    refetchOnWindowFocus: false,
  });

  const preview = describeRangePreview({
    startSerial: trimmedStart,
    requestedQty: quantity,
    resolvedSerials: rangeQuery.data,
    startExists: exactQuery.data,
    checking: rangeQuery.isFetching || exactQuery.isFetching,
  });

  /* ── scan mode: validate each serial against this location ───────────── */
  const scanQuery = useQuery({
    queryKey: ["assignableBySerials", scopeParams, scanned],
    queryFn: async () => {
      const response = await devitrakApi.post("/db_event/inventory-query", {
        queryName: "inventory.assignableBySerials",
        params: { ...scopeParams, serialNumbers: scanned },
      });
      const rows = response.data?.result ?? [];
      return rows.map((row) => row.serial_number);
    },
    enabled: Boolean(scopeParams) && mode === "scan" && scanned.length > 0,
    refetchOnWindowFocus: false,
  });

  const scanList = describeScanList(
    scanned,
    scanQuery.isFetching ? null : scanQuery.data,
  );

  /* ── what the write will carry ────────────────────────────────────────── */
  const serials = mode === "range" ? preview.serials : scanList.goodSerials;
  const reviewRows = buildReviewRows({ picked, serials, deposit });
  const steps = describeStepper(step);
  const footer = describeWizardFooter({
    step,
    count: step === "done" ? addedCount : serials.length,
    hasPicked: Boolean(picked),
    submitting: loadingStatus,
  });

  const visibleRows = useMemo(
    () => filterStockRows(stockRows, query),
    [stockRows, query],
  );

  /* ── submits: the existing hooks, unchanged ──────────────────────────── */
  const rangeSubmit = useAddingByStartingSerialNumber({
    closeModal: () => setStep("done"),
    openNotification,
    queryClient,
    setLoadingStatus,
  });

  const scanSubmit = useAddingItemsToEventInventoryOneByOne({
    closeModal: () => setStep("done"),
    openNotification,
    queryClient,
    setLoadingStatus,
    serialNumbers: scanList.goodSerials,
  });

  const onConfirm = handleSubmit(async (data) => {
    setAddedCount(serials.length);
    if (mode === "range") return rangeSubmit(data);
    return scanSubmit(data);
  });

  const pickRow = (row) => {
    setValueItemSelected({
      category_name: row.category,
      item_group: row.group,
      location: row.location,
      qty: row.qty,
    });
    setScanned([]);
    setStep("2");
  };

  const addScan = () => {
    const value = scanDraft.trim();
    if (value === "" || scanned.includes(value)) return;
    setScanned([...scanned, value]);
    setScanDraft("");
  };

  const startAnother = () => {
    setValueItemSelected({});
    setScanned([]);
    setScanDraft("");
    setQuery("");
    setAddedCount(0);
    setStep("1");
  };

  const goNext = () => {
    if (step === "1") setStep("2");
    else if (step === "2") setStep("3");
  };

  return (
    <div className="asw">
      {/* ── stepper ── */}
      <div className="asw-steps">
        {steps.map((entry, index) => (
          <div className={`asw-step asw-step--${entry.state}`} key={entry.id}>
            <button
              type="button"
              className={`asw-step__btn${entry.canRevisit ? " asw-step__btn--link" : ""}`}
              onClick={() => entry.canRevisit && setStep(entry.id)}
              disabled={!entry.canRevisit}
            >
              <span className="asw-step__badge">
                {entry.badge === "done" ? <IconCheck /> : entry.badge}
              </span>
              <span className="asw-step__label">{entry.label}</span>
            </button>
            {index < steps.length - 1 && <span className="asw-step__rule" />}
          </div>
        ))}
      </div>

      {/* ══ STEP 1 — pick the stock ══ */}
      {step === "1" && (
        <div>
          <label className="asw-label" htmlFor="asw-stock-search">
            Which stock are you adding?
          </label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <span
              style={{
                position: "absolute",
                left: "12px",
                display: "flex",
                color: "var(--gray-500, #667085)",
                pointerEvents: "none",
              }}
            >
              <IconSearch />
            </span>
            <input
              id="asw-stock-search"
              className="asw-field"
              style={{ paddingLeft: "36px" }}
              placeholder="Search by group, category or location"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="asw-table">
            <div className="asw-table__head">
              <span>Item group</span>
              <span>Location</span>
              <span style={{ textAlign: "right" }}>Available</span>
            </div>
            <div className="asw-scroll" style={{ maxHeight: "268px" }}>
              {visibleRows.length > 0 ? (
                visibleRows.map((row) => (
                  <button
                    type="button"
                    key={row.id}
                    className={`asw-table__row${
                      picked && row.id ===
                      `${picked.category}||${picked.group}||${picked.location}`
                        ? " asw-table__row--on"
                        : ""
                    }`}
                    onClick={() => pickRow(row)}
                  >
                    <span className="asw-cellname">
                      <span className="asw-cellname__main">{row.group}</span>
                      <span className="asw-hint">{row.category}</span>
                    </span>
                    <span className="asw-cell">{row.location}</span>
                    <span
                      className={`asw-cell asw-cell--qty${row.qty <= 5 ? " asw-cell--low" : ""}`}
                    >
                      {row.qty}
                    </span>
                  </button>
                ))
              ) : (
                <div className="asw-blank">
                  <p className="asw-blank__title">Nothing matches that</p>
                  <p className="asw-blank__body">
                    Only in-stock, assignable items can be added.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ STEP 2 — how many ══ */}
      {step === "2" && picked && (
        <div>
          <div className="asw-picked">
            <span style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
              <span className="asw-picked__title">
                {picked.category} · {picked.group}
              </span>
              <span className="asw-hint">
                {picked.location} · {picked.qty} available
              </span>
            </span>
            <GrayButtonComponent
              title="Change"
              func={() => setStep("1")}
              size="sm"
              styles={{ margin: 0, width: "fit-content" }}
            />
          </div>

          <div className="asw-modes">
            <button
              type="button"
              className={`asw-mode${mode === "range" ? " asw-mode--on" : ""}`}
              onClick={() => setMode("range")}
            >
              <span className="asw-mode__head">
                <span className="asw-mode__icon">
                  <IconRows />
                </span>
                <span className="asw-mode__title">A consecutive run</span>
              </span>
              <span className="asw-hint" style={{ textWrap: "pretty" }}>
                Give the first serial and how many. You will see exactly which
                ones before anything is added.
              </span>
            </button>

            <button
              type="button"
              className={`asw-mode${mode === "scan" ? " asw-mode--on" : ""}`}
              onClick={() => setMode("scan")}
            >
              <span className="asw-mode__head">
                <span className="asw-mode__icon">
                  <IconScan />
                </span>
                <span className="asw-mode__title">Scan each device</span>
              </span>
              <span className="asw-hint" style={{ textWrap: "pretty" }}>
                Scan or type serials one at a time. Each is checked against this
                location as you go.
              </span>
            </button>
          </div>

          {mode === "range" && (
            <div style={{ marginTop: "20px" }}>
              <div className="asw-two">
                <div>
                  <label className="asw-label" htmlFor="asw-starting">
                    First serial number
                  </label>
                  <input
                    id="asw-starting"
                    className="asw-field"
                    placeholder="Scan or type the first serial"
                    {...register("starting")}
                  />
                </div>
                <div>
                  <label className="asw-label" htmlFor="asw-quantity">
                    How many
                  </label>
                  <input
                    id="asw-quantity"
                    className="asw-field"
                    placeholder="Quantity"
                    {...register("quantity")}
                  />
                </div>
              </div>

              <div className={`asw-preview asw-tone--${preview.tone}`}>
                <div className="asw-preview__head">
                  <span className="asw-preview__headline">{preview.headline}</span>
                  <span className="asw-pill">{preview.countLabel}</span>
                </div>
                {preview.serials.length > 0 && (
                  <div className="asw-scroll asw-preview__serials">
                    {preview.serials.map((serial) => (
                      <span className="asw-chip" key={serial}>
                        {serial}
                      </span>
                    ))}
                  </div>
                )}
                {preview.note && <p className="asw-preview__note">{preview.note}</p>}
              </div>
            </div>
          )}

          {mode === "scan" && (
            <div style={{ marginTop: "20px" }}>
              <label className="asw-label" htmlFor="asw-scan">
                Serial number
              </label>
              <div className="asw-scanbar">
                <input
                  id="asw-scan"
                  className="asw-field"
                  placeholder="Scan or type a serial, then press Enter"
                  value={scanDraft}
                  onChange={(event) => setScanDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addScan();
                    }
                  }}
                />
                <GrayButtonComponent
                  title="Add"
                  func={addScan}
                  isDisabled={scanDraft.trim() === ""}
                  styles={{ margin: 0, width: "fit-content" }}
                />
              </div>

              <div className="asw-scanhead">
                <span className="asw-scanhead__title">{scanList.summary}</span>
                {scanned.length > 0 && (
                  <GrayButtonComponent
                    title="Clear all"
                    func={() => setScanned([])}
                    size="sm"
                    styles={{ margin: 0, width: "fit-content" }}
                  />
                )}
              </div>

              {scanList.rows.length > 0 && (
                <div className="asw-scroll asw-scanlist">
                  {scanList.rows.map((row) => (
                    <span
                      className={`asw-chip ${
                        row.ok === null
                          ? "asw-chip--wait"
                          : row.ok
                            ? "asw-chip--ok"
                            : "asw-chip--bad"
                      }`}
                      key={row.serial}
                    >
                      {row.serial}
                      <button
                        type="button"
                        className="asw-chip__x"
                        onClick={() =>
                          setScanned(scanned.filter((s) => s !== row.serial))
                        }
                        aria-label={`Remove ${row.serial}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                          <path
                            d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {scanList.rejectMessage && (
                <div className="asw-warnbox">
                  <span className="asw-warnbox__icon">
                    <IconWarn />
                  </span>
                  <p className="asw-warnbox__text">{scanList.rejectMessage}</p>
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: "20px", maxWidth: "320px" }}>
            <label className="asw-label" htmlFor="asw-deposit">
              Deposit per device <span className="asw-label__opt">— optional</span>
            </label>
            <input
              id="asw-deposit"
              className="asw-field"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register("deposit")}
            />
            <p className="asw-hint" style={{ margin: "6px 0 0" }}>
              Leave blank if this event takes no deposit.
            </p>
          </div>
        </div>
      )}

      {/* ══ STEP 3 — review ══ */}
      {step === "3" && (
        <div>
          <p
            style={{
              margin: "0 0 16px",
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              lineHeight: "20px",
              color: "var(--gray-600, #475467)",
            }}
          >
            Nothing has been written yet. This is what will be added:
          </p>

          <div className="asw-review">
            {reviewRows.map((row) => (
              <div className="asw-review__row" key={row.label}>
                <span className="asw-review__label">{row.label}</span>
                <span className="asw-review__value">{row.value}</span>
              </div>
            ))}
            <div className="asw-scroll asw-review__serials">
              {serials.map((serial) => (
                <span className="asw-chip" key={serial}>
                  {serial}
                </span>
              ))}
            </div>
          </div>

          <div className="asw-infobox">
            <span className="asw-infobox__icon">
              <IconInfo />
            </span>
            <p className="asw-infobox__text">
              These devices leave the warehouse and are held by this event until
              it is closed or they are returned.
            </p>
          </div>
        </div>
      )}

      {/* ══ DONE ══ */}
      {step === "done" && (
        <div className="asw-done">
          <span className="asw-done__icon">
            <IconDone />
          </span>
          <p className="asw-done__title">
            {addedCount} {addedCount === 1 ? "device" : "devices"} added
          </p>
          <p className="asw-done__body">
            {picked
              ? `${picked.category} · ${picked.group} from ${picked.location} is now held by this event. Add another group, or close this out.`
              : "Add another group, or close this out."}
          </p>
        </div>
      )}

      {/* ── footer ── */}
      <div className="asw-foot">
        <span className="asw-hint">{footer.hint}</span>
        <div className="asw-foot__actions">
          {footer.showBack && (
            <GrayButtonComponent
              title="Back"
              func={() => setStep(step === "3" ? "2" : "1")}
              styles={{ margin: 0, width: "fit-content" }}
            />
          )}
          {footer.showAddAnother && (
            <GrayButtonComponent
              title="Add another group"
              func={startAnother}
              styles={{ margin: 0, width: "fit-content" }}
            />
          )}
          <BlueButtonComponent
            title={footer.nextLabel}
            buttonType="button"
            func={step === "3" ? onConfirm : step === "done" ? closeModal : goNext}
            isDisabled={footer.nextDisabled}
            isLoading={loadingStatus}
            styles={{ margin: 0, width: "fit-content" }}
          />
        </div>
      </div>
    </div>
  );
};

export default AddStockWizard;
