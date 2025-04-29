import { Icon } from "@iconify/react/dist/iconify.js";
import { Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Button, Table } from "antd";
import { groupBy } from "lodash";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import DownloadingXlslFile from "../../../actions/DownloadXlsx";
import columnsTableMain from "../../../utils/ColumnsTableMain";
const TableDeviceLocation = ({ searchItem, referenceData }) => {
  const location = useLocation();
  const ownership = location.search.split("&");
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const listItemsQuery = useQuery({
    queryKey: ["currentStateDevicePerLocation"],
    queryFn: () =>
      devitrakApi.post("/db_item/current-inventory", {
        company_id: user.sqlInfo.company_id,
        ownership: decodeURI(String(ownership[0]).toLowerCase().slice(1)),
      }),
    refetchOnMount: false,
  });

  const listImagePerItemQuery = useQuery({
    queryKey: ["deviceImagePerLocation"],
    queryFn: () => devitrakApi.post("/image/images", { company: user.companyData.id }),
    refetchOnMount: false,
  });

  const itemsInInventoryQuery = useQuery({
    queryKey: ["deviceInInventoryPerBrand"],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
        ownership: decodeURI(String(ownership[0]).toLowerCase().slice(1)),
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
            key: `${data.item_id}-${data.event_name}`,
            ...data,
            data: {
              ...data,
              location:
                groupingBySerialNumber[data.serial_number].at(-1).location,
              ...groupingBySerialNumber[data.serial_number].at(-1),
            },
            location:
              groupingBySerialNumber[data.serial_number].at(-1).location,
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
  }, [user.company]);

  const dataToDisplay = () => {
    if (!searchItem || searchItem === "") {
      // &&(searchParameter === "undefined" || searchParameter === "")
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
    const itemList = groupBy(listItemsQuery?.data?.data.result, "warehouse");
    return itemList[1]?.length;
  };
  useEffect(() => {
    const controller = new AbortController();
    referenceData({
      totalDevices: dataStructuringFormat().length,
      totalValue: calculatingValue(),
      totalAvailable: totalAvailable(),
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
        })}
        dataSource={dataToDisplay()}
        className="table-ant-customized"
      />
    </Grid>
  );
};

export default TableDeviceLocation;
