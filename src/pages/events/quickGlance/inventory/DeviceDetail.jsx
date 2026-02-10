import { Icon } from "@iconify/react";
import { Grid, InputAdornment, OutlinedInput, Typography } from "@mui/material";
import { Divider } from "antd";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { onResetDeviceInQuickGlance } from "../../../../store/slices/devicesHandleSlice";
// import CreateDevice from "../modal/CreateDevice";
import { MagnifyIcon } from "../../../../components/icons/MagnifyIcon";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import { Title } from "../../../../styles/global/Title";
import ActionsMainPage from "./action/MainPage";
import DeviceDescriptionTags from "./detailComponent/DeviceDescriptionTags";
import DeviceInformationDetail from "./detailComponent/DeviceInformationDetail";
import TableDetailPerDevice from "./detailComponent/TableDetailPerDevice";

const DeviceDetail = () => {
  const { deviceInfoSelected } = useSelector((state) => state.devicesHandle);
  // const [openDeviceModal, setOpenDeviceModal] = useState(false);
  const { register, watch } = useForm();
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();
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
            <Typography
              textTransform={"none"}
              style={TextFontSize30LineHeight38}
            >
              Devices
            </Typography>
            <BlueButtonComponent
              style={{
                display: user.role === "4" && "none",
                width:"fit-content"
              }}
              func={() => navigate("/inventory/new-bulk-items")}
              title="Add new group of devices"
            />
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
            padding={"0 0 0 -24px"}
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
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            <Typography
              style={{
                ...Title,
                fontSize: "28px",
                padding: 0,
                width: "fit-content",
              }}
            >
              Search:&nbsp;
            </Typography>
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
            <TableDetailPerDevice searching={watch("searching")} />
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
