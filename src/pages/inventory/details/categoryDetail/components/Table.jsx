import { Icon } from "@iconify/react/dist/iconify.js";
import { Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Button, Table } from "antd";
import { groupBy } from "lodash";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import Loading from "../../../../../components/animation/Loading";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import DownloadingXlslFile from "../../../actions/DownloadXlsx";
import columnsTableMain from "../../../utils/ColumnsTableMain";
import { dataStructuringFormat, dataToDisplay } from "../../utils/dataStructuringFormat";

const TableDeviceCategory = ({ searchItem = '', referenceData, isLoadingComponent }) => {
  const location = useLocation();
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  
  // Consolidated pagination state
  const [paginationState, setPaginationState] = useState({
    current: 1,
    pageSize: 10,
    filteredCount: 0
  });

  // Memoize category name extraction to prevent recalculation
  const categoryName = useMemo(() => {
    const searchParams = location.search.split("&");
    return decodeURI(searchParams[0].slice(1));
  }, [location.search]);

  // Memoize query keys to prevent unnecessary re-renders
  const queryKeys = useMemo(() => ({
    items: ["currentStateDevicePerCategory", categoryName],
    images: ["deviceImagePerCategory", categoryName],
    inventory: ["deviceInInventoryPerCategory", categoryName]
  }), [categoryName]);

  const listItemsQuery = useQuery({
    queryKey: queryKeys.items,
    queryFn: () =>
      devitrakApi.post("/db_company/inventory-based-on-submitted-parameters", {
        query: 'select * from item_inv where category_name = ? and company_id = ?',
        values: [categoryName, user.sqlInfo.company_id]
      }),
    enabled: !!user.sqlInfo?.company_id && !!categoryName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  const listImagePerItemQuery = useQuery({
    queryKey: queryKeys.images,
    queryFn: () =>
      devitrakApi.post("/image/images", { 
        company: user.companyData.id, 
        category: categoryName 
      }),
    enabled: !!user.companyData?.id && !!categoryName,
    staleTime: 10 * 60 * 1000, // 10 minutes - images change less frequently
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });

  const itemsInInventoryQuery = useQuery({
    queryKey: queryKeys.inventory,
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
        category_name: categoryName,
      }),
    enabled: !!user.sqlInfo?.company_id && !!categoryName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  // Memoize derived data to prevent unnecessary recalculations
  const derivedData = useMemo(() => {
    const imageSource = listImagePerItemQuery?.data?.data?.item;
    const groupingByDeviceType = groupBy(imageSource, "item_group");
    const renderedListItems = listItemsQuery?.data?.data?.result;
    
    return {
      imageSource,
      groupingByDeviceType,
      renderedListItems
    };
  }, [
    listImagePerItemQuery?.data?.data?.item,
    listItemsQuery?.data?.data?.result
  ]);

  // Memoize structured data to prevent unnecessary processing
  const structuredDataRendering = useMemo(() => {
    if (!derivedData.renderedListItems || !derivedData.groupingByDeviceType) {
      return [];
    }
    
    return dataStructuringFormat(
      derivedData.renderedListItems,
      derivedData.groupingByDeviceType,
      itemsInInventoryQuery
    );
  }, [
    derivedData.renderedListItems,
    derivedData.groupingByDeviceType,
    itemsInInventoryQuery?.data
  ]);

  // Memoize calculations to prevent recalculation on every render
  const calculations = useMemo(() => {
    const totalValue = structuredDataRendering.reduce((sum, item) => 
      sum + Number(item.cost || 0), 0
    );
    
    const itemList = groupBy(derivedData.renderedListItems, "warehouse");
    const totalAvailable = itemList[1]?.length || 0;
    
    return {
      totalDevices: structuredDataRendering.length,
      totalValue,
      totalAvailable
    };
  }, [structuredDataRendering, derivedData.renderedListItems]);

  // Update reference data when calculations change
  useEffect(() => {
    if (referenceData && calculations.totalDevices >= 0) {
      referenceData(calculations);
    }
  }, [calculations, referenceData]);

  const dataRenderingMemo = useMemo(() => {
    return dataToDisplay(structuredDataRendering, searchItem);
  }, [structuredDataRendering, searchItem]);

  // Update filtered count when data changes - Fix infinite loop
  useEffect(() => {
    if (dataRenderingMemo.length !== paginationState.filteredCount) {
      setPaginationState(prev => ({
        ...prev,
        filteredCount: dataRenderingMemo.length,
        current: 1 // Reset to first page when data changes
      }));
    }
  }, [dataRenderingMemo.length]); // Remove filteredDataCount from dependencies

  // Memoized refresh handler
  const handleRefresh = useCallback(() => {
    listImagePerItemQuery.refetch();
    listItemsQuery.refetch();
    itemsInInventoryQuery.refetch();
  }, [listImagePerItemQuery, listItemsQuery, itemsInInventoryQuery]);

  // Optimized table change handler
  const handleTableChange = useCallback((pagination, filters, sorter, extra) => {
    setPaginationState(prev => ({
      ...prev,
      current: extra.action === 'filter' ? 1 : pagination.current,
      pageSize: pagination.pageSize,
      filteredCount: extra.action === 'filter' ? 
        extra.currentDataSource.length : prev.filteredCount
    }));
  }, []);

  // Memoize table columns to prevent recreation
  const tableColumns = useMemo(() => 
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
      data: dataRenderingMemo
    }), [derivedData.groupingByDeviceType, navigate, dataRenderingMemo]
  );

  // Memoize pagination config
  const paginationConfig = useMemo(() => ({
    position: ["bottomCenter"],
    pageSizeOptions: [10, 20, 30, 50, 100],
    total: paginationState.filteredCount,
    current: paginationState.current,
    pageSize: paginationState.pageSize,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => 
      `${range[0]}-${range[1]} of ${total} items`,
  }), [paginationState]);

  // Memoize button styles to prevent object recreation
  const buttonStyle = useMemo(() => ({
    display: "flex",
    alignItems: "center",
    borderTop: "transparent",
    borderLeft: "transparent",
    borderBottom: "transparent",
    borderRadius: "8px 8px 0 0",
  }), []);

  // const containerStyle = useMemo(() => ({
  //   display: "flex",
  //   alignItems: "center",
  //   marginRight: "5px",
  //   padding: "0 0 0 0",
  // }), []);

  // Early return for loading states
  if (isLoadingComponent) {
    return (
      <div style={CenteringGrid}>
        <Loading />
      </div>
    );
  }

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
          border={"1px solid var(--gray-200, #eaecf0)"}
          borderRadius={"12px 12px 0 0"}
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          marginBottom={-1}
          paddingBottom={-1}
          item
          xs={12}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginRight: "5px",
              padding: "0 0 0 0",
            }}
          >
            <Button
              style={buttonStyle}
              onClick={handleRefresh}
            >
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                fontWeight={500}
                fontSize={"12px"}
                fontFamily={"Inter"}
                lineHeight={"28px"}
                color={"var(--blue-dark-700, #004EEB)"}
                padding={"0px"}
              >
                <Icon icon="jam:refresh" /> Refresh
              </Typography>
            </Button>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginRight: "5px",
              padding: "0 0 0 0",
            }}
          >
            <DownloadingXlslFile props={dataRenderingMemo} />
          </div>
        </Grid>
        {isLoadingComponent && <Loading />}
        {!isLoadingComponent && (
          <Table
            pagination={paginationConfig}
            style={{ width: "100%" }}
            columns={tableColumns}
            dataSource={dataRenderingMemo}
            className="table-ant-customized"
            onChange={handleTableChange}
            loading={listItemsQuery.isLoading || listImagePerItemQuery.isLoading || itemsInInventoryQuery.isLoading}
          />
        )}
      </Grid>
    </Suspense>
  );
};

export default TableDeviceCategory;
