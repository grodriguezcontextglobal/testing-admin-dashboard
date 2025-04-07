import { Button, Checkbox } from "antd";
import { LightBlueButton } from "../../../../../styles/global/LightBlueButton";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { RectangleBluePlusIcon } from "../../../../../components/icons/RectangleBluePlusIcon";
import { Grid, InputLabel, OutlinedInput, Typography } from "@mui/material";
import LightBlueButtonText from "../../../../../styles/global/LightBlueButtonText";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { useForm } from "react-hook-form";

const NoMerchantService = ({
  assignAllDevices,
  setAssignAllDevices,
  handleAddingNewItemToDeviceSetupEvent,
}) => {
  const { register, handleSubmit } = useForm();
  return (
    <form
      onSubmit={handleSubmit(handleAddingNewItemToDeviceSetupEvent)}
      style={{
        width: "100%",
      }}
    >
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
            <Checkbox
              style={{ width: "100%", textAlign: "left" }}
              onChange={(e) => setAssignAllDevices(e.target.checked)}
              value={assignAllDevices}
            >
              <p style={Subtitle}>Assign all</p>
            </Checkbox>
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
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              style={{ ...Subtitle, fontWeight: 500 }}
            >
              Quantity
            </Typography>
          </InputLabel>
          <OutlinedInput
            disabled={assignAllDevices}
            {...register("quantity")}
            style={{
              ...OutlinedInputStyle,
              width: "100%",
            }}
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
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              style={{
                ...Subtitle,
                fontWeight: 500,
                color: "transparent",
              }}
              color={"transparent"}
            >
              Quantity
            </Typography>
          </InputLabel>
          <Button
            htmlType="submit"
            style={{
              ...LightBlueButton,
              ...CenteringGrid,
              width: "100%",
            }}
          >
            <Typography textTransform="none" style={LightBlueButtonText}>
              <RectangleBluePlusIcon />
              &nbsp; Add item
            </Typography>
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default NoMerchantService;
