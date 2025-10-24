import {
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { RectangleBluePlusIcon } from "../../../../../components/icons/RectangleBluePlusIcon";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import LightBlueButtonComponent from "../../../../../components/UX/buttons/LigthBlueButton";
import { onAddExtraServiceNeeded } from "../../../../../store/slices/eventSlice";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import { TextFontSize20LineHeight30 } from "../../../../../styles/global/TextFontSize20HeightLine30";
import SelectedServiceAddedRendered from "../components/SelectedServicesAddedRendered";

const Services = ({
  handleExtraService,
  removeServiceAdded,
  extraServiceAdded,
  checkFilledFields,
}) => {
  const { register, handleSubmit, watch, setValue } = useForm();
  const { extraServiceNeeded } = useSelector((state) => state.event);
  const [extraServicesNeeded, setExtraServicesNeeded] =
    useState(extraServiceNeeded);
  const dispatch = useDispatch();

  const handleExtraServiceNeeded = async () => {
    return setExtraServicesNeeded(!extraServicesNeeded);
  };
  const clearForm = () => {
    setValue("service", "");
    setValue("deposit", "");
    return;
  };

  useEffect(() => {
    dispatch(onAddExtraServiceNeeded(extraServicesNeeded));
  }, [extraServicesNeeded, dispatch]);

  useEffect(() => {
    const controller = new AbortController();
    clearForm();
    return () => {
      controller.abort();
    };
  }, [extraServiceAdded.length]);

  const triggerFilledFields = () => {
    const depositField = watch("deposit") !== "";
    const serviceField = watch("service") !== "";
    const checkingFields = [depositField, serviceField];
    if (checkingFields.some((ele) => ele === true)) {
      return checkFilledFields(true);
    }
    return checkFilledFields(false);
  };
  triggerFilledFields();
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
        <LightBlueButtonComponent
          title="Need extra services?"
          styles={{ width: "fit-content" }}
          func={() => handleExtraServiceNeeded()}
        />
        {/* <Buttonx
          style={{
            ...LightBlueButton,
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => handleExtraServiceNeeded()}
        >
          <p style={LightBlueButtonText}>Need extra services?</p>
        </Buttonx> */}
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
                  required
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
                    Amount to charge
                  </Typography>
                </InputLabel>
                <OutlinedInput
                  {...register("deposit")}
                  required
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
              <BlueButtonComponent
                buttonType="submit"
                title="Add service"
                icon={
                  <RectangleBluePlusIcon
                    hoverStroke="var(--Blue-dark-800)"
                    stroke="var(--basewhite)"
                  />
                }
                styles={{ width: "100%" }}
              />
              {/* <Button
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
              </Button> */}
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
