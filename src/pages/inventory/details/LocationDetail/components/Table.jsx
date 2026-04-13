import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { groupBy, uniqueId } from "lodash";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import TableHeader from "../../../../../components/UX/TableHeader";
import BaseTable from "../../../../../components/UX/tables/BaseTable";
import Loading from "../../../../../components/animation/Loading";
import RefreshButton from "../../../../../components/utils/UX/RefreshButton";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import columnsTableMain from "../../../utils/ColumnsTableMain";

const DownloadingXlslFile = lazy(() => import("../../../actions/DownloadXlsx"));

const TableDeviceLocation = ({ searchItem, referenceData }) => {
  const location = useLocation();
  const locationName = location.search.split("&");
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  
  // State to track filtered data count for dynamic pagination
  // eslint-disable-next-line no-unused-vars
  const [filteredDataCount, setFilteredDataCount] = useState(0);
  
  const urlQuery =
    location.state === null
      ? `/db_company/inventory-based-on-location-and-sublocation`
      : `/db_company/inventory-based-on-location-and-sublocation?sub_location=${location.state.sub_location}`;
      
  const listItemsQuery = useQuery({
    queryKey: ["currentStateDevicePerLocation"],
    queryFn: () =>
      devitrakApi.post("/db_company/inventory-based-on-submitted-parameters", {
        query: "select * from item_inv where location = ? and company_id = ?",
        values: [decodeURI(locationName[0].slice(1)), user.sqlInfo.company_id],
      }),
    refetchOnMount: false,
    enabled: !!user.sqlInfo.company_id,
  });

  const listImagePerItemQuery = useQuery({
    queryKey: ["deviceImagePerLocation"],
    queryFn: () =>
      devitrakApi.post("/image/images", { company: user.companyData.id }),
    refetchOnMount: false,
  });

  const itemsInInventoryQuery = useQuery({
    queryKey: ["deviceInInventoryPerLocation"],
    queryFn: () =>
      devitrakApi.post(urlQuery, {
        company_id: user.sqlInfo.company_id,
        location: String(decodeURI(locationName[0].slice(1))).toLowerCase(),
      }),
    refetchOnMount: false,
  });
  
  const imageSource = listImagePerItemQuery?.data?.data?.item;
  const groupingByDeviceType = groupBy(imageSource, "item_group");
  const renderedListItems = listItemsQuery?.data?.data.result;
  
  const structuredData = useMemo(() => {
    const resultFormatToDisplay = new Set();
    const groupingBySerialNumber = groupBy(
      itemsInInventoryQuery?.data?.data?.items,
      "serial_number"
    );
    if (renderedListItems?.length > 0) {
      for (let data of renderedListItems) {
        if (groupingBySerialNumber[data.serial_number]) {
          resultFormatToDisplay.add({
            key: `${data.item_id}-${uniqueId()}`,
            ...data,
            data: {
              ...data,
              location:
                groupingBySerialNumber[data.serial_number]?.at(-1).location,
              ...groupingBySerialNumber[data.serial_number]?.at(-1),
            },
            location:
              groupingBySerialNumber[data.serial_number]?.at(-1).location,
            image_url:
              groupingBySerialNumber[data.serial_number]?.at(-1).image_url ??
              groupingByDeviceType[data.item_group]?.at(-1).image_url,
          });
        }
      }
      return Array.from(resultFormatToDisplay);
    }
    return [];
  }, [renderedListItems, itemsInInventoryQuery.data, groupingByDeviceType]);
  
  useEffect(() => {
    const controller = new AbortController();
    listItemsQuery.refetch();
    listImagePerItemQuery.refetch();
    itemsInInventoryQuery.refetch();

    return () => {
      controller.abort();
    };
  }, [user.company, location.key]);

  const dataToDisplay = useMemo(() => {
    if (!searchItem || searchItem === "") {
      return structuredData;
    }
    const filteredData = structuredData?.filter((item) =>
      JSON.stringify(item)
        .toLowerCase()
        .includes(String(searchItem).toLowerCase())
    );
    return filteredData;
  }, [structuredData, searchItem]);

  useEffect(() => {
    if (dataToDisplay) {
      setFilteredDataCount(dataToDisplay.length);
    }
  }, [dataToDisplay]);

  const totalValue = useMemo(() => {
    let result = 0;
    for (let data of structuredData) {
      result += Number(data.cost);
    }
    return result;
  }, [structuredData]);
  
  const availabilityInfo = useMemo(() => {
    const items = itemsInInventoryQuery?.data?.data?.items;
    if (!items) {
      return { totalUnits: 0, totalAvailable: 0 };
    }
    const itemList = groupBy(items, "warehouse");
    return {
      totalUnits: items.length,
      totalAvailable: itemList[1]?.length || 0,
    };
  }, [itemsInInventoryQuery.data]);
  
  useEffect(() => {
    referenceData({
      totalDevices: structuredData.length,
      totalValue: totalValue,
      totalAvailable: availabilityInfo.totalAvailable,
    });
  }, [structuredData, totalValue, availabilityInfo, referenceData, location.key]);

  const dictionary = {
    Permanent: "Owned",
    Rent: "Leased",
    Sale: "For sale",
  };
  
  const cellStyle = {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
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
        <TableHeader leftCta={<RefreshButton propsFn={() => {
          listImagePerItemQuery.refetch();
          listItemsQuery.refetch();
          itemsInInventoryQuery.refetch();
        }} />} rightCta={<DownloadingXlslFile props={dataToDisplay} />} />
        <BaseTable
          enablePagination={true}
          pageSize={10}
          style={{ width: "100%" }}
          columns={columnsTableMain({
            cellStyle,
            dictionary,
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
            data: dataToDisplay
          })}
          dataSource={dataToDisplay}
          className="table-ant-customized"
          // onChange={handleTableChange}
        />
      </Grid>
    </Suspense>
  );
};

export default TableDeviceLocation;
