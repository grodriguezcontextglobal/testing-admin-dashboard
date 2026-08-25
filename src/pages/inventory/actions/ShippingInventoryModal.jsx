import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { saveAs } from "file-saver";
import PropTypes from "prop-types";
import { useCallback, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import renderingTitle from "../../../components/general/renderingTitle";
import { useStatusNotification } from "../../../components/notification/alerts/useStatusNotification";
import BlueButtonConfirmationComponent from "../../../components/UX/buttons/BlueButtonConfirmation";
import DangerButtonConfirmationComponent from "../../../components/UX/buttons/DangerButtonConfirmation";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import SelectComponent from "../../../components/UX/dropdown/SelectComponent";
import EmptyState from "../../../components/UX/emptyState/EmptyState";
import Input from "../../../components/UX/inputs/Input";
import Label from "../../../components/UX/inputs/Label";
import ModalUX from "../../../components/UX/modal/ModalUX";
import { ProfileSkeleton, StatusChip } from "../../../components/UX/profile";
import BaseTable from "../../../components/UX/tables/BaseTable";
import { onTrackBackgroundJob } from "../../../store/slices/backgroundJobsSlice";
import "../../../styles/global/actionForm.css";
import generateIdempotencyKey from "../../../utils/actions/generateIdempotencyKey";
import ExchangeModal from "./components/ExchangeModal";
import {
  buildShipmentPayload,
  describeShippingStatus,
  eventsFromItems,
  formatShipmentDateTime,
  missingShipmentFields,
} from "./utils/shipping";

const EMPTY_FORM = {
  destination: "",
  shipOutDate: "",
  courier: "",
  trackingNumber: "",
  authorizer: "",
  receiver: "",
};

/**
 * Sending an event's reserved inventory out of the warehouse.
 *
 * The screen was one flat MUI grid: an event selector, then six fields all
 * disabled until an event was picked with nothing saying why, then the packing
 * list, then three buttons of equal weight — Cancel, Download Report and Ship
 * Out. It is three numbered steps now, in the order the work happens: which
 * event, what is in the box, where it is going. The report moved next to the
 * list it describes, and shipping out is a confirmation that names the count.
 *
 * Validation used to be a single toast — "Please complete all required fields"
 * — for six fields. Each field says whether it is the one missing.
 *
 * Every request is unchanged.
 */
const ShippingInventoryModal = ({ visible, onClose, user }) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const { notify, contextHolder } = useStatusNotification();

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [itemToExchange, setItemToExchange] = useState(null);
  const [isExchangeOpen, setIsExchangeOpen] = useState(false);
  const [newSerialNumber, setNewSerialNumber] = useState("");
  const [notice, setNotice] = useState(null);

  const companyId = user?.sqlInfo?.company_id ?? "";
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  // ── 1. active events with inventory locked in the warehouse ───────────────
  const eventsQuery = useQuery({
    queryKey: ["shippingEvents"],
    queryFn: async () => {
      const response = await devitrakApi.post("/db_item/event-items/search", {
        active: 1,
        company_id: companyId,
        shipping_status: "locked_in_warehouse",
      });
      if (!response.data?.ok || !response.data?.items) return [];
      return eventsFromItems(response.data.items);
    },
  });

  // ── 2. the packing list for the selected event ────────────────────────────
  const itemsQuery = useQuery({
    queryKey: ["shippingItems", selectedEvent?.id],
    queryFn: async () => {
      const response = await devitrakApi.post("/db_item/event-items/search", {
        company_id: companyId,
        event_id: selectedEvent.id,
        shipping_status: "locked_in_warehouse",
      });
      return response.data?.items ?? [];
    },
    enabled: !!selectedEvent,
    staleTime: 30_000,
  });

  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);
  const missing = missingShipmentFields(form);
  const canShip = Boolean(selectedEvent) && items.length > 0 && missing.length === 0;

  // ── 3. ship out ───────────────────────────────────────────────────────────

  const bulkUpdateItemStatusMutation = useMutation({
    mutationFn: async ({ company_id, event_id, item_ids, idempotencyKey }) => {
      const [{ data: bulkUpdateResponse }] = await Promise.all([
        devitrakApi.put(
          "/db_item/event-items/bulk-update",
          {
            company_id,
            event_id,
            updates: { shipping_status: "in-transit" },
            // NOTE: both queries above search for `locked_in_warehouse`, so the
            // rows on screen do not carry `in-reserved` and this filter matches
            // none of them — the job reports success having updated nothing,
            // while /db_inventory/update-large-data below does move the items
            // by id. Left exactly as it was: changing it starts writing rows
            // that are not being written today, which is a server-side effect
            // and needs the backend's confirmation first.
            filters: { shipping_status: "in-reserved" },
          },
          { headers: { "Idempotency-Key": idempotencyKey } }
        ),
        devitrakApi.post("/db_inventory/update-large-data", {
          item_ids,
          company_id,
          warehouse: 0,
          updates: { logistic_status: "in-transit", warehouse: 0 },
        }),
      ]);
      return bulkUpdateResponse;
    },
    onError: () => setNotice("The items were not marked as shipped. Try again."),
    onSuccess: (response) => {
      // The item-status update runs in the backend's job queue: the PUT answers
      // 202 with a jobId rather than a synchronous 200.
      dispatch(
        onTrackBackgroundJob({
          jobId: response.jobId,
          type: "shipment-item-status-bulk-update",
          successMessage: "Shipment recorded and inventory shipped out.",
          failureMessage: "Could not update the item statuses.",
          invalidateKeys: [["shippingEvents"]],
        })
      );
      notify(
        "info",
        "Shipment recorded.",
        "The inventory is being shipped out in the background — we'll let you know when it lands."
      );
      handleClose();
    },
  });

  const createShipmentRecordMutation = useMutation({
    mutationFn: async (shipmentData) => {
      const { data } = await devitrakApi.post("/db_shipment/", shipmentData);
      return data;
    },
    onError: () =>
      setNotice("The shipment record was not created. Nothing was shipped."),
    onSuccess: () => {
      if (items.length === 0) {
        notify("success", "Shipment recorded.");
        queryClient.invalidateQueries({ queryKey: ["shippingEvents"] });
        return handleClose();
      }
      bulkUpdateItemStatusMutation.mutate({
        company_id: companyId,
        event_id: selectedEvent.id,
        item_ids: items.map((item) => item.item_id),
        idempotencyKey: generateIdempotencyKey(),
      });
    },
  });

  const isShipping =
    createShipmentRecordMutation.isPending || bulkUpdateItemStatusMutation.isPending;

  function handleClose() {
    setSelectedEvent(null);
    setForm(EMPTY_FORM);
    setSubmitAttempted(false);
    setNotice(null);
    onClose();
  }

  const handleEventSelection = (event) => {
    setSelectedEvent(event ?? null);
    setSubmitAttempted(false);
    setNotice(null);
    // The event's own address is the obvious first guess at the destination.
    setForm({ ...EMPTY_FORM, destination: event?.address ?? "" });
  };

  const handleShipOut = () => {
    setSubmitAttempted(true);
    setNotice(null);

    if (missing.length > 0) {
      return setNotice("Fill in the fields marked below before shipping out.");
    }
    if (items.length === 0) {
      return setNotice("This event has nothing locked in the warehouse to ship.");
    }

    createShipmentRecordMutation.mutate(
      buildShipmentPayload({
        authorizer: form.authorizer,
        companyId,
        courier: form.courier,
        destination: form.destination,
        eventId: selectedEvent.id,
        packageList: items.map((item) => item.item_id),
        receiver: form.receiver,
        trackingNumber: form.trackingNumber,
      })
    );
  };

  const handleRemoveItem = async (item) => {
    setNotice(null);
    try {
      await devitrakApi.post("/db_item/edit-item", {
        item_id: item.item_id,
        logistic_status: "in-stock",
      });
      await devitrakApi.post("/db_event/remove-reserved-items-for-event", {
        event_id: selectedEvent?.id,
        item_id: [item.item_id],
        company_id: companyId,
      });

      // The packing list is what shows this row, so it is the one that has to
      // be refetched. The old handler refreshed the event list instead — and
      // invalidated a key that does not exist — so the removed item stayed on
      // screen, and reported success through a browser alert().
      await itemsQuery.refetch();
      queryClient.invalidateQueries({ queryKey: ["shippingEvents"] });
      notify(
        "success",
        `${item.serial_number ?? item.item_id} removed from the shipment.`,
        "It is back in stock."
      );
    } catch {
      setNotice(
        `${item.serial_number ?? item.item_id} was not removed. Nothing changed.`
      );
    }
  };

  // ── the packing report ────────────────────────────────────────────────────

  const handleDownloadReport = useCallback(async () => {
    if (!selectedEvent || items.length === 0) {
      return setNotice("Pick an event with inventory before generating the report.");
    }

    setIsExporting(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Devitrak";
      workbook.created = new Date();

      const summary = workbook.addWorksheet("Shipment Summary");
      summary.columns = [
        { header: "Field", key: "field", width: 28 },
        { header: "Value", key: "value", width: 46 },
      ];
      summary.getRow(1).font = { bold: true };
      [
        { field: "Event Name", value: selectedEvent.label },
        { field: "Destination / Location", value: form.destination || selectedEvent.address },
        { field: "Ship-Out Date", value: formatShipmentDateTime(form.shipOutDate) },
        { field: "Courier", value: form.courier || "—" },
        { field: "Tracking Number", value: form.trackingNumber || "—" },
        { field: "Authorized By", value: form.authorizer || "—" },
        { field: "Who will receive inventory at destination", value: form.receiver || "—" },
        { field: "Total Items", value: items.length },
        { field: "Report Generated", value: new Date().toLocaleString() },
      ].forEach((row) => summary.addRow(row));

      const list = workbook.addWorksheet("Packaging List");
      list.columns = [
        { header: "#", key: "idx", width: 6 },
        { header: "Serial Number", key: "serial_number", width: 22 },
        { header: "Item / Group", key: "item_group", width: 28 },
        { header: "Category", key: "category_name", width: 20 },
        { header: "Condition", key: "status", width: 14 },
        { header: "Shipping Status", key: "shipping_status", width: 20 },
        { header: "Location (Origin)", key: "location", width: 24 },
      ];
      list.getRow(1).font = { bold: true };
      list.views = [{ state: "frozen", ySplit: 1 }];

      items.forEach((item, index) => {
        list.addRow({
          category_name: item.category_name ?? "",
          idx: index + 1,
          item_group: item.item_group ?? item.item_name ?? "",
          location: item.location ?? item.main_warehouse ?? "",
          serial_number: item.serial_number ?? "",
          shipping_status: describeShippingStatus(item.shipping_status).label,
          status: item.status ?? item.condition ?? "",
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `shipping_report_${selectedEvent.label.replace(/\s+/g, "_")}_${Date.now()}.xlsx`
      );
      notify("success", "Packing report downloaded.");
    } catch {
      setNotice("The report could not be generated.");
    } finally {
      setIsExporting(false);
    }
    // `form` in full: the old dependency list omitted courier and trackingNumber
    // while the report printed them, so a stale pair could reach the file.
  }, [selectedEvent, items, form, notify]);

  // ── the packing list table ────────────────────────────────────────────────

  const columns = [
    { key: "idx", title: "#", width: 50, render: (_, __, index) => index + 1 },
    {
      key: "serial_number",
      title: "Serial",
      dataIndex: "serial_number",
      render: (value) =>
        value ? <span className="action-form__serial">{value}</span> : "—",
    },
    {
      key: "item_group",
      title: "Item",
      dataIndex: "item_group",
      render: (value, row) => value ?? row.item_name ?? "—",
    },
    { key: "category_name", title: "Category", dataIndex: "category_name" },
    {
      key: "status",
      title: "Condition",
      dataIndex: "status",
      render: (value, row) => value ?? row.condition ?? "—",
    },
    {
      key: "location",
      title: "Origin",
      dataIndex: "location",
      render: (value, row) => value ?? row.main_warehouse ?? "—",
    },
    {
      key: "shipping_status",
      title: "Status",
      dataIndex: "shipping_status",
      render: (value) => {
        const status = describeShippingStatus(value);
        return <StatusChip label={status.label} tone={status.tone} pip />;
      },
    },
    {
      key: "actions",
      title: "",
      align: "right",
      render: (_, row) => (
        <div className="profile-row-actions">
          <GrayButtonComponent
            size="sm"
            title="Exchange"
            buttonType="button"
            disabled={isShipping}
            func={() => {
              setItemToExchange(row);
              setIsExchangeOpen(true);
            }}
          />
          <DangerButtonConfirmationComponent
            size="sm"
            title="Remove"
            buttonType="button"
            disabled={isShipping}
            // The old dialog was titled "Remove" and asked "are you sure you
            // want to exchange this item?", behind a blue button.
            confirmationTitle={`Remove ${row.serial_number ?? row.item_id} from this shipment?`}
            confirmationDescription="It goes back into stock and off the packing list."
            okText="Remove"
            func={() => handleRemoveItem(row)}
          />
        </div>
      ),
    },
  ];

  const stepClass = (done) =>
    `action-form__step${done ? " action-form__step--done" : ""}`;

  const fieldError = (key) =>
    submitAttempted && missing.includes(key) ? "Required" : undefined;

  const body = (
    <div className="action-form">
      {contextHolder}

      <p className="action-form__lead">
        Inventory locked in the warehouse for an event, handed to a courier.
        Nothing moves until you confirm.
      </p>

      {/* 1 — which event */}
      <section className={stepClass(Boolean(selectedEvent))}>
        <div className="action-form__step-head">
          <h3 className="action-form__step-title">
            <span className="action-form__step-index">1</span>
            Which event
          </h3>
        </div>

        {eventsQuery.isLoading ? (
          <ProfileSkeleton lines={1} />
        ) : (eventsQuery.data ?? []).length === 0 ? (
          <p className="action-form__empty">
            No active event has inventory locked in the warehouse right now.
          </p>
        ) : (
          <>
            <SelectComponent
              placeholder="Search an event…"
              items={eventsQuery.data ?? []}
              onSelect={handleEventSelection}
              value={selectedEvent}
              isRequired
            />
            {selectedEvent && (
              <p className="action-form__step-note">
                {selectedEvent.address || "No address on the event"} ·{" "}
                {selectedEvent.itemCount} item
                {selectedEvent.itemCount === 1 ? "" : "s"} ready
              </p>
            )}
          </>
        )}
      </section>

      {/* 2 — what is in the box */}
      {selectedEvent && (
        <section className={stepClass(items.length > 0)}>
          <div className="action-form__step-head">
            <h3 className="action-form__step-title">
              <span className="action-form__step-index">2</span>
              What is in the shipment ({items.length})
            </h3>
            <GrayButtonComponent
              size="sm"
              title={isExporting ? "Generating…" : "Download packing list"}
              buttonType="button"
              disabled={items.length === 0 || isExporting}
              loadingState={isExporting}
              func={handleDownloadReport}
            />
          </div>

          {itemsQuery.isLoading ? (
            <ProfileSkeleton lines={3} />
          ) : items.length === 0 ? (
            <EmptyState
              compact
              icon="tabler:package-off"
              title="Nothing locked for this event"
              description="Reserve inventory for the event before shipping it out."
            />
          ) : (
            <div className="action-form__scroll">
              <BaseTable
                className="profile-table"
                columns={columns}
                dataSource={items}
                // Never `Math.random()`: a fresh key on every render remounts
                // every row, which is what the old fallback did.
                rowKey={(row, index) => row.item_id ?? row.serial_number ?? index}
                enablePagination={items.length > 8}
                pageSize={8}
                size="small"
              />
            </div>
          )}
        </section>
      )}

      {/* 3 — where it goes */}
      {selectedEvent && (
        <section className={stepClass(missing.length === 0)}>
          <div className="action-form__step-head">
            <h3 className="action-form__step-title">
              <span className="action-form__step-index">3</span>
              Where it is going, and who signs for it
            </h3>
          </div>

          <div className="action-form__grid">
            <div className="action-form__field action-form__field--wide">
              <Label>Destination</Label>
              <Input
                value={form.destination}
                onChange={(event) => setField("destination", event.target.value)}
                disabled={isShipping}
                placeholder="e.g. Convention Center, Miami FL"
                error={Boolean(fieldError("destination"))}
                helperText={fieldError("destination")}
              />
            </div>
            <div className="action-form__field">
              <Label>Courier</Label>
              <Input
                value={form.courier}
                onChange={(event) => setField("courier", event.target.value)}
                disabled={isShipping}
                placeholder="FedEx, UPS, USPS, DHL"
                error={Boolean(fieldError("courier"))}
                helperText={fieldError("courier")}
              />
            </div>
            <div className="action-form__field">
              <Label>Tracking number</Label>
              <Input
                value={form.trackingNumber}
                onChange={(event) => setField("trackingNumber", event.target.value)}
                disabled={isShipping}
                placeholder="e.g. 1234567890"
                error={Boolean(fieldError("trackingNumber"))}
                helperText={fieldError("trackingNumber")}
              />
            </div>
            <div className="action-form__field">
              <Label>Authorised by</Label>
              <Input
                value={form.authorizer}
                onChange={(event) => setField("authorizer", event.target.value)}
                disabled={isShipping}
                placeholder="Who approved the shipment"
                error={Boolean(fieldError("authorizer"))}
                helperText={fieldError("authorizer")}
              />
            </div>
            <div className="action-form__field">
              <Label>Received by</Label>
              <Input
                value={form.receiver}
                onChange={(event) => setField("receiver", event.target.value)}
                disabled={isShipping}
                placeholder="Who takes delivery at the destination"
                error={Boolean(fieldError("receiver"))}
                helperText={fieldError("receiver")}
              />
            </div>
            <div className="action-form__field">
              <Label>Ship-out date</Label>
              <Input
                type="datetime-local"
                value={form.shipOutDate}
                onChange={(event) => setField("shipOutDate", event.target.value)}
                disabled={isShipping}
              />
              {/* The shipment endpoint has no field for this date, so it is not
                  stored — it only reaches the packing report. It used to be
                  required to submit, which implied otherwise. */}
              <p className="action-form__step-note">
                Printed on the packing list. Not stored with the shipment record.
              </p>
            </div>
          </div>
        </section>
      )}

      {canShip && (
        <dl className="action-form__summary">
          <div>
            <dt>Items</dt>
            <dd>{items.length}</dd>
          </div>
          <div>
            <dt>Destination</dt>
            <dd>{form.destination}</dd>
          </div>
          <div>
            <dt>Courier</dt>
            <dd>{form.courier}</dd>
          </div>
          <div>
            <dt>Tracking</dt>
            <dd>{form.trackingNumber}</dd>
          </div>
        </dl>
      )}

      {notice && <p className="action-form__notice">{notice}</p>}

      <div className="action-form__footer">
        <p className="action-form__consequence">
          Every item is marked in transit and leaves the warehouse.
        </p>
        <GrayButtonComponent
          title="Cancel"
          buttonType="button"
          disabled={isShipping}
          func={handleClose}
        />
        <BlueButtonConfirmationComponent
          title={
            items.length > 0
              ? `Ship out ${items.length} item${items.length === 1 ? "" : "s"}`
              : "Ship out inventory"
          }
          buttonType="button"
          disabled={!canShip}
          loadingState={isShipping}
          confirmationTitle={`Ship ${items.length} item${
            items.length === 1 ? "" : "s"
          } to ${form.destination || "the destination"}?`}
          confirmationDescription="They are marked in transit and taken out of the warehouse."
          okText="Ship out"
          func={handleShipOut}
        />
      </div>
    </div>
  );

  return (
    <>
      <ModalUX
        openDialog={visible}
        closeModal={isShipping ? () => {} : handleClose}
        closable={!isShipping}
        title={renderingTitle("Ship inventory out")}
        footer={null}
        width={960}
        body={body}
      />
      {isExchangeOpen && (
        <ExchangeModal
          visible={isExchangeOpen}
          onClose={() => setIsExchangeOpen(false)}
          itemToExchange={itemToExchange}
          newSerialNumber={newSerialNumber}
          setNewSerialNumber={setNewSerialNumber}
          refetchShippingEvents={itemsQuery.refetch}
          eventId={selectedEvent?.id}
          companyId={companyId}
        />
      )}
    </>
  );
};

ShippingInventoryModal.propTypes = {
  visible: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object,
};

export default ShippingInventoryModal;
