import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { groupBy } from "lodash";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import Loading from "../../../../../components/animation/Loading";
import TableHeader from "../../../../../components/UX/TableHeader";
import BaseTable from "../../../../../components/UX/tables/BaseTable";
import RefreshButton from "../../../../../components/utils/UX/RefreshButton";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { filterDataByRoleAndPreference } from "../../../utils/accessControlUtils";
import columnsTableMain from "../../../utils/ColumnsTableMain";
import {
  dataStructuringFormat,
  dataToDisplay,
} from "../../utils/dataStructuringFormat";

const DownloadingXlslFile = lazy(() => import("../../../actions/DownloadXlsx"));

const TableItemBrand = ({
  searchItem = "",
  referenceData,
  isLoadingComponent,
}) => {
  const location = useLocation();
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();

  // Consolidated pagination state
  const [paginationState, setPaginationState] = useState({
    current: 1,
    pageSize: 10,
    filteredCount: 0,
  });

  // Memoize brand name extraction to prevent recalculation
  const brandName = useMemo(() => {
    const searchParams = location.search.split("&");
    return decodeURI(searchParams[0].slice(1));
  }, [location.search]);

  // Memoize query keys to prevent unnecessary re-renders
  const queryKeys = useMemo(
    () => ({
      items: ["currentStateDevicePerBrand", brandName],
      images: ["deviceImagePerBrand", brandName],
      inventory: ["deviceInInventoryPerBrand", brandName],
    }),
    [brandName],
  );

  const listItemsQuery = useQuery({
    queryKey: queryKeys.items,
    queryFn: () =>
      devitrakApi.post("/db_company/inventory-based-on-submitted-parameters", {
        query: "select * from item_inv where brand = ? and company_id = ?",
        values: [brandName, user.sqlInfo.company_id],
      }),
    enabled: !!user.sqlInfo?.company_id && !!brandName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  const listImagePerItemQuery = useQuery({
    queryKey: queryKeys.images,
    queryFn: () =>
      devitrakApi.post("/image/images", { company: user.companyData.id }),
    enabled: !!user.companyData?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes - images change less frequently
    cacheTime: 15 * 60 * 1000, // 15 minutes
  });

  const itemsInInventoryQuery = useQuery({
    queryKey: queryKeys.inventory,
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
        brand: brandName,
      }),
    enabled: !!user.sqlInfo?.company_id && !!brandName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Memoize derived data to prevent unnecessary recalculations
  const derivedData = useMemo(() => {
    const imageSource = listImagePerItemQuery?.data?.data?.item;
    const groupingByDeviceType = groupBy(imageSource, "item_group");
    let renderedListItems = listItemsQuery?.data?.data?.result;

    if (renderedListItems) {
      renderedListItems = filterDataByRoleAndPreference(
        renderedListItems,
        user,
      );
    }

    return {
      imageSource,
      groupingByDeviceType,
      renderedListItems,
    };
  }, [
    listImagePerItemQuery?.data?.data?.item,
    listItemsQuery?.data?.data?.result,
    user,
  ]);

  // Memoize structured data to prevent unnecessary processing
  const structuredDataRendering = useMemo(() => {
    if (!derivedData.renderedListItems) return [];

    return dataStructuringFormat(
      derivedData.renderedListItems,
      derivedData.groupingByDeviceType,
      itemsInInventoryQuery,
    );
  }, [
    derivedData.renderedListItems,
    derivedData.groupingByDeviceType,
    itemsInInventoryQuery?.data,
  ]);

  // Memoize calculations to prevent recalculation on every render
  const calculations = useMemo(() => {
    const totalValue = structuredDataRendering.reduce(
      (sum, item) => sum + Number(item.cost || 0),
      0,
    );

    const itemList = groupBy(derivedData.renderedListItems, "warehouse");
    const totalAvailable = itemList[1]?.length || 0;

    return {
      totalDevices: structuredDataRendering.length,
      totalValue,
      totalAvailable,
    };
  }, [structuredDataRendering, derivedData.renderedListItems]);

  // Update reference data when calculations change
  useEffect(() => {
    if (referenceData && calculations.totalDevices > 0) {
      referenceData(calculations);
    }
  }, [calculations, referenceData]);

  const dataRenderingMemo = useMemo(() => {
    return dataToDisplay(structuredDataRendering, searchItem);
  }, [structuredDataRendering, searchItem]);

  // Update filtered count when data changes
  useEffect(() => {
    if (dataRenderingMemo.length !== paginationState.filteredCount) {
      setPaginationState((prev) => ({
        ...prev,
        filteredCount: dataRenderingMemo.length,
        current: 1, // Reset to first page when data changes
      }));
    }
  }, [dataRenderingMemo.length, paginationState.filteredCount]);

  // Memoized refresh handler
  const handleRefresh = useCallback(() => {
    listImagePerItemQuery.refetch();
    listItemsQuery.refetch();
    itemsInInventoryQuery.refetch();
  }, [listImagePerItemQuery, listItemsQuery, itemsInInventoryQuery]);

  // Optimized table change handler
  const handleTableChange = useCallback(
    (pagination, filters, sorter, extra) => {
      setPaginationState((prev) => ({
        ...prev,
        current: extra.action === "filter" ? 1 : pagination.current,
        pageSize: pagination.pageSize,
        filteredCount:
          extra.action === "filter"
            ? extra.currentDataSource.length
            : prev.filteredCount,
      }));
    },
    [],
  );

  // Memoize table columns to prevent recreation
  const tableColumns = useMemo(
    () =>
      columnsTableMain({
        groupingByDeviceType: derivedData.groupingByDeviceType,
        navigate,
        responsive: [
          ["lg"],
          ["lg"],
          ["xs", "sm", "md", "lg"],
          ["md", "lg"],
          ["md", "lg"],
          ["md", "lg"],
          ["xs", "sm", "md", "lg"],
          ["xs", "sm", "md", "lg"],
        ],
        data: dataRenderingMemo,
      }),
    [derivedData.groupingByDeviceType, navigate, dataRenderingMemo],
  );

  // Memoize pagination config
  const paginationConfig = useMemo(
    () => ({
      position: ["bottomCenter"],
      pageSizeOptions: [10, 20, 30, 50, 100],
      total: paginationState.filteredCount,
      current: paginationState.current,
      pageSize: paginationState.pageSize,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
    }),
    [paginationState],
  );

  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
        </div>
      }
    >
      <Grid margin={"15px 0 0 0"} padding={0} container>
        {isLoadingComponent && <Loading />}
        {!isLoadingComponent && (
          <>
            <TableHeader
              leftCta={<RefreshButton propsFn={handleRefresh} />}
              rightCta={<DownloadingXlslFile props={dataRenderingMemo} />}
            />

            <BaseTable
              pagination={paginationConfig}
              columns={tableColumns}
              dataSource={dataRenderingMemo}
              onChange={handleTableChange}
            />
          </>
        )}
      </Grid>
    </Suspense>
  );
};

export default TableItemBrand;
