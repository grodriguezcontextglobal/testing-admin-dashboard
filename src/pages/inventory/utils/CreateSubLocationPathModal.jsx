import { useMutation, useQuery } from "@tanstack/react-query";
import { Input, message, Select, Typography } from "antd";
import { useState } from "react";
import { devitrakApi } from "../../../api/devitrakApi";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../components/UX/buttons/DangerButton";
import ModalUX from "../../../components/UX/modal/ModalUX";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../styles/global/Subtitle";

/**
 * Modal for registering an ordered sub-location path for a given location.
 *
 * Props:
 *   open              - boolean, controls visibility
 *   onClose           - fn, closes the modal
 *   locationId        - number | null, pre-selected location ID (null → show selector)
 *   locationName      - string | null, shown as context label when pre-selected
 *   user              - redux user object
 */
const CreateSubLocationPathModal = ({
  open,
  onClose,
  locationId: initialLocationId = null,
  locationName: initialLocationName = null,
  user,
}) => {
  const [segments, setSegments] = useState([""]);
  const [savedPaths, setSavedPaths] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(initialLocationId);
  const [selectedLocationName, setSelectedLocationName] = useState(initialLocationName);

  // Fetch locations for the selector (only when no locationId is pre-provided)
  const locationsQuery = useQuery({
    queryKey: ["locationsAndSublocationsWithTypes"],
    queryFn: () =>
      devitrakApi.post(
        `/db_location/companies/${user.sqlInfo.company_id}/locations`,
        {
          company_id: user.sqlInfo.company_id,
          role: Number(
            user.companyData.employees?.find((e) => e.user === user.email)?.role
          ),
          preference:
            user.companyData.employees?.find((e) => e.user === user.email)
              ?.preference || [],
        }
      ),
    enabled: !!user.sqlInfo.company_id && !initialLocationId,
    staleTime: 2 * 60 * 1000,
  });

  const locationOptions = Object.entries(
    locationsQuery?.data?.data?.data || {}
  ).map(([name, data]) => ({
    value: data.location_id,
    label: name,
  }));

  const preview = segments.filter((s) => s.trim()).join(" > ") || "—";

  const addSegment = () => setSegments((prev) => [...prev, ""]);
  const removeSegment = (index) =>
    setSegments((prev) => prev.filter((_, i) => i !== index));
  const updateSegment = (index, value) =>
    setSegments((prev) => prev.map((s, i) => (i === index ? value : s)));

  const mutation = useMutation({
    mutationFn: (path) =>
      devitrakApi.post("/db_location/sub-location-path", {
        company_id: user.sqlInfo.company_id,
        location_id: selectedLocationId,
        sub_location_path: path,
        created_by:
          user.sqlInfo.staff_id || user.sqlInfo.id || null,
      }),
    onSuccess: (_, path) => {
      const pathKey = path.join(" > ");
      setSavedPaths((prev) => [...prev, pathKey]);
      setSegments([""]);
      message.success(`Path "${pathKey}" saved`);
    },
    onError: (err, path) => {
      if (err.response?.status === 409) {
        // Path already exists — treat as idempotent success
        const pathKey = path.join(" > ");
        setSavedPaths((prev) => [...prev, pathKey]);
        setSegments([""]);
        message.info("This path already exists for the location.");
        return;
      }
      message.error(err.response?.data?.msg || err.message);
    },
  });

  const handleSave = () => {
    if (!selectedLocationId) {
      message.warning("Please select a location first");
      return;
    }
    const path = segments.map((s) => s.trim()).filter(Boolean);
    if (path.length === 0) {
      message.warning("Add at least one segment");
      return;
    }
    if (segments.some((s) => !s.trim())) {
      message.warning("Fill or remove empty segments before saving");
      return;
    }
    mutation.mutate(path);
  };

  const handleClose = () => {
    setSegments([""]);
    setSavedPaths([]);
    if (!initialLocationId) {
      setSelectedLocationId(null);
      setSelectedLocationName(null);
    }
    onClose();
  };

  return (
    <ModalUX
      openDialog={open}
      closeModal={handleClose}
      footer={null}
      width={580}
      title={
        <Typography style={Subtitle}>Register Sub-location Path</Typography>
      }
      body={
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            paddingTop: "1rem",
          }}
        >
          {!initialLocationId && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              <label style={{ fontWeight: 600 }}>Location *</label>
              <Select
                style={{ width: "100%" }}
                placeholder="Select a location"
                options={locationOptions}
                loading={locationsQuery.isLoading}
                value={selectedLocationId}
                onChange={(val, opt) => {
                  setSelectedLocationId(val);
                  setSelectedLocationName(opt?.label || null);
                }}
              />
            </div>
          )}

          {(initialLocationName || selectedLocationName) && (
            <div
              style={{
                background: "#f5f5f5",
                borderRadius: "6px",
                padding: "8px 12px",
                fontSize: "13px",
                color: "#555",
              }}
            >
              Location:{" "}
              <strong>{initialLocationName || selectedLocationName}</strong>
            </div>
          )}

          <div>
            <label
              style={{
                fontWeight: 600,
                display: "block",
                marginBottom: "8px",
              }}
            >
              Path segments (in order) *
            </label>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {segments.map((seg, index) => (
                <div
                  key={index}
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    style={{
                      minWidth: "20px",
                      color: "#667085",
                      fontSize: "12px",
                      textAlign: "right",
                    }}
                  >
                    {index + 1}.
                  </span>
                  <Input
                    style={{ ...OutlinedInputStyle, flex: 1 }}
                    value={seg}
                    onChange={(e) => updateSegment(index, e.target.value)}
                    placeholder={`Segment ${index + 1}`}
                    onPressEnter={addSegment}
                  />
                  {segments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSegment(index)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#F04438",
                        fontSize: "20px",
                        lineHeight: 1,
                        padding: "0 4px",
                      }}
                      aria-label="Remove segment"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addSegment}
              style={{
                marginTop: "8px",
                background: "none",
                border: "1px dashed #D0D5DD",
                borderRadius: "6px",
                padding: "5px 14px",
                cursor: "pointer",
                color: "#475467",
                fontSize: "13px",
                width: "fit-content",
              }}
            >
              + Add segment
            </button>
          </div>

          <div
            style={{
              background: "#f0f9ff",
              borderRadius: "6px",
              padding: "10px 14px",
              fontSize: "13px",
              color: "#0369a1",
            }}
          >
            Preview: <strong>{preview}</strong>
          </div>

          {savedPaths.length > 0 && (
            <div
              style={{
                background: "#f6ffed",
                borderRadius: "6px",
                padding: "10px 14px",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#389e0d",
                  margin: "0 0 6px",
                }}
              >
                Saved this session:
              </p>
              <ul
                style={{
                  margin: 0,
                  padding: "0 0 0 16px",
                  fontSize: "13px",
                  color: "#344054",
                }}
              >
                {savedPaths.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              gap: "10px",
            }}
          >
            <DangerButtonComponent
              title="Close"
              func={handleClose}
              buttonType="button"
            />
            <BlueButtonComponent
              title="Save Path"
              func={handleSave}
              buttonType="button"
              loadingState={mutation.isPending}
            />
          </div>
        </div>
      }
    />
  );
};

export default CreateSubLocationPathModal;
