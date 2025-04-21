import { Icon } from "@iconify/react";
import { Grid, InputAdornment, OutlinedInput, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Button, Divider } from "antd";
import { lazy, Suspense, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import { MagnifyIcon } from "../../../components/icons/MagnifyIcon";
import { WhitePlusIcon } from "../../../components/icons/WhitePlusIcon";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import useFetchingDeviceInfoBasedOnFeature from "../utils/useFetchingDeviceInfoBasedOnFeature";
import ExtraInformation from "./detailComponent/components/ExtraInformation";
const DeleteItem = lazy(() => import("./detailComponent/actions/DeleteItem"));
const DeviceDescriptionTags = lazy(() =>
  import("./detailComponent/DeviceDescriptionTags")
);
const DeviceInformationDetail = lazy(() =>
  import("./detailComponent/DeviceInformationDetail")
);
const TableDetailPerDevice = lazy(() =>
  import("./detailComponent/TableDetailPerDevice")
);
const TotalDevicesDistributed = lazy(() =>
  import("./detailComponent/components/TotalDeviceDistributed")
);
const TotalRequestedDevice = lazy(() =>
  import("./detailComponent/components/TotalRequestedDevice")
);
const TotalReturnedDevice = lazy(() =>
  import("./detailComponent/components/TotalReturnedDevice")
);
const EditItem = lazy(() => import("./detailComponent/actions/EditItem"));
const CardRendered = lazy(() => import("../utils/CardRendered"));
const MainPage = () => {
  const { user } = useSelector((state) => state.admin);
  const item_id = new URLSearchParams(window.location.search).get("id");
  const trackingHistoryItemQuery = useQuery({
    queryKey: ["trackingItemActivity"],
    queryFn: () => devitrakApi.post(`/db_item/tracking_item/${item_id}`),
    refetchOnMount: false,
  });

  const infoItemQuery = useQuery({
    queryKey: ["infoItemSql"],
    queryFn: () =>
      devitrakApi.post(`/db_item/consulting-item`, {
        item_id: item_id,
      }),
    refetchOnMount: false,
  });
  const { register } = useForm();
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
  const navigate = useNavigate();
  useEffect(() => {
    const controller = new AbortController();
    trackingHistoryItemQuery.refetch();
    infoItemQuery.refetch();
    return () => {
      controller.abort();
    };
  }, [item_id]);

  const props = {
    variableName: "item_id",
    value: location.search.split("=")[1],
  };
  const extraData = useFetchingDeviceInfoBasedOnFeature(props);
  if (trackingHistoryItemQuery.isLoading)
    return (
      <div style={CenteringGrid}>
        <Loading />
      </div>
    );
  if (trackingHistoryItemQuery.data) {
    const itemExtraSerialNumber =
      extraData.ok &&
      typeof extraData.items[0]?.extra_serial_number === "object"
        ? extraData.items[0]?.extra_serial_number
        : JSON.parse(extraData.items[0].extra_serial_number);

    const dataFound = [
      {
        ...trackingHistoryItemQuery?.data?.data?.result[0],
        data: [...trackingHistoryItemQuery.data.data.result],
        itemInfo: { ...infoItemQuery?.data?.data?.items },
      },
    ];

    const refetchingFn = () => {
      trackingHistoryItemQuery.refetch();
      infoItemQuery.refetch();
      return null;
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
              textAlign={"right"}
              display={`${
                isLargeDevice || isExtraLargeDevice ? "none" : "flex"
              }`}
              justifyContent={"flex-end"}
              alignItems={"center"}
              gap={1}
              item
              xs={12}
              sm={12}
            >
              <Button
                style={{ ...BlueButton }}
                onClick={() => navigate("/inventory/new-bulk-items")}
              >
                <WhitePlusIcon />
                &nbsp;{" "}
                <Typography
                  textTransform={"none"}
                  style={{ ...BlueButtonText }}
                >
                  {" "}
                  Add new group of devices{" "}
                </Typography>
              </Button>
            </Grid>
            <Grid marginY={0} item xs={12} sm={12} md={6}>
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
              display={`${isSmallDevice || isMediumDevice ? "none" : "flex"}`}
              justifyContent={"flex-end"}
              alignItems={"center"}
              gap={1}
              item
              md={6}
            >
              <Button
                style={{ ...BlueButton }}
                onClick={() => navigate("/inventory/new-bulk-items")}
              >
                <Typography
                  textTransform={"none"}
                  style={{ ...BlueButtonText, ...CenteringGrid }}
                >
                  <WhitePlusIcon />
                  &nbsp; Add new group of devices{" "}
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
                  <p
                    style={{
                      ...TextFontsize18LineHeight28,
                      color: BlueButton.background,
                      fontWeight: 600,
                    }}
                  >
                    Back
                  </p>
                </Link>
                <Typography
                  style={{
                    ...TextFontsize18LineHeight28,
                    fontWeight: 600,
                    color: "var(--gray-900, #101828)",
                  }}
                >
                  <Icon icon="mingcute:right-line" />
                  {dataFound[0]?.item_group} {dataFound[0]?.serial_number}
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
              justifyContent={"left"}
              textAlign={"left"}
              alignItems={"center"}
              alignSelf={"start"}
              item
              xs={12}
              sm={12}
              md={4}
              lg={4}
            >
              <DeviceInformationDetail dataFound={dataFound} />
            </Grid>
            <Grid
              display={"flex"}
              justifyContent={"center"}
              textAlign={"left"}
              alignItems={"center"}
              alignSelf={"start"}
              item
              xs={12}
              sm={12}
              md={3}
              lg={3}
            >
              <DeviceDescriptionTags dataFound={dataFound} />
            </Grid>
            <Grid
              display={"flex"}
              justifyContent={"flex-end"}
              alignItems={"center"}
              alignSelf={"start"}
              gap={1}
              item
              xs={12}
              sm={12}
              md={3}
              lg={3}
            >
              {/* {user.role === "Administrator" && dataFound[0].ownership !== "Rent" && <DeleteItem dataFound={dataFound} />}
                        {user.role === "Administrator" && <EditItem dataFound={dataFound} />} */}
              {Number(user.role) < 2 && dataFound[0].ownership !== "Rent" && (
                <DeleteItem dataFound={dataFound} />
              )}
              {Number(user.role) < 2 && (
                <EditItem dataFound={dataFound} refetchingFn={refetchingFn} />
              )}
            </Grid>
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            container
          >
            <Grid item xs={12} sm={12} md={6} lg={4}>
              <TotalRequestedDevice dataFound={dataFound} />
            </Grid>
            <Grid item xs={12} sm={12} md={6} lg={4}>
              {" "}
              <TotalDevicesDistributed dataFound={dataFound} />
            </Grid>
            <Grid item xs={12} sm={12} md={6} lg={4}>
              <TotalReturnedDevice dataFound={dataFound} />
            </Grid>
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            container
          >
            {Array.isArray(extraData.items) &&
              extraData.items?.length > 0 &&
              itemExtraSerialNumber?.length > 0 &&
              itemExtraSerialNumber?.map((item) => {
                return (
                  <Grid
                    key={item.valueObject}
                    item
                    xs={12}
                    sm={12}
                    md={3}
                    lg={4}
                  >
                    <CardRendered
                      props={item.valueObject}
                      title={item.keyObject}
                      optional={null}
                    />
                  </Grid>
                );
              })}
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            container
          >
            {Array.isArray(extraData.items) &&
              extraData.items?.length > 0 &&
              extraData.items[0]?.sub_location?.length > 0 &&
              extraData.items[0]?.sub_location?.map((location, index) => {
                return (
                  <Grid key={location} item xs={12} sm={12} md={3} lg={4}>
                    <CardRendered
                      props={location}
                      title={`Sub location ${index + 1}`}
                      optional={null}
                    />
                  </Grid>
                );
              })}
          </Grid>
          <Grid
            display={dataFound[0]?.container > 0 ? "flex" : "none"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            container
          >
            {dataFound[0]?.container > 0 && (
              <ExtraInformation
                dataFound={dataFound[0]}
                containerInfo={infoItemQuery?.data?.data?.items[0] ?? {}}
              />
            )}
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
              justifyContent={"flex-end"}
              alignItems={"center"}
              item
              xs={12}
              sm={12}
              md={3}
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
              <TableDetailPerDevice dataFound={dataFound} />
            </Grid>
          </Grid>
        </Grid>
      </Suspense>
    );
  }
};

export default MainPage;
