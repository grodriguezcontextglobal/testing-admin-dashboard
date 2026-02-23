import { Divider, Typography, Progress, Alert } from "antd";
import { useState, useCallback, useEffect } from "react";
import LightBlueButtonComponent from "../../../../../../components/UX/buttons/LigthBlueButton";
import ScannedSerialsList from "./ScannedSerialsList";
import SerialNumberInput from "./SerialNumberInput";
import { useDispatch, useSelector } from "react-redux";
import useBatchProcessor from "./hooks/useBatchProcessor";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import { onAddEventData } from "../../../../../../store/slices/eventSlice";

const Sequential = ({ deviceTitle, Subtitle }) => {
  const [scannedSerials, setScannedSerials] = useState([]);
  const [inputError, setInputError] = useState(null);
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
      const sqlTemplate = {
        event_id: event.sql.event_id,
        item_group: deviceTitle,
        company_id: user.sqlInfo.company_id,
        category_name: event.deviceSetup.find(
          (item) => item.group === deviceTitle
        ).category,
        data: batch,
        warehouse: 0,
      };

      const noSqlTemplate = {
        type: deviceTitle,
        deviceList: batch,
        company: event.company_id,
        status:"Operational",
        activity:false,
        comment:"No comment",
        eventSelected:event.eventInfoDetail.eventName,
        provider:event.company
      };
      // nosql - deviceList, status, activity, comment, eventSelected, provider, type, company
      await devitrakApi.post('/db_event/allocate-device-event', sqlTemplate)
      await devitrakApi.post('/receiver/receivers-pool-bulk', noSqlTemplate)
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
    reset();
  };

  const handleAllScannedSerialNumbers = async () => {
    if (scannedSerials.length === 0) {
      setInputError("Please scan serial numbers first.");
      return;
    }
    startProcessing();
  };

  useEffect(() => {
    console.log("status === success")
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
        <div style={{ margin:"0.5rem 0", gap:2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
              message="All serial numbers processed successfully!"
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
          disabled={scannedSerials?.length === 0 || status === "running"}
          buttonType="button"
          styles={{ width: "100%" }}
        />
      </div>
    </div>
  );
};

export default Sequential;
