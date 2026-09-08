import { useQuery } from "@tanstack/react-query";
import { Segmented } from "antd";
import PropTypes from "prop-types";
import { useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import renderingTitle from "../../../../../../components/general/renderingTitle";
import DangerButtonConfirmationComponent from "../../../../../../components/UX/buttons/DangerButtonConfirmation";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import Input from "../../../../../../components/UX/inputs/Input";
import TextArea from "../../../../../../components/UX/inputs/TextArea";
import ModalUX from "../../../../../../components/UX/modal/ModalUX";
import { ProfileStatTiles } from "../../../../../../components/UX/profile";
import BaseTable from "../../../../../../components/UX/tables/BaseTable";
import { addScannedSerials } from "../../../../../inventory/utils/checkInFromEvent";
import { parsePastedScanDump } from "../../../../../inventory/utils/parsePastedScanDump";
import {
  DISPUTE,
  buildCloseoutReport,
  localCountView,
} from "../../../utils/eventCloseoutReport";
import "../../../../../../styles/global/actionForm.css";

/**
 * Counting the inventory before an event is allowed to close.
 *
 * This is the step that used to be done on paper. "End event" went straight to
 * a confirmation that counted the devices the *database* believed were still
 * out — a number that says nothing about what is physically on the pallet — and
 * then returned everything to the warehouse irreversibly.
 *
 * Now the count comes first: scan what came back, read the reconciliation, and
 * then decide. The two ways out are both real outcomes, not a confirm and a
 * cancel:
 *
 *   - **Close the event** — what was counted goes back to the warehouse, and
 *     what was not stays on the record, with whoever holds it.
 *   - **Keep it open** — go and look for the rest. The scans are kept, because
 *     losing a twenty-minute sweep to a closed dialog is how a feature stops
 *     being used.
 *
 * Closing is gated on having counted, never on the count being clean. Blocking
 * it on missing devices makes the operator choose between lying and not
 * closing.
 */
const STATUS_LABEL = {
  returning: { label: "Counted", tone: "success" },
  outstanding: { label: "Not counted", tone: "warning" },
  unknown: { label: "Not in this event", tone: "neutral" },
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "outstanding", label: "Not counted" },
  { value: "returning", label: "Counted" },
];

const EndEventCountModal = ({
  open,
  poolInventory,
  onKeepOpen,
  onCloseEvent,
}) => {
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);

  const [scanned, setScanned] = useState([]);
  const [scanInput, setScanInput] = useState("");
  const [pasted, setPasted] = useState("");
  const [notice, setNotice] = useState(null);
  const [filter, setFilter] = useState("all");
  const scanFieldRef = useRef(null);

  const eventName = event?.eventInfoDetail?.eventName;

  /* Who still holds what, so an uncounted device can name a person and an
     amount instead of only a serial. Its own query: if it fails the count is
     still usable, and the report is told the holders are unknown rather than
     concluding that nobody holds anything. */
  const holdersQuery = useQuery({
    queryKey: ["eventOutstandingHolders", eventName, user?.companyData?.id],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-assigned-list", {
        eventSelected: eventName,
        company: user?.companyData?.id,
        "device.status": true,
      }),
    enabled: Boolean(open && eventName && user?.companyData?.id),
  });

  const count = useMemo(
    () => localCountView(poolInventory, scanned),
    [poolInventory, scanned]
  );

  const report = useMemo(
    () =>
      buildCloseoutReport({
        count,
        receivers: holdersQuery.data?.data?.listOfReceivers,
      }),
    [count, holdersQuery.data]
  );

  /* ─────────────────────────────────────────────────────────────── scanning ── */

  const addSerials = (serials) => {
    const result = addScannedSerials(scanned, serials);
    setScanned(result.list);
    return result;
  };

  const handleScan = () => {
    const value = scanInput.trim();
    if (!value) return;
    const result = addSerials([value]);
    setScanInput("");
    scanFieldRef.current?.focus();
    setNotice(
      result.duplicates.length > 0
        ? { tone: "warn", text: `${value} was already counted.` }
        : { tone: "ok", text: `${value} counted.` }
    );
  };

  const handlePaste = () => {
    const parsed = parsePastedScanDump(pasted);
    if (parsed.error) {
      return setNotice({
        tone: "error",
        text: `That paste carries ${parsed.error.lines} lines; the limit is ${parsed.error.limit}. Split it and paste again.`,
      });
    }
    if (parsed.codes.length === 0) {
      return setNotice({ tone: "error", text: "Nothing readable in that paste." });
    }
    const result = addSerials(parsed.codes.map((code) => code.value));
    setPasted("");
    setNotice({
      tone: "ok",
      text: `${parsed.totalReads} read${parsed.totalReads === 1 ? "" : "s"} · ${result.added.length
        } newly counted${result.duplicates.length > 0
          ? ` · ${result.duplicates.length} already counted`
          : ""
        }.`,
    });
  };

  /* ───────────────────────────────────────────────────────────────── the rows ── */

  const rows = useMemo(() => {
    const disputedBySerial = new Map(
      report.disputed.map((row) => [row.serial, row.reason])
    );
    return [
      ...report.outstanding.map((row) => ({
        key: `outstanding-${row.serial}`,
        kind: "outstanding",
        serial: row.serial,
        group: row.group,
        holder: row.holder ?? (row.paymentIntent ? "On a transaction" : "—"),
        value: row.value,
        chargeable: row.chargeable,
        dispute: disputedBySerial.get(row.serial) ?? null,
      })),
      ...count.unknown.map((value) => ({
        key: `unknown-${value}`,
        kind: "unknown",
        serial: value,
        group: "—",
        holder: "—",
        value: 0,
        chargeable: null,
        dispute: null,
      })),
      ...report.returning.map((row) => ({
        key: `returning-${row.serial}`,
        kind: "returning",
        serial: row.serial,
        group: row.group,
        holder: "—",
        value: 0,
        chargeable: null,
        dispute: disputedBySerial.get(row.serial) ?? null,
      })),
    ];
  }, [report, count.unknown]);

  const visibleRows =
    filter === "all" ? rows : rows.filter((row) => row.kind === filter);

  const columns = [
    { key: "serial", title: "Serial", dataIndex: "serial" },
    { key: "group", title: "Group", dataIndex: "group", responsive: ["md"] },
    {
      key: "status",
      title: "Status",
      dataIndex: "kind",
      render: (kind, row) => (
        <span>
          {STATUS_LABEL[kind]?.label ?? kind}
          {row.dispute === DISPUTE.RETURNED_BUT_ASSIGNED && (
            <strong> · still assigned to a consumer</strong>
          )}
          {row.dispute === DISPUTE.NO_HOLDER && <span> · nobody holds it</span>}
        </span>
      ),
    },
    {
      key: "holder",
      title: "Still with",
      dataIndex: "holder",
      responsive: ["md"],
    },
  ];

  const { totals } = report;

  const body = (
    <div className="action-form">
      <p className="action-form__lead">
        Count what came back before the event closes. What is counted returns to
        the warehouse; what is not stays on the record, with whoever has it.
      </p>

      <Input
        ref={scanFieldRef}
        label="Scan a serial or a tag"
        value={scanInput}
        onChange={(e) => setScanInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          handleScan();
        }}
        placeholder="Pull the trigger, or type and press Enter"
      />

      <TextArea
        label="Or paste a reader export"
        value={pasted}
        onChange={(e) => setPasted(e.target.value)}
        rows={3}
        placeholder="One code per line, or the reader's own export"
      />
      <GrayButtonComponent
        title="Add pasted reads"
        buttonType="button"
        isDisabled={!pasted.trim()}
        func={handlePaste}
      />

      {notice && <p className="action-form__notice">{notice.text}</p>}

      <ProfileStatTiles
        testId="event-count-stats"
        tiles={[
          { label: "Expected", value: totals.expected },
          { label: "Counted", value: totals.returning },
          {
            label: "Not counted",
            value: totals.outstanding,
            tone: totals.outstanding > 0 ? "critical" : "neutral",
          },
          {
            label: "Value still out",
            value: report.holdersKnown ? `$${totals.outstandingValue}` : "—",
            sub: report.holdersKnown ? null : "Holder list unavailable",
          },
        ]}
      />

      {rows.length > 0 && (
        <>
          <div className="action-form__toolbar">
            <Segmented
              options={FILTERS}
              value={filter}
              onChange={setFilter}
              size="small"
            />
            <p className="action-form__count">
              <strong>{visibleRows.length}</strong> of {rows.length}
            </p>
          </div>
          <div className="action-form__scroll">
            <BaseTable
              className="profile-table"
              columns={columns}
              dataSource={visibleRows}
              rowKey={(row) => row.key}
              enablePagination={visibleRows.length > 12}
              pageSize={12}
              size="small"
            />
          </div>
        </>
      )}

      <div className="action-form__footer">
        <GrayButtonComponent
          title={
            totals.outstanding > 0
              ? `Keep open · go find ${totals.outstanding}`
              : "Keep open"
          }
          buttonType="button"
          func={onKeepOpen}
        />
        <DangerButtonConfirmationComponent
          title={
            report.counted && totals.returning > 0
              ? `Close event · return ${totals.returning}`
              : "Close event"
          }
          buttonType="button"
          /* Gated on having counted, not on counting clean. */
          isDisabled={totals.returning === 0}
          confirmationTitle="Close this event?"
          confirmationDescription={
            totals.outstanding > 0
              ? `${totals.returning} device${totals.returning === 1 ? "" : "s"
              } go back to the warehouse. ${totals.outstanding} stay on the record with whoever has them. This cannot be reversed.`
              : "Everything counted goes back to the warehouse. This cannot be reversed."
          }
          okText="Close event"
          func={onCloseEvent}
        />
      </div>
    </div>
  );

  return (
    <ModalUX
      title={renderingTitle("Count the inventory before closing")}
      openDialog={open}
      closeModal={onKeepOpen}
      footer={null}
      width={760}
      body={body}
    />
  );
};

EndEventCountModal.propTypes = {
  open: PropTypes.bool,
  /** The event's receivers pool, already fetched by the parent. */
  poolInventory: PropTypes.array,
  /** Dismiss without closing the event — a real outcome, not a cancel. */
  onKeepOpen: PropTypes.func.isRequired,
  onCloseEvent: PropTypes.func.isRequired,
};

export default EndEventCountModal;
