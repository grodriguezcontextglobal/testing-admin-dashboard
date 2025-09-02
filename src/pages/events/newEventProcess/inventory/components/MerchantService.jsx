import {
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { Checkbox } from "antd";
import { useForm } from "react-hook-form";
import { RectangleBluePlusIcon } from "../../../../../components/icons/RectangleBluePlusIcon";
import LightBlueButtonComponent from "../../../../../components/UX/buttons/LigthBlueButton";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../styles/global/Subtitle";

const MerchantService = ({
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
              style={{ ...Subtitle, fontWeight: 500 }}
            >
              Deposit
            </Typography>
          </InputLabel>
          <OutlinedInput
            {...register("deposit", { required: true})}
            style={{
              ...OutlinedInputStyle,
              width: "100%",
            }}
            startAdornment={<InputAdornment position="start">$</InputAdornment>}
            placeholder="Enter deposit needed for this item."
            fullWidth
            required
          />
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
        <LightBlueButtonComponent
        buttonType="button"
        func={() => handleSubmit(handleAddingNewItemToDeviceSetupEvent)()}
        title={"Add item"}
        styles={{width:"fit-content"}}
        icon={<RectangleBluePlusIcon />}
        />
      </Grid>
    </form>
  );
};

export default MerchantService;
