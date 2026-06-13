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

/**
 * Modal for creating a sub-location independently (not tied to an item).
 *
 * Props:
 *   open           - boolean, controls visibility
 *   onClose        - fn, closes the modal
 *   locationId     - number, the parent location's ID
 *   locationName   - string, shown as context label
 *   parentId       - number | null, sub_location_id to nest under (null = root level)
 *   parentName     - string | null, shown when nesting under an existing sub-location
 *   user           - redux user object
 */
const CreateSubLocationModal = ({
  open,
  onClose,
  locationId,
  locationName,
  parentId,
  parentName,
  user,
}) => {
  const { control, handleSubmit, reset } = useForm();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) =>
      devitrakApi.post("/db_sub_location/sub-locations", {
        location_id: locationId,
        company_id: user.sqlInfo.company_id,
        name: data.name,
        parent_id: parentId || null,
        active: 1,
      }),
    onSuccess: () => {
      message.success("Sub-location created successfully");
      queryClient.invalidateQueries({
        queryKey: ["locationsAndSublocationsWithTypes"],
      });
      queryClient.invalidateQueries({ queryKey: ["structuredCompanyInventory"] });
      clearCacheMemory(`company_id=${user.sqlInfo.company_id}`);
      reset();
      onClose();
    },
    onError: (err) => {
      message.error(`Error: ${err.response?.data?.msg || err.message}`);
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const context = parentName
    ? `${locationName} › ${parentName}`
    : locationName;

  return (
    <ModalUX
      openDialog={open}
      closeModal={handleClose}
      footer={null}
      title={<Typography style={Subtitle}>Add Sub-location</Typography>}
      body={
        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            paddingTop: "1rem",
          }}
        >
          {context && (
            <div
              style={{
                background: "#f5f5f5",
                borderRadius: "6px",
                padding: "8px 12px",
                fontSize: "13px",
                color: "#555",
              }}
            >
              Adding under: <strong>{context}</strong>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontWeight: 600 }}>Sub-location Name *</label>
            <Controller
              name="name"
              control={control}
              rules={{ required: "Name is required" }}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Input
                    {...field}
                    style={OutlinedInputStyle}
                    placeholder="e.g. Shelf A, Zone 1, Row 3"
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
            style={{ display: "flex", justifyContent: "flex-start", gap: "10px" }}
          >
            <DangerButtonComponent
              title="Cancel"
              func={handleClose}
              buttonType="button"
            />
            <BlueButtonComponent
              title="Create Sub-location"
              func={handleSubmit((data) => mutation.mutate(data))}
              buttonType="submit"
              loadingState={mutation.isPending}
            />
          </div>
        </form>
      }
    />
  );
};

export default CreateSubLocationModal;
