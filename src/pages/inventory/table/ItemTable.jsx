/* eslint-disable no-unused-vars */
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import "../../../styles/global/ant-table.css";
import "../style/details.css";
import { Avatar, Divider, Table } from "antd";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { devitrakApi } from "../../../api/devitrakApi";
import { dictionary } from "../utils/dicSelectedOptions";
import { GeneralDeviceIcon } from "../../../components/icons/GeneralDeviceIcon";
import { Grid, Typography } from "@mui/material";
import { groupBy, orderBy } from "lodash";
import { Icon } from "@iconify/react";
import { PropTypes } from "prop-types";
import { RightNarrowInCircle } from "../../../components/icons/RightNarrowInCircle";
import { Subtitle } from "../../../styles/global/Subtitle";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import Loading from "../../../components/animation/Loading";
import RefreshButton from "../../../components/utils/UX/RefreshButton";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import ColumnsFormat from "./extras/ux/ColumnsFormat";
const BannerMsg = lazy(() => import("../../../components/utils/BannerMsg"));
const DownloadingXlslFile = lazy(() => import("../actions/DownloadXlsx"));
const RenderingFilters = lazy(() => import("./extras/RenderingFilters"));

const ItemTable = ({
  searchItem,
  date,
  loadingState,
  reference,
  openAdvanceSearchModal,
  setOpenAdvanceSearchModal,
  setDataFilterOptions,
  chosen,
  downloadDataReport,
  total,
  searchedResult,
  companyHasInventoryQuery,
}) => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.admin);
  const [chosenConditionState, setChosenConditionState] = useState(0);
  const [searchDateResult, setSearchDateResult] = useState([]);
  const listItemsQuery = useQuery({
    queryKey: ["listOfItemsInStock"],
    queryFn: () =>
      devitrakApi.get(
        `/db_company/current-inventory/${user.sqlInfo.company_id}`
      ),
    enabled: !!user.sqlInfo.company_id,
    staleTime: 50 * 60 * 1000, // 500 minutes
    keepPreviousData: true,
  });

  const listImagePerItemQuery = useQuery({
    queryKey: ["imagePerItemList"],
    queryFn: () =>
      devitrakApi.post("/image/images", { company: user.companyData.id }),
    enabled: !!user.sqlInfo.company_id,
    staleTime: 50 * 60 * 1000, // 500 minutes
    keepPreviousData: true,
  });

  const itemsInInventoryQuery = useQuery({
    queryKey: ["ItemsInInventoryCheckingQuery"],
    queryFn: () =>
      devitrakApi.get(
        `/db_item/check-item?company_id=${user.sqlInfo.company_id}`
      ),
    enabled: !!user.sqlInfo.company_id,
    staleTime: 50 * 60 * 1000, // 500 minutes
    keepPreviousData: true,
  });

  const refactoredListInventoryCompany = useQuery({
    queryKey: ["RefactoredListInventoryCompany"],
    queryFn: () =>
      devitrakApi.post(
        `/db_company/company-inventory-with-current-warehouse-status`,
        {
          company_id: user.sqlInfo.company_id,
        }
      ),
    enabled: !!user.sqlInfo.company_id,
    staleTime: 50 * 60 * 1000, // 500 minutes
    keepPreviousData: true,
  });

  const imageSource = listImagePerItemQuery?.data?.data?.item;
  const groupingByDeviceType = groupBy(imageSource, "item_group");
  const renderedListItems = listItemsQuery?.data?.data?.result;

  const getDataStructuringFormat = useCallback(
    (props) => {
      const resultFormatToDisplay = new Set();
      const groupingBySerialNumber = groupBy(
        itemsInInventoryQuery?.data?.data?.items,
        "serial_number"
      );
      if (props?.length > 0) {
        for (let data of props) {
          if (groupingBySerialNumber[data.serial_number]) {
            resultFormatToDisplay.add({
              key: `${data.item_id}-${data.event_name}`,
              ...data,
              brand: groupingBySerialNumber[data.serial_number].at(-1).brand,
              data: {
                ...data,
                location:
                  groupingBySerialNumber[data.serial_number].at(-1).location,
                ...groupingBySerialNumber[data.serial_number].at(-1),
              },
              location:
                groupingBySerialNumber[data.serial_number].at(-1).location,
              image_url:
                groupingBySerialNumber[data.serial_number].at(-1).image_url ??
                null,
            });
          }
        }
      }
      return orderBy(
        Array.from(resultFormatToDisplay),
        ["serial_number"],
        ["asc"]
      );
    },
    [renderedListItems, itemsInInventoryQuery]
  );

  const refactoredGetDataStructuringFormat = useCallback(() => {
    const resultFormatToDisplay = [];
    const data = refactoredListInventoryCompany?.data?.data?.items;
    const groupingByImage = groupBy(data, "image_url");

    const processItems = (items) => {
      const groupingByItem = groupBy(items, "item_group");
      for (let [key, value] of Object.entries(groupingByItem)) {
        const imageSource = groupingByDeviceType[key]
          ? groupingByDeviceType[key][0].source
          : null;
        for (let data of value) {
          resultFormatToDisplay.push({
            key: data.item,
            item_id: data.item,
            item_group: data.item_group,
            category_name: data.category_name,
            brand: data.brand,
            ownership: data.ownership,
            main_warehouse: data.main_warehouse,
            warehouse: data.warehouse,
            location:
              data.usage && data.usage.length > 0 ? data.usage : data.location,
            image_url: data.image_url || imageSource,
            serial_number: data.serial_number,
            enableAssignFeature: data.enableAssignFeature,
            usage: data.usage,
          });
        }
      }
    };

    if (groupingByImage[null]) {
      processItems(groupingByImage[null]);
    }
    if (groupingByImage[""]) {
      processItems(groupingByImage[""]);
    }

    return resultFormatToDisplay;
  }, [refactoredListInventoryCompany, groupingByDeviceType]);

  useEffect(() => {
    getDataStructuringFormat(renderedListItems);
    loadingState(false); // ✅ State update happens inside useEffect, not render
    refactoredGetDataStructuringFormat();
  }, [getDataStructuringFormat, loadingState]);

  const filterOptionsBasedOnProps = (props) => {
    const options = new Set();
    const sortingByProps = groupBy(
      getDataStructuringFormat(renderedListItems),
      props
    );
    for (let [key, _] of Object.entries(sortingByProps)) {
      options.add(key);
    }
    return Array.from(options);
  };

  const filterByProps = () => {
    const dicSelectedOptions = {
      0: "brand",
      1: "item_group",
      2: "serial_number",
      3: "location",
      4: "ownership",
      5: "status",
    };
    const sortingByProps = groupBy(
      getDataStructuringFormat(renderedListItems),
      dicSelectedOptions[chosen.category]
    );
    return sortingByProps[chosen.value];
  };

  const searchingData = () => {
    return getDataStructuringFormat(renderedListItems)?.filter((item) =>
      JSON.stringify(item)
        .toLowerCase()
        .includes(String(searchItem).toLowerCase())
    );
  };
  useEffect(() => {
    if (searchItem && searchItem !== "") {
      setSearchDateResult([]);
      setChosenConditionState(1);
    }
    if (chosen.value !== null) {
      setSearchDateResult([]);
      setChosenConditionState(2);
    }
    if (date !== null) {
      setChosenConditionState(3);
    }
    if (
      chosen.value === null &&
      date === null &&
      (!searchItem || searchItem.length === 0)
    ) {
      setSearchDateResult([]);
      setChosenConditionState(0);
    }
  }, [searchItem, chosen.value, date, loadingState]);

  const querySearchingDataByDate = async () => {
    const date1Format = `${new Date(date).getTime()}`;
    const date2Format = `${new Date(date).getFullYear()}-${
      new Date(date).getMonth() + 1
    }-${new Date(date).getDate()}`;
    const responseQuery = await devitrakApi.get(
      `/event/event-inventory-based-on-period?company_id=${user.companyData.id}&date=${date1Format}&date2=${date2Format}&company_sql_id=${user.sqlInfo.company_id}`
    );
    setSearchDateResult(responseQuery.data.events);
    return responseQuery?.data?.events;
  };

  useEffect(() => {
    if (date) {
      querySearchingDataByDate();
    }
  }, [date]); // ✅ This will ensure the query runs when the date is updated

  const filterDataByDate = useMemo(() => {
    return getDataStructuringFormat(searchDateResult);
  }, [reference]);

  const options = {
    0: getDataStructuringFormat(renderedListItems),
    1: searchItem && searchingData(),
    2: chosen.value !== null && filterByProps(),
    3: date !== null && filterDataByDate,
  };

  const dataToDisplay = useCallback(() => {
    if (chosenConditionState === 3) {
      return getDataStructuringFormat(searchDateResult);
    }
    return options[chosenConditionState] || [];
  }, [chosenConditionState, searchDateResult, renderedListItems]);

  const filterOptions = {
    0: filterOptionsBasedOnProps("brand"),
    1: filterOptionsBasedOnProps("item_group"),
    2: filterOptionsBasedOnProps("serial_number"),
    3: filterOptionsBasedOnProps("location"),
    4: filterOptionsBasedOnProps("ownership"),
    5: filterOptionsBasedOnProps("status"),
  };

  const memoizedDataToDisplay = useMemo(
    () => dataToDisplay(),
    [chosenConditionState, searchDateResult, renderedListItems]
  );

  useEffect(() => {
    setDataFilterOptions(filterOptions);
    // Only call once data is ready
    if (memoizedDataToDisplay?.length > 0) {
      downloadDataReport(memoizedDataToDisplay);
    }
  }, [chosen, memoizedDataToDisplay]);

  const cellStyle = {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
  };

  const refreshFn = () => {
    listImagePerItemQuery.refetch();
    listItemsQuery.refetch();
    return itemsInInventoryQuery.refetch();
  };

  useEffect(() => {
    dataToDisplay();
  }, []);

  // Add function to get display title based on current filter state
  const getDisplayTitle = () => {
    if (searchItem && searchItem !== "") {
      return `Search results for "${searchItem}"`;
    }
    if (chosen.value !== null) {
      const categoryNames = {
        0: "brand",
        1: "item_group",
        2: "serial_number",
        3: "location",
        4: "ownership",
        5: "status",
      };
      return `Filtered by ${categoryNames[chosen.category]}: "${chosen.value}"`;
    }
    return "All devices";
  };

  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
        </div>
      }
    >
      <Grid margin={"15px 0 0 0"} padding={0} container>
        <Grid item xs={12} sm={12} md={12} lg={12}>
          <RenderingFilters
            dataToDisplay={dataToDisplay}
            searchItem={searchItem}
            user={user}
            openAdvanceSearchModal={openAdvanceSearchModal}
            setOpenAdvanceSearchModal={setOpenAdvanceSearchModal}
            searchedResult={searchedResult}
            chosen={chosen}
          />
        </Grid>
        <Grid
          flexDirection={"column"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          margin={"20px 0 0 0"}
          sx={{
            display: { xs: "none", sm: "none", md: "flex", lg: "flex" },
          }}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <div //details
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            open={true}
          >
            <div //summary
              style={{
                width: "100%",
              }}
              open
            >
              <div
                style={{
                  ...CenteringGrid,
                  justifyContent: "space-between",
                }}
              >
                <p
                  style={{
                    ...TextFontsize18LineHeight28,
                    width: "60%",
                    textAlign: "left",
                    cursor: "pointer",
                    textWrap: "balance",
                  }}
                >
                  {getDisplayTitle()}{" "}
                  <span
                    style={{
                      ...Subtitle,
                      width: "100%",
                      textAlign: "left",
                    }}
                  >
                    | Total <strong>{total}</strong> units
                    {(searchItem || chosen.value !== null) && (
                      <span style={{ color: "var(--blue-600)" }}>
                        {" "}
                        (filtered from{" "}
                        {companyHasInventoryQuery?.data?.data?.total ?? 0}{" "}
                        total)
                      </span>
                    )}
                  </span>{" "}
                  &nbsp;{" "}
                </p>
              </div>
            </div>
            <Divider />
            <Grid container>
              <Grid
                border={"1px solid var(--gray-200, #eaecf0)"}
                borderRadius={"12px 12px 0 0"}
                display={"flex"}
                justifyContent={"space-between"}
                alignItems={"center"}
                marginBottom={-1}
                paddingBottom={-1}
                item
                md={12}
                lg={12}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginRight: "5px",
                    padding: "0 0 0 0",
                  }}
                >
                  <RefreshButton propsFn={refreshFn} />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    // marginRight: "5px",
                    padding: "0 0 0 0",
                  }}
                >
                  <DownloadingXlslFile props={dataToDisplay()} />
                </div>{" "}
              </Grid>

              <Table
                pagination={{
                  position: ["bottomCenter"],
                  pageSizeOptions: [10, 20, 30, 50, 100],
                  total: dataToDisplay()?.length,
                  defaultPageSize: 10,
                  defaultCurrent: 1,
                }}
                style={{ width: "100%" }}
                columns={ColumnsFormat({ dictionary, navigate, cellStyle })}
                dataSource={refactoredGetDataStructuringFormat()}//dataToDisplay()}
                className="table-ant-customized"
              />
              <Divider />
            </Grid>
          </div>
        </Grid>
        {total === 0 && (!searchItem || searchItem === "") && (
          <BannerMsg
            props={{
              title: "Add new item",
              message: `Add new devices to your inventory and assign categories and groups
            for easier management. Devices in your inventory can be assigned to
            staff or consumers permanently or temporarily. You can also mark
            devices with different statuses for condition and location. Include
            a device value to track deposits and fees.`,
              link: "/inventory/new-item",
              button: BlueButton,
              paragraphStyle: BlueButtonText,
              paragraphText: "Add new item",
            }}
          />
        )}
      </Grid>
    </Suspense>
  );
};

export default ItemTable;

ItemTable.propTypes = {
  searchItem: PropTypes.string,
};
