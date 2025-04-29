/* eslint-disable no-unused-vars */
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import "../../../styles/global/ant-table.css";
import "../style/details.css";
import { Avatar, Divider, Table } from "antd";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { devitrakApi } from "../../../api/devitrakApi";
import { dictionary } from "../utils/dicSelectedOptions";
import { GeneralDeviceIcon } from "../../../components/icons/GeneralDeviceIcon";
import { Grid, Typography } from "@mui/material";
import { groupBy } from "lodash";
import { Icon } from "@iconify/react";
import { PropTypes } from "prop-types";
import { RightNarrowInCircle } from "../../../components/icons/RightNarrowInCircle";
import { Subtitle } from "../../../styles/global/Subtitle";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import Loading from "../../../components/animation/Loading";
import RefreshButton from "../../../components/utils/UX/RefreshButton";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
const BannerMsg = lazy(() => import("../../../components/utils/BannerMsg"));
const DownloadingXlslFile = lazy(() => import("../actions/DownloadXlsx"));
const RenderingFilters = lazy(() => import("./extras/RenderingFilters"));

const ItemTable = ({
  searchItem,
  date,
  loadingState,
  reference,
  openAdvanceSearchModal,
  setOpenAdvanceSearchModal,
  setDataFilterOptions,
  chosen,
  downloadDataReport,
}) => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.admin);
  // const [chosen, setChosen] = useState({ category: null, value: null });
  const [chosenConditionState, setChosenConditionState] = useState(0);
  const [searchDateResult, setSearchDateResult] = useState([]);
  const listItemsQuery = useQuery({
    queryKey: ["listOfItemsInStock"],
    queryFn: () =>
      devitrakApi.get(
        `/db_item/check-inventory?company_id=${user.sqlInfo.company_id}`
      ),
    enabled: !!user.sqlInfo.company_id,
  });

  const listImagePerItemQuery = useQuery({
    queryKey: ["imagePerItemList"],
    queryFn: () =>
      devitrakApi.post("/image/images", { company: user.companyData.id }),
    enabled: !!user.companyData.id,
  });

  const itemsInInventoryQuery = useQuery({
    queryKey: ["ItemsInInventoryCheckingQuery"],
    queryFn: () =>
      devitrakApi.get(
        `/db_item/check-item?company_id=${user.sqlInfo.company_id}`
      ),
    enabled: !!user.sqlInfo.company_id,
  });

  const imageSource = listImagePerItemQuery?.data?.data?.item;
  const groupingByDeviceType = groupBy(imageSource, "item_group");
  const renderedListItems = listItemsQuery?.data?.data?.result;

  const getDataStructuringFormat = useCallback(
    (props) => {
      const resultFormatToDisplay = new Set();
      const groupingBySerialNumber = groupBy(
        itemsInInventoryQuery?.data?.data?.items,
        "serial_number"
      );
      if (props?.length > 0) {
        for (let data of props) {
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
              image_url:
                groupingBySerialNumber[data.serial_number].at(-1).image_url ??
                null,
            });
          }
        }
      }
      return Array.from(resultFormatToDisplay);
    },
    [renderedListItems, itemsInInventoryQuery]
  );

  useEffect(() => {
    getDataStructuringFormat(renderedListItems);
    loadingState(false); // ✅ State update happens inside useEffect, not render
  }, [getDataStructuringFormat, loadingState]);

  const filterOptionsBasedOnProps = (props) => {
    const options = new Set();
    const sortingByProps = groupBy(
      getDataStructuringFormat(renderedListItems),
      props
    );
    for (let [key, _] of Object.entries(sortingByProps)) {
      options.add(key);
    }
    return Array.from(options);
  };

  const filterByProps = () => {
    const dicSelectedOptions = {
      0: "brand",
      1: "item_group",
      2: "serial_number",
      3: "location",
      4: "ownership",
      5: "status",
    };
    const sortingByProps = groupBy(
      getDataStructuringFormat(renderedListItems),
      dicSelectedOptions[chosen.category]
    );
    return sortingByProps[chosen.value];
  };

  const searchingData = () => {
    return getDataStructuringFormat(renderedListItems)?.filter((item) =>
      JSON.stringify(item)
        .toLowerCase()
        .includes(String(searchItem).toLowerCase())
    );
  };
  useEffect(() => {
    if (searchItem && searchItem !== "") {
      setSearchDateResult([]);
      setChosenConditionState(1);
    }
    if (chosen.value !== null) {
      setSearchDateResult([]);
      setChosenConditionState(2);
    }
    if (date !== null) {
      setChosenConditionState(3);
    }
    if (
      chosen.value === null &&
      date === null &&
      (!searchItem || searchItem.length === 0)
    ) {
      setSearchDateResult([]);
      setChosenConditionState(0);
    }
  }, [searchItem, chosen.value, date, loadingState]);

  const querySearchingDataByDate = async () => {
    const date1Format = `${new Date(date).getTime()}`;
    const date2Format = `${new Date(date).getFullYear()}-${
      new Date(date).getMonth() + 1
    }-${new Date(date).getDate()}`;
    const responseQuery = await devitrakApi.get(
      `/event/event-inventory-based-on-period?company_id=${user.companyData.id}&date=${date1Format}&date2=${date2Format}&company_sql_id=${user.sqlInfo.company_id}`
    );
    setSearchDateResult(responseQuery.data.events);
    return responseQuery?.data?.events;
  };

  useEffect(() => {
    if (date) {
      querySearchingDataByDate();
    }
  }, [date]); // ✅ This will ensure the query runs when the date is updated

  const filterDataByDate = useMemo(() => {
    return getDataStructuringFormat(searchDateResult);
  }, [reference]);

  const options = {
    0: getDataStructuringFormat(renderedListItems),
    1: searchItem && searchingData(),
    2: chosen.value !== null && filterByProps(),
    3: date !== null && filterDataByDate,
  };

  const dataToDisplay = useCallback(() => {
    if (chosenConditionState === 3) {
      return getDataStructuringFormat(searchDateResult);
    }
    return options[chosenConditionState] || [];
  }, [chosenConditionState, searchDateResult, renderedListItems]);

  const filterOptions = {
    0: filterOptionsBasedOnProps("brand"),
    1: filterOptionsBasedOnProps("item_group"),
    2: filterOptionsBasedOnProps("serial_number"),
    3: filterOptionsBasedOnProps("location"),
    4: filterOptionsBasedOnProps("ownership"),
    5: filterOptionsBasedOnProps("status"),
  };

  useEffect(() => {
    const controller = new AbortController();
    setDataFilterOptions(filterOptions);
    downloadDataReport(dataToDisplay());
    return () => {
      controller.abort();
    };
  }, [
    chosen,
    listItemsQuery.data,
    listImagePerItemQuery.data,
    itemsInInventoryQuery.data,
  ]);

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
      responsive: ["lg"],
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
                src={
                  record.image_url ??
                  groupingByDeviceType[record.item_group][0].source
                }
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
      render: (warehouse, record) => {
        if (record.data.enableAssignFeature === 1) {
          return (
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
          );
        } else {
          return (
            <span
              style={{
                ...cellStyle,
                borderRadius: "16px",
                justifyContent: "center",
                display: "flex",
                padding: "2px 8px",
                alignItems: "center",
                background: `#F9F5FF`,
                width: "fit-content",
              }}
            >
              <p
                style={{
                  color: "#6941C6",
                  textTransform: "capitalize",
                }}
              >
                <Icon icon="tabler:point-filled" rotate={3} color={`#6941C6`} />
                Disabled
              </p>
            </span>
          );
        }
      },
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
        } else if (String(result).toLowerCase().split(" / ")?.length === 3) {
          const splittingName = String(result).split(" / ");
          result = splittingName[1];
          // .slice(1, 2)
          // .flat()
          // .toLocaleString()
          // .replaceAll(",", " ");
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
    {
      title: "",
      dataIndex: "data",
      key: "data",
      responsive: ["lg"],
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

  const refreshFn = () => {
    listImagePerItemQuery.refetch();
    listItemsQuery.refetch();
    return itemsInInventoryQuery.refetch();
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
        <Grid item xs={12} sm={12} md={12} lg={12}>
          <RenderingFilters
            dataToDisplay={dataToDisplay}
            searchItem={searchItem}
            user={user}
            openAdvanceSearchModal={openAdvanceSearchModal}
            setOpenAdvanceSearchModal={setOpenAdvanceSearchModal}
          />
        </Grid>
        <Grid
          flexDirection={"column"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          margin={"20px 0 0 0"}
          sx={{
            display: { xs: "none", sm: "none", md: "flex", lg: "flex" },
          }}

          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <div //details
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            open={true}
          >
            <div //summary
              style={{
                width: "100%",
              }}
              open
            >
              <div
                style={{
                  ...CenteringGrid,
                  justifyContent: "space-between",
                }}
              >
                <p
                  style={{
                    ...TextFontsize18LineHeight28,
                    width: "60%",
                    textAlign: "left",
                    cursor: "pointer",
                    textWrap: "balance",
                  }}
                >
                  All devices{" "}
                  <span
                    style={{
                      ...Subtitle,
                      width: "100%",
                      textAlign: "left",
                    }}
                  >
                    | Total <strong>{dataToDisplay()?.length}</strong> units
                  </span>{" "}
                  &nbsp;{" "}
                </p>
              </div>
            </div>
            <Divider />
            <Grid
              container
            >
              <Grid
                border={"1px solid var(--gray-200, #eaecf0)"}
                borderRadius={"12px 12px 0 0"}
                display={"flex"}
                justifyContent={"space-between"}
                alignItems={"center"}
                marginBottom={-1}
                paddingBottom={-1}
                item
                md={12}
                lg={12}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginRight: "5px",
                    padding: "0 0 0 0",
                  }}
                >
                  <RefreshButton propsFn={refreshFn()} />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    // marginRight: "5px",
                    padding: "0 0 0 0",
                  }}
                >
                  <DownloadingXlslFile props={dataToDisplay()} />
                </div>{" "}
              </Grid>

              <Table
                pagination={{
                  position: ["bottomCenter"],
                  pageSizeOptions: [10, 20, 30, 50, 100],
                  total: dataToDisplay()?.length,
                  defaultPageSize: 10,
                  defaultCurrent: 1,
                }}
                style={{ width: "100%" }}
                columns={columns}
                dataSource={dataToDisplay()}
                className="table-ant-customized"
              />
              <Divider />
            </Grid>
          </div>
        </Grid>
        {dataToDisplay()?.length === 0 &&
          (!searchItem || searchItem === "") && (
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
    </Suspense>
  );
};

export default ItemTable;

ItemTable.propTypes = {
  searchItem: PropTypes.string,
};
