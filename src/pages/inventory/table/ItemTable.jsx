import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Divider } from "antd";
import { groupBy } from "lodash";
import { PropTypes } from "prop-types";
import {
  lazy,
  Suspense,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import DevitrakLoading from "../../../components/animation/DevitrakLoading";
import RefreshButton from "../../../components/utils/UX/RefreshButton";
import BaseTable from "../../../components/UX/tables/BaseTable";
import {
  FEATURE_INVENTORY_SERVER_PAGINATION,
  FEATURE_SCOPED_ROLES,
} from "../../../config/featureFlags";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { SearchItemContext } from "../MainPage";
import "../style/details.css";
import {
  filterInventoryByCategoryScope,
  hasEmptyScope,
  isCategoryScopedRole,
} from "../utils/accessControlUtils";
import EmptyState from "../../../components/UX/emptyState/EmptyState";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import {
  activeFilterSummary,
  hasActiveCriteria,
} from "../utils/activeFilterSummary";
import { dictionary } from "../utils/dicSelectedOptions";
import { facetsToFilterOptions } from "../utils/facetsToFilterOptions";
import useInventoryFacets from "../utils/hooks/useInventoryFacets";
import useInventoryPage from "../utils/hooks/useInventoryPage";
import { toServerFilters } from "../utils/inventoryPageContract";
import ColumnsFormat from "./extras/ux/ColumnsFormat";
import CursorPager from "./extras/ux/CursorPager";
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
  setOpenCreateLocationModal,
  setTypePerLocationInfoModal,
  setOpenDetails,
  allowedLocations,
  userPreferences,
  reportMatchedTotal,
}) => {
  const searchValues = useContext(SearchItemContext);
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.admin);
  // Scoped-roles (Phase C): the category dimension is enforced server-side and
  // mirrored here for a consistent UX. Read the SQL scope stored at login.
  const {
    roleType: scopedRoleType,
    categories: scopedCategories,
  } = useSelector((state) => state.permission);
  const [chosenConditionState, setChosenConditionState] = useState(0);
  const [searchResult, setSearchResult] = useState([]);

  // ─── Server-paginated branch (FEATURE_INVENTORY_SERVER_PAGINATION) ─────────
  // Both branches are mounted; only one does any work. With the flag off the
  // hook is disabled, fires no request, and everything below reads from the
  // in-memory dataset exactly as before — the flag has to be inert in
  // production until the backend deploys the three endpoints.
  const serverFilters = useMemo(
    () => toServerFilters(searchValues?.chosenOption),
    [searchValues?.chosenOption],
  );
  const serverSearch = searchValues?.searchItem || serverFilters.search || "";
  // Ordering lives here rather than inside antd, because in server mode the
  // table only holds one page and the order is MySQL's decision over the whole
  // filtered set.
  const [serverSort, setServerSort] = useState({ sortBy: null, sortDir: "asc" });
  const serverPage = useInventoryPage({
    enabled: FEATURE_INVENTORY_SERVER_PAGINATION,
    filters: serverFilters.filters,
    search: serverSearch,
    sortBy: serverSort.sortBy,
    sortDir: serverSort.sortDir,
  });

  // Two questions, two calls, and the split is the point.
  //
  // The option lists are asked for with NO filters, deliberately: picking a
  // brand must not shrink the group list, because the user builds a combination
  // one filter at a time and needs to see what is there to pick next. Asking
  // unfiltered guarantees that whatever the server decides to do about narrowing
  // its own facets. They are the company's distinct values, so they move only
  // when inventory does — cheap to hold.
  const facetOptionsQuery = useInventoryFacets({
    enabled: FEATURE_INVENTORY_SERVER_PAGINATION,
  });
  // matchedTotal is the other question: how many rows the set on screen holds.
  // That one does carry the filters, and it is the only one that moves when a
  // filter moves.
  const facetTotalQuery = useInventoryFacets({
    enabled: FEATURE_INVENTORY_SERVER_PAGINATION,
    filters: serverFilters.filters,
    search: serverSearch,
  });

  useEffect(() => {
    if (!FEATURE_INVENTORY_SERVER_PAGINATION) return;
    if (typeof reportMatchedTotal !== "function") return;
    if (facetTotalQuery.matchedTotal === null) return;
    reportMatchedTotal(facetTotalQuery.matchedTotal);
  }, [facetTotalQuery.matchedTotal, reportMatchedTotal]);

  // antd hands back the clicked column and its direction; `order` is undefined
  // on the third click, which is how a user clears the sort.
  const handleTableChange = (_pagination, _filters, sorter) => {
    if (!FEATURE_INVENTORY_SERVER_PAGINATION) return;
    const next = Array.isArray(sorter) ? sorter[0] : sorter;
    setServerSort({
      sortBy: next?.order ? next.columnKey ?? next.field : null,
      sortDir: next?.order === "descend" ? "desc" : "asc",
    });
  };

  // Shared cell style for table cells
  const cellStyle = useMemo(
    () => ({
      display: "flex",
      alignItems: "center",
      gap: "8px",
      width: "100%",
    }),
    [],
  );
  const listImagePerItemQuery = useQuery({
    queryKey: ["imagePerItemList"],
    queryFn: () =>
      devitrakApi.post("/image/images", { company: user.companyData.id }),
    enabled: !!user.sqlInfo.company_id,
    staleTime: 50 * 60 * 1000, // 500 minutes
    keepPreviousData: true,
  });

  const refactoredListInventoryCompany = useQuery({
    queryKey: ["RefactoredListInventoryCompany"],
    queryFn: () =>
      devitrakApi.post(`/db_item/warehouse-items`, {
        company_id: user.sqlInfo.company_id,
        role: user.role,
        preference:
          user.companyData.employees
            .find((item) => item.user === user.email)
            ?.preference?.managerLocation?.map((item) => item.location) ||
          user.preference,
      }),
    // Off entirely once the server paginates. Leaving it on would mean paying
    // for every row of the company's inventory *and* paging on top — the cost
    // this migration exists to remove, plus a second one. It also matters for
    // correctness of intent: with this alive it is tempting to narrow its rows
    // in the client, which answers "which of these match" instead of "which of
    // the whole inventory match".
    enabled: !FEATURE_INVENTORY_SERVER_PAGINATION && !!user.sqlInfo.company_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true,
  });
  // Memoised, and it has to be. groupBy returns a fresh object on every call,
  // and this feeds the dependency array of refactoredDataset → baseDataset →
  // the search effect, which calls setSearchResult(baseDataset). Recomputed
  // inline, every render produced a new identity, so the effect fired, set
  // state, and triggered the next render: an update loop with no exit.
  const groupingByDeviceType = useMemo(
    () => groupBy(listImagePerItemQuery?.data?.data?.item, "item_group"),
    [listImagePerItemQuery?.data?.data?.item],
  );
  // The single source of rows for the table
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
        // console.log("itemId",itemId)
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
          data: data,
          logistic_status: data.logistic_status ?? null,
        };
        rowMap.set(itemId, row);
      }
    }

    return Array.from(rowMap.values());
  }, [refactoredListInventoryCompany?.data?.data?.items, groupingByDeviceType]);

  const baseDataset = useMemo(() => {
    let data = refactoredDataset;

    // Legacy allowedLocations prop support (optional, if still needed by parent components)
    // We keep this to ensure backward compatibility if allowedLocations is passed explicitly for other reasons
    if (allowedLocations !== null && Array.isArray(allowedLocations)) {
      if (allowedLocations.length === 0) {
        return [];
      }
      data = data.filter((item) => {
        const itemLocation = item.location;
        if (!itemLocation) return false;
        return allowedLocations.some(
          (allowed) =>
            itemLocation === allowed ||
            String(itemLocation).startsWith(`${allowed} /`),
        );
      });
    }

    // Category-scoped roles (8/9): mirror the server-side scope filter so the
    // table matches what the backend will return. Fail-closed on empty scope.
    if (FEATURE_SCOPED_ROLES && isCategoryScopedRole(scopedRoleType)) {
      const assignedCategoryNames = (scopedCategories ?? []).map(
        (c) => c.category_name,
      );
      data = filterInventoryByCategoryScope(data, assignedCategoryNames);
    }

    return data;
  }, [refactoredDataset, allowedLocations, scopedRoleType, scopedCategories]);

  // R6 — a CATEGORY-scoped role with zero assigned categories sees no
  // inventory; show a clear message instead of an ambiguous empty table.
  // Location roles are governed by the legacy server-side filter (R3), so
  // hasEmptyScope deliberately ignores them here.
  const emptyScope = useMemo(
    () =>
      FEATURE_SCOPED_ROLES &&
      hasEmptyScope(scopedRoleType, { categories: scopedCategories }),
    [scopedRoleType, scopedCategories],
  );

  // Filtering helpers now use baseDataset
  const filterOptionsBasedOnProps = (props) => {
    const sortingByProps = groupBy(baseDataset, props);
    return Object.keys(sortingByProps);
  };

  useEffect(() => {
    if (
      Array.isArray(searchValues?.chosenOption) &&
      searchValues?.chosenOption.length > 0
    ) {
      setChosenConditionState(2); // filter-by-props
    } else {
      setChosenConditionState(0); // default
    }
  }, [searchValues?.chosenOption]);

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
      JSON.stringify(item).toLowerCase().includes(term),
    );
    setSearchResult(filtered);
  }, [searchValues?.searchItem, baseDataset]);

  // Replace options + useCallback with a stable, memoized dataset
  const dataToDisplayMemo = useMemo(() => {
    if (chosenConditionState === 2) {
      // apply selected filters simultaneously
      const dicSelectedOptions = {
        0: "brand",
        1: "item_group",
        2: "serial_number",
        3: "location",
        4: "ownership",
        5: "condition",
        7: "logistic_status",
        8: "category_name",
      };
      if (
        !Array.isArray(searchValues?.chosenOption) ||
        searchValues?.chosenOption.length === 0
      )
        return baseDataset;
      return baseDataset.filter((item) =>
        searchValues?.chosenOption.every((filter) => {
          // console.log(filter)
          const propertyKey = dicSelectedOptions[filter.category];
          if (!propertyKey) return true;
          return item?.[propertyKey] === filter.value;
        }),
      );
    }
    // default branch reflects search or all
    return searchResult;
  }, [
    chosenConditionState,
    searchValues?.chosenOption,
    baseDataset,
    searchResult,
  ]);
  // console.log(dataToDisplayMemo)

  // The rows that actually reach the table. With the flag off this is the
  // in-memory dataset, untouched; with it on, the single page the server sent.
  const rowsToRender = FEATURE_INVENTORY_SERVER_PAGINATION
    ? serverPage.items
    : dataToDisplayMemo;

  // Two empty tables that look identical and mean opposite things: this company
  // has no inventory, and the combination you built matches none of it. The
  // filters are AND — Brand Dell *and* Group Laptop — so asking for a group
  // that brand does not carry is a legitimate question with no answer, and the
  // table has to say which empty it is. Only the second case is handled here;
  // the first keeps the app-wide placeholder from main.jsx.
  const chosenOption = searchValues?.chosenOption;
  const searchTerm = searchValues?.searchItem;
  const setChosenOption = searchValues?.setChosenOption;
  const emptyTableText = useMemo(() => {
    if (!hasActiveCriteria(chosenOption, searchTerm)) return undefined;
    return (
      <EmptyState
        icon="tabler:filter-off"
        title="No inventory matches those filters"
        description={activeFilterSummary(chosenOption, searchTerm)}
        action={
          <GrayButtonComponent
            title="Clear filters"
            size="sm"
            func={() => setChosenOption?.([])}
          />
        }
      />
    );
  }, [chosenOption, searchTerm, setChosenOption]);

  // Provide a stable accessor for components expecting a function
  // const dataToDisplay = useCallback(
  //   () => dataToDisplayMemo,
  //   [dataToDisplayMemo]
  // );

  // With the server paginating, the option lists come from inventory-facets:
  // grouping the rows in memory could only ever describe the page, and a page
  // of fifty rows knows fifty brands.
  useEffect(() => {
    if (!FEATURE_INVENTORY_SERVER_PAGINATION) return;
    setDataFilterOptions(facetsToFilterOptions(facetOptionsQuery.facets));
  }, [facetOptionsQuery.facets, setDataFilterOptions]);

  // Update filter options and report download only when inputs change
  useEffect(() => {
    if (FEATURE_INVENTORY_SERVER_PAGINATION) return;
    setDataFilterOptions({
      0: filterOptionsBasedOnProps("brand"),
      1: filterOptionsBasedOnProps("item_group"),
      2: filterOptionsBasedOnProps("serial_number"),
      3: filterOptionsBasedOnProps("location"),
      4: filterOptionsBasedOnProps("ownership"),
      5: filterOptionsBasedOnProps("status"),
      // 6 (Staff member) is gone: it was the one list not derived from the
      // data — it came from companyData.employees — and it filtered on
      // `assignedToStaffMember`, which is null on every row because
      // warehouse-items has no `usage` column. Every name in it matched nothing.
      7: filterOptionsBasedOnProps("logistic_status"),
      8: filterOptionsBasedOnProps("category_name"),
    });
    if (Array.isArray(dataToDisplayMemo) && dataToDisplayMemo.length > 0) {
      downloadDataReport(dataToDisplayMemo);
    }
  }, [baseDataset, dataToDisplayMemo]);

  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <DevitrakLoading />
        </div>
      }
    >
      <Grid margin={"15px 0 0 0"} padding={0} container>
        {emptyScope && (
          <Grid item xs={12} sm={12} md={12} lg={12}>
            <div style={{ width: "100%", textAlign: "center", padding: "48px 16px" }}>
              <p style={{ fontWeight: 600, fontSize: "18px", margin: 0 }}>
                No inventory in your scope yet
              </p>
              <p style={{ color: "var(--gray-500, #667085)", marginTop: "8px" }}>
                You don&apos;t have any{" "}
                {isCategoryScopedRole(scopedRoleType) ? "categories" : "locations"}{" "}
                assigned. Contact your administrator to get access to inventory.
              </p>
            </div>
          </Grid>
        )}
        {!emptyScope && (
          <>
            {/* This used to carry `display={chosenOption.at(-1)?.category === 6
                && "none"}`: picking a staff member hid the whole card strip,
                because the sections could not answer that filter. With the
                filter gone the strip has nothing to hide from. */}
            <Grid item xs={12} sm={12} md={12} lg={12}>
              <RenderingFilters
                dataToDisplay={dataToDisplayMemo}
                searchItem={searchValues?.searchItem}
                user={user}
                openAdvanceSearchModal={searchValues?.openAdvanceSearchModal}
                setOpenAdvanceSearchModal={setOpenAdvanceSearchModal}
                searchedResult={searchValues?.searchedResult}
                chosen={searchValues?.chosenOption}
                setFiltering={searchValues?.setChosenOption}
                setTypePerLocationInfoModal={setTypePerLocationInfoModal}
                setOpenDetails={setOpenDetails}
                allowedLocations={allowedLocations}
                setOpenCreateLocationModal={setOpenCreateLocationModal}
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding:"14px 0px" }}>
                    <RefreshButton propsFn={searchValues?.refreshFn} />
                    <DownloadingXlslFile props={dataToDisplayMemo} />
                  </div>
                  <BaseTable
                    // antd's pager needs a total and a page count; keyset
                    // pagination has neither. In the server branch the table
                    // shows the page it was given and CursorPager drives it.
                    enablePagination={!FEATURE_INVENTORY_SERVER_PAGINATION}
                    pageSize={10}
                    // The legacy dataset used to fill this gap: while
                    // warehouse-items was in flight the table rendered the
                    // other two fetches' rows. With the legacy path gone there
                    // is nothing behind it, so an un-flagged load reads as
                    // "this company has no inventory" until the response
                    // lands. Say "loading" instead of showing an empty table.
                    loading={
                      FEATURE_INVENTORY_SERVER_PAGINATION
                        ? serverPage.isFetching
                        : refactoredListInventoryCompany.isLoading
                    }
                    // BaseTable dresses the wait in the brand's animation; this
                    // only names what is loading, for screen readers.
                    loadingLabel="Loading inventory…"
                    style={{ width: "100%" }}
                    columns={ColumnsFormat({
                      dictionary,
                      navigate,
                      cellStyle,
                      userPreferences, // Pass preferences to column formatter for action buttons
                      serverSorted: FEATURE_INVENTORY_SERVER_PAGINATION,
                      sortBy: serverSort.sortBy,
                      sortDir: serverSort.sortDir,
                    })}
                    onChange={handleTableChange}
                    // Only set when the user has narrowed something; otherwise
                    // antd falls through to the app-wide placeholder.
                    locale={emptyTableText ? { emptyText: emptyTableText } : undefined}
                    dataSource={rowsToRender}
                    rowKey={(record) => record.item_id}
                    onRow={(record) => {
                      return {
                        onClick: () => {
                          navigate(`/inventory/item?id=${record.item_id}`)
                        },
                      };
                    }}

                  />
                  {FEATURE_INVENTORY_SERVER_PAGINATION && (
                    <CursorPager
                      pageNumber={serverPage.pageNumber}
                      hasPrevious={serverPage.hasPrevious}
                      hasMore={serverPage.hasMore}
                      onPrevious={serverPage.previousPage}
                      onNext={serverPage.nextPage}
                      isFetching={serverPage.isFetching}
                    />
                  )}
                  <Divider />
                </Grid>
              </div>
            </Grid>
            {searchValues?.searchedResult?.length === 0 &&
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
          </>
        )}
      </Grid>
    </Suspense>
  );
};

export default ItemTable;

ItemTable.propTypes = {
  searchItem: PropTypes.string,
};
