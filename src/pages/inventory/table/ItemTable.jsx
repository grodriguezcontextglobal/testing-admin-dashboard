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
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  // reference,
  openAdvanceSearchModal,
  setOpenAdvanceSearchModal,
  setDataFilterOptions,
  chosen,
  downloadDataReport,
  total,
  searchedResult,
  // companyHasInventoryQuery,
}) => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.admin);
  const [chosenConditionState, setChosenConditionState] = useState(0);
  const [searchResult, setSearchResult] = useState([]);

  // Shared cell style for table cells
  const cellStyle = useMemo(
    () => ({
      display: "flex",
      alignItems: "center",
      gap: "8px",
      width: "100%",
    }),
    []
  );

  // Display title based on search/filter/date
  // const getDisplayTitle = useCallback(() => {
  //   if (chosenConditionState === 3 && date)
  //     return "Inventory for selected period";
  //   if (searchItem) return `Search results for "${searchItem}"`;
  //   if (Array.isArray(chosen) && chosen.length > 0) {
  //     const labels = {
  //       0: "Brand",
  //       1: "Device name",
  //       2: "Serial number",
  //       3: "Location",
  //       4: "Ownership",
  //       5: "Condition",
  //     };
  //     const filterDescriptions = chosen.map((filter) => {
  //       const label = labels[filter.category] ?? "Filter";
  //       return `${label}: ${filter.value}`;
  //     });
  //     return `Filtered by ${filterDescriptions.join(", ")}`;
  //   }
  //   return "Inventory";
  // }, [searchItem, chosen, chosenConditionState, date]);
  const listItemsQuery = useQuery({
    queryKey: ["listOfItemsInStock"],
    queryFn: () =>
      devitrakApi.get(
        `/db_company/current-inventory/${user.sqlInfo.company_id}`
      ),
    enabled: !!user.sqlInfo.company_id,
    staleTime: 5 * 60 * 1000, // 50 minutes
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
    staleTime: 5 * 60 * 1000, // 50 minutes
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
    staleTime: 5 * 60 * 1000, // 50 minutes
    keepPreviousData: true,
  });

  const imageSource = listImagePerItemQuery?.data?.data?.item;
  const groupingByDeviceType = groupBy(imageSource, "item_group");
  const renderedListItems = listItemsQuery?.data?.data?.result;
  const queryClient = useQueryClient();
  const getDataStructuringFormat = useCallback(
    (props) => {
      const resultFormatToDisplay = new Map();
      const groupingBySerialNumber = groupBy(
        itemsInInventoryQuery?.data?.data?.items,
        "serial_number"
      );
      if (props?.length > 0) {
        for (let data of props) {
          if (groupingBySerialNumber[data.serial_number]) {
            if (!resultFormatToDisplay.has(data.item_id)) {
              const valu = {
                key: `${data.item_id}`,
                ...data,
                condition:
                  data.status ??
                  groupingBySerialNumber[data.serial_number].at(-1).status ??
                  groupingBySerialNumber[data.serial_number].at(-1).condition,
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
              };
              resultFormatToDisplay.set(data.item_id, valu);
            }
          }
        }
      }
      return orderBy(
        Array.from(resultFormatToDisplay.values()),
        ["serial_number"],
        ["asc"]
      );
    },
    [renderedListItems, itemsInInventoryQuery]
  );

  // Prefer refactored inventory dataset; fallback to legacy format
  const refactoredDataset = useMemo(() => {
    const items = refactoredListInventoryCompany?.data?.data?.items;
    if (!Array.isArray(items) || items.length === 0) return [];

    // Deduplicate rows by item_id to avoid repeated keys
    const rowMap = new Map();
    const groupingByImage = groupBy(items, "image_url");

    const processItems = (itemsChunk) => {
      const groupingByItem = groupBy(itemsChunk, "item_group");
      for (let [key, value] of Object.entries(groupingByItem)) {
        const imageSource = groupingByDeviceType[key]
          ? groupingByDeviceType[key][0].source
          : null;
        for (let data of value) {
          const row = {
            key: data.item, // stable key equals item_id
            item_id: data.item,
            item_group: data.item_group,
            category_name: data.category_name,
            brand: data.brand,
            ownership: data.ownership,
            main_warehouse: data.main_warehouse,
            warehouse: data.warehouse,
            location: data.location,
            image_url: data.image_url || imageSource,
            serial_number: data.serial_number,
            enableAssignFeature: data.enableAssignFeature,
            usage: data.usage,
            status: data.status ?? null,
            condition: data.status ?? null,
            assignedToStaffMember:
              data.usage && data.usage.length > 0 ? data.usage : null,
          };

          // Always keep the latest row for this item_id
          rowMap.set(row.item_id, row);
        }
      }
    };

    // Process groups, including null/empty image_url buckets
    if (groupingByImage[null]) processItems(groupingByImage[null]);
    if (groupingByImage[""]) processItems(groupingByImage[""]);
    Object.entries(groupingByImage)
      .filter(([k]) => k !== null && k !== "")
      .forEach(([, chunk]) => processItems(chunk));

    return Array.from(rowMap.values());
  }, [refactoredListInventoryCompany?.data?.data?.items, groupingByDeviceType]);

  // Legacy join-based dataset (existing function retained)
  const legacyDataset = useMemo(
    () => getDataStructuringFormat(renderedListItems),
    [renderedListItems, itemsInInventoryQuery?.data?.data?.items]
  );

  // Unified dataset
  const baseDataset = useMemo(
    () => (refactoredDataset.length > 0 ? refactoredDataset : legacyDataset),
    [refactoredDataset, legacyDataset]
  );

  // Remove redundant calls; only mark loading done when data exists
  useEffect(() => {
    if (baseDataset.length > 0) {
      loadingState(false);
    }
  }, [baseDataset.length, loadingState]);

  // Filtering helpers now use baseDataset
  const filterOptionsBasedOnProps = (props) => {
    const sortingByProps = groupBy(baseDataset, props);
    return Object.keys(sortingByProps);
  };

  useEffect(() => {
    if (Array.isArray(chosen) && chosen.length > 0) {
      setChosenConditionState(2); // filter-by-props
    } else if (date) {
      setChosenConditionState(3); // date filter
    } else {
      setChosenConditionState(0); // default
    }
  }, [chosen, date]);

  const filterByProps = () => {
    if (!Array.isArray(chosen) || chosen.length === 0) {
      return baseDataset;
    }

    const dicSelectedOptions = {
      0: "brand",
      1: "item_group",
      2: "serial_number",
      3: "location",
      4: "ownership",
      5: "condition",
    };

    // Apply all filters simultaneously
    return baseDataset.filter((item) => {
      return chosen.every((filter) => {
        const propertyKey = dicSelectedOptions[filter.category];
        if (!propertyKey) return true; // Skip invalid filters
        return item?.[propertyKey] === filter.value;
      });
    });
  };

  const searchingData = () => {
    return baseDataset.filter((item) =>
      JSON.stringify(item)
        .toLowerCase()
        .includes(String(searchItem).toLowerCase())
    );
  };

  // Date filtering: keep existing behavior using legacy transformation,
  // since the event endpoint structure is different/unknown.
  const filterDataByDate = useMemo(() => {
    return getDataStructuringFormat(searchResult);
  }, [searchResult, itemsInInventoryQuery?.data?.data?.items]);

  // Keep search results in state; if no term, show all
  useEffect(() => {
    const term = String(searchItem || "")
      .trim()
      .toLowerCase();
    if (term.length === 0) {
      setSearchResult(baseDataset);
      return;
    }
    const filtered = baseDataset.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(term)
    );
    setSearchResult(filtered);
  }, [searchItem, baseDataset]);

  const options = {
    0: searchResult, // default branch reflects search or all
    1: searchItem && searchingData(),
    2: chosen.value !== null && filterByProps(),
    3: date !== null && filterDataByDate,
  };

  const dataToDisplay = useCallback(() => {
    if (chosenConditionState === 3) {
      return filterDataByDate;
    }
    return options[chosenConditionState] || [];
  }, [chosenConditionState, filterDataByDate, options]);

  const memoizedDataToDisplay = useMemo(() => dataToDisplay(), [dataToDisplay]);

  useEffect(() => {
    setDataFilterOptions({
      0: filterOptionsBasedOnProps("brand"),
      1: filterOptionsBasedOnProps("item_group"),
      2: filterOptionsBasedOnProps("serial_number"),
      3: filterOptionsBasedOnProps("location"),
      4: filterOptionsBasedOnProps("ownership"),
      5: filterOptionsBasedOnProps("status"),
    });

    if (memoizedDataToDisplay?.length > 0) {
      downloadDataReport(memoizedDataToDisplay);
    }
  }, [chosen, memoizedDataToDisplay]);

  // Refresh: invalidate inventory-related queries
  const refreshFn = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["RefactoredListInventoryCompany"],
    });
    queryClient.invalidateQueries({
      queryKey: ["ItemsInInventoryCheckingQuery"],
    });
    queryClient.invalidateQueries({ queryKey: ["listOfItemsInStock"] });
    queryClient.invalidateQueries({ queryKey: ["imagePerItemList"] });
  }, [queryClient]);

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
                dataSource={memoizedDataToDisplay} // unified dataset
                rowKey={(record) => record.item_id || record.key}
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
