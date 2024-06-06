import { Icon } from "@iconify/react";
import { Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Button, Divider, Table } from "antd";
import _ from "lodash";
import pkg from "prop-types";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
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
import CardLocations from "../utils/CardLocations";
const { PropTypes } = pkg;
import "../style/details.css";

const ItemTable = ({ searchItem }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.admin);
  const listItemsQuery = useQuery({
    queryKey: ["listOfItemsInStock"],
    queryFn: () =>
      devitrakApi.post("/db_item/current-inventory", {
        company_name: user.company,
      }),
    enabled: false,
    refetchOnMount: false,
  });

  const listImagePerItemQuery = useQuery({
    queryKey: ["imagePerItemList"],
    queryFn: () => devitrakApi.post("/image/images", { company: user.company }),
    enabled: false,
    refetchOnMount: false,
  });

  const itemsInInventoryQuery = useQuery({
    queryKey: ["ItemsInInventoryCheckingQuery"],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company: user.company,
      }),
    enabled: false,
    refetchOnMount: false,
  });
  const imageSource = listImagePerItemQuery?.data?.data?.item;
  const groupingByDeviceType = _.groupBy(imageSource, "item_group");
  const renderedListItems = listItemsQuery?.data?.data.result;
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

  const sortingByParameters = (props) => {
    const totalPerLocation = new Map();
    const parameter = props;
    if (itemsInInventoryQuery.data) {
      for (let data of itemsInInventoryQuery.data.data.items) {
        if (totalPerLocation.has(data[parameter])) {
          totalPerLocation.set(
            data[parameter],
            totalPerLocation.get(data[parameter]) + 1
          );
        } else {
          totalPerLocation.set(data[parameter], 1);
        }
      }
    }
    const result = new Set();
    for (let [key, value] of totalPerLocation) {
      result.add({ key, value });
    }
    return Array.from(result);
  };

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
              ...Subtitle,
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
      render: (data) => (
        <span style={cellStyle}>
          <Typography
            style={{ ...Subtitle, textOverflow: "ellipsis" }}
            textTransform={"capitalize"}
          >
            {data.warehouse === 1 ? data.location : data.event_name}
          </Typography>
        </span>
      ),
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
    {
      title: "Value",
      dataIndex: "cost",
      key: "cost",
      sorter: {
        compare: (a, b) => ("" + a.cost).localeCompare(b.cost),
      },
      render: (cost) => (
        <span style={cellStyle}>
          {" "}
          <Typography style={Subtitle} textTransform={"capitalize"}>
            ${cost}
          </Typography>
        </span>
      ),
    },
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
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const onSelectChange = (newSelectedRowKeys) => {
    if (selectedRowKeys.length > 2)
      return alert("Reached out max locations allowed.");

    if (selectedRowKeys.some((element) => element === newSelectedRowKeys)) {
      const result = selectedRowKeys.filter(
        (element) => element !== newSelectedRowKeys
      );
      return setSelectedRowKeys(result);
    }
    return setSelectedRowKeys(newSelectedRowKeys);
  };
  const optionsToRenderInDetailsHtmlTags = [
    {
      title: "Locations",
      data: sortingByParameters("location"),
      open: true,
      displayCards: selectedRowKeys.length > 0,
      routeTitle: "location",
      renderSelectedOptions: [],
      renderMoreOptions: true,
      rowSelection: {
        selectedRowKeys,
        onChange: onSelectChange,
      },
      columns: [
        {
          title: "Locations name",
          dataIndex: "key",
          key: "key",
          render: (key) => <p style={Subtitle}>{key}</p>,
        },
        {
          title: "Total device",
          dataIndex: "value",
          key: "value",
          render: (value) => <p style={Subtitle}>{value}</p>,
        },
        {
          title: "",
          dataIndex: "action",
          key: "action",
          render: (_, record) => (
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <button
                onClick={() => console.log(record)}
                style={{
                  backgroundColor: "transparent",
                  outline: "none",
                  margin: 0,
                  padding: 0,
                }}
              >
                <RightNarrowInCircle />
              </button>
            </div>
          ),
        },
      ],
    },
    {
      title: "Category",
      data: sortingByParameters("category_name"),
      open: false,
      routeTitle: "category_name",
      renderMoreOptions: false,
      columns: [
        {
          title: "Name",
          dataIndex: "name",
          key: "name",
        },
      ],
    },
    {
      title: "Groups",
      data: sortingByParameters("item_group"),
      open: false,
      routeTitle: "group",
      renderMoreOptions: false,
      columns: [
        {
          title: "Name",
          dataIndex: "name",
          key: "name",
        },
      ],
    },
    {
      title: "Brands",
      data: sortingByParameters("brand"),
      open: false,
      routeTitle: "brand",
      renderMoreOptions: false,
      columns: [
        {
          title: "Name",
          dataIndex: "name",
          key: "name",
        },
      ],
    },
  ];
  return (
    <Grid margin={"15px 0 0 0"} padding={0} container>
      {optionsToRenderInDetailsHtmlTags.map((item) => {
        return (
          <Grid
            key={item.title}
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
              open={item.open}
            >
              <summary>
                <p
                  style={{
                    ...TextFontsize18LineHeight28,
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  {item.title}
                </p>
              </summary>
              <Divider />
              <Grid container>
                {item.data.map((opt) => {
                  return (
                    <Grid key={opt} item xs={12} sm={12} md={4} lg={4}>
                      {" "}
                      <Link
                        to={`/inventory/${String(
                          item.routeTitle
                        ).toLowerCase()}?${decodeURI(opt.key)}`}
                      >
                        <CardLocations
                          title={opt.key}
                          props={`${opt.value} total devices`}
                          optional={null}
                        />
                      </Link>
                    </Grid>
                  );
                })}
              </Grid>
              {item.renderMoreOptions && (
                <Table
                  pagination={{
                    position: ["bottomCenter"],
                    pageSizeOptions: [10, 20, 30, 50, 100],
                    total: item.data.length,
                    defaultPageSize: 10,
                    defaultCurrent: 1,
                  }}
                  style={{ width: "100%" }}
                  rowSelection={item.rowSelection}
                  columns={item.columns}
                  dataSource={item.data}
                  className="table-ant-customized"
                />
              )}
            </details>
            <Divider />
          </Grid>
        );
      })}
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
