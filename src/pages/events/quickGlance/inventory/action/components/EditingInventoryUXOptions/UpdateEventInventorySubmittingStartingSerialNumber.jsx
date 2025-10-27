import { Grid, InputLabel, OutlinedInput } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../../../../components/UX/buttons/BlueButton";
import { valueContext } from "../../EditingForEventInventory";
import useAddingByStartingSerialNumber from "../EditingEventInventoryActions/addingByStartingSerialNumber";

export const UpdateEventInventorySubmittingStartingSerialNumber = ({
  handleSubmit,
  closeModal,
  loadingStatus,
  register,
  OutlinedInputStyle,
  Subtitle,
  watch,
  queryClient,
  openNotification,
  setLoadingStatus,
}) => {
  const { user } = useSelector((state) => state.admin);
  const ctx = useContext(valueContext);
  const { valueItemSelected } = ctx || {};
  const [serialExists, setSerialExists] = useState(null);
  const [checkingSerial, setCheckingSerial] = useState(false);

  const startingValue = watch("starting");
  const quantityValue = watch("quantity");

  useEffect(() => {
    let timeoutId;
    const starting = String(startingValue ?? "").trim();
    const qty = Number(quantityValue);

    const canCheck =
      starting.length > 0 &&
      Number.isFinite(qty) &&
      qty > 0 &&
      valueItemSelected &&
      user?.sqlInfo?.company_id;

    if (!canCheck) {
      setSerialExists(null);
      setCheckingSerial(false);
      return;
    }

    const check = async () => {
      try {
        setCheckingSerial(true);
        const query =
          "Select * from item_inv where company_id = ? and warehouse = 1 and enableAssignFeature = 1 and location = ? and item_group = ? and category_name = ? and serial_number = ?";
        const values = [
          user.sqlInfo.company_id,
          valueItemSelected.location,
          valueItemSelected.item_group,
          valueItemSelected.category_name,
          starting,
        ];
        const res = await devitrakApi.post(
          "/db_event/inventory-based-on-submitted-parameters",
          { query, values }
        );
        const rows = res?.data?.result || [];
        setSerialExists(rows.length > 0);
      } catch (e) {
        setSerialExists(false);
      } finally {
        setCheckingSerial(false);
      }
    };

    timeoutId = setTimeout(check, 300); // debounce user typing

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    startingValue,
    quantityValue,
    valueItemSelected,
    user?.sqlInfo?.company_id,
  ]);

  return (
    <form
      onSubmit={handleSubmit(
        useAddingByStartingSerialNumber({
          closeModal,
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
              Starting serial number.
              {String(startingValue ?? "").trim().length > 0 &&
              Number.isFinite(Number(quantityValue)) &&
              Number(quantityValue) > 0 ? (
                checkingSerial ? null : serialExists ? null : (
                  <span
                    style={{
                      backgroundColor: "var(--danger-action)",
                      color: "var(--basewhite)",
                      width: "100%",
                      textAlign: "center",
                      borderRadius: "12px 12px 0 0",
                      padding: "0.5rem 0.25rem",
                    }}
                  >
                    Not found in location
                  </span>
                )
              ) : null}
            </p>
          </InputLabel>
          <OutlinedInput
            {...register("starting")}
            style={{
              ...OutlinedInputStyle,
              width: "100%",
            }}
            placeholder="Enter serial number."
            fullWidth
          />
        </Grid>
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
              Quantity
            </p>
          </InputLabel>
          <OutlinedInput
            {...register("quantity")}
            style={{ ...OutlinedInputStyle, width: "100%" }}
            placeholder="Enter quantity needed."
            fullWidth
          />
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
            title={"Apply Option 2"}
            buttonType="submit"
            loadingState={loadingStatus}
            disabled={loadingStatus || !serialExists}
          />
        </Grid>
      </Grid>
    </form>
  );
};
