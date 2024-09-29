import {
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { TextFontSize20LineHeight30 } from "../../../../../styles/global/TextFontSize20HeightLine30";
import { Button } from "antd";
import { LightBlueButton } from "../../../../../styles/global/LightBlueButton";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { RectangleBluePlusIcon } from "../../../../../components/icons/RectangleBluePlusIcon";
import LightBlueButtonText from "../../../../../styles/global/LightBlueButtonText";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import { useForm } from "react-hook-form";
import SelectedServiceAddedRendered from "../components/SelectedServicesAddedRendered";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { onAddExtraServiceNeeded } from "../../../../../store/slices/eventSlice";

const Services = ({
  handleExtraService,
  removeServiceAdded,
  extraServiceAdded,
}) => {
  const { register, handleSubmit } = useForm();
  const { extraServiceNeeded } = useSelector((state) => state.event);
  const [extraServicesNeeded, setExtraServicesNeeded] =
    useState(extraServiceNeeded);
  const dispatch = useDispatch();

  const handleExtraServiceNeeded = async () => {
    return setExtraServicesNeeded(!extraServicesNeeded);
  };
  useEffect(() => {
    dispatch(onAddExtraServiceNeeded(extraServicesNeeded));
  }, [extraServicesNeeded, dispatch]);
  return (
    <Grid
      style={{
        borderRadius: "8px",
        border: "1px solid var(--gray300, #D0D5DD)",
        background: "var(--gray100, #F2F4F7)",
        padding: "24px",
        width: "100%",
      }}
      marginY={2}
      item
      xs={12}
      sm={12}
      md={12}
      lg={12}
    >
      <InputLabel
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          textTransform="none"
          style={{ ...TextFontSize20LineHeight30, fontWeight: 600 }}
        >
          Other services
        </Typography>
        <Button
          style={{
            ...LightBlueButton,
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => handleExtraServiceNeeded()}
        >
          <p style={LightBlueButtonText}>Need extra services?</p>
        </Button>
      </InputLabel>
      {extraServicesNeeded && (
        <>
          <form
            onSubmit={handleSubmit(handleExtraService)}
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
                    Service
                  </Typography>
                </InputLabel>
                <OutlinedInput
                  {...register("service")}
                  style={{
                    ...OutlinedInputStyle,
                    width: "100%",
                  }}
                  placeholder="Enter service name."
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
                  {...register("deposit")}
                  style={{
                    ...OutlinedInputStyle,
                    width: "100%",
                  }}
                  startAdornment={
                    <InputAdornment position="start">$</InputAdornment>
                  }
                  placeholder="Enter price to charge for this service."
                  fullWidth
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
              <Button
                htmlType="submit"
                style={{
                  ...LightBlueButton,
                  ...CenteringGrid,
                  width: "100%",
                }}
              >
                <RectangleBluePlusIcon />
                &nbsp;
                <Typography textTransform="none" style={LightBlueButtonText}>
                  Add service
                </Typography>
              </Button>
            </Grid>
          </form>
          <SelectedServiceAddedRendered
            extraServiceAdded={extraServiceAdded}
            removeServiceAdded={removeServiceAdded}
          />
        </>
      )}{" "}
    </Grid>
  );
};

export default Services;
