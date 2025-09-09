import { Icon } from "@iconify/react/dist/iconify.js";
import { Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Button, Table } from "antd";
import { groupBy } from "lodash";
import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import DownloadingXlslFile from "../../../actions/DownloadXlsx";
import columnsTableMain from "../../../utils/ColumnsTableMain";
import {
  dataStructuringFormat,
  dataToDisplay,
} from "../../utils/dataStructuringFormat";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import Loading from "../../../../../components/animation/Loading";

const TableItemOwnership = ({
  searchItem,
  referenceData,
  isLoadingComponent,
}) => {
  const location = useLocation();
  const ownership = location.search.split("&");
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  
  const listItemsQuery = useQuery({
    queryKey: [
      "currentStateDevicePerGroupName",
      decodeURI(ownership[0].slice(1)),
    ],
    queryFn: () =>
      devitrakApi.post("/db_company/inventory-based-on-submitted-parameters", {
        query: "select * from item_inv where ownership = ? and company_id = ?",
        values: [decodeURI(ownership[0].slice(1)), user.sqlInfo.company_id],
      }),
    enabled: !!user.sqlInfo.company_id,
  });

  const listImagePerItemQuery = useQuery({
    queryKey: ["deviceImagePerLocation"],
    queryFn: () =>
      devitrakApi.post("/image/images", { company: user.companyData.id }),
    enabled: !!user.sqlInfo.company_id,
  });

  const itemsInInventoryQuery = useQuery({
    queryKey: ["deviceInInventoryPerBrand"],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
        ownership: decodeURI(String(ownership[0]).toLowerCase().slice(1)),
      }),
    enabled: !!user.sqlInfo.company_id,
  });

  // Memoize expensive calculations
  const imageSource = listImagePerItemQuery?.data?.data?.item;
  const groupingByDeviceType = useMemo(() => {
    return groupBy(imageSource, "item_group");
  }, [imageSource]);

  const renderedListItems = listItemsQuery?.data?.data?.result;
  const [structuredDataRendering, setStructuredDataRendering] = useState([]);

  // Fix: Memoize the structured data to prevent unnecessary re-calculations
  const memoizedStructuredData = useMemo(() => {
    return dataStructuringFormat(
      renderedListItems,
      groupingByDeviceType,
      itemsInInventoryQuery
    );
  }, [renderedListItems, groupingByDeviceType, itemsInInventoryQuery?.data]);

  // Fix: Update state only when memoized data actually changes
  useEffect(() => {
    setStructuredDataRendering(memoizedStructuredData);
  }, [memoizedStructuredData]);

  // Memoize expensive calculations
  const calculatingValue = useMemo(() => {
    let result = 0;
    for (let data of structuredDataRendering) {
      result += Number(data.cost);
    }
    return result;
  }, [structuredDataRendering]);

  const totalAvailable = useMemo(() => {
    const itemList = groupBy(listItemsQuery?.data?.data.result, "warehouse");
    return itemList[1]?.length;
  }, [listItemsQuery?.data?.data.result]);

  // Fix: Use useCallback to prevent referenceData from changing on every render
  const memoizedReferenceData = useCallback(() => {
    return {
      totalDevices: structuredDataRendering.length,
      totalValue: calculatingValue,
      totalAvailable: totalAvailable,
    };
  }, [structuredDataRendering.length, calculatingValue, totalAvailable]);

  // Fix: Only call referenceData when the actual values change
  useEffect(() => {
    const data = memoizedReferenceData();
    referenceData(data);
  }, [memoizedReferenceData, referenceData]);

  const dataRenderingMemo = useMemo(() => {
    return dataToDisplay(structuredDataRendering, searchItem);
  }, [structuredDataRendering, searchItem]);

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
              total: dataRenderingMemo.length,
              defaultPageSize: 10,
              defaultCurrent: 1,
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
          />
        )}
      </Grid>
    </Suspense>
  );
};

export default TableItemOwnership;
