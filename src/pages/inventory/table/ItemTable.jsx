import { Icon } from "@iconify/react";
import { Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Button, Divider, Table } from "antd";
import _ from "lodash";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import {
  GeneralDeviceIcon,
  RightNarrowInCircle,
} from "../../../components/icons/Icons";
import BannerMsg from "../../../components/utils/BannerMsg";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { Subtitle } from "../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import "../../../styles/global/ant-table.css";
import DownloadingXlslFile from "../actions/DownloadXlsx";
import "../style/details.css";
import RenderingFilters from "./extras/RenderingFilters";
import { PropTypes } from "prop-types";
const ItemTable = ({ searchItem }) => {
  const navigate = useNavigate();
  // const dispatch = useDispatch();
  const { user } = useSelector((state) => state.admin);
  const listItemsQuery = useQuery({
    queryKey: ["listOfItemsInStock"],
    queryFn: () =>
      devitrakApi.post("/db_item/current-inventory", {
        company_id: user.sqlInfo.company_id,
      }),
    refetchOnMount: false,
  });

  const listImagePerItemQuery = useQuery({
    queryKey: ["imagePerItemList"],
    queryFn: () => devitrakApi.post("/image/images", { company: user.company }),
    refetchOnMount: false,
  });

  const itemsInInventoryQuery = useQuery({
    queryKey: ["ItemsInInventoryCheckingQuery"],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
      }),
    refetchOnMount: false,
  });
  const imageSource = listImagePerItemQuery?.data?.data?.item;
  const groupingByDeviceType = _.groupBy(imageSource, "item_group");
  const renderedListItems = listItemsQuery?.data?.data?.result;
  const dataStructuringFormat = () => {
    const resultFormatToDisplay = new Set();
    const groupingBySerialNumber = _.groupBy(
      itemsInInventoryQuery?.data?.data?.items,
      "serial_number"
    );
    if (renderedListItems?.length > 0) {
      for (let data of renderedListItems) {
        if (groupingBySerialNumber[data.serial_number]) {
          resultFormatToDisplay.add({
            key: `${data.item_id}-${data.event_name}`,
            ...data,
            brand: groupingBySerialNumber[data.serial_number].at(-1).brand,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.company]);

  const dataToDisplay = () => {
    if (!searchItem || searchItem === "") {
      if (dataStructuringFormat().length > 0) {
        return dataStructuringFormat();
      }
      return [];
    } else {
      return dataStructuringFormat()?.filter((item) =>
        JSON.stringify(item)
          .toLowerCase()
          .includes(String(searchItem).toLowerCase())
      );
    }
  };

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
  const columns = [
    {
      title: "Device category",
      dataIndex: "data",
      key: "data",
      sorter: {
        compare: (a, b) =>
          ("" + a.data.item_group).localeCompare(b.data.item_group),
      },
      render: (record) => (
        <span style={cellStyle}>
          <Avatar
            size={"80px"}
            style={{ borderRadius: "8px", background: "transparent" }}
          >
            {groupingByDeviceType[record.item_group] ? (
              <img
                src={groupingByDeviceType[record.item_group][0].source}
                alt={`${record.item_group}-${record.serial_number}`}
                style={{ width: "100%", height: "auto" }}
              />
            ) : (
              <Avatar size={"80px"}>
                <GeneralDeviceIcon />
              </Avatar>
            )}
          </Avatar>
          {/*  */}
          &nbsp;{" "}
          <Typography
            style={{ ...Subtitle, cellStyle }}
            textTransform={"capitalize"}
          >
            {record.category_name}
          </Typography>
        </span>
      ),
    },
    {
      title: "Device name",
      dataIndex: "item_group",
      key: "item_group",
      sorter: {
        compare: (a, b) => ("" + a.item_group).localeCompare(b.item_group),
      },
      render: (item_group) => (
        <span style={cellStyle}>
          {" "}
          <Typography style={Subtitle} textTransform={"capitalize"}>
            {item_group}
          </Typography>
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "warehouse",
      key: "warehouse",
      sorter: {
        compare: (a, b) => ("" + a.warehouse).localeCompare(b.warehouse),
      },
      render: (warehouse) => (
        <span
          style={{
            ...cellStyle,
            borderRadius: "16px",
            justifyContent: "center",
            display: "flex",
            padding: "2px 8px",
            alignItems: "center",
            background: `${
              warehouse === 0
                ? "var(--blue-50, #EFF8FF)"
                : "var(--success-50, #ECFDF3)"
            }`,
            width: "fit-content",
          }}
        >
          <p
            style={{
              color: `${
                warehouse === 0
                  ? "var(--blue-700, #175CD3)"
                  : "var(--success-700, #027A48)"
              }`,
              textTransform: "capitalize",
            }}
          >
            <Icon
              icon="tabler:point-filled"
              rotate={3}
              color={`${warehouse === 0 ? "#2E90FA" : "#12B76A"}`}
            />
            {warehouse === 0 ? "In Use" : "In Stock"}
          </p>
        </span>
      ),
    },
    {
      title: "Ownership",
      dataIndex: "ownership",
      key: "ownership",
      sorter: {
        compare: (a, b) => ("" + a.ownership).localeCompare(b.ownership),
      },
      render: (ownership) => (
        <span
          style={{
            ...cellStyle,
            borderRadius: "16px",
            justifyContent: "center",
            display: "flex",
            padding: "2px 8px",
            alignItems: "center",
            background: `${
              ownership === "Permanent"
                ? "var(--blue-50, #EFF8FF)"
                : "var(--success-50, #ECFDF3)"
            }`,
            width: "fit-content",
          }}
        >
          <Typography
            color={`${
              ownership === "Permanent"
                ? "var(--blue-700, #175CD3)"
                : "var(--success-700, #027A48)"
            }`}
            style={Subtitle}
            textTransform={"capitalize"}
          >
            <Icon
              icon="tabler:point-filled"
              rotate={3}
              color={`${ownership === "Permanent" ? "#2E90FA" : "#12B76A"}`}
            />
            {dictionary[ownership]}
          </Typography>
        </span>
      ),
    },
    {
      title: "Taxable address",
      dataIndex: "data",
      key: "data",
      sorter: {
        compare: (a, b) =>
          ("" + a.data.main_warehouse).localeCompare(b.data.main_warehouse),
      },
      render: (data) => (
        <span style={cellStyle}>
          {" "}
          <Typography style={Subtitle} textTransform={"capitalize"}>
            {data.main_warehouse}
          </Typography>
        </span>
      ),
    },
    {
      title: "Location",
      dataIndex: "data",
      key: "data",
      sorter: {
        compare: (a, b) =>
          ("" + a.data.location).localeCompare(b.data.location),
      },
      render: (data) => {
        let result = data.event_name;
        if (String(result).toLowerCase().includes("leased equipment")) {
          const splittingName = String(result).split(" / ");
          result = splittingName.slice(1).toLocaleString().replaceAll(",", " ");
        } else if (String(result).toLowerCase().split(" / ").length === 3) {
          const splittingName = String(result).split(" / ");
          result = splittingName.slice(0, 2).flat().toLocaleString().replaceAll(",", " ");
        } 
        return (
          <span style={cellStyle}>
            <Typography
              style={{ ...Subtitle, textOverflow: "ellipsis" }}
              textTransform={"capitalize"}
            >
              {data.warehouse > 0 ? data.location : result}
            </Typography>
          </span>
        );
      },
    },
    {
      title: "Main Serial Number",
      dataIndex: "serial_number",
      key: "serial_number",
      sorter: (a, b) => a.serial_number - b.serial_number,
      render: (serial_number) => (
        <span style={cellStyle}>
          {" "}
          <Typography style={Subtitle} textTransform={"capitalize"}>
            {serial_number}
          </Typography>
        </span>
      ),
    },
    // {
    //   title: "Value",
    //   dataIndex: "cost",
    //   key: "cost",
    //   sorter: {
    //     compare: (a, b) => ("" + a.cost).localeCompare(b.cost),
    //   },
    //   render: (cost) => (
    //     <span style={cellStyle}>
    //       {" "}
    //       <Typography style={Subtitle} textTransform={"capitalize"}>
    //         ${cost}
    //       </Typography>
    //     </span>
    //   ),
    // },
    {
      title: "",
      dataIndex: "data",
      key: "data",
      render: (record) => (
        <button
          style={{
            ...cellStyle,
            backgroundColor: "transparent",
            border: "none",
          }}
          onClick={() => navigate(`/inventory/item?id=${record.item_id}`)}
        >
          <RightNarrowInCircle />
        </button>
      ),
    },
  ];

  return (
    <Grid margin={"15px 0 0 0"} padding={0} container>
      <RenderingFilters
        dataToDisplay={dataToDisplay}
        searchItem={searchItem}
        user={user}
      />
      <Grid
        display={"flex"}
        flexDirection={"column"}
        justifyContent={"flex-start"}
        alignItems={"center"}
        margin={"20px 0 0 0"}
        item
        xs={12}
      >
        <details
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          open
        >
          <summary open>
            <p
              style={{
                ...TextFontsize18LineHeight28,
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              All devices
            </p>
          </summary>
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
                  <p
                    style={{
                      textTransform: "none",
                      textAlign: "left",
                      fontWeight: 500,
                      fontSize: "12px",
                      fontFamily: "Inter",
                      lineHeight: "28px",
                      color: "var(--blue-dark-700, #004EEB)",
                      padding: "0px",
                    }}
                  >
                    <Icon icon="jam:refresh" /> Refresh
                  </p>
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
              columns={columns}
              dataSource={dataToDisplay()}
              className="table-ant-customized"
            />
          </Grid>
        </details>
      </Grid>
      <Divider />
      {dataToDisplay().length === 0 && (!searchItem || searchItem === "") && (
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
  );
};

export default ItemTable;

ItemTable.propTypes = {
  searchItem: PropTypes.string,
};
