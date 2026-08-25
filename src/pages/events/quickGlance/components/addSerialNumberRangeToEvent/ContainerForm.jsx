import { Alert, Divider, Progress, Typography } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import LightBlueButtonComponent from "../../../../../components/UX/buttons/LigthBlueButton";
import { onAddEventData } from "../../../../../store/slices/eventSlice";
import ScannedSerialsList from "./addingItemsMethod/ScannedSerialsList";
import SerialNumberInput from "./addingItemsMethod/SerialNumberInput";
import useBatchProcessor from "./addingItemsMethod/hooks/useBatchProcessor";
import {
  CONTAINER_BATCH_SIZE,
  buildContainerAllocationPayload,
  summarizeContainerAllocation,
} from "./utils/containerAllocation";
const ContainerForm = ({
  deviceTitle,
  Subtitle,
}) => {
  const [scannedSerials, setScannedSerials] = useState([]);
  const [inputError, setInputError] = useState(null);
  const [allocationSummaries, setAllocationSummaries] = useState([]);
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch()
  const finalizeProcessAndUpdateEventInventory = async() => {
      const updatedEventInventory = await devitrakApi.post("/event/update-global-state", {event_id:event.id})
      const eventRef = event
      dispatch(onAddEventData({
        ...eventRef,
        deviceSetup:updatedEventInventory.data.updatedEventInventary
      }))
  }

  const processBatch = useCallback(
    async (batch) => {
      const sqlTemplate = buildContainerAllocationPayload({
        event,
        deviceTitle,
        user,
        batch,
      });

      // This endpoint writes the Mongo receivers pool itself, inside its own
      // transaction. The `/receiver/receivers-pool-bulk` call that used to
      // follow it inserted every unit into the pool a second time — that
      // helper is insertMany with no dedup. Confirmed with backend 2026-08-19.
      const { data } = await devitrakApi.post(
        "/db_event/allocate-device-container-event",
        sqlTemplate
      );
      setAllocationSummaries((previous) => [
        ...previous,
        summarizeContainerAllocation(data),
      ]);
      await devitrakApi.post("/event/update-event-inventory-freshest-data", {event_id:event.id})
    },
    [event, deviceTitle, user]
  );

  const { progress, status, error, startProcessing, reset } = useBatchProcessor(
    scannedSerials,
    processBatch,
    CONTAINER_BATCH_SIZE
  );

  const handleAddSerial = (serial) => {
    if (scannedSerials.includes(serial)) {
      setInputError(`Serial number "${serial}" has already been scanned.`);
      return;
    }
    setScannedSerials((prev) => [...prev, serial]);
    setInputError(null);
  };

  const removeSubmittedSerial = (index) => {
    setScannedSerials(
      scannedSerials.filter((_,i) => i !== index)
    );
  };

  const handleClear = () => {
    setScannedSerials([]);
    setInputError(null);
    setAllocationSummaries([]);
    reset();
  };

  const handleAllScannedSerialNumbers = async () => {
    if (scannedSerials.length === 0) {
      setInputError("Please scan serial numbers first.");
      return;
    }
    setAllocationSummaries([]);
    startProcessing();
  };

  /**
   * What the endpoint actually reported, rather than a blanket success.
   * It answers 200 having processed only the scanned serials that resolved to
   * a container, without naming the ones it skipped — so claiming "all serial
   * numbers processed" is a promise the response does not make. It does carry
   * the item count, and the "containers are empty" message.
   */
  const allocationOutcome = () => {
    const processed = allocationSummaries
      .map((summary) => summary.processedItemCount)
      .filter((count) => typeof count === "number");
    const total = processed.reduce((sum, count) => sum + count, 0);
    const messages = [
      ...new Set(allocationSummaries.map((summary) => summary.message).filter(Boolean)),
    ];

    if (processed.length === 0) {
      return {
        headline: `Scanned containers sent for ${scannedSerials.length} serial number${scannedSerials.length === 1 ? "" : "s"}.`,
        detail: messages.join(" ") || null,
      };
    }
    return {
      headline: `${total} item${total === 1 ? "" : "s"} moved into this event, from ${scannedSerials.length} scanned serial number${scannedSerials.length === 1 ? "" : "s"} — containers plus what was inside them.`,
      detail: messages.join(" ") || null,
    };
  };

  useEffect(() => {
    finalizeProcessAndUpdateEventInventory()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status === "success"])
  
  return (
    <div style={{ width: "100%" }}>
      <div style={{ margin: "0px auto 1rem", width: "100%" }}>
        <label style={{ ...Subtitle, margin: "0px auto 1rem" }}>
          Scan all serial numbers for {deviceTitle} and enabled to this
          event&apos;s inventory.
        </label>
      </div>

      <div style={{ margin: "1rem 0" }}>
        <Typography.Title level={5}>Scan Serial Number of containers</Typography.Title>
        <SerialNumberInput
          onAdd={handleAddSerial}
          disabled={status === "running"}
          placeholder={`Enter serial for ${deviceTitle}`}
        />
        {inputError && (
          <Alert message={inputError} type="error" showIcon style={{ marginTop: "8px" }} />
        )}
      </div>

      <Divider />

      <div>
        <div style={{ alignItems: "center", display: "flex", gap:2, justifyContent: "space-between", margin:"0.5rem 0" }}>
        <Typography.Title level={5}>
          Scanned Items ({scannedSerials.length})
        </Typography.Title>
        <GrayButtonComponent title="Clear" func={handleClear} disabled={status === "running"} />
        </div>
        <ScannedSerialsList
          serials={scannedSerials}
          onRemove={removeSubmittedSerial}
        />
      </div>

      {status !== "idle" && (
        <div style={{ marginTop: "1rem" }}>
          <Progress percent={progress} />
          {status === "running" && <p>Processing...</p>}
          {status === "success" && (
            <Alert
              message={allocationOutcome().headline}
              description={allocationOutcome().detail}
              type="success"
              showIcon
            />
          )}
          {status === "error" && <Alert message={error} type="error" showIcon />}
        </div>
      )}

      <div style={{ marginTop: "2rem", width: "100%" }}>
        <LightBlueButtonComponent
          title="Allocate Scanned Serial Numbers"
          func={handleAllScannedSerialNumbers}
          disabled={scannedSerials?.length === 0 || status === "running" || status === "success"}
          buttonType="button"
          styles={{ width: "100%" }}
        />
      </div>
    </div>
  );
};

export default ContainerForm;
