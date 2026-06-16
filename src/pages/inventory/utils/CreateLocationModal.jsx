import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input, message, Typography } from "antd";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { devitrakApi } from "../../../api/devitrakApi";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../components/UX/buttons/DangerButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../components/UX/modal/ModalUX";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../styles/global/Subtitle";
import clearCacheMemory from "../../../utils/actions/clearCacheMemory";
import CreateSubLocationPathModal from "./CreateSubLocationPathModal";

const CreateLocationModal = ({ openModal, setOpenModal, user }) => {
  const { control, handleSubmit, reset } = useForm();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [createdLocation, setCreatedLocation] = useState(null);
  const [openPathModal, setOpenPathModal] = useState(false);

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
    setOpenPathModal(false);
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

      <div style={{ display: "flex", justifyContent: "flex-start", gap: "10px" }}>
        <DangerButtonComponent
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
          background: "#f6ffed",
          border: "1px solid #b7eb8f",
          borderRadius: "8px",
          padding: "12px 16px",
          fontSize: "14px",
          color: "#344054",
        }}
      >
        <strong>"{createdLocation?.name}"</strong> was created successfully.
      </div>

      <p style={{ margin: 0, fontSize: "14px", color: "#475467" }}>
        You can now register ordered sub-location paths for this location, or
        skip and do it later.
      </p>

      <div style={{ display: "flex", justifyContent: "flex-start", gap: "10px" }}>
        <GrayButtonComponent
          title="Skip for now"
          func={handleClose}
          buttonType="button"
        />
        <BlueButtonComponent
          title="Register Sub-location Paths"
          func={() => setOpenPathModal(true)}
          buttonType="button"
        />
      </div>

      {openPathModal && (
        <CreateSubLocationPathModal
          open={openPathModal}
          onClose={() => setOpenPathModal(false)}
          locationId={createdLocation?.id || null}
          locationName={createdLocation?.name || null}
          user={user}
        />
      )}
    </div>
  );

  return (
    <ModalUX
      openDialog={openModal}
      closeModal={handleClose}
      footer={null}
      title={
        <Typography style={Subtitle}>
          {step === 1 ? "Create New Location" : "Location Created"}
        </Typography>
      }
      body={step === 1 ? step1Body() : step2Body()}
    />
  );
};

export default CreateLocationModal;
