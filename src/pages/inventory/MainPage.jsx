/* eslint-disable no-unused-vars */
import { Grid, OutlinedInput, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Divider, Spin, Tabs } from "antd";
import {
  createContext,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import "react-datepicker/dist/react-datepicker.css";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import Loading from "../../components/animation/Loading";
// import CalendarIcon from "../../components/icons/CalendarIcon";
import GrayButtonComponent from "../../components/UX/buttons/GrayButton";
import "../../styles/global/ant-select.css";
import { BlueButton } from "../../styles/global/BlueButton";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import CenteringGrid from "../../styles/global/CenteringGrid";
import { GrayButton } from "../../styles/global/GrayButton";
import GrayButtonText from "../../styles/global/GrayButtonText";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import "../../styles/global/OutlineInput.css";
import { TextFontSize30LineHeight38 } from "../../styles/global/TextFontSize30LineHeight38";
import { Title } from "../../styles/global/Title";
import AddInventoryFromXLSXFile from "./actions/AddInventoryFromXLSXFile";
// import DownloadingXlslFile from "./actions/DownloadXlsx";
import DisplayItemTypesPerLocationModal from "./utils/DisplayItemTypesPerLocationModal";
import FilterOptionsUX from "./utils/FilterOptionsUX";
import HeaderInventaryComponent from "./utils/HeaderInventaryComponent";
import MobileActionsButtons from "./utils/MobileActionsButtons";
// import LocationsList from "./utils/LocationsList";
import CreateLocationModal from "./utils/CreateLocationModal";
import { devitrakApi } from "../../api/devitrakApi";

const BannerMsg = lazy(() => import("../../components/utils/BannerMsg"));
const ItemTable = lazy(() => import("./table/ItemTable"));
export const SearchItemContext = createContext();
export const FilterOptionsContext = createContext();
/**
 * MainPage Component
 *
 * The main container for the inventory management interface.
 *
 * Responsibilities:
 * - Fetches initial inventory data and user preferences.
 * - Manages state for search, filtering, and modal visibility.
 * - Determines user access permissions based on company data and preferences.
 * - Renders the header, filter options, and the main item table or empty state.
 *
 * Permission Logic:
 * - Uses `user.companyData.employees[].preference` to determine allowed inventory locations.
 * - Passes `allowedInventoryLocations` to child components for data filtering.
 *
 * @returns {JSX.Element} The rendered inventory page.
 */
const MainPage = () => {
  const [chosenOption, setChosenOption] = useState([]);
  const [searchedResult, setSearchedResult] = useState(null);
  const [params, setParams] = useState(null);
  const [dataFilterOptions, setDataFilterOptions] = useState({
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  });
  const [openDetails, setOpenDetails] = useState(false);
  const [typePerLocationInfoModal, setTypePerLocationInfoModal] =
    useState(null);
  const [addInventoryFromXLSXFileModal, setAddInventoryFromXLSXFileModal] =
    useState(false);
  const [openCreateLocationModal, setOpenCreateLocationModal] = useState(false);
  const [downloadDataReport, setDownloadDataReport] = useState(null);
  const [renderingData, setRenderingData] = useState(true);
  const { user } = useSelector((state) => state.admin);
  const [currentTab, setCurrentTab] = useState(0);
  const [activeView, setActiveView] = useState("1");
  const { register, setValue, handleSubmit } = useForm({
    defaultValues: {
      searchItem: "...",
    },
  });

  // Extract user preferences for inventory location filtering
  const userPreferences = useMemo(() => {
    return user?.companyData?.employees?.find((emp) => emp.user === user.email)
      ?.preference;
  }, [user]);

  const allowedInventoryLocations = useMemo(() => {
    // Role 0 Bypass: Admin/Owner has full access (return null to indicate no filter)
    if (
      user?.companyData.employees.find((e) => e.user === user.email).role ===
        0 ||
      user?.companyData.employees.find((e) => e.user === user.email).role ===
        "0"
    ) {
      return null;
    }
    // For other roles, return assigned locations or empty array if none
    return userPreferences?.inventory_location || [];
  }, [userPreferences, user]);

  const companyHasInventoryQuery = useQuery({
    queryKey: ["companyHasInventoryQuery", user.sqlInfo.company_id],
    queryFn: () =>
      devitrakApi.get(
        `/db_item/check-company-has-inventory?company_id=${user.sqlInfo.company_id}`
      ),
    enabled: !!user.sqlInfo.company_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const locationsQuery = useQuery({
    queryKey: ["locations", user.sqlInfo.company_id],
    queryFn: () =>
      devitrakApi.get(
        `/db_location/companies/${user.sqlInfo.company_id}/locations`
      ),
    enabled: !!user.sqlInfo.company_id,
  });

  const queryClient = useQueryClient();
  const [openAdvanceSearchModal, setOpenAdvanceSearchModal] = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(false);

  const optionsUX = useMemo(
    () => <FilterOptionsUX setChosen={setChosenOption} />,
    [chosenOption, dataFilterOptions]
  );

  const settingParamsForSearchResult = useMemo(
    () => params,
    [params, user.sqlInfo.company_id]
  );

  useEffect(() => {
    setValue("searchItem", "");
    setRenderingData(false);
    // companyHasInventoryQuery.refetch();
  }, []);

  useEffect(() => {
    if (companyHasInventoryQuery.isSuccess) {
      const total = companyHasInventoryQuery?.data?.data?.total;
      setCurrentTab(total > 0 ? 1 : 2);
      setIsLoadingState(true);
      setIsLoadingState(false);
    }
  }, [companyHasInventoryQuery.isSuccess]);

  // Update the callback to receive filtered data count
  const handleFilteredDataUpdate = useCallback((filteredData) => {
    setDownloadDataReport(filteredData);
    setFilteredDataCount(filteredData?.length || 0);
  }, []);

  // Calculate the total to display based on current state
  const getTotalToDisplay = () => {
    if (params || (Array.isArray(chosenOption) && chosenOption.length > 0)) {
      return filteredDataCount > 0 ? filteredDataCount : 0;
    }
    return companyHasInventoryQuery?.data?.data?.total ?? 0;
  };
  const refetchingQueriesFn = () => {
    setIsLoadingState(true);
    queryClient.resetQueries({
      queryKey: ["ItemsInInventoryCheckingQuery"],
    });
    queryClient.resetQueries({
      queryKey: ["listOfItemsInStock"],
    });
    queryClient.resetQueries({
      queryKey: ["RefactoredListInventoryCompany"],
    });
    queryClient.resetQueries({
      queryKey: ["companyHasInventoryQuery", user.sqlInfo.company_id],
    });
    setIsLoadingState(false);
    setValue("searchItem", "");
    setParams(null);
    setSearchedResult(null);
    return setRenderingData(false);
  };

  // Add state to track filtered data count
  const [filteredDataCount, setFilteredDataCount] = useState(0);

  const renderingOption = {
    0: <Spin indicator={<Loading />} fullscreen={true} />,
    1: (
      <ItemTable
        chosen={chosenOption}
        companyHasInventoryQuery={companyHasInventoryQuery}
        companyInventoryExisting={companyHasInventoryQuery.data}
        dataFilterOptions={dataFilterOptions}
        date={null}
        downloadDataReport={handleFilteredDataUpdate}
        loadingState={setIsLoadingState}
        openAdvanceSearchModal={openAdvanceSearchModal}
        reference={null}
        refreshFn={refetchingQueriesFn}
        searchedResult={searchedResult}
        // searchItem={settingParamsForSearchResult}
        setDataFilterOptions={setDataFilterOptions}
        setOpenAdvanceSearchModal={setOpenAdvanceSearchModal}
        total={getTotalToDisplay()}
        setTypePerLocationInfoModal={setTypePerLocationInfoModal}
        setOpenDetails={setOpenDetails}
        allowedLocations={allowedInventoryLocations}
        userPreferences={userPreferences}
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

  const searchItem = async (data) => {
    const result = await devitrakApi.post(
      "/db_company/get-grouped-inventory-by-search-parameter",
      {
        searchParameter: data.searchItem,
        company_id: user.sqlInfo.company_id,
      }
    );
    if (result?.data?.ok) {
      setSearchedResult(result.data.data);
      return setParams(data.searchItem);
    }
  };

  const closeTypePerLocationInfoModal = () => {
    setOpenDetails(false);
    return setTypePerLocationInfoModal(null);
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
          setAddInventoryFromXLSXFileModal={setAddInventoryFromXLSXFileModal}
          setOpenCreateLocationModal={setOpenCreateLocationModal}
        />
        <MobileActionsButtons user={user} />
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
          </div>
          <Grid justifyContent={"flex-start"} gap={1} container>
            <Grid item xs={12} sm={12} md={12} lg={12}>
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
                        gap: "5px",
                      }}
                    >
                      <button
                        style={{
                          backgroundColor: "transparent",
                          margin: 0,
                          padding: 0,
                          border: "none",
                          boxShadow: "-moz-initial",
                        }}
                        type="button"
                        onClick={() => {
                          setValue("searchItem", "");
                          setParams(null);
                          setSearchedResult(null);
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
                          Clear
                        </p>
                      </button>
                      <button
                        type="submit"
                        style={{
                          backgroundColor: "transparent",
                          margin: 0,
                          padding: 0,
                          border: "none",
                          boxShadow: "-moz-initial",
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
                    </div>
                  }
                />
              </form>
            </Grid>
            <Divider />
            <Grid
              display={"flex"}
              justifyContent={"flex-start"}
              gap={1}
              item
              xs={12}
              sm={12}
              md
              lg
            >
              <GrayButtonComponent
                title={"Forecast Inventory"}
                func={() => {
                  setOpenAdvanceSearchModal(true);
                }}
                styles={{
                  width: "100%",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                titleStyles={{
                  textTransform: "none",
                }}
              />
              <GrayButtonComponent
                title={"Reload"}
                func={() => {
                  refetchingQueriesFn();
                  locationsQuery.refetch();
                }}
                styles={{
                  width: "100%",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                titleStyles={{
                  textTransform: "none",
                }}
              />
            </Grid>

            {/* <Grid
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
            </Grid> */}
          </Grid>
        </Grid>
        <Divider />
        <FilterOptionsContext.Provider
          value={{
            filterOptions: dataFilterOptions,
            chosen: chosenOption,
            setChosenOption: setChosenOption,
          }}
        >
          {optionsUX}
        </FilterOptionsContext.Provider>
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
            <SearchItemContext.Provider
              value={{
                chosenOption,
                setChosenOption,
                companyHasInventoryQuery,
                companyInventoryExisting: companyHasInventoryQuery.data,
                dataFilterOptions,
                date: null,
                downloadDataReport: handleFilteredDataUpdate,
                loadingState: setIsLoadingState,
                openAdvanceSearchModal,
                reference: null,
                refreshFn: refetchingQueriesFn,
                searchedResult: searchedResult,
                searchItem: settingParamsForSearchResult,
                setDataFilterOptions: setDataFilterOptions,
                setOpenAdvanceSearchModal: setOpenAdvanceSearchModal,
                total: getTotalToDisplay(),
                allowedLocations: allowedInventoryLocations,
                userPreferences: userPreferences,
              }}
            >
              {/* <Tabs
                defaultActiveKey="1"
                activeKey={activeView}
                onChange={setActiveView}
                style={{ width: "100%" }}
                items={[
                  {
                    key: "1",
                    label: "Inventory Items",
                    children: renderingOption[currentTab],
                  },
                  {
                    key: "2",
                    label: "Locations",
                    children: (
                      <LocationsList
                        locations={locationsQuery.data?.data?.result || []}
                      />
                    ),
                  },
                ]}
              /> */}
              {renderingOption[currentTab]}
            </SearchItemContext.Provider>
          </Grid>
        </Grid>
      </Grid>
      {isLoadingState && <Spin indicator={<Loading />} fullscreen={true} />}
      {renderingData && <Spin indicator={<Loading />} fullscreen={true} />}
      {openDetails && (
        <DisplayItemTypesPerLocationModal
          id_key={typePerLocationInfoModal.id_key}
          openDetails={openDetails}
          closeModal={closeTypePerLocationInfoModal}
          nodeName={typePerLocationInfoModal.nodeName}
          rows={typePerLocationInfoModal.rows}
          columns={typePerLocationInfoModal.columns}
        />
      )}
      {addInventoryFromXLSXFileModal && (
        <AddInventoryFromXLSXFile
          openModal={addInventoryFromXLSXFileModal}
          closeModal={setAddInventoryFromXLSXFileModal}
        />
      )}
      {openCreateLocationModal && (
        <CreateLocationModal
          openModal={openCreateLocationModal}
          setOpenModal={setOpenCreateLocationModal}
          refetch={locationsQuery.refetch}
          user={user}
        />
      )}
    </Suspense>
  );
};

export default MainPage;
