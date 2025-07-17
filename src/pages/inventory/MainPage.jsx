/* eslint-disable no-unused-vars */
import { Grid, InputAdornment, OutlinedInput, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import DownloadingXlslFile from "./actions/DownloadXlsx";
import FilterOptionsUX from "./utils/filterOptionsUX";
import GrayButtonText from "../../styles/global/GrayButtonText";
import { GrayButton } from "../../styles/global/GrayButton";
import HeaderInventaryComponent from "./utils/HeaderInventaryComponent";
import { CloseIcon } from "../../components/icons/CloseIcon";
const BannerMsg = lazy(() => import("../../components/utils/BannerMsg"));
const ItemTable = lazy(() => import("./table/ItemTable"));

const MainPage = () => {
  const [chosenOption, setChosenOption] = useState({
    category: null,
    value: null,
  });
  const [params, setParams] = useState(null);
  const [dataFilterOptions, setDataFilterOptions] = useState({
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  });
  const [downloadDataReport, setDownloadDataReport] = useState(null);
  const [renderingData, setRenderingData] = useState(true);
  const { user } = useSelector((state) => state.admin);
  const [currentTab, setCurrentTab] = useState(0);
  const { register, watch, setValue, handleSubmit } = useForm({
    defaultValues: {
      searchItem: "...",
    },
  });
  const companyHasInventoryQuery = useQuery({
    queryKey: ["companyHasInventoryQuery", user.sqlInfo.company_id],
    queryFn: () =>
      devitrakApi.get(
        `/db_item/check-company-has-inventory?company_id=${user.sqlInfo.company_id}`
      ),
    enabled: !!user.sqlInfo.company_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  const queryClient = useQueryClient();
  const [openAdvanceSearchModal, setOpenAdvanceSearchModal] = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(false);

  useEffect(() => {
    setValue("searchItem", "");
    setRenderingData(false);
    companyHasInventoryQuery.refetch();
  }, []);

  useEffect(() => {
    if (companyHasInventoryQuery.isSuccess) {
      const total = companyHasInventoryQuery?.data?.data?.total;
      setCurrentTab(total > 0 ? 1 : 2);
      setIsLoadingState(true);
      setIsLoadingState(false);
    }
  }, [companyHasInventoryQuery.isSuccess]);

  const renderingOption = {
    0: <Spin indicator={<Loading />} fullscreen={true} />,
    1: (
      <ItemTable
        searchItem={params}
        date={null}
        loadingState={setIsLoadingState}
        companyInventoryExisting={companyHasInventoryQuery.data}
        reference={null}
        openAdvanceSearchModal={openAdvanceSearchModal}
        setOpenAdvanceSearchModal={setOpenAdvanceSearchModal}
        chosen={chosenOption}
        setDataFilterOptions={setDataFilterOptions}
        downloadDataReport={setDownloadDataReport}
        total={companyHasInventoryQuery?.data?.data?.total ?? 0}
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

  const refetchingQueriesFn = () => {
    setIsLoadingState(true);
    queryClient.refetchQueries(["ItemsInInventoryCheckingQuery"]);
    queryClient.refetchQueries(["listOfItemsInStock"]);
    queryClient.refetchQueries(["ItemsInInventoryCheckingQuery"]);
    queryClient.refetchQueries(["RefactoredListInventoryCompany"]);
    queryClient.refetchQueries([
      "companyHasInventoryQuery",
      user.sqlInfo.company_id,
    ]);
    setIsLoadingState(false);
    return setRenderingData(false);
  };

  const searchItem = (data) => {
    return setParams(data.searchItem);
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
          display: renderingData ? "none" : "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
        container
      >
        <HeaderInventaryComponent
          user={user}
          TextFontSize30LineHeight38={TextFontSize30LineHeight38}
          LightBlueButton={LightBlueButton}
          LightBlueButtonText={LightBlueButtonText}
          BlueButton={BlueButton}
          BlueButtonText={BlueButtonText}
        />
        <Grid
          gap={1}
          sx={{
            display: { xs: "flex", sm: "flex", md: "none", lg: "none" },
            marginTop: "10px",
          }}
          container
        >
          <Grid item xs={12} sm={12}>
            {" "}
            <Link style={{ width: "100%" }} to="/inventory/edit-group">
              <button style={{ ...LightBlueButton, width: "100%" }}>
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
                  &nbsp;Update a group of items
                </p>
              </button>
            </Link>
          </Grid>
          <Grid item xs={12} sm={12}>
            {" "}
            <Link style={{ width: "100%" }} to="/inventory/new-bulk-items">
              <button style={{ ...BlueButton, width: "100%" }}>
                <p style={{ ...BlueButtonText, textTransform: "none" }}>
                  <WhiteCirclePlusIcon
                    style={{ height: "21px", margin: "auto" }}
                  />
                  &nbsp; Add a group of items
                </p>
              </button>
            </Link>
          </Grid>
          <Grid item xs={12} sm={12}>
            {" "}
            <Link style={{ width: "100%" }} to="/inventory/new-item">
              <button style={{ ...LightBlueButton, width: "100%" }}>
                <p style={{ ...LightBlueButtonText, textTransform: "none" }}>
                  {/* <BluePlusIcon /> */}
                  <RectangleBluePlusIcon />
                  &nbsp; Add one item
                </p>
              </button>
            </Link>
          </Grid>
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
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              margin: "0px 0px 1rem 0px",
            }}
          >
            <Typography
              sx={{
                ...Title,
                fontSize: "28px",
                padding: 0,
                textAlign: "left",
                width: {
                  xs: "100%",
                  sm: "100%",
                  md: "50%",
                  lg: "50%",
                },
              }}
            >
              Search inventory:&nbsp;
            </Typography>
            <Grid
              item
              sx={{
                display: { xs: "none", sm: "none", md: "flex", lg: "flex" },
              }}
              md={12}
              lg={12}
            >
              <FilterOptionsUX
                filterOptions={dataFilterOptions}
                chosen={chosenOption}
                setChosen={setChosenOption}
              />
            </Grid>
          </div>
          <Grid justifyContent={"flex-start"} gap={1} container>
            <Grid item xs={12} sm={12} md={8} lg={8}>
              <form
                style={{ width: "100%" }}
                id="search-form"
                onSubmit={handleSubmit(searchItem)}
              >
                <OutlinedInput
                  {...register("searchItem")}
                  style={OutlinedInputStyle}
                  fullWidth
                  placeholder="Search device here"
                  endAdornment={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignSelf: "flex-start",
                        gap: "5px",
                      }}
                    >
                      <button
                        type="submit"
                        style={{
                          backgroundColor: "transparent",
                          margin: 0,
                          padding: 0,
                          border: "none",
                          boxShadow: "-moz-initial",
                          display: watch("searchItem") === "" ? "none" : "flex",
                        }}
                      >
                        <p
                          style={{
                            ...GrayButtonText,
                            ...GrayButton,
                            width: GrayButton.width,
                            padding: "0 12px",
                          }}
                        >
                          Search
                        </p>
                      </button>
                      <button
                        style={{
                          backgroundColor: "transparent",
                          margin: 0,
                          padding: 0,
                          border: "none",
                          boxShadow: "-moz-initial",
                          display: watch("searchItem") === "" ? "none" : "flex",
                        }}
                        onClick={() => {
                          setValue("searchItem", "");
                          setParams(null);
                        }}
                      >
                        <p
                          style={{
                            ...GrayButtonText,
                            ...GrayButton,
                            width: GrayButton.width,
                            padding: "0 12px",
                          }}
                        >
                          X
                        </p>
                      </button>
                    </div>
                  }
                />
              </form>
            </Grid>
            <Grid
              display={"flex"}
              justifyContent={"flex-end"}
              gap={1}
              item
              xs={12}
              sm={12}
              md
              lg
            >
              <Button
                style={{ ...GrayButton, width: "100%" }}
                onClick={() => {
                  setOpenAdvanceSearchModal(true);
                }}
              >
                <p style={{ ...GrayButtonText, textTransform: "none" }}>
                  Advance search
                </p>
              </Button>
              <Button
                loading={isLoadingState}
                style={{ ...GrayButton, width: "100%" }}
                onClick={refetchingQueriesFn}
              >
                <p style={{ ...GrayButtonText, textTransform: "none" }}>
                  Reload
                </p>
              </Button>
            </Grid>
            <Grid
              item
              sx={{
                display: { xs: "flex", sm: "flex", md: "none", lg: "none" },
              }}
              xs={12}
              sm={12}
            >
              <Button style={{ ...OutlinedInputStyle, width: "100%" }}>
                <DownloadingXlslFile props={downloadDataReport} />
              </Button>
            </Grid>
            <Grid
              item
              sx={{
                display: { xs: "flex", sm: "flex", md: "none", lg: "none" },
              }}
              md
              lg
            >
              <FilterOptionsUX
                filterOptions={dataFilterOptions}
                chosen={chosenOption}
                setChosen={setChosenOption}
              />
            </Grid>
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
      {renderingData && <Spin indicator={<Loading />} fullscreen={true} />}
    </Suspense>
  );
};

export default MainPage;
