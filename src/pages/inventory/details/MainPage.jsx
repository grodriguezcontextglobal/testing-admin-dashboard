import { Grid, InputAdornment, OutlinedInput, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Breadcrumb, Divider } from "antd";
import { lazy, Suspense, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import { MagnifyIcon } from "../../../components/icons/MagnifyIcon";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import LightBlueButtonText from "../../../styles/global/LightBlueButtonText";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import ExtraInformation from "./detailComponent/components/ExtraInformation";
import ExtraInformationItemComponent from "./detailComponent/components/ExtraInformationItemComponent";
import MainHeaderContainingAllSections from "./UX/MainHeaderContainingAllSections";
const DeleteItem = lazy(() => import("./detailComponent/actions/DeleteItem"));
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
  const navigate = useNavigate();
  useEffect(() => {
    const controller = new AbortController();
    trackingHistoryItemQuery.refetch();
    infoItemQuery.refetch();
    return () => {
      controller.abort();
    };
  }, [item_id]);

  if (trackingHistoryItemQuery.isLoading)
    return (
      <div style={CenteringGrid}>
        <Loading />
      </div>
    );
  if (trackingHistoryItemQuery.data) {
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

    const options = [
      {
        title: (
          <Link to="/inventory">
            <Typography style={{ ...LightBlueButtonText, fontWeight: 600 }}>
              All devices
            </Typography>
          </Link>
        ),
      },
      {
        title: (
          <Typography fontWeight={600}>
            {dataFound[0]?.item_group} {dataFound[0]?.serial_number}
          </Typography>
        ),
      },
    ];

    const headersActions = [Number(user.role) < 2 && dataFound[0].ownership !== "Rent" && (
      <DeleteItem dataFound={dataFound} />
    ),
    Number(user.role) < 2 && (
      <EditItem dataFound={dataFound} refetchingFn={refetchingFn} />
    )
    ]
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
          id={item_id}
          key={item_id}
          container
        >
          <Grid marginY={0} item xs={12} sm={12} md={6} lg={6}>
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
            display={"flex"}
            alignItems={"center"}
            gap={1}
            sx={{
              justifyContent: {
                xs: "flex-start",
                sm: "flex-start",
                md: "flex-end",
                lg: "flex-end",
              },
              margin: {
                xs: "0.5rem 0",
                sm: "0.5rem 0",
                md: "0",
                lg: "0",
              },
            }}
            item
            xs={12}
            sm={12}
            md={6}
            lg={6}
          >
            <BlueButtonComponent
              title={"Add new group of devices"}
              func={() => navigate("/inventory/new-bulk-items")}
              buttonType="button"
            />
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            marginY={2}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            <Breadcrumb separator=">" items={options} />
          </Grid>
        </Grid>
        <Divider style={{ margin: "0 0 15px 0" }} />
        <MainHeaderContainingAllSections
          dataFound={dataFound}
          actions={headersActions.filter(Boolean)}
        />
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
        <ExtraInformationItemComponent dataFound={dataFound} />
        <Divider />
        <ExtraInformation
          dataFound={dataFound}
          containerInfo={infoItemQuery?.data?.data?.items[0] ?? {}}
        />
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
      </Suspense>
    );
  }
};

export default MainPage;
