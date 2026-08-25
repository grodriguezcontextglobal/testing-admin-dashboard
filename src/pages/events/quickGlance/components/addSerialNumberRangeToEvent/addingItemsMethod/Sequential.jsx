import { Alert, Divider, Progress, Typography } from "antd";
import { useCallback, useEffect, useState } from "react";
import LightBlueButtonComponent from "../../../../../../components/UX/buttons/LigthBlueButton";
import ScannedSerialsList from "./ScannedSerialsList";
import SerialNumberInput from "./SerialNumberInput";
import { useDispatch, useSelector } from "react-redux";
import useBatchProcessor from "./hooks/useBatchProcessor";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import { onAddEventData } from "../../../../../../store/slices/eventSlice";
import {
  buildItemAllocationPayload,
  describeItemAllocation,
  explainAllocationFailure,
  summarizeItemAllocation,
} from "../utils/itemAllocation";

const Sequential = ({ deviceTitle, Subtitle }) => {
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
      const sqlTemplate = buildItemAllocationPayload({
        event,
        deviceTitle,
        user,
        batch,
      });

      let responseData;
      try {
        const { data } = await devitrakApi.post(
          "/db_event/allocate-device-event",
          sqlTemplate
        );
        responseData = data;
      } catch (error) {
        // A 422 means the serials did not match this group/category — a wrong
        // payload, not an outage. Carrying the reason up keeps it out of the
        // bare "Request failed with status code 422" the hook would show.
        throw new Error(explainAllocationFailure(error, deviceTitle));
      }

      const summary = summarizeItemAllocation(responseData, batch);
      setAllocationSummaries((previous) => [...previous, summary]);

      // Only the serials that actually resolved in SQL go into the Mongo pool.
      // poolReceiversBulk is insertMany with no dedup, so handing it the whole
      // scanned batch left unmatched devices held by an event they were never
      // assigned to. Confirmed with backend 2026-08-20.
      if (summary.allocatedSerials.length > 0) {
        const noSqlTemplate = {
          type: deviceTitle,
          activity: false,
          comment: "No comment",
          company: event.company_id,
          deviceList: summary.allocatedSerials,
          eventSelected: event.eventInfoDetail.eventName,
          provider: event.company,
          status: "Operational",
        };
        // nosql - deviceList, status, activity, comment, eventSelected, provider, type, company
        await devitrakApi.post("/receiver/receivers-pool-bulk", noSqlTemplate);
      }
      await finalizeProcessAndUpdateEventInventory()
    },
    [event, deviceTitle, user]
  );

  const { progress, status, error, startProcessing, reset } = useBatchProcessor(
    scannedSerials,
    processBatch
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

  const allocationOutcome = describeItemAllocation(
    allocationSummaries,
    deviceTitle
  );

  useEffect(() => {
    finalizeProcessAndUpdateEventInventory()
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
        <Typography.Title level={5}>Scan Serial Number</Typography.Title>
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
              message={allocationOutcome.headline}
              description={allocationOutcome.detail}
              type={allocationOutcome.complete ? "success" : "warning"}
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
          disabled={scannedSerials?.length === 0 || status === "running"}
          buttonType="button"
          styles={{ width: "100%" }}
        />
      </div>
    </div>
  );
};

export default Sequential;
