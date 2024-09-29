import { Icon } from "@iconify/react/dist/iconify.js";
import {
  Button,
  Grid,
  InputAdornment,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Divider } from "antd";
import { lazy, Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MagnifyIcon } from "../../../../components/icons/MagnifyIcon";
import { WhitePlusIcon } from "../../../../components/icons/WhitePlusIcon";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import LightBlueButtonText from "../../../../styles/global/LightBlueButtonText";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import Loading from "../../../../components/animation/Loading";
// import TableDeviceLocation from "./components/Table";
// import TotalInventoryCard from "./components/TotalInventoryCard";
// import TotalValueDevicesLocation from "./components/TotalValueDevices";
// import TotalAvailableItem from "../../utils/TotalAvailableItem";
const TableDeviceLocation = lazy(() => import("./components/Table"));
const TotalInventoryCard = lazy(() =>
  import("./components/TotalInventoryCard")
);
const TotalValueDevicesLocation = lazy(() =>
  import("./components/TotalValueDevices")
);
const TotalAvailableItem = lazy(() => import("../../utils/TotalAvailableItem"));
const MainPageGrouping = () => {
  const [referenceData, setReferenceData] = useState({
    totalDevices: 0,
    totalValue: 0,
    totalAvailable: 0,
  });
  const location = useLocation();
  const groupName = location.search.split("&");
  const { register, watch } = useForm({
    defaultValues: {
      searchDevice: decodeURI(groupName[1].split("=")[1]),
    },
  });
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  const navigate = useNavigate();
  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
        </div>
      }
    >
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
            marginY={0}
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            item
            xs={12}
            sm={12}
            md={6}
          >
            <Typography style={TextFontSize30LineHeight38}>Group</Typography>
          </Grid>
          <Grid
            textAlign={"right"}
            display={`${isSmallDevice || isMediumDevice ? "none" : "flex"}`}
            justifyContent={"flex-end"}
            alignItems={"center"}
            gap={1}
            item
            md={6}
          >
            <Button
              style={{ ...BlueButton }}
              onClick={() => navigate("/inventory/new-item")}
            >
              <WhitePlusIcon />
              &nbsp;{" "}
              <Typography textTransform={"none"} style={BlueButtonText}>
                {" "}
                Add new device{" "}
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
              <Link to="/inventory">
                <Typography
                  display={"flex"}
                  justifyContent={"flex-start"}
                  alignItems={"center"}
                  style={{ ...LightBlueButtonText, fontWeight: 600 }}
                >
                  All devices
                </Typography>
              </Link>
              <Typography
                display={"flex"}
                justifyContent={"flex-start"}
                alignItems={"center"}
                textTransform={"none"}
                textAlign={"left"}
                fontWeight={600}
                fontSize={"18px"}
                fontFamily={"Inter"}
                lineHeight={"28px"}
                color={"var(--gray-900, #101828)"}
              >
                <Icon icon="mingcute:right-line" />
                {decodeURI(groupName[0].slice(1))}
              </Typography>
            </Grid>
          </Grid>
          <Grid textAlign={"right"} item xs={4}></Grid>
        </Grid>
        <Divider />
        <Grid
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          alignSelf={"start"}
          container
        >
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            textAlign={"left"}
            alignItems={"center"}
            alignSelf={"start"}
            item
            xs={12}
            sm={12}
            md={6}
            lg={6}
          >
            <Typography style={TextFontSize30LineHeight38}>
              {decodeURI(groupName[0].slice(1))}
            </Typography>
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"flex-end"}
            textAlign={"left"}
            alignItems={"center"}
            alignSelf={"start"}
            item
            xs={12}
            sm={12}
            md={6}
            lg={6}
          >
            {/* <ButtonActions /> */}
          </Grid>
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          container
        >
          <Grid item xs={12} sm={12} md={3} lg={4}>
            <TotalInventoryCard props={referenceData.totalDevices} />
          </Grid>
          <Grid item xs={12} sm={12} md={3} lg={4}>
            <TotalAvailableItem props={referenceData.totalAvailable} />
          </Grid>
          <Grid item xs={12} sm={12} md={3} lg={4}>
            <TotalValueDevicesLocation props={referenceData.totalValue} />
          </Grid>
        </Grid>
        <Divider />
        <Grid
          marginY={3}
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          container
        >
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            item
            xs={12}
            sm={12}
            md={8}
          >
            <Typography style={TextFontSize30LineHeight38}>
              Inventory of {decodeURI(groupName[0].slice(1))}
            </Typography>
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"flex-end"}
            alignItems={"center"}
            item
            xs={12}
            sm={12}
            md={4}
          >
            <OutlinedInput
              {...register("searchDevice")}
              fullWidth
              placeholder="Search devices here"
              style={OutlinedInputStyle}
              startAdornment={
                <InputAdornment position="start">
                  <MagnifyIcon />
                </InputAdornment>
              }
            />
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
            <TableDeviceLocation
              searchItem={watch("searchDevice")}
              referenceData={setReferenceData}
            />
          </Grid>
        </Grid>
      </Grid>
    </Suspense>
  );
};

export default MainPageGrouping;
