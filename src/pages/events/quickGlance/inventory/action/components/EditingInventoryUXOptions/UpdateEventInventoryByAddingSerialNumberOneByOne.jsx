import {
  Box,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useRef, useState } from "react";
import BlueButtonComponent from "../../../../../../../components/UX/buttons/BlueButton";
import { TrashIcon } from "../../../../../../../components/icons/TashIcon";
import useAddingItemsToEventInventoryOneByOne from "../EditingEventInventoryActions/addingOneByOne";

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
  const inputRef = useRef(null);

  const handleAddSerial = (e) => {
    e.preventDefault();
    const trimmedSerial = currentSerial.trim();
    if (trimmedSerial && !serialNumbers.includes(trimmedSerial)) {
      setSerialNumbers((prev) => [...prev, trimmedSerial]);
      setCurrentSerial("");
      // Keep focus on input for continuous scanning/typing
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleRemoveSerial = (serialToRemove) => {
    setSerialNumbers((prev) =>
      prev.filter((serial) => serial !== serialToRemove)
    );
  };

  return (
    <Box>
      <form style={{ width: "100%" }} onSubmit={handleAddSerial}>
        {/* Serial Number Input */}
        <Grid container spacing={2} alignItems="center" mb={2}>
          <Grid item xs={8}>
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
            <OutlinedInput
              ref={inputRef}
              value={currentSerial}
              onChange={(e) => setCurrentSerial(e.target.value)}
              style={{ ...OutlinedInputStyle, width: "100%" }}
              placeholder={"Scan or type serial number..."}
              fullWidth
              autoFocus
            />
          </Grid>
          <Grid item xs={4}>
            <Box mt={3}>
              <BlueButtonComponent
                title="Add"
                buttonType="submit"
                func={null}
                disabled={!currentSerial.trim()}
              />
            </Box>
          </Grid>
        </Grid>
      </form>

      {/* Serial Numbers List */}
      <Box mb={2}>
        <Typography variant="subtitle1" gutterBottom>
          Added Serial Numbers ({serialNumbers.length})
        </Typography>
        {serialNumbers.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            style={{ fontStyle: "italic" }}
          >
            No serial numbers added yet
          </Typography>
        ) : (
          <List
            dense
            style={{
              maxHeight: "200px",
              overflow: "auto",
              border: "1px solid #e0e0e0",
              borderRadius: "4px",
            }}
          >
            {serialNumbers.map((serial, index) => (
              <ListItem key={index} divider>
                <ListItemText primary={serial} />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleRemoveSerial(serial)}
                    size="small"
                  >
                    <TrashIcon hoverFill={"#b42318"} />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Submit with Deposit Amount */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        gap={2}
      >
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
            })
          )}
          style={{ width: "100%" }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={8}>
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
              <OutlinedInput
                {...register("deposit")}
                type="number"
                inputProps={{ step: "0.01", min: "0" }}
                style={{ ...OutlinedInputStyle, width: "100%" }}
                placeholder="Enter deposit amount (optional)"
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <Box mt={3} display="flex" justifyContent="flex-end">
                <BlueButtonComponent
                  title={`Add ${serialNumbers.length} items and Exit.`}
                  buttonType="submit"
                  disabled={serialNumbers.length === 0 || loadingStatus}
                  loadingState={loadingStatus}
                />
              </Box>
            </Grid>
          </Grid>
        </form>
      </Box>
    </Box>
  );
};
