import { Box, InputLabel } from "@mui/material";
import BlueButtonComponent from "../../../../../../../components/UX/buttons/BlueButton";
import Input from "../../../../../../../components/UX/inputs/Input";
import useAutomaticallyAvailableItemsToEvent from "../EditingEventInventoryActions/useAutomaticallyAvailableItemsToEvent";

export const AppSelectingFromExistingAutomatically = ({
  assignAllDevices,
  closeModal,
  eventName,
  handleSubmit,
  loadingStatus,
  openNotification,
  // OutlinedInputStyle,
  queryClient,
  register,
  // setAssignAllDevices,
  setLoadingStatus,
  Subtitle,
  UXMandatoryFieldsSign,
}) => {
  return (
    <form
      onSubmit={handleSubmit(
        useAutomaticallyAvailableItemsToEvent({
          assignAllDevices,
          closeModal,
          eventName,
          openNotification,
          queryClient,
          setLoadingStatus,
        }),
      )}
      style={{ width: "100%" }}
    >
      {/* Option 1: auto by location and quantity */}
      {/* <Grid
        container
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
        marginY={2}
        gap={2}
        style={{
          width: "100%",
        }}
      >
        <Grid item xs={12} sm={12} md={12} lg={12}>
          <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              style={{ ...Subtitle, fontWeight: 500 }}
              component="div"
            >
              Assign all&nbsp;
              <input
                type="checkbox"
                value={assignAllDevices}
                onChange={(e) => setAssignAllDevices(e.target.checked)}
              />
            </Typography>
          </InputLabel>
        </Grid>
      </Grid> */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
          gap: 2,
          alignItems: "end",
          width: "100%",
          marginY: 2,
        }}
      >
        <Box>
          <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
            <p
              style={{
                ...Subtitle,
                fontWeight: 500,
                textTransform: "none",
                textAlign: "left",
                margin: 0,
              }}
            >
              Quantity {UXMandatoryFieldsSign}
            </p>
          </InputLabel>
          <Input
            disabled={assignAllDevices}
            {...register("quantity")}
            style={{ width: "100%" }}
            placeholder="Enter quantity needed."
            fullWidth
          />
        </Box>

        <Box>
          <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
            <p
              style={{
                ...Subtitle,
                fontWeight: 500,
                textTransform: "none",
                textAlign: "left",
                margin: 0,
              }}
            >
              Deposit Amount {UXMandatoryFieldsSign}
            </p>
          </InputLabel>
          <Input
            {...register("deposit")}
            type="number"
            inputProps={{ step: "0.01", min: "0" }}
            style={{ width: "100%" }}
            placeholder="Enter deposit amount (optional)"
            fullWidth
          />
        </Box>

        <Box>
          <BlueButtonComponent
            title={"Add and Exit"}
            buttonType="submit"
            loadingState={loadingStatus}
            disabled={loadingStatus}
            styles={{ width: "100%" }}
          />
        </Box>
      </Box>
    </form>
  );
};
