/* eslint-disable no-unused-vars */
import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Divider, Table } from "antd";
import { groupBy, orderBy } from "lodash";
import { PropTypes } from "prop-types";
import {
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import RefreshButton from "../../../components/utils/UX/RefreshButton";
import "../../../styles/global/ant-table.css";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { SearchItemContext } from "../MainPage";
import "../style/details.css";
import { dictionary } from "../utils/dicSelectedOptions";
import ColumnsFormat from "./extras/ux/ColumnsFormat";
const BannerMsg = lazy(() => import("../../../components/utils/BannerMsg"));
const DownloadingXlslFile = lazy(() => import("../actions/DownloadXlsx"));
const RenderingFilters = lazy(() => import("./extras/RenderingFilters"));

/**
 * ItemTable Component
 *
 * Displays the filtered inventory items in a tabular format.
 *
 * Responsibilities:
 * - Fetches and consolidates inventory data from multiple sources.
 * - Filters data based on user search, active filters, and allowed locations.
 * - Renders the table using Ant Design's Table component.
 * - Passes permission-aware column definitions via `ColumnsFormat`.
 * - Integrates `RenderingFilters` for advanced filtering options.
 *
 * Props:
 * @param {Function} setOpenAdvanceSearchModal - Setter for modal visibility.
 * @param {Function} setDataFilterOptions - Setter for available filter options.
 * @param {Function} downloadDataReport - Callback for updating report data.
 * @param {Function} setTypePerLocationInfoModal - Setter for location details modal.
 * @param {Function} setOpenDetails - Setter for details visibility.
 * @param {Array<string>} allowedLocations - List of locations authorized for the current user.
 * @param {Object} userPreferences - User preferences object containing permission settings.
 *
 * @returns {JSX.Element} The rendered item table and filter controls.
 */
const ItemTable = ({
  // searchItem,
  // date,
  // loadingState,
  // reference,
  // openAdvanceSearchModal,
  setOpenAdvanceSearchModal,
  setDataFilterOptions,
  // chosen,
  downloadDataReport,
  // total,
  // searchedResult,
  // dataFilterOptions,
  // refreshFn,
  setTypePerLocationInfoModal,
  setOpenDetails,
  allowedLocations,
  userPreferences,
}) => {
  const searchValues = useContext(SearchItemContext);
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
      devitrakApi.post(`/db_inventory/check-item`, {
        company_id: user.sqlInfo.company_id,
        role:
          user.companyData.employees.find(
            (element) => element.user === user.email
          )?.role || [],
        preference:
          user.companyData.employees.find(
            (element) => element.user === user.email
          )?.preference || [],
      }),
    enabled: !!user.sqlInfo.company_id,
    staleTime: 5 * 60 * 1000, // 50 minutes
    keepPreviousData: true,
  });

  // const refactoredListInventoryCompany = useQuery({
  //   queryKey: ["RefactoredListInventoryCompany"],
  //   queryFn: () => devitrakApi.post(`/db_company/company-inventory-with-current-warehouse-status`, {
  //       company_id: user.sqlInfo.company_id,
  //     }),
  //     enabled: !!user.sqlInfo.company_id,
  //     staleTime: 5 * 60 * 1000, // 5 minutes
  //     keepPreviousData: true,
  // });

  const refactoredListInventoryCompany = useQuery({
    queryKey: ["RefactoredListInventoryCompany"],
    queryFn: () =>
      devitrakApi.post(`/db_item/warehouse-items`, {
        company_id: user.sqlInfo.company_id,
        role: user.role,
        preference:
          user.companyData.employees.find((item) => item.user === user.email)
            ?.preference || user.preference,
      }),
    enabled: !!user.sqlInfo.company_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true,
  });
  const imageSource = listImagePerItemQuery?.data?.data?.item;
  const groupingByDeviceType = groupBy(imageSource, "item_group");
  const renderedListItems = listItemsQuery?.data?.data?.result;
  // const queryClient = useQueryClient();
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

    const rowMap = new Map();

    for (const data of items) {
      // Resolve image source: use item's image or fallback to group image
      let imageSource = data.image_url;
      if (!imageSource || imageSource === "") {
        const groupImages = groupingByDeviceType[data.item_group];
        if (groupImages && groupImages.length > 0) {
          imageSource = groupImages[0].source;
        }
      }

      // Ensure we have a valid ID. Fallback to 'id' if 'item_id' is missing.
      const itemId = data.item_id || data.id;

      if (itemId) {
        const row = {
          key: itemId,
          item_id: itemId,
          item_group: data.item_group,
          category_name: data.category_name,
          brand: data.brand,
          ownership: data.ownership,
          main_warehouse: data.main_warehouse,
          warehouse: data.warehouse,
          location: data.location,
          image_url: imageSource,
          serial_number: data.serial_number,
          enableAssignFeature: data.enableAssignFeature,
          usage: data.usage,
          status: data.status ?? null,
          condition: data.status ?? null,
          assignedToStaffMember:
            data.usage && data.usage.length > 0 ? data.usage : null,
        };
        rowMap.set(itemId, row);
      }
    }

    return Array.from(rowMap.values());
  }, [refactoredListInventoryCompany?.data?.data?.items, groupingByDeviceType]);

  // Legacy join-based dataset (existing function retained)
  const legacyDataset = useMemo(
    () => getDataStructuringFormat(renderedListItems),
    [renderedListItems, itemsInInventoryQuery?.data?.data?.items]
  );

  // Unified dataset
  const baseDataset = useMemo(() => {
    let data = refactoredDataset.length > 0 ? refactoredDataset : legacyDataset;

    // Filter by allowed locations if specified (inventory_location)
    // If allowedLocations is null, it means Role 0 (All Access) -> Skip filtering
    if (allowedLocations !== null && Array.isArray(allowedLocations)) {
      if (allowedLocations.length === 0) {
        // User has NO allowed locations -> Return empty
        return [];
      }

      data = data.filter((item) => {
        const itemLocation = item.location;
        if (!itemLocation) return false;

        // Exact match or partial match (e.g., "Main / Sub")
        return allowedLocations.some(
          (allowed) =>
            itemLocation === allowed ||
            String(itemLocation).startsWith(`${allowed} /`)
        );
      });
    }

    return data;
  }, [refactoredDataset, legacyDataset, allowedLocations]);

  // Filtering helpers now use baseDataset
  const filterOptionsBasedOnProps = (props) => {
    const sortingByProps = groupBy(baseDataset, props);
    return Object.keys(sortingByProps);
  };

  useEffect(() => {
    if (
      Array.isArray(searchValues.chosenOption) &&
      searchValues.chosenOption.length > 0
    ) {
      setChosenConditionState(2); // filter-by-props
    } else if (searchValues.date) {
      setChosenConditionState(3); // date filter
    } else {
      setChosenConditionState(0); // default
    }
  }, [searchValues?.chosenOption, searchValues?.date]);

  // Date filtering: keep existing behavior using legacy transformation,
  // since the event endpoint structure is different/unknown.
  const filterDataByDate = useMemo(() => {
    return getDataStructuringFormat(searchResult);
  }, [searchResult, itemsInInventoryQuery?.data?.data?.items]);

  // Keep search results in state; if no term, show all
  useEffect(() => {
    const term = String(searchValues?.searchItem || "")
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
  }, [searchValues?.searchItem, baseDataset]);

  // Replace options + useCallback with a stable, memoized dataset
  const dataToDisplayMemo = useMemo(() => {
    if (chosenConditionState === 3) {
      // date filter branch retains legacy transform behavior
      return filterDataByDate;
    }
    if (chosenConditionState === 2) {
      // apply selected filters simultaneously
      const dicSelectedOptions = {
        0: "brand",
        1: "item_group",
        2: "serial_number",
        3: "location",
        4: "ownership",
        5: "condition",
        6: "assignedToStaffMember",
      };
      if (
        !Array.isArray(searchValues.chosenOption) ||
        searchValues.chosenOption.length === 0
      )
        return baseDataset;
      return baseDataset.filter((item) =>
        searchValues.chosenOption.every((filter) => {
          const propertyKey = dicSelectedOptions[filter.category];
          if (filter.category === 6) {
            return item?.[propertyKey]?.includes(filter.value);
          }
          if (!propertyKey) return true;
          return item?.[propertyKey] === filter.value;
        })
      );
    }
    // default branch reflects search or all
    return searchResult;
  }, [
    chosenConditionState,
    filterDataByDate,
    searchValues.chosenOption,
    baseDataset,
    searchResult,
  ]);

  // Provide a stable accessor for components expecting a function
  // const dataToDisplay = useCallback(
  //   () => dataToDisplayMemo,
  //   [dataToDisplayMemo]
  // );

  // Update filter options and report download only when inputs change
  useEffect(() => {
    setDataFilterOptions({
      0: filterOptionsBasedOnProps("brand"),
      1: filterOptionsBasedOnProps("item_group"),
      2: filterOptionsBasedOnProps("serial_number"),
      3: filterOptionsBasedOnProps("location"),
      4: filterOptionsBasedOnProps("ownership"),
      5: filterOptionsBasedOnProps("status"),
      6: [
        // Match normalized format: "First Last / email"
        ...user.companyData.employees.map(
          (employee) =>
            `${employee.firstName} ${employee.lastName} / ${employee.user}`
        ),
      ],
    });
    if (Array.isArray(dataToDisplayMemo) && dataToDisplayMemo.length > 0) {
      downloadDataReport(dataToDisplayMemo);
    }
  }, [baseDataset, dataToDisplayMemo]);

  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
        </div>
      }
    >
      <Grid margin={"15px 0 0 0"} padding={0} container>
        <Grid
          display={searchValues.chosenOption?.at(-1)?.category === 6 && "none"}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <RenderingFilters
            dataToDisplay={dataToDisplayMemo}
            searchItem={searchValues?.searchItem}
            user={user}
            openAdvanceSearchModal={searchValues.openAdvanceSearchModal}
            setOpenAdvanceSearchModal={setOpenAdvanceSearchModal}
            searchedResult={searchValues.searchedResult}
            chosen={searchValues.chosenOption}
            setFiltering={searchValues.setChosenOption}
            setTypePerLocationInfoModal={setTypePerLocationInfoModal}
            setOpenDetails={setOpenDetails}
            allowedLocations={allowedLocations}
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
          <div
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
                  <RefreshButton propsFn={searchValues.refreshFn} />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    padding: "0 0 0 0",
                  }}
                >
                  {/* Use stable memoized dataset */}
                  <DownloadingXlslFile props={dataToDisplayMemo} />
                </div>{" "}
              </Grid>

              <Table
                pagination={{
                  position: ["bottomCenter"],
                  pageSizeOptions: [10, 20, 30, 50, 100],
                  total: dataToDisplayMemo.length,
                  defaultPageSize: 10,
                  defaultCurrent: 1,
                }}
                style={{ width: "100%" }}
                columns={ColumnsFormat({
                  dictionary,
                  navigate,
                  cellStyle,
                  userPreferences, // Pass preferences to column formatter for action buttons
                })}
                dataSource={dataToDisplayMemo}
                rowKey={(record) => record.item_id || record.key}
                className="table-ant-customized"
              />
              <Divider />
            </Grid>
          </div>
        </Grid>
        {searchValues.searchedResult?.length === 0 &&
          (!searchValues?.searchItem || searchValues?.searchItem === "") && (
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
