import {
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import LightBlueButtonComponent from "../../../../../components/UX/buttons/LigthBlueButton";
import Input from "../../../../../components/UX/inputs/Input";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../styles/global/Subtitle";

const MerchantService = ({
  handleAddingNewItemToDeviceSetupEvent,
  register,
  handleSubmit,
}) => {
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
            {...register("quantity")}
            style={{
              ...OutlinedInputStyle,
              width: "100%",
            }}
            placeholder="Enter quantity needed."
            fullWidth
            required
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
          <Input
            {...register("deposit", { required: true})}
            style={{
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
        />
      </Grid>
    </form>
  );
};

export default MerchantService;
