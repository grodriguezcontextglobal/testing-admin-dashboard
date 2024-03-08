import { Icon } from "@iconify/react";
import { Grid, InputAdornment, OutlinedInput, Typography } from "@mui/material";
import { Divider, Button } from "antd";
import { Link } from "react-router-dom";
import { onResetDeviceInQuickGlance } from "../../../../store/slices/devicesHandleSlice";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { useState } from "react";
// import CreateDevice from "../modal/CreateDevice";
import { useMediaQuery } from "@uidotdev/usehooks";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import DeviceInformationDetail from "./detailComponent/DeviceInformationDetail";
import DeviceDescriptionTags from "./detailComponent/DeviceDescriptionTags";
import TableDetailPerDevice from "./detailComponent/TableDetailPerDevice";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { MagnifyIcon } from "../../../../components/icons/Icons";
import { Title } from "../../../../styles/global/Title";
import ActionsMainPage from "./action/MainPage";
// import TableDetailPerDevice from "./TableDetailPerDevice";
// import Actions from "./Actions";
// import DeviceDescriptionTags from "./DeviceDescriptionTags";
// import DeviceInformationDetail from "./DeviceInformationDetail";

const DeviceDetail = () => {
  const { deviceInfoSelected } = useSelector((state) => state.devicesHandle);
  // const [openDeviceModal, setOpenDeviceModal] = useState(false);
  const { register, watch} = useForm();
  const dispatch = useDispatch();
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  const isLargeDevice = useMediaQuery(
    "only screen and (min-width : 993px) and (max-width : 1200px)"
  );
  const isExtraLargeDevice = useMediaQuery(
    "only screen and (min-width : 1201px)"
  );

  return (
    <>
      <Grid
        style={{
          padding: "5px",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
        container
      >
          <Grid
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            container
          >
            <Grid
              textAlign={"right"}
              display={`${(isLargeDevice || isExtraLargeDevice) && "none"}`}
              justifyContent={"flex-end"}
              alignItems={"center"}
              gap={1}
              item
              xs={12}
              sm={12}
              md={12} lg={12}
            >
              <Button
                style={{ ...BlueButton, ...CenteringGrid }}
                // onClick={() => setOpenDeviceModal(true)}
              >
                <Typography
                  textTransform={"none"}
                  style={BlueButtonText}
                >
                  <Icon
                    icon="ic:baseline-plus"
                    color="var(--base-white, #FFF"
                    width={20}
                    height={20}
                  />{" "}
                  Add new group of devices
                </Typography>
              </Button>
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <Typography
                textTransform={"none"}
                style={{
                  color: "var(--gray-900, #101828)",
                  lineHeight: "38px",
                }}
                textAlign={"left"}
                fontWeight={600}
                fontFamily={"Inter"}
                fontSize={"30px"}
              >
                Devices
              </Typography>
            </Grid>
            <Grid
              textAlign={"right"}
              display={`${(isSmallDevice || isMediumDevice) && "none"}`}
              justifyContent={"flex-end"}
              alignItems={"center"}
              gap={1}
              item
              md={6}
            >
              <Button
                style={{ ...BlueButton, ...CenteringGrid }}
                // onClick={() => setOpenDeviceModal(true)}
              >
                <Typography
                  textTransform={"none"}
                  style={BlueButtonText}
                >
                  <Icon
                    icon="ic:baseline-plus"
                    color="var(--base-white, #FFF"
                    width={20}
                    height={20}
                  />{" "}
                  Add new group of devices
                </Typography>
              </Button>
            </Grid>
          </Grid>
          <Grid
            style={{
              paddingTop: "0px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            container
            marginTop={4}
          >
            <Grid marginY={0} item xs={12} sm={12} md={8}>
              <Grid
                display={"flex"}
                justifyContent={"flex-start"}
                alignItems={"center"}
                item
                xs={12}
              >
                <Link to="/events/event-quickglance">
                  <Typography
                    textTransform={"none"}
                    textAlign={"left"}
                    fontWeight={600}
                    fontSize={"18px"}
                    fontFamily={"Inter"}
                    lineHeight={"28px"}
                    color={"var(--blue-dark-600, #155EEF)"}
                    onClick={() => dispatch(onResetDeviceInQuickGlance())}
                  >
                    Back
                  </Typography>
                </Link>
                <Typography
                  textTransform={"none"}
                  textAlign={"left"}
                  fontWeight={600}
                  fontSize={"18px"}
                  fontFamily={"Inter"}
                  lineHeight={"28px"}
                  color={"var(--gray-900, #101828)"}
                >
                  <Icon icon="mingcute:right-line" />
                  {deviceInfoSelected.entireData.type}{" "}
                  {deviceInfoSelected.entireData.device}
                </Typography>
              </Grid>
            </Grid>
            <Grid textAlign={"right"} item xs={4}></Grid>
          </Grid>
          <Divider />
          <Grid container>
            <Grid
              display={"flex"}
              justifyContent={"left"}
              textAlign={"left"}
              alignItems={"center"}
              padding={'0 0 0 -24px'}
              item
              xs={12}
              sm={12}
              md={4}
              lg={4}
            >
              <DeviceInformationDetail />
            </Grid>
            <Grid
              display={"flex"}
              justifyContent={"center"}
              // textAlign={"left"}
              alignItems={"center"}
              item
              xs={12}
              sm={12}
              md={4}
              lg={4}
            >
              <DeviceDescriptionTags />
            </Grid>
            <Grid
              display={"flex"}
              justifyContent={"flex-end"}
              // textAlign={"left"}
              alignItems={"center"}
              item
              xs={12}
              sm={12}
              md={4}
              lg={4}
            >
              <ActionsMainPage />
            </Grid>
          </Grid>

          <Divider />
          <Grid
            marginY={3}
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            gap={1}
            container
          >
            <Grid
          display={'flex'}
          justifyContent={'flex-start'}
          alignItems={"center"}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <Typography style={{ ...Title, fontSize: "28px", padding: 0, width: "fit-content" }}>Search:&nbsp;</Typography>
          <Grid item xs sm md lg>
            <OutlinedInput
              {...register("searching")}
              style={OutlinedInputStyle}
              fullWidth
              placeholder="Search consumer"
              startAdornment={
                <InputAdornment position="start">
                  <MagnifyIcon />
                </InputAdornment>
              }
            />
          </Grid>

        </Grid>
          </Grid>
          <Grid container>
            <Grid
              display={"flex"}
              justifyContent={"center"}
              alignItems={"center"}
              item
              xs={12}
            >
              <TableDetailPerDevice searching={watch('searching')} />
            </Grid>
          </Grid>
        {/* </Grid> */}
      </Grid>
      {/* <CreateDevice
        openDeviceModal={openDeviceModal}
        setOpenDeviceModal={setOpenDeviceModal}
      /> */}
    </>
  );
};

export default DeviceDetail;