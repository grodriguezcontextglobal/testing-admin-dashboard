import { Grid, InputLabel, OutlinedInput, Typography } from "@mui/material";
import BlueButtonComponent from "../../../../../../../components/UX/buttons/BlueButton";
import useAutomaticallyAvailableItemsToEvent from "../EditingEventInventoryActions/useAutomaticallyAvailableItemsToEvent";

export const AppSelectingFromExistingAutomatically = ({
  assignAllDevices,
  closeModal,
  eventName,
  handleSubmit,
  loadingStatus,
  openNotification,
  OutlinedInputStyle,
  queryClient,
  register,
  setAssignAllDevices,
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
        })
      )}
      style={{ width: "100%" }}
    >
      {/* Option 1: auto by location and quantity */}
      <Grid
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
        marginY={2}
        gap={2}
        style={{
          width: "100%",
        }}
        item
        xs={12}
        sm={12}
        md={12}
        lg={12}
      >
        <Grid item xs={6} sm={6} md={6} lg={6}>
          <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              style={{ ...Subtitle, fontWeight: 500 }}
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
      </Grid>
      <Grid
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
        marginY={2}
        gap={2}
        item
        xs={12}
        sm={12}
        md={12}
        lg={12}
      >
        <Grid item xs={6} sm={6} md={6} lg={6}>
          <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
            <p
              style={{
                ...Subtitle,
                fontWeight: 500,
                textTransform: "none",
                textAlign: "left",
              }}
            >
              Quantity {UXMandatoryFieldsSign}
            </p>
          </InputLabel>
          <OutlinedInput
            disabled={assignAllDevices}
            {...register("quantity")}
            style={{ ...OutlinedInputStyle, width: "100%" }}
            placeholder="Enter quantity needed."
            fullWidth
          />
        </Grid>
        {/* Deposit Amount input */}
        <Grid
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          marginY={2}
          gap={2}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <Grid item xs={6} sm={6} md={6} lg={6}>
            <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
              <p
                style={{
                  ...Subtitle,
                  fontWeight: 500,
                  textTransform: "none",
                  textAlign: "left",
                }}
              >
                Deposit Amount {UXMandatoryFieldsSign}
              </p>
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
        </Grid>
        <Grid
          style={{ alignSelf: "baseline" }}
          item
          xs={6}
          sm={6}
          md={6}
          lg={6}
        >
          <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
            <p
              style={{
                ...Subtitle,
                fontWeight: 500,
                color: "transparent",
                textTransform: "none",
                textAlign: "left",
              }}
              color={"transparent"}
            >
              Quantity
            </p>
          </InputLabel>
          <BlueButtonComponent
            title={"Add and Exit"}
            buttonType="submit"
            loadingState={loadingStatus}
            disabled={loadingStatus}
          />
        </Grid>
      </Grid>
    </form>
  );
};
