import { useQueryClient } from "@tanstack/react-query";
import PropTypes from "prop-types";
import { useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import clearCacheMemory from "../../../utils/actions/clearCacheMemory";
import { useStatusNotification } from "../../notification/alerts/useStatusNotification";
import BlueButtonComponent from "../buttons/BlueButton";
import BlueButtonConfirmationComponent from "../buttons/BlueButtonConfirmation";
import GrayButtonComponent from "../buttons/GrayButton";
import Chip from "../Chip/Chip";
import Input from "../inputs/Input";
import ModalUX from "../modal/ModalUX";
import "./returnDevices.css";
import {
  buildBulkReturnPayloads,
  deviceKey,
  isSameDevice,
  pendingDevices,
  resolveScan,
  returnCacheKeys,
  returnableDevices,
  summarizeReturn,
} from "./returnPlan";

/**
 * Taking devices back on one transaction — the only modal for it.
 *
 * It replaces three near-identical copies (`ExpressCheckoutItems`,
 * `ReturningInBulkMethod`, `ExpressCheckInDevices`), all of which showed the
 * same thing: a 30px heading reading "Please review and confirm the items you
 * want to return." above a bare row of serial-number chips and one blue button
 * labelled `Confirm return | Total items to return: 0`. There was no cancel, no
 * device type, no sign of which devices were even eligible, and the express
 * check-in copy answered every rejected scan with a single sentence covering
 * three different reasons.
 *
 * The redesign is one screen read top to bottom:
 *
 *   1. Scan     — a focused field with its answer directly underneath it
 *   2. To return — the list about to be sent, each row removable
 *   3. Still out — what is left, clickable, so a scanner is optional
 *   4. Footer   — cancel, and one confirm that names the count
 *
 * `mode` only changes the wording and where the focus lands: "scan" opens on
 * the field with an empty list, "review" opens with the table's selection
 * already on the list. Both submit the same two requests with the same bodies.
 */
const ReturnDevicesModal = ({
  open,
  onClose,
  mode = "review",
  devices,
  initialSelection = [],
  eventSelected,
  event: eventProp,
  user: userProp,
  transactionLabel,
  onRefetch,
  onReturned,
  onClearSelection,
}) => {
  const reduxEvent = useSelector((state) => state.event.event);
  const reduxUser = useSelector((state) => state.admin.user);
  // The consumers table builds its own partial event object; everywhere else
  // the selected event in Redux is the one being worked on.
  const event = eventProp ?? reduxEvent;
  const user = userProp ?? reduxUser;

  const queryClient = useQueryClient();
  const { notify, contextHolder } = useStatusNotification();
  const inputRef = useRef(null);

  const [serial, setSerial] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // The modal is mounted only while open and destroyed on close, so the initial
  // selection is read once, on the way in.
  const [picked, setPicked] = useState(() => returnableDevices(initialSelection));

  const returnable = useMemo(() => returnableDevices(devices), [devices]);
  const pending = useMemo(() => pendingDevices(devices, picked), [devices, picked]);
  const summary = summarizeReturn({ picked, returnable });
  const isScanMode = mode === "scan";

  const closeModal = () => {
    if (isSubmitting) return;
    onClose?.();
  };

  const addDevice = (device, message) => {
    setPicked((current) => [...current, device]);
    setFeedback({ tone: "ok", message });
  };

  const handleScan = (submitEvent) => {
    submitEvent?.preventDefault?.();
    const result = resolveScan({ serial, devices, picked });
    setFeedback({ tone: result.ok ? "ok" : "error", message: result.message });
    if (result.ok) setPicked((current) => [...current, result.device]);
    // Clear after a rejection too, but only when a reader is driving: its next
    // read is already on its way and whatever is left behind gets prepended to
    // it. Nothing is lost — the feedback line under the field quotes the serial
    // that was refused. Typed entry (review mode) keeps the value so a typo can
    // be corrected in place.
    if (result.ok || isScanMode) setSerial("");
    // The next scan goes into the same field, so it keeps the keyboard.
    inputRef.current?.focus();
  };

  const handleAddAll = () => {
    if (pending.length === 0) return;
    setPicked(returnable);
    setFeedback({
      tone: "ok",
      message: `${pending.length} device${
        pending.length === 1 ? "" : "s"
      } added to the return list.`,
    });
  };

  const handleRemove = (device) => {
    setPicked((current) => current.filter((item) => !isSameDevice(item, device)));
    setFeedback(null);
  };

  const handleConfirm = async () => {
    if (isSubmitting || !summary.canSubmit) return;

    const count = picked.length;
    const payloads = buildBulkReturnPayloads({
      devices: picked,
      companyId: user?.companyData?.id,
      eventSelected,
      timeStamp: new Date().getTime(),
    });

    setIsSubmitting(true);
    try {
      await devitrakApi.patch(
        "/receiver/update-bulk-items-in-transaction",
        payloads.transaction
      );
      await devitrakApi.patch("/receiver/update-bulk-items-in-pool", payloads.pool);

      queryClient.invalidateQueries({
        queryKey: ["assginedDeviceList"],
        exact: true,
      });
      queryClient.invalidateQueries({
        queryKey: ["listOfreceiverInPool"],
        exact: true,
      });

      // Independent keys, so they clear concurrently.
      await Promise.all(
        returnCacheKeys({ event, companyId: user?.companyData?.id }).map((key) =>
          clearCacheMemory(key)
        )
      );

      await onRefetch?.();
      await onReturned?.();

      notify("success", `${count} device${count === 1 ? "" : "s"} returned.`);
      onClearSelection?.();
      setPicked([]);
      return onClose?.();
    } catch (error) {
      // One message, and it says what state the devices are in — the old
      // handler printed the raw error object after a success toast had already
      // fired, because the spinner was cleared before the last await.
      notify(
        "error",
        "The return failed. Nothing was returned — check the list and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const header = (
    <div className="return-devices__header">
      <h2 className="return-devices__title">
        {isScanMode ? "Express check-in" : "Return devices"}
      </h2>
      <p className="return-devices__subtitle">
        {isScanMode
          ? "Scan each device coming back. Nothing is returned until you confirm."
          : "Review the list before confirming. A return cannot be undone."}
      </p>
      {transactionLabel && (
        <p className="return-devices__meta">
          Transaction <code>{transactionLabel}</code>
          {returnable.length > 0 && (
            <>
              {" · "}
              {returnable.length} device{returnable.length === 1 ? "" : "s"} still out
            </>
          )}
        </p>
      )}
    </div>
  );

  const body = (
    <div className="return-devices">
      {contextHolder}

      {returnable.length === 0 ? (
        <p className="return-devices__empty return-devices__empty--all">
          Nothing on this transaction is still out. Every device has already been
          returned.
        </p>
      ) : (
        <>
          {/* 1 — Scan */}
          <section className="return-devices__block">
            <form className="return-devices__scan" onSubmit={handleScan}>
              <div className="return-devices__field">
                <label className="return-devices__label" htmlFor="return-serial-number">
                  {isScanMode
                    ? "Scan or type a serial number"
                    : "Add another device by serial number"}
                </label>
                <Input
                  id="return-serial-number"
                  name="serialNumber"
                  ref={inputRef}
                  autoFocus={isScanMode}
                  autoComplete="off"
                  placeholder="e.g. SN-4471"
                  value={serial}
                  onChange={(changeEvent) => setSerial(changeEvent.target.value)}
                  disabled={isSubmitting}
                  fullWidth
                />
              </div>
              <BlueButtonComponent
                title="Add"
                buttonType="submit"
                disabled={isSubmitting}
              />
            </form>
            {/* The answer sits under the field that caused it, not in a toast in
                the corner of the screen. */}
            {feedback && (
              <p
                className={`return-devices__feedback return-devices__feedback--${feedback.tone}`}
                role="status"
              >
                {feedback.message}
              </p>
            )}
          </section>

          {/* 2 — What is about to be sent */}
          <section className="return-devices__block">
            <div className="return-devices__heading">
              <h3 className="return-devices__section">
                To return ({summary.picked})
              </h3>
              {summary.picked > 0 && (
                <span className="return-devices__hint">
                  {summary.remaining === 0
                    ? "Everything still out is on the list"
                    : `${summary.remaining} still out and not on the list`}
                </span>
              )}
            </div>

            {picked.length === 0 ? (
              <p className="return-devices__empty">
                {isScanMode
                  ? "Nothing scanned yet. Scan a serial number above, or pick from the list below."
                  : "Nothing on the list yet. Pick a device from the list below."}
              </p>
            ) : (
              <ul className="return-devices__list">
                {picked.map((device, index) => (
                  <li className="return-devices__item" key={deviceKey(device, index)}>
                    <span className="return-devices__serial">
                      {device.serialNumber || "No serial number"}
                    </span>
                    <span className="return-devices__type">
                      {device.deviceType || "Unknown type"}
                    </span>
                    <button
                      className="return-devices__remove"
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleRemove(device)}
                      aria-label={`Remove ${device.serialNumber || "device"} from the return list`}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 3 — What is left, one click away. A scanner is convenient, not
              required, and the eligible devices were invisible before. */}
          {pending.length > 0 && (
            <section className="return-devices__block">
              <div className="return-devices__heading">
                <h3 className="return-devices__section">
                  Still out ({pending.length})
                </h3>
                <GrayButtonComponent
                  title={`Add all ${pending.length}`}
                  size="sm"
                  disabled={isSubmitting}
                  func={handleAddAll}
                />
              </div>
              <div className="return-devices__chips">
                {pending.map((device, index) => (
                  <Chip
                    key={deviceKey(device, index)}
                    label={`${device.serialNumber || "No serial"} · ${
                      device.deviceType || "Unknown"
                    }`}
                    variant="outlined"
                    color="default"
                    onClick={
                      isSubmitting
                        ? undefined
                        : () =>
                            addDevice(
                              device,
                              `${device.serialNumber || "Device"} added to the return list.`
                            )
                    }
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );

  const footer = [
    <div className="return-devices__footer" key="return-devices-footer">
      <GrayButtonComponent
        title="Cancel"
        disabled={isSubmitting}
        func={closeModal}
      />
      <BlueButtonConfirmationComponent
        title={
          summary.canSubmit
            ? `Return ${summary.picked} device${summary.picked === 1 ? "" : "s"}`
            : "Return devices"
        }
        disabled={!summary.canSubmit}
        loadingState={isSubmitting}
        confirmationTitle={`Return ${summary.picked} device${
          summary.picked === 1 ? "" : "s"
        }?`}
        confirmationDescription="The devices go back into the event pool. This cannot be undone."
        okText="Return"
        func={handleConfirm}
      />
    </div>,
  ];

  return (
    <ModalUX
      openDialog={open}
      closeModal={closeModal}
      closable={!isSubmitting}
      title={header}
      body={body}
      footer={footer}
      width={640}
      modalStyles={{ zIndex: 30 }}
    />
  );
};

ReturnDevicesModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["review", "scan"]),
  /** Every device record on the transaction, returned ones included. */
  devices: PropTypes.array,
  /** Records to put on the return list when the modal opens. */
  initialSelection: PropTypes.array,
  /** Passed verbatim to `/receiver/update-bulk-items-in-pool`. */
  eventSelected: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  event: PropTypes.object,
  user: PropTypes.object,
  transactionLabel: PropTypes.string,
  onRefetch: PropTypes.func,
  /** Runs after a successful return — receipt email, deposit settlement. */
  onReturned: PropTypes.func,
  onClearSelection: PropTypes.func,
};

export default ReturnDevicesModal;
