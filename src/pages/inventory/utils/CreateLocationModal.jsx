import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Input, message, Select, Typography } from "antd";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { devitrakApi } from "../../../api/devitrakApi";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../components/UX/modal/ModalUX";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../styles/global/Subtitle";
import clearCacheMemory from "../../../utils/actions/clearCacheMemory";

/**
 * Create a location. By default this creates a TOP-LEVEL location. Optionally
 * the user can pick an existing location to nest the new one inside it as a
 * sub-location (via the /db_sub_location/sub-locations tree). Parentage is an
 * explicit choice — nothing is nested unless the user asks for it.
 */
const CreateLocationModal = ({ openModal, setOpenModal, user }) => {
  const { control, handleSubmit, reset } = useForm();
  const queryClient = useQueryClient();
  const [parentLocation, setParentLocation] = useState(null); // { id, name } | null

  const invalidateLocationData = () => {
    queryClient.invalidateQueries({
      queryKey: ["ItemsInInventoryCheckingQuery"],
    });
    queryClient.invalidateQueries("structuredCompanyInventory");
    queryClient.invalidateQueries("locationsAndSublocationsWithTypes");
    queryClient.invalidateQueries(["locationPathsTree"]);
    clearCacheMemory(`company_id=${user.sqlInfo.company_id}`);
  };

  // Existing top-level locations, offered as optional parents.
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
    enabled: !!user.sqlInfo.company_id && openModal,
    staleTime: 2 * 60 * 1000,
  });

  const locationOptions = Object.entries(
    locationsQuery?.data?.data?.data || {}
  ).map(([name, data]) => ({ value: data.location_id, label: name }));

  const createTopLevelMutation = useMutation({
    mutationFn: (data) =>
      devitrakApi.post("/db_location/locations", {
        company_id: user.sqlInfo.company_id,
        location_name: data.location_name,
        manager_id: null,
        address_details: data.address_details || "",
      }),
    onSuccess: (_res, variables) => {
      message.success(`Location "${variables.location_name}" created`);
      invalidateLocationData();
      handleClose();
    },
    onError: (error) => {
      message.error(
        `Error creating location: ${
          error.response?.data?.error || error.message
        }`
      );
    },
  });

  const createSubLocationMutation = useMutation({
    mutationFn: (data) =>
      devitrakApi.post("/db_sub_location/sub-locations", {
        location_id: parentLocation?.id,
        company_id: user.sqlInfo.company_id,
        name: data.location_name,
        parent_id: null,
        active: 1,
      }),
    onSuccess: (_res, variables) => {
      message.success(
        `"${variables.location_name}" added under ${parentLocation?.name}`
      );
      invalidateLocationData();
      handleClose();
    },
    onError: (error) => {
      message.error(
        `Error creating sub-location: ${
          error.response?.data?.msg || error.message
        }`
      );
    },
  });

  const isPending =
    createTopLevelMutation.isPending || createSubLocationMutation.isPending;

  const onSubmit = (data) => {
    if (parentLocation?.id) {
      return createSubLocationMutation.mutate(data);
    }
    return createTopLevelMutation.mutate(data);
  };

  function handleClose() {
    setParentLocation(null);
    reset();
    setOpenModal(false);
  }

  return (
    <ModalUX
      openDialog={openModal}
      closeModal={handleClose}
      footer={null}
      title={<Typography style={Subtitle}>Create New Location</Typography>}
      body={
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            paddingTop: "1rem",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontWeight: 600 }}>
              {parentLocation ? "Sub-location Name *" : "Location Name *"}
            </label>
            <Controller
              name="location_name"
              control={control}
              rules={{ required: "Name is required" }}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Input
                    {...field}
                    style={OutlinedInputStyle}
                    placeholder={
                      parentLocation
                        ? "e.g. Floor 2, Storage Room"
                        : "Enter location name"
                    }
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

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontWeight: 600 }}>
              Nest under{" "}
              <span
                style={{ fontWeight: 400, color: "var(--gray-500, #667085)" }}
              >
                (optional)
              </span>
            </label>
            <Select
              style={{ width: "100%" }}
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Top-level location (no parent)"
              loading={locationsQuery.isLoading}
              options={locationOptions}
              value={parentLocation?.id ?? undefined}
              onChange={(val, opt) =>
                setParentLocation(val ? { id: val, name: opt?.label } : null)
              }
            />
            <span style={{ fontSize: "12px", color: "var(--gray-500, #667085)" }}>
              {parentLocation
                ? `This will be created as a sub-location inside "${parentLocation.name}".`
                : "Leave empty to create a standalone, top-level location."}
            </span>
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
              title={parentLocation ? "Create Sub-location" : "Create Location"}
              func={handleSubmit(onSubmit)}
              buttonType="submit"
              loadingState={isPending}
            />
          </div>
        </form>
      }
    />
  );
};

export default CreateLocationModal;
