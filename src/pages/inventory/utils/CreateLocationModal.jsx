import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input, message, Typography } from "antd";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { devitrakApi } from "../../../api/devitrakApi";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import TextLink from "../../../components/UX/buttons/TextLink";
import ModalUX from "../../../components/UX/modal/ModalUX";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../styles/global/Subtitle";
import clearCacheMemory from "../../../utils/actions/clearCacheMemory";

const CreateLocationModal = ({ openModal, setOpenModal, user }) => {
  const { control, handleSubmit, reset } = useForm();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [createdLocation, setCreatedLocation] = useState(null);
  const [segments, setSegments] = useState([""]);
  const [savedPaths, setSavedPaths] = useState([]);

  const createLocationMutation = useMutation({
    mutationFn: async (data) => {
      return await devitrakApi.post("/db_location/locations", {
        company_id: user.sqlInfo.company_id,
        location_name: data.location_name,
        manager_id: null,
        address_details: data.address_details || "",
      });
    },
    onSuccess: (response, variables) => {
      message.success("Location created successfully");
      queryClient.invalidateQueries({
        queryKey: ["ItemsInInventoryCheckingQuery"],
      });
      queryClient.invalidateQueries("structuredCompanyInventory");
      queryClient.invalidateQueries("locationsAndSublocationsWithTypes");
      queryClient.invalidateQueries(["locationPathsTree"]);
      clearCacheMemory(`company_id=${user.sqlInfo.company_id}`);
      reset();
      const locationId =
        response?.data?.location_id ||
        response?.data?.data?.location_id ||
        null;
      setCreatedLocation({
        id: locationId,
        name: variables.location_name,
      });
      setStep(2);
    },
    onError: (error) => {
      message.error(
        `Error creating location: ${
          error.response?.data?.error || error.message
        }`
      );
    },
  });

  // Saves one ordered sub-location path (e.g. ["Building A", "Floor 2"]) for
  // the just-created location. Lets the user add several without leaving step 2.
  const pathMutation = useMutation({
    mutationFn: (path) =>
      devitrakApi.post("/db_location/sub-location-path", {
        company_id: user.sqlInfo.company_id,
        location_id: createdLocation?.id,
        sub_location_path: path,
        created_by: user.sqlInfo.staff_id || user.sqlInfo.id || null,
      }),
    onSuccess: (_, path) => {
      const key = path.join(" > ");
      setSavedPaths((prev) => [...prev, key]);
      setSegments([""]);
      queryClient.invalidateQueries(["locationPathsTree"]);
      queryClient.invalidateQueries("locationsAndSublocationsWithTypes");
      message.success(`Sub-location "${key}" added`);
    },
    onError: (err, path) => {
      if (err.response?.status === 409) {
        setSavedPaths((prev) => [...prev, path.join(" > ")]);
        setSegments([""]);
        message.info("That sub-location already exists.");
        return;
      }
      message.error(err.response?.data?.msg || err.message);
    },
  });

  const preview = segments.map((s) => s.trim()).filter(Boolean).join(" > ");
  const addSegment = () => setSegments((prev) => [...prev, ""]);
  const removeSegment = (index) =>
    setSegments((prev) => prev.filter((_, i) => i !== index));
  const updateSegment = (index, value) =>
    setSegments((prev) => prev.map((s, i) => (i === index ? value : s)));

  const handleAddPath = () => {
    const path = segments.map((s) => s.trim()).filter(Boolean);
    if (path.length === 0) {
      message.warning("Type at least one level first.");
      return;
    }
    pathMutation.mutate(path);
  };

  const onSubmit = async (data) => {
    if (data.manager_id) {
      const res = await devitrakApi.post("/db_staff/consulting-member", {
        email: data.manager_id,
      });
      return createLocationMutation.mutate({
        ...data,
        manager_id: res.data?.member?.staff_id || null,
      });
    }
    return createLocationMutation.mutate(data);
  };

  const handleClose = () => {
    setStep(1);
    setCreatedLocation(null);
    setSegments([""]);
    setSavedPaths([]);
    reset();
    setOpenModal(false);
  };

  const step1Body = () => (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        paddingTop: "1rem",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <label style={{ fontWeight: 600 }}>Location Name *</label>
        <Controller
          name="location_name"
          control={control}
          rules={{ required: "Location name is required" }}
          render={({ field, fieldState: { error } }) => (
            <>
              <Input
                {...field}
                style={OutlinedInputStyle}
                placeholder="Enter location name"
                status={error ? "error" : ""}
              />
              {error && (
                <span style={{ color: "red", fontSize: "12px" }}>
                  {error.message}
                </span>
              )}
            </>
          )}
        />
      </div>

      <div
        style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}
      >
        <GrayButtonComponent
          title="Cancel"
          func={handleClose}
          buttonType="button"
        />
        <BlueButtonComponent
          title="Create Location"
          func={handleSubmit(onSubmit)}
          buttonType="submit"
          loadingState={createLocationMutation.isPending}
        />
      </div>
    </form>
  );

  const canAddPaths = Boolean(createdLocation?.id);

  const step2Body = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        paddingTop: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "var(--success-50, #ecfdf3)",
          border: "1px solid var(--success-200, #abefc6)",
          borderRadius: "8px",
          padding: "12px 16px",
          fontSize: "14px",
          color: "var(--gray-700, #344054)",
        }}
      >
        <span style={{ color: "var(--success-600, #079455)", fontWeight: 700 }}>
          ✓
        </span>
        <span>
          <strong>&quot;{createdLocation?.name}&quot;</strong> was created.
        </span>
      </div>

      {canAddPaths ? (
        <>
          <div>
            <label style={{ fontWeight: 600, display: "block" }}>
              Add sub-locations{" "}
              <span style={{ fontWeight: 400, color: "var(--gray-500, #667085)" }}>
                (optional)
              </span>
            </label>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "13px",
                color: "var(--gray-600, #475467)",
              }}
            >
              Break this location into an ordered path, e.g.{" "}
              <em>Building A &gt; Floor 2 &gt; Room 201</em>. Add as many as you
              like — or just click Done.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {segments.map((seg, index) => (
              <div
                key={index}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span
                  style={{
                    minWidth: "18px",
                    color: "var(--gray-500, #667085)",
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
                  placeholder={index === 0 ? "e.g. Building A" : `Level ${index + 1}`}
                  onPressEnter={addSegment}
                />
                {segments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSegment(index)}
                    aria-label="Remove level"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--error-500, #d15334)",
                      fontSize: "20px",
                      lineHeight: 1,
                      padding: "0 4px",
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <TextLink onClick={addSegment} style={{ width: "fit-content" }}>
              + Add another level
            </TextLink>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <BlueButtonComponent
              buttonType="button"
              size="sm"
              onClick={handleAddPath}
              loadingState={pathMutation.isPending}
              isDisabled={!preview}
              styles={{ width: "fit-content" }}
            >
              Add sub-location
            </BlueButtonComponent>
            {preview && (
              <span style={{ fontSize: "13px", color: "var(--gray-500, #667085)" }}>
                Preview:{" "}
                <strong style={{ color: "var(--gray-700, #344054)" }}>
                  {preview}
                </strong>
              </span>
            )}
          </div>

          {savedPaths.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--gray-600, #475467)",
                }}
              >
                Added ({savedPaths.length})
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {savedPaths.map((p, i) => (
                  <span
                    key={i}
                    style={{
                      background: "var(--gray-100, #eeefe9)",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      fontSize: "13px",
                      color: "var(--gray-700, #344054)",
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p style={{ margin: 0, fontSize: "14px", color: "var(--gray-600, #475467)" }}>
          You can add sub-locations to this location anytime from its page.
        </p>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
          borderTop: "1px solid var(--gray-200, #ddded6)",
          paddingTop: "1rem",
        }}
      >
        <BlueButtonComponent title="Done" func={handleClose} buttonType="button" />
      </div>
    </div>
  );

  return (
    <ModalUX
      openDialog={openModal}
      closeModal={handleClose}
      footer={null}
      title={
        <Typography style={Subtitle}>
          {step === 1 ? "Create New Location" : "Add Sub-locations"}
        </Typography>
      }
      body={step === 1 ? step1Body() : step2Body()}
    />
  );
};

export default CreateLocationModal;
