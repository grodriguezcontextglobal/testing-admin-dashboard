/* eslint-disable no-unused-vars */
import { Grid, InputAdornment, OutlinedInput } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Button, Divider, Spin } from "antd";
import { lazy, Suspense, useEffect, useState } from "react";
// import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import Loading from "../../components/animation/Loading";
// import CalendarIcon from "../../components/icons/CalendarIcon";
import { EditIcon } from "../../components/icons/EditIcon";
import { MagnifyIcon } from "../../components/icons/MagnifyIcon";
import { RectangleBluePlusIcon } from "../../components/icons/RectangleBluePlusIcon";
import { WhiteCirclePlusIcon } from "../../components/icons/WhiteCirclePlusIcon";
import "../../styles/global/ant-select.css";
import { BlueButton } from "../../styles/global/BlueButton";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import CenteringGrid from "../../styles/global/CenteringGrid";
import { LightBlueButton } from "../../styles/global/LightBlueButton";
import LightBlueButtonText from "../../styles/global/LightBlueButtonText";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import "../../styles/global/OutlineInput.css";
import { TextFontSize30LineHeight38 } from "../../styles/global/TextFontSize30LineHeight38";
import { Title } from "../../styles/global/Title";
const BannerMsg = lazy(() => import("../../components/utils/BannerMsg"));
const ItemTable = lazy(() => import("./table/ItemTable"));

const MainPage = () => {
  const { user } = useSelector((state) => state.admin);
  const [currentTab, setCurrentTab] = useState(0);
  const { register, watch } = useForm();
  const companyHasInventoryQuery = useQuery({
    queryKey: ["companyHasInventoryQuery"],
    queryFn: () =>
      devitrakApi.get(
        `/db_item/check-company-has-inventory?company_id=${user.sqlInfo.company_id}`
      ),
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    companyHasInventoryQuery.refetch();
    return () => {
      controller.abort();
    };
  }, [currentTab]);

  const [begin, setBegin] = useState(null);
  const [openAdvanceSearchModal, setOpenAdvanceSearchModal] = useState(false);
  const [reference, setReference] = useState(null);
  const [isLoadingState, setIsLoadingState] = useState(false);
  useEffect(() => {
    if (companyHasInventoryQuery?.data?.data?.total > 0) {
      setIsLoadingState(true);
      setCurrentTab(1);
      setIsLoadingState(false);
    }
    if (companyHasInventoryQuery?.data?.data?.total === 0) {
      setIsLoadingState(true);
      setCurrentTab(2);
      setIsLoadingState(false);
    }
  }, [companyHasInventoryQuery.data, companyHasInventoryQuery.isSuccess]);

  const renderingOption = {
    0: <Spin indicator={<Loading />} fullscreen={true} />,
    1: (
      <ItemTable
        searchItem={watch("searchItem")}
        date={begin}
        loadingState={setIsLoadingState}
        companyInventoryExisting={companyHasInventoryQuery.data}
        reference={reference}
        openAdvanceSearchModal={openAdvanceSearchModal}
        setOpenAdvanceSearchModal={setOpenAdvanceSearchModal}
      />
    ),
    2: (
      <BannerMsg
        props={{
          title: "Add to your inventory",
          message:
            "Creating an event will let you assign and manage devices, as well as staff to an event with a start and end date. You will also be able to assign devices to consumers, collect retain deposits, collect fees for damaged devices, and keep track of your full inventory.",
          link: "/inventory/new-item",
          button: BlueButton,
          paragraphStyle: BlueButtonText,
          paragraphText: "Add to inventory",
        }}
      />
    ),
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
          padding: "5px 0",
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
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <Grid marginY={0} item xs={12} sm={12} md={4} lg={4}>
            <p style={{ ...TextFontSize30LineHeight38, textAlign: "left" }}>
              Inventory of {user.company}
            </p>
          </Grid>
          <Grid
            textAlign={"right"}
            display={"flex"}
            justifyContent={"flex-end"}
            alignItems={"center"}
            gap={1}
            sx={{ display: { xs: "none", sm: "none", md: "flex", lg: "flex" } }}
            item
            md={8}
            lg={8}
          >
            <Link to="/inventory/edit-group">
              <button style={{ ...LightBlueButton, width: "fit-content" }}>
                <p
                  style={{
                    ...LightBlueButtonText,
                    textTransform: "none",
                    gap: "2px",
                  }}
                >
                  <EditIcon
                    stroke={"var(--blue-dark--800)"}
                    width={"20"}
                    height={"18"}
                  />
                  &nbsp;Update a group of device
                </p>
              </button>
            </Link>
            <Link to="/inventory/new-bulk-items">
              <button style={{ ...BlueButton, width: "fit-content" }}>
                <WhiteCirclePlusIcon
                  style={{ height: "21px", margin: "auto" }}
                />
                &nbsp;
                <p style={{ ...BlueButtonText, textTransform: "none" }}>
                  Add a group of devices
                </p>
              </button>
            </Link>
            <Link to="/inventory/new-item">
              <button style={{ ...LightBlueButton, width: "fit-content" }}>
              <RectangleBluePlusIcon />
              {/* <BluePlusIcon /> */}
                &nbsp;
                <p style={{ ...LightBlueButtonText, textTransform: "none" }}>
                  Add one device
                </p>
              </button>
            </Link>
          </Grid>
        </Grid>
        <Grid
          textAlign={"right"}
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          gap={1}
          sx={{
            display: { xs: "flex", sm: "flex", md: "none", lg: "none" },
            marginTop: "10px",
          }}
          item
          xs={12}
          sm={12}
        >
          <Link to="/inventory/edit-group">
            <button style={{ ...LightBlueButton, width: "fit-content" }}>
              <p
                style={{
                  ...LightBlueButtonText,
                  textTransform: "none",
                  gap: "2px",
                }}
              >
                <EditIcon
                  stroke={"var(--blue-dark--800)"}
                  width={"21"}
                  height={"18"}
                />
                &nbsp;Update a group of device
              </p>
            </button>
          </Link>
          <Link to="/inventory/new-bulk-items">
            <button style={{ ...BlueButton, width: "fit-content" }}>
              <WhiteCirclePlusIcon style={{ height: "21px", margin: "auto" }} />
              &nbsp;
              <p style={{ ...BlueButtonText, textTransform: "none" }}>
                Add a group of devices
              </p>
            </button>
          </Link>
          <Link to="/inventory/new-item">
            <button style={{ ...LightBlueButton, width: "fit-content" }}>
              <p style={{ ...LightBlueButtonText, textTransform: "none" }}>
                {/* <BluePlusIcon /> */}
                <RectangleBluePlusIcon />
                &nbsp; Add one device
              </p>
            </button>
          </Link>
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
          <Grid textAlign={"right"} item xs={4}></Grid>
        </Grid>
        <Divider />
        <Grid
          display={companyHasInventoryQuery?.data?.data?.total === 0 && "none"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <p
            style={{
              ...Title,
              fontSize: "28px",
              padding: 0,
              width: "fit-content",
            }}
          >
            Search inventory:&nbsp;
          </p>
          <Grid style={{ ...CenteringGrid, gap: "5px" }} item xs sm md lg>
            <OutlinedInput
              {...register("searchItem")}
              style={OutlinedInputStyle}
              fullWidth
              placeholder="Search device here"
              startAdornment={
                <InputAdornment position="start">
                  <MagnifyIcon />
                </InputAdornment>
              }
            />
            <Button
              style={{ ...OutlinedInputStyle, ...CenteringGrid, gap: 0 }}
              onClick={() => {
                setOpenAdvanceSearchModal(true);
              }}
            >
              Advance search
            </Button>
            <Button
              style={{ ...OutlinedInputStyle, ...CenteringGrid, gap: 0 }}
              onClick={() => {
                setCurrentTab(3);
              }}
            >
              Reload
            </Button>
          </Grid>
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          container
        >
          <Grid
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
            style={CenteringGrid}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            {renderingOption[currentTab]}
          </Grid>
        </Grid>
      </Grid>
      {isLoadingState && <Spin indicator={<Loading />} fullscreen={true} />}
    </Suspense>
  );
};

export default MainPage;
