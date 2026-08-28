import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { groupBy } from "lodash";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import TableHeader from "../../../../../components/UX/TableHeader";
import BaseTable from "../../../../../components/UX/tables/BaseTable";
import DevitrakLoading from "../../../../../components/animation/DevitrakLoading";
import RefreshButton from "../../../../../components/utils/UX/RefreshButton";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import columnsTableMain from "../../../utils/ColumnsTableMain";
import { buildLocationRows, filterLocationRows } from "../utils/locationRows";

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
      devitrakApi.post("/db_company/inventory-query", {
        queryName: "inventory.byAttribute",
        params: {
          attribute: "location",
          value: decodeURI(locationName[0].slice(1)),
        },
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
  
  /* Memoized, because `structuredData` is memoized on it. It used to be a bare
     `groupBy(...)` recomputed inline, so the rows below were rebuilt on every
     render — see utils/locationRows for what that did to the table. */
  const groupingByDeviceType = useMemo(
    () => groupBy(listImagePerItemQuery?.data?.data?.item, "item_group"),
    [listImagePerItemQuery?.data?.data?.item]
  );
  const renderedListItems = listItemsQuery?.data?.data?.result;
  const locatedItems = itemsInInventoryQuery?.data?.data?.items;

  const structuredData = useMemo(
    () =>
      buildLocationRows({
        items: renderedListItems,
        inventoryItems: locatedItems,
        imagesByGroup: groupingByDeviceType,
      }),
    [renderedListItems, locatedItems, groupingByDeviceType]
  );
  
  useEffect(() => {
    const controller = new AbortController();
    listItemsQuery.refetch();
    listImagePerItemQuery.refetch();
    itemsInInventoryQuery.refetch();

    return () => {
      controller.abort();
    };
  }, [user.company, location.key]);

  const dataToDisplay = useMemo(
    () => filterLocationRows(structuredData, searchItem),
    [structuredData, searchItem]
  );

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
  
  /* Depends on the three numbers being reported, not on the identity of the
     objects holding them. The parent's setter stores whatever it is handed, so
     an effect that re-fired on identity handed it a new object on every render
     and the parent re-rendered — which rebuilt these rows, which re-fired the
     effect. */
  const { totalAvailable } = availabilityInfo;
  useEffect(() => {
    referenceData({
      totalDevices: structuredData.length,
      totalValue,
      totalAvailable,
    });
  }, [structuredData.length, totalValue, totalAvailable, referenceData]);

  const dictionary = {
    Permanent: "Permanent",
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
          <DevitrakLoading />
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
        />
      </Grid>
    </Suspense>
  );
};

export default TableDeviceLocation;
