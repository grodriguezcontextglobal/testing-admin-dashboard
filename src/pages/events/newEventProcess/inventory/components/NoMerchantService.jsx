import { Grid, InputLabel, Typography } from "@mui/material";
import { Checkbox } from "antd";
import { useForm } from "react-hook-form";
import LightBlueButtonComponent from "../../../../../components/UX/buttons/LigthBlueButton";
import Input from "../../../../../components/UX/inputs/Input";
import { Subtitle } from "../../../../../styles/global/Subtitle";

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
              checked={assignAllDevices}
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
          <Input
            disabled={assignAllDevices}
            {...register("quantity")}
            style={{
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
          <LightBlueButtonComponent
            title={"Add item"}
            loadingState={false}
            buttonType="button"
            func={() => handleSubmit(handleAddingNewItemToDeviceSetupEvent)()}
            styles={{ width: "fit-content" }}
          />
        </Grid>
      </Grid>
    </form>
  );
};

export default NoMerchantService;
