import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Segmented } from "antd";
import PropTypes from "prop-types";
import { useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import renderingTitle from "../../../components/general/renderingTitle";
import { useStatusNotification } from "../../../components/notification/alerts/useStatusNotification";
import BlueButtonConfirmationComponent from "../../../components/UX/buttons/BlueButtonConfirmation";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import MultiSelectComponent from "../../../components/UX/dropdown/MultiSelectComponent";
import SelectComponent from "../../../components/UX/dropdown/SelectComponent";
import EmptyState from "../../../components/UX/emptyState/EmptyState";
import Input from "../../../components/UX/inputs/Input";
import Label from "../../../components/UX/inputs/Label";
import ModalUX from "../../../components/UX/modal/ModalUX";
import {
  ProfileErrorState,
  ProfileSkeleton,
  ProfileStatTiles,
  StatusChip,
} from "../../../components/UX/profile";
import BaseTable from "../../../components/UX/tables/BaseTable";
import "../../../styles/global/actionForm.css";
import useCompanyLocations from "../actions/utils/useCompanyLocations";
import useSubLocations from "../actions/utils/useSubLocations";
import {
  addScannedSerial,
  buildCheckInPayload,
  checkInBlockers,
  expectedSerials,
  nearMiss,
  reconcile,
  reconciliationRows,
} from "./checkInFromEvent";

const ROW_STATUS = {
  missing: { label: "Not scanned", tone: "warning" },
  scanned: { label: "Scanned", tone: "success" },
  extra: { label: "Not in this event", tone: "critical" },
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "missing", label: "Not scanned" },
  { value: "scanned", label: "Scanned" },
  { value: "extra", label: "Not in this event" },
];

const stepClass = (done) =>
  `action-form__step${done ? " action-form__step--done" : ""}`;

/**
 * Bringing an event's devices back into the warehouse.
 *
 * The screen reconciles what the event is holding against what was physically
 * scanned off the pallet, then files the matches into a warehouse location.
 *
 * Two things about the old version drove this rewrite. The comparison sat
 * behind a "Compare" button and was frozen into state, so scanning more devices
 * after pressing it left the results stale — and the check-in posted that stale,
 * smaller set of serials without a word. And the expected devices rendered as a
 * collapsible tree on one side with the scans as a cloud of chips on the other,
 * so with 300 devices there was no way to see which ones were still outstanding.
 * The comparison is now derived on every keystroke, and both lists are one
 * table you can read.
 *
 * No request changed: `buildCheckInPayload` pins the body that
 * `POST /api/db_event/confirm-item-return` already accepts.
 */
const CheckInDevicesFromEventsModal = ({ open, close }) => {
  const { user } = useSelector((state) => state.admin);
  const { notify, contextHolder } = useStatusNotification();
  const queryClient = useQueryClient();
  const scanFieldRef = useRef(null);

  const [selectedEventOption, setSelectedEventOption] = useState(null);
  const [eventInventory, setEventInventory] = useState([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [inventoryError, setInventoryError] = useState(null);
  const [scanned, setScanned] = useState([]);
  const [scanInput, setScanInput] = useState("");
  const [lastScan, setLastScan] = useState(null);
  const [filter, setFilter] = useState("all");
  const [locationOption, setLocationOption] = useState(null);
  const [subLocationSelection, setSubLocationSelection] = useState(new Set());

  const selectedEventName = selectedEventOption?.label ?? null;
  const selectedLocation = locationOption?.id ?? null;

  const { data: locations = [], isLoading: isLoadingLocations } = useCompanyLocations();
  const { data: subLocations = [], isLoading: isLoadingSubLocations } =
    useSubLocations(selectedLocation);

  const {
    data: events = [],
    isLoading: isLoadingEvents,
    isError: isEventsError,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ["finishedEvents", user.companyData.id],
    queryFn: async () => {
      const response = await devitrakApi.post(`/event/event-list`, {
        type: "event",
        company_id: user.companyData.id,
        logistic_inventory_status: "in-transit",
        active: false,
      });
      return response.data.list.filter((event) => event.active === false);
    },
    enabled: !!user.companyData.id,
  });

  /* ─────────────────────────────────────────────────── derived, never stale ── */

  const expected = useMemo(() => expectedSerials(eventInventory), [eventInventory]);
  const comparison = useMemo(
    () => reconcile(eventInventory, scanned),
    [eventInventory, scanned]
  );
  const rows = useMemo(
    () => reconciliationRows(eventInventory, scanned),
    [eventInventory, scanned]
  );
  const visibleRows = useMemo(
    () => (filter === "all" ? rows : rows.filter((row) => row.status === filter)),
    [rows, filter]
  );

  const blockers = checkInBlockers({
    eventName: selectedEventName,
    location: selectedLocation,
    matchedCount: comparison.matched.length,
  });

  /* ───────────────────────────────────────────────────────────── the event ── */

  const resetScanning = () => {
    setEventInventory([]);
    setScanned([]);
    setScanInput("");
    setLastScan(null);
    setFilter("all");
    setInventoryError(null);
  };

  const loadEventInventory = async (event) => {
    if (!event?.deviceSetup?.length) {
      setInventoryError("This event has no device setup, so nothing is expected back.");
      return;
    }

    setIsLoadingInventory(true);
    try {
      const responses = await Promise.all(
        event.deviceSetup.map((item) =>
          devitrakApi.post("/receiver/receiver-pool-list", {
            type: item.group,
            contract_type: "event",
            company: user.companyData.id,
            eventSelected: event.eventInfoDetail.eventName,
          })
        )
      );
      const inventory = responses.flatMap((response) => response.data.receiversInventory);
      setEventInventory(inventory);

      if (inventory.length === 0) {
        // Pre-existing behaviour, kept: an event that turns out to hold nothing
        // is closed out here. It used to happen silently behind an "info"
        // toast that only mentioned the empty result, so the write is now
        // named in the message.
        await devitrakApi.patch(`/event/edit-staff-event/${event.id}`, {
          logistic_inventory_status: "completed",
        });
        await refetchEvents();
        setInventoryError(
          "This event is not holding any devices. It has been marked completed."
        );
      }
    } catch (error) {
      console.error("Failed to fetch event inventory:", error);
      setInventoryError(
        "The event inventory could not be loaded, so there is nothing to check against. Nothing was changed."
      );
      setEventInventory([]);
    } finally {
      setIsLoadingInventory(false);
    }
  };

  const handleEventSelection = async (option) => {
    resetScanning();
    setSelectedEventOption(option ?? null);
    if (option?.original) await loadEventInventory(option.original);
  };

  /* ────────────────────────────────────────────────────────────── scanning ── */

  const handleScan = () => {
    const result = addScannedSerial(scanned, scanInput);
    if (result.outcome === "empty") return;

    setScanInput("");
    scanFieldRef.current?.focus();

    if (result.outcome === "duplicate") {
      setLastScan({ tone: "warn", text: `${result.serial} was already scanned.` });
      return;
    }

    setScanned(result.list);

    if (expected.includes(result.serial)) {
      setLastScan({ tone: "ok", text: `${result.serial} matched.` });
      return;
    }

    const suggestion = nearMiss(eventInventory, result.serial);
    setLastScan({
      tone: "error",
      text: suggestion
        ? `${result.serial} is not in this event — did you mean ${suggestion}?`
        : `${result.serial} does not belong to this event. It will not be checked in.`,
    });
  };

  const handleScanKey = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    handleScan();
  };

  const handleRemoveScan = (serial) => {
    setScanned((previous) => previous.filter((value) => value !== serial));
    setLastScan(null);
  };

  /* ────────────────────────────────────────────────────────────── check in ── */

  const invalidateInventory = async () => {
    await Promise.all(
      [
        ["finishedEvents", user.companyData.id],
        ["listOfItemsInStock"],
        ["imagePerItemList"],
        ["ItemsInInventoryCheckingQuery"],
        ["RefactoredListInventoryCompany"],
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey }))
    );
  };

  const checkInMutation = useMutation({
    mutationFn: (payload) =>
      devitrakApi.post("/db_event/confirm-item-return", payload),
    onSuccess: async () => {
      notify(
        "success",
        `${comparison.matched.length} device${
          comparison.matched.length === 1 ? "" : "s"
        } checked in.`
      );
      await invalidateInventory();
      close();
    },
    // The old call was fired without await inside a try/catch, so a rejected
    // request surfaced nowhere and the operator was left believing the devices
    // had been filed.
    onError: (error) => {
      console.error(error);
      notify(
        "error",
        "The devices could not be checked in. Nothing was changed — try again."
      );
    },
  });

  const handleCheckIn = () => {
    if (blockers.length > 0) return;
    checkInMutation.mutate(
      buildCheckInPayload({
        companyId: user.sqlInfo?.company_id,
        eventName: selectedEventName,
        location: selectedLocation,
        matched: comparison.matched,
        noSqlCompanyId: user.companyData?.id,
        subLocations: subLocationSelection,
        userId: user.sqlMemberInfo?.staff_id,
      })
    );
  };

  const isCheckingIn = checkInMutation.isPending;

  const handleClose = () => {
    if (isCheckingIn) return;
    close();
  };

  /* ───────────────────────────────────────────────────────────────── table ── */

  const columns = [
    {
      key: "serial",
      title: "Serial number",
      dataIndex: "serial",
      render: (serial) => <span className="action-form__serial">{serial}</span>,
    },
    { key: "type", title: "Group", dataIndex: "type", responsive: ["md"] },
    {
      key: "status",
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <StatusChip label={ROW_STATUS[status].label} tone={ROW_STATUS[status].tone} pip />
      ),
    },
    {
      key: "action",
      title: "",
      render: (_, row) =>
        row.status === "missing" ? null : (
          <button
            type="button"
            className="action-form__remove"
            onClick={() => handleRemoveScan(row.serial)}
            disabled={isCheckingIn}
          >
            Undo scan
          </button>
        ),
    },
  ];

  const subLocationItems = useMemo(
    () =>
      Array.isArray(subLocations)
        ? subLocations.map((sub) => ({ label: sub, id: sub }))
        : [],
    [subLocations]
  );

  /* ────────────────────────────────────────────────────────────────── body ── */

  const body = (
    <div className="action-form">
      {contextHolder}

      <p className="action-form__lead">
        Scan the devices coming back from a closed event. Only the ones that
        match the event&apos;s inventory are checked in.
      </p>

      {/* 1 — the event */}
      <section className={stepClass(Boolean(selectedEventName))}>
        <div className="action-form__step-head">
          <h3 className="action-form__step-title">
            <span className="action-form__step-index">1</span>
            Which event came back
          </h3>
        </div>

        {isEventsError ? (
          <ProfileErrorState
            title="Couldn't load the closed events"
            description="The service didn't respond. Nothing was changed."
          />
        ) : isLoadingEvents ? (
          <ProfileSkeleton lines={1} />
        ) : events.length === 0 ? (
          <p className="action-form__empty">
            No closed event has inventory still out. Events appear here once they
            finish with devices in transit.
          </p>
        ) : (
          <>
            <SelectComponent
              placeholder="Search closed events…"
              items={events.map((event) => ({
                id: event.id,
                label: event.eventInfoDetail.eventName,
                original: event,
              }))}
              value={selectedEventOption}
              onSelect={handleEventSelection}
              isRequired
            />
            {selectedEventName && !isLoadingInventory && !inventoryError && (
              <p className="action-form__step-note">
                {expected.length} device{expected.length === 1 ? "" : "s"} expected
                back from this event.
              </p>
            )}
          </>
        )}
      </section>

      {/* 2 — the scan */}
      {selectedEventName && (
        <section className={stepClass(comparison.matched.length > 0)}>
          <div className="action-form__step-head">
            <h3 className="action-form__step-title">
              <span className="action-form__step-index">2</span>
              Scan what arrived
            </h3>
          </div>

          {isLoadingInventory ? (
            <ProfileSkeleton lines={4} />
          ) : inventoryError ? (
            <p className="action-form__notice">{inventoryError}</p>
          ) : (
            <>
              <div className="action-form__field">
                <Label>Serial number</Label>
                <Input
                  ref={scanFieldRef}
                  autoFocus
                  value={scanInput}
                  onChange={(event) => setScanInput(event.target.value)}
                  onKeyDown={handleScanKey}
                  placeholder="Scan or type a serial, then press Enter"
                  disabled={isCheckingIn}
                />
                {lastScan && (
                  <p
                    className={`action-form__feedback action-form__feedback--${
                      lastScan.tone === "ok" ? "ok" : "error"
                    }`}
                  >
                    {lastScan.text}
                  </p>
                )}
              </div>

              <ProfileStatTiles
                tiles={[
                  { label: "Scanned & matched", value: comparison.matched.length },
                  {
                    label: "Still expected",
                    value: comparison.missing.length,
                    tone: comparison.missing.length > 0 ? "critical" : "neutral",
                  },
                  { label: "Not in this event", value: comparison.extra.length },
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
                      locale={{ emptyText: "Nothing in this list" }}
                    />
                  </div>
                </>
              )}

              {rows.length === 0 && (
                <EmptyState
                  icon="tabler:barcode"
                  title="Nothing to reconcile"
                  description="This event is not holding any devices."
                />
              )}
            </>
          )}
        </section>
      )}

      {/* 3 — where it lands */}
      {comparison.matched.length > 0 && (
        <section className={stepClass(Boolean(selectedLocation))}>
          <div className="action-form__step-head">
            <h3 className="action-form__step-title">
              <span className="action-form__step-index">3</span>
              Where the devices are stored
            </h3>
          </div>

          <div className="action-form__grid">
            <div className="action-form__field">
              <Label>Location</Label>
              {isLoadingLocations ? (
                <ProfileSkeleton lines={1} />
              ) : (
                <SelectComponent
                  placeholder="Select a location"
                  items={locations.map((location) => ({
                    label: location.location,
                    id: location.id,
                  }))}
                  value={locationOption}
                  onSelect={(option) => {
                    setLocationOption(option ?? null);
                    setSubLocationSelection(new Set());
                  }}
                  isRequired
                />
              )}
            </div>

            <div className="action-form__field">
              <Label>Sub-locations (optional)</Label>
              {isLoadingSubLocations ? (
                <ProfileSkeleton lines={1} />
              ) : subLocationItems.length === 0 ? (
                <p className="action-form__step-note">
                  {selectedLocation
                    ? "This location has no sub-locations."
                    : "Pick a location first."}
                </p>
              ) : (
                <MultiSelectComponent
                  placeholder="Select sub-locations"
                  items={subLocationItems}
                  selectedKeys={subLocationSelection}
                  onSelectionChange={setSubLocationSelection}
                  onReset={() => setSubLocationSelection(new Set())}
                  onSelectAll={() =>
                    setSubLocationSelection(
                      new Set(subLocationItems.map((item) => item.id))
                    )
                  }
                >
                  {(item) => (
                    <MultiSelectComponent.Item
                      id={item.id}
                      selectionIndicator="checkbox"
                      selectionIndicatorAlign="left"
                    >
                      {item.label}
                    </MultiSelectComponent.Item>
                  )}
                </MultiSelectComponent>
              )}
            </div>
          </div>
        </section>
      )}

      {comparison.missing.length > 0 && comparison.matched.length > 0 && (
        <p className="action-form__notice">
          {comparison.missing.length} device
          {comparison.missing.length === 1 ? " is" : "s are"} still not scanned.
          Checking in now files only the {comparison.matched.length} matched
          device{comparison.matched.length === 1 ? "" : "s"}; the rest stay out
          with the event.
        </p>
      )}

      {blockers.length > 0 && selectedEventName && (
        <ul className="action-form__notice">
          {blockers.map((blocker) => (
            <li key={blocker}>{blocker}</li>
          ))}
        </ul>
      )}

      <div className="action-form__footer">
        <p className="action-form__consequence">
          Matched devices return to the warehouse and leave the event.
        </p>
        <GrayButtonComponent
          title="Cancel"
          buttonType="button"
          disabled={isCheckingIn}
          func={handleClose}
        />
        <BlueButtonConfirmationComponent
          title={
            comparison.matched.length > 0
              ? `Check in ${comparison.matched.length} device${
                  comparison.matched.length === 1 ? "" : "s"
                }`
              : "Check in devices"
          }
          buttonType="button"
          disabled={blockers.length > 0 || isCheckingIn}
          loadingState={isCheckingIn}
          confirmationTitle={`Check in ${comparison.matched.length} device${
            comparison.matched.length === 1 ? "" : "s"
          }?`}
          confirmationDescription={
            comparison.missing.length > 0
              ? `${comparison.missing.length} still unscanned device${
                  comparison.missing.length === 1 ? "" : "s"
                } stay out with the event.`
              : "Everything the event was holding has been scanned."
          }
          okText="Check in"
          func={handleCheckIn}
        />
      </div>
    </div>
  );

  return (
    <ModalUX
      openDialog={open}
      closeModal={handleClose}
      closable={!isCheckingIn}
      title={renderingTitle("Check in devices from an event")}
      width={840}
      footer={null}
      body={body}
    />
  );
};

CheckInDevicesFromEventsModal.propTypes = {
  open: PropTypes.bool,
  close: PropTypes.func.isRequired,
};

export default CheckInDevicesFromEventsModal;
