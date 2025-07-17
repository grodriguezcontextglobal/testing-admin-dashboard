import {
  Grid,
  InputAdornment,
  OutlinedInput,
  Typography
} from "@mui/material";
import { Breadcrumb, Divider } from "antd";
import { lazy, Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import Loading from "../../../../components/animation/Loading";
import { MagnifyIcon } from "../../../../components/icons/MagnifyIcon";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { LightBlueButton } from "../../../../styles/global/LightBlueButton";
import LightBlueButtonText from "../../../../styles/global/LightBlueButtonText";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../styles/global/Subtitle";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import HeaderInventaryComponent from "../../utils/HeaderInventaryComponent";
import CardInfo from "../UX/CardInfo";
const TableDeviceLocation = lazy(() => import("./components/Table"));
const MainPage = () => {
  const { user } = useSelector((state) => state.admin);
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
  // const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  // const isMediumDevice = useMediaQuery(
  //   "only screen and (min-width : 769px) and (max-width : 992px)"
  // );
  // const navigate = useNavigate();

  useEffect(() => {
    if (watch("searchDevice") === "undefined") {
      setValue("searchDevice", "");
    }
  }, [locationName]);

  const subLocations =
    location.state !== null
      ? decodeURI(location?.state?.sub_location)?.split("%2C")
      : [];

  const subStyle = {
    ...Subtitle,
    textDecoration: "none",
    height: "100%",
    fontWeight: 600,
    textAlign: "left",
  };

  const navigateToSublocation = (subLocation, index) => {
    const subLocationPathNavigate = subLocations.slice(0, index + 1);
    const chosenPath = encodeURIComponent(subLocationPathNavigate.join(","));
    if (index === subLocations.length - 1) {
      return (
        <Typography style={subStyle} color={"var(--gray900)"}>
          {subLocation}
        </Typography>
      );
    }
    return (
      <Link
        to={`${location.pathname}${location.search}`}
        state={{ sub_location: chosenPath }}
        style={subStyle}
      >
        {subLocation}
      </Link>
    );
  };

  const options = [
    {
      title: (
        <Link style={{ textAlign: "left", width: "100%" }} to="/inventory">
          <Typography
            style={{
              ...Subtitle,
              fontWeight: 600,
              textAlign: "left",
              color: LightBlueButtonText.color,
            }}
          >
            All devices
          </Typography>
        </Link>
      ),
    },
    {
      title: (
        <Link to={`${location.pathname}${location.search}`} style={subStyle}>
          <Typography
            style={Subtitle}
            fontWeight={600}
            color={"var(--gray900)"}
          >
            {decodeURI(locationName.slice(1))}
          </Typography>
        </Link>
      ),
    },

    ...subLocations.map((item, index) => ({
      title: navigateToSublocation(item, index),
    })),
  ];

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
        <Grid item xs={12} sm={12} md={12} lg={12}>
          <HeaderInventaryComponent
            user={user}
            TextFontSize30LineHeight38={TextFontSize30LineHeight38}
            LightBlueButton={LightBlueButton}
            LightBlueButtonText={LightBlueButtonText}
            BlueButton={BlueButton}
            BlueButtonText={BlueButtonText}
          />
        </Grid>
        <Divider />
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
          {/* <Grid
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
          </Grid> */}
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
              md={12}
              lg={12}
            >
              <Breadcrumb separator=">" items={options} />
            </Grid>
          </Grid>
        </Grid>
        <Divider />
        <CardInfo referenceData={referenceData} />
        <Divider />
        <Grid
          display={"flex"}
          justifyContent={"flex-end"}
          alignItems={"center"}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
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
