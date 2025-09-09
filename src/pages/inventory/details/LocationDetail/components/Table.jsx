import { Icon } from "@iconify/react/dist/iconify.js";
import { Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Button, Table } from "antd";
import { groupBy, uniqueId } from "lodash";
import { lazy, Suspense, useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import Loading from "../../../../../components/animation/Loading";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import columnsTableMain from "../../../utils/ColumnsTableMain";
// import DownloadingXlslFile from "../../../actions/DownloadXlsx";
const DownloadingXlslFile = lazy(() => import("../../../actions/DownloadXlsx"));
const TableDeviceLocation = ({ searchItem, referenceData }) => {
  const location = useLocation();
  const locationName = location.search.split("&");
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
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
  const dataStructuringFormat = () => {
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
  };
  useEffect(() => {
    const controller = new AbortController();
    dataStructuringFormat();
    listItemsQuery.refetch();
    listImagePerItemQuery.refetch();
    itemsInInventoryQuery.refetch();

    return () => {
      controller.abort();
    };
  }, [user.company, location.key]);

  const dataToDisplay = () => {
    if (!searchItem || searchItem === "") {
      if (dataStructuringFormat().length > 0) {
        return dataStructuringFormat();
      }
      return [];
    } else if (String(searchItem).length > 0) {
      return dataStructuringFormat()?.filter((item) =>
        JSON.stringify(item)
          .toLowerCase()
          .includes(String(searchItem).toLowerCase())
      );
    }
  };

  const calculatingValue = () => {
    let result = 0;
    for (let data of dataStructuringFormat()) {
      result += Number(data.cost);
    }
    return result;
  };
  const totalAvailable = () => {
    const itemList = groupBy(
      itemsInInventoryQuery?.data?.data?.items,
      "warehouse"
    );
    return {
      totalUnits: itemsInInventoryQuery?.data?.data?.items.length ?? 0,
      totalAvailable: itemList[1]?.length,
    };
  };
  useEffect(() => {
    const controller = new AbortController();
    referenceData({
      totalDevices: dataStructuringFormat().length,
      totalValue: calculatingValue(),
      totalAvailable: totalAvailable().totalAvailable,
    });

    return () => {
      controller.abort();
    };
  }, [
    itemsInInventoryQuery.data,
    dataStructuringFormat().length,
    location.key,
  ]);

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
            <DownloadingXlslFile props={dataToDisplay()} />
          </div>
        </Grid>
        <Table
          pagination={{
            position: ["bottomCenter"],
            pageSizeOptions: [10, 20, 30, 50, 100],
            total: dataToDisplay().length,
            defaultPageSize: 10,
            defaultCurrent: 1,
          }}
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
            data: dataToDisplay()
          })}
          dataSource={dataToDisplay()}
          className="table-ant-customized"
        />
      </Grid>
    </Suspense>
  );
};

export default TableDeviceLocation;
