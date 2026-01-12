import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input, message, Typography } from "antd";
import { Controller, useForm } from "react-hook-form";
import { devitrakApi } from "../../../api/devitrakApi";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../components/UX/buttons/DangerButton";
import ModalUX from "../../../components/UX/modal/ModalUX";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../styles/global/Subtitle";
import clearCacheMemory from "../../../utils/actions/clearCacheMemory";

const CreateLocationModal = ({ openModal, setOpenModal, user }) => {
  const { control, handleSubmit, reset } = useForm();
  const queryClient = useQueryClient();

  const createLocationMutation = useMutation({
    mutationFn: async (data) => {
      return await devitrakApi.post("/db_location/locations", {
        company_id: user.sqlInfo.company_id,
        location_name: data.location_name,
        manager_id: null, // Optional
        address_details: data.address_details || "", // Optional
      });
    },
    onSuccess: () => {
      message.success("Location created successfully");
      queryClient.invalidateQueries({
        queryKey: ["ItemsInInventoryCheckingQuery"],
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries("structuredCompanyInventory");
      queryClient.invalidateQueries("locationsAndSublocationsWithTypes");
      clearCacheMemory(`company_id=${user.sqlInfo.company_id}`);
      reset();
      setOpenModal(false);
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
        company_id: user.sqlInfo.company_id,
        location_name: data.location_name,
        manager_id: res.data?.member?.staff_id || null, // Optional
        address_details: data.address_details || "", // Optional
      });
    }
    return createLocationMutation.mutate({
      company_id: user.sqlInfo.company_id,
      location_name: data.location_name,
      manager_id: null, // Optional
      address_details: data.address_details || "", // Optional
    });
  };

  const modalBody = () => {
    return (
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
          style={{ display: "flex", justifyContent: "felx-start", gap: "10px" }}
        >
          <DangerButtonComponent
            title="Cancel"
            func={() => setOpenModal(false)}
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
  };
  return (
    <ModalUX
      openDialog={openModal}
      closeModal={() => setOpenModal(false)}
      footer={null}
      title={<Typography style={Subtitle}>Create New Location</Typography>}
      body={modalBody()}
    />
  );
};

export default CreateLocationModal;
