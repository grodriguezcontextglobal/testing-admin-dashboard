import {
  Box,
  InputLabel,
  Typography
} from "@mui/material";
import { Space } from "antd";
import { useState } from "react";
import Chip from "../../../../../../../components/UX/Chip/Chip";
import BlueButtonComponent from "../../../../../../../components/UX/buttons/BlueButton";
import Input from "../../../../../../../components/UX/inputs/Input"; // Reusable Input
import { useScanInput } from "../../../../../../../hooks/useScanInput";
import useAddingItemsToEventInventoryOneByOne from "../EditingEventInventoryActions/addingOneByOne";
import DangerButtonConfirmationComponent from "../../../../../../../components/UX/buttons/DangerButtonConfirmation";

export const UpdateEventInventoryByAddingSerialNumberOneByOne = ({
  closeModal,
  handleSubmit,
  loadingStatus,
  openNotification,
  OutlinedInputStyle,
  queryClient,
  register,
  setLoadingStatus,
  Subtitle,
  watch,
  UXMandatoryFieldsSign,
}) => {
  const [serialNumbers, setSerialNumbers] = useState([]);
  const [currentSerial, setCurrentSerial] = useState("");
  // Normalization, de-duplication and focus retention now come from the shared
  // hook, so this screen behaves identically to every other scan-in field.
  const {
    inputRef,
    add,
    remove: handleRemoveSerial,
    clear,
  } = useScanInput({ values: serialNumbers, setValues: setSerialNumbers });

  const handleAddSerial = (e) => {
    e.preventDefault();
    add(currentSerial);
    // Clear even when the read was refused, so a rejected value is not
    // prepended to the reader's next read.
    setCurrentSerial("");
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* 
        Layout Improvement:
        - Grouped input and action button in a grid layout for better responsiveness.
        - Used reusable 'Input' component for consistency.
      */}
      <form style={{ width: "100%" }} onSubmit={handleAddSerial}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "3fr 1fr" },
            gap: 2,
            alignItems: "end",
            mb: 2,
          }}
        >
          <Box>
            <InputLabel style={{ marginBottom: "0.2rem" }}>
              <Typography
                style={{
                  ...Subtitle,
                  fontWeight: 500,
                  textTransform: "none",
                }}
              >
                Serial Number {UXMandatoryFieldsSign}
              </Typography>
            </InputLabel>
            <Input
              ref={inputRef}
              value={currentSerial}
              onChange={(e) => setCurrentSerial(e.target.value)}
              placeholder={"Scan or type serial number..."}
              fullWidth
              autoFocus
              // Pass custom style to match previous OutlinedInputStyle
              style={{ ...OutlinedInputStyle, width: "100%" }}
            />
          </Box>
          <Box>
            <BlueButtonComponent
              title="Add"
              buttonType="submit"
              func={null}
              disabled={!currentSerial.trim()}
              styles={{ width: "100%" }}
            />
          </Box>
        </Box>
      </form>

      {/* 
        Layout Improvement:
        - Enhanced list visibility with clear count and scrollable area.
        - Added conditional empty state for better UX.
      */}
      <Box mb={2}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, flex: 1 }}>
          Added Serial Numbers ({serialNumbers.length}){serialNumbers.length > 0 && <DangerButtonConfirmationComponent
            title="Remove All"
            func={clear}
          />}
        </Typography>
        {serialNumbers.length === 0 ? (
          <Box
            sx={{
              p: 2,
              border: "1px dashed #e0e0e0",
              borderRadius: "4px",
              textAlign: "center",
              bgcolor: "#f9fafb",
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              style={{ fontStyle: "italic" }}
            >
              No serial numbers added yet.
            </Typography>
          </Box>
        ) : (
          <Space size={[8,16]} wrap>

            {serialNumbers.map((serial) => (
              <Chip
                color="info"
                variant="filled"
                filled={true}
                outlined={true}
                key={serial}
                label={serial}
                onDelete={() => handleRemoveSerial(serial)}
              />
            ))}
            </Space>
        )}
      </Box>

      {/* 
        Layout Improvement:
        - Separated the final submission form.
        - Aligned Deposit and Submit button in a responsive grid.
      */}
      <form
        onSubmit={handleSubmit(
          useAddingItemsToEventInventoryOneByOne({
            serialNumbers,
            closeModal,
            handleSubmit,
            loadingStatus,
            openNotification,
            OutlinedInputStyle,
            queryClient,
            register,
            setLoadingStatus,
            Subtitle,
            watch,
          }),
        )}
        style={{ width: "100%" }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
            alignItems: "end",
          }}
        >
          <Box>
            <InputLabel style={{ marginBottom: "0.2rem" }}>
              <Typography
                style={{
                  ...Subtitle,
                  fontWeight: 500,
                  textTransform: "none",
                }}
              >
                Deposit Amount {UXMandatoryFieldsSign}
              </Typography>
            </InputLabel>
            <Input
              {...register("deposit")}
              type="number"
              // MUI Input/OutlinedInput passes extra props down to the input element
              inputProps={{ step: "0.01", min: "0" }}
              placeholder="Enter deposit amount (optional)"
              fullWidth
              style={{ ...OutlinedInputStyle, width: "100%" }}
            />
          </Box>
          <Box>
            <BlueButtonComponent
              title={`Add ${serialNumbers.length} items and Exit`}
              buttonType="submit"
              disabled={serialNumbers.length === 0 || loadingStatus}
              loadingState={loadingStatus}
              styles={{ width: "100%" }}
            />
          </Box>
        </Box>
      </form>
    </Box>
  );
};
