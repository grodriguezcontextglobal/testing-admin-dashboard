import { Icon } from "@iconify/react/dist/iconify.js";
import {
  Button,
  Grid,
  InputAdornment,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Breadcrumb, Divider } from "antd";
import { lazy, Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Loading from "../../../../components/animation/Loading";
import { MagnifyIcon } from "../../../../components/icons/MagnifyIcon";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import LightBlueButtonText from "../../../../styles/global/LightBlueButtonText";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
const TableDeviceLocation = lazy(() => import("./components/Table"));
const TotalInventoryCard = lazy(() =>
  import("./components/TotalInventoryCard")
);
const TotalValueDevicesLocation = lazy(() =>
  import("./components/TotalValueDevices")
);
const TotalAvailableItem = lazy(() => import("../../utils/TotalAvailableItem"));

const MainPage = () => {
  const [referenceData, setReferenceData] = useState({
    totalDevices: 0,
    totalValue: 0,
    totalAvailable: 0,
  });
  const location = useLocation();
  const locationName = location.search.split("&")[0];
  const { register, watch, setValue } = useForm({
    defaultValues: {
      searchDevice: location.search.split("&")[1]?.split("=")[1],
    },
  });
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (watch("searchDevice") === "undefined") {
      setValue("searchDevice", "");
    }
  }, [locationName]);

  const subLocations =
    location.state !== null
      ? decodeURI(location?.state?.sub_location)?.split("%2C")
      : [];

  const navigateToSublocation = (subLocation, index) => {
    const subLocationPathNavigate = subLocations.slice(0, index+1);
    const chosenPath = encodeURIComponent(subLocationPathNavigate.join(","));
    return (
      <Link
        to={`${location.pathname}${location.search}`}
        state={{ sub_location: chosenPath }}
        style={{ textDecoration: "none", height: "100%" }}
      >
        {subLocation}
      </Link>
    );
  };

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
            <Typography style={TextFontSize30LineHeight38}>
              Local inventory
            </Typography>
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
              onClick={() => navigate("/inventory/edit-group")}
              style={{ ...BlueButton, width: "fit-content" }}
            >
              <p style={{ ...BlueButtonText, textTransform: "none" }}>
                Update a group of device
              </p>
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
          <Grid
            marginY={0}
            display={"flex"}
            sx={{
              flexDirection: {
                xs: "column",
                sm: "column",
                md: "row",
                lg: "row",
              },
            }}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            <Grid
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              item
              xs={12}
              sm={12}
              md={1}
              lg={1}
            >
              <Link style={{textAlign: "left", width: "100%"}} to="/inventory">
                <Typography
                  display={"flex"}
                  justifyContent={"flex-start"}
                  alignItems={"center"}
                  style={{
                    ...LightBlueButtonText,
                    fontWeight: 600,
                    textAlign: "left",
                  }}
                >
                  All devices
                  <Icon icon="mingcute:right-line" color="var(--gray900)" />
                </Typography>
              </Link>
            </Grid>
            <Grid
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              item
              xs={12}
              sm={12}
              md={9}
              lg={9}
            >
              <Typography
                style={{
                  ...TextFontSize30LineHeight38,
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                }}
                color={"var(--gray900, #101828)"}
              >
                {decodeURI(locationName.slice(1))}
              </Typography>
            </Grid>
          </Grid>
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
              {decodeURI(locationName.slice(1))}
            </Typography>
          </Grid>
          <Grid
            display={"flex"}
            textAlign={"left"}
            alignItems={"center"}
            alignSelf={"start"}
            sx={{
              justifyContent: {
                xs: "flex-start",
                sm: "flex-start",
                md: "flex-end",
                lg: "flex-end",
              },
            }}
            item
            xs={12}
            sm={12}
            md={6}
            lg={6}
          >
            <Breadcrumb
              style={{
                ...TextFontSize30LineHeight38,
                fontWeight: 400,
                display: location.state ? "flex" : "none",
                justifyContent: "flex-start",
                alignItems: "center",
              }}
              items={[
                ...subLocations.map((item, index) => ({
                  title: navigateToSublocation(item, index),
                })),
              ]}
            />
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
              Inventory at {decodeURI(locationName.slice(1))}
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

export default MainPage;
