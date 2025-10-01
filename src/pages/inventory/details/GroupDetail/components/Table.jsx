import { Icon } from "@iconify/react/dist/iconify.js";
import { Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Button, Table } from "antd";
import { groupBy } from "lodash";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import Loading from "../../../../../components/animation/Loading";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import columnsTableMain from "../../../utils/ColumnsTableMain";
import {
  dataStructuringFormat,
  dataToDisplay,
} from "../../utils/dataStructuringFormat";

const DownloadingXlslFile = lazy(() => import("../../../actions/DownloadXlsx"));

const TableItemGroup = ({
  searchItem,
  referenceData,
  isLoadingComponent,
  setResultedData,
}) => {
  const location = useLocation();
  const groupName = location.search.split("&");
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  
  // State to track filtered data count for dynamic pagination
  const [filteredDataCount, setFilteredDataCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const listItemsQuery = useQuery({
    queryKey: [
      "currentStateDevicePerGroupName",
      decodeURI(groupName[0].slice(1)),
    ],
    queryFn: () =>
      devitrakApi.post("/db_company/inventory-based-on-submitted-parameters", {
        query: "select * from item_inv where item_group = ? and company_id = ?",
        values: [decodeURI(groupName[0].slice(1)), user.sqlInfo.company_id],
      }),
    enabled: !!user.sqlInfo.company_id,
  });

  const listImagePerItemQuery = useQuery({
    queryKey: ["deviceImagePerGroupName"],
    queryFn: () =>
      devitrakApi.post("/image/images", {
        company: user.companyData.id,
        item_group: decodeURI(groupName[0].slice(1)),
      }),
    enabled: !!user.sqlInfo.company_id,
  });

  const itemsInInventoryQuery = useQuery({
    queryKey: ["deviceInInventoryPerGroup"],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
        item_group: decodeURI(groupName[0].slice(1)),
      }),
    enabled: !!user.sqlInfo.company_id,
  });

  const imageSource = listImagePerItemQuery?.data?.data?.item;
  const groupingByDeviceType = groupBy(imageSource, "item_group");
  const renderedListItems = listItemsQuery?.data?.data?.result;
  const [structuredDataRendering, setStructuredDataRendering] = useState([]);
  
  useEffect(() => {
    setStructuredDataRendering(
      dataStructuringFormat(
        renderedListItems,
        groupingByDeviceType,
        itemsInInventoryQuery
      )
    );
  }, [
    renderedListItems?.length > 0,
    groupingByDeviceType,
    itemsInInventoryQuery,
  ]);

  const calculatingValue = () => {
    let result = 0;
    for (let data of structuredDataRendering) {
      result += Number(data.cost);
    }
    return result;
  };

  const totalAvailable = () => {
    const itemList = groupBy(listItemsQuery?.data?.data.result, "warehouse");
    return itemList[1]?.length;
  };

  useEffect(() => {
    const controller = new AbortController();
    referenceData({
      totalDevices: structuredDataRendering.length,
      totalValue: calculatingValue(),
      totalAvailable: totalAvailable(),
    });
    return () => {
      controller.abort();
    };
  }, [structuredDataRendering.length, location.key]);

  const dataRenderingMemo = useMemo(() => {
    const result = dataToDisplay(structuredDataRendering, searchItem);
    setResultedData(result);
    // Initialize filtered count with the full data length
    if (filteredDataCount === 0) {
      setFilteredDataCount(result.length);
    }
    return result;
  }, [structuredDataRendering, searchItem]);

  // Handle table changes including filtering, pagination, and sorting
  const handleTableChange = (pagination, filters, sorter, extra) => {
    // Update pagination state
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
    
    // Update filtered data count when filters are applied
    if (extra.action === 'filter') {
      setFilteredDataCount(extra.currentDataSource.length);
      // Reset to first page when filtering
      setCurrentPage(1);
    }
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
              style={{
                display: "flex",
                alignItems: "center",
                borderTop: "transparent",
                borderLeft: "transparent",
                borderBottom: "transparent",
                borderRadius: "8px 8px 0 0",
              }}
              onClick={() => {
                listImagePerItemQuery.refetch();
                listItemsQuery.refetch();
                itemsInInventoryQuery.refetch();
              }}
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
            pagination={{
              position: ["bottomCenter"],
              pageSizeOptions: [10, 20, 30, 50, 100],
              total: filteredDataCount,
              current: currentPage,
              pageSize: pageSize,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            style={{ width: "100%" }}
            columns={columnsTableMain({
              groupingByDeviceType,
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
            })}
            dataSource={dataRenderingMemo}
            className="table-ant-customized"
            onChange={handleTableChange}
          />
        )}
      </Grid>
    </Suspense>
  );
};

export default TableItemGroup;
