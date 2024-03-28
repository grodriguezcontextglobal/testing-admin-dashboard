import { Icon } from "@iconify/react";
import { Grid, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, Button, Divider, Table } from "antd";
import pkg from 'prop-types';
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import _ from 'lodash';
import { GeneralDeviceIcon, RefreshIcon, RightNarrowInCircle } from "../../../components/icons/Icons";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { Subtitle } from "../../../styles/global/Subtitle";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import '../../../styles/global/ant-table.css';
import { useEffect } from "react";
const { PropTypes } = pkg;

const ItemTable = ({ searchItem }) => {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.admin);
  const queryClient = useQueryClient()
  const listItemsQuery = useQuery({
    queryKey: ["listOfItemsInStock"],
    queryFn: () => devitrakApi.post("/db_item/current-inventory", { company_name: user.company }),
    enabled: false,
    refetchOnMount: false,
    staleTime: Infinity
  });
  const listImagePerItemQuery = useQuery({
    queryKey: ["imagePerItemList"],
    queryFn: () => devitrakApi.post("/image/images", { company: user.company }),
    enabled: false,
    refetchOnMount: false
  });

  const itemsInInventoryQuery = useQuery({
    queryKey: ['ItemsInInventoryCheckingQuery'],
    queryFn: () => devitrakApi.post("/db_item/consulting-item", {
      company: user.company
    }),
    enabled: false,
    refetchOnMount: false
  })
  const imageSource = listImagePerItemQuery?.data?.data?.item
  const groupingByDeviceType = _.groupBy(imageSource, 'item_group')
  const renderedListItems = listItemsQuery?.data?.data.result

  const dataStructuringFormat = () => {
    const resultFormatToDisplay = new Set();
    const groupingBySerialNumber = _.groupBy(itemsInInventoryQuery?.data?.data?.items, 'serial_number')
    if (renderedListItems?.length > 0) {
      for (let data of renderedListItems) {
        if (groupingBySerialNumber[data.serial_number]) {
          resultFormatToDisplay.add({ key: `${data.item_id}-${data.event_name}`, ...data, data: { ...data, location: groupingBySerialNumber[data.serial_number].at(-1).location }, location: groupingBySerialNumber[data.serial_number].at(-1).location });
        }
      }
      return Array.from(resultFormatToDisplay);
    }
    return []
  };
  useEffect(() => {
    const controller = new AbortController()
    dataStructuringFormat()
    listItemsQuery.refetch()
    listImagePerItemQuery.refetch()
    itemsInInventoryQuery.refetch()
    return () => {
      controller.abort()
    }
  }, [user.company])

  const dataToDisplay = () => {
    if (!searchItem || searchItem === "") {
      if (dataStructuringFormat().length > 0) {
        return dataStructuringFormat();
      }
      return []
    } else {
      return dataStructuringFormat()?.filter(item =>
        String(item.serial_number).toLowerCase().match(String(searchItem).toLowerCase()) ||
        String(item.location).toLowerCase().match(String(searchItem).toLowerCase()) ||
        String(item.category_name).toLowerCase().match(String(searchItem).toLowerCase()) ||
        String(item.item_group).toLowerCase().match(String(searchItem).toLowerCase()) ||
        String(item.event_name).toLowerCase().match(String(searchItem).toLowerCase()) ||
        String(item.state_address).toLowerCase().match(String(searchItem).toLowerCase()) ||
        String(item.street_address).toLowerCase().match(String(searchItem).toLowerCase()) ||
        String(item.city_address).toLowerCase().match(String(searchItem).toLowerCase()) ||
        String(item.ownership).toLowerCase().match(String(searchItem).toLowerCase()) ||
        String(item.cost).toLowerCase().match(String(searchItem).toLowerCase()) ||
        String(item.descript_item).toLowerCase().match(String(searchItem).toLowerCase()))
    }
  };
  const displayWelcomeMessage = () => {
    return <Grid
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
      marginTop={5}
      container
    >
      <Grid margin={'auto'} display={'flex'} flexDirection={'column'} alignSelf={'stretch'} gap={'40px'} alignItems={'center'} item xs={10}>
        <Typography
          fontFamily={"Inter"}
          fontSize={"36px"}
          fontStyle={"normal"}
          fontWeight={600}
          lineHeight={"44px"}
          color="var(--Gray-900, #101828)"
          padding={"16px 24px"}
          letterSpacing={"-0.72px"}
        >
          Add devices to inventory
        </Typography>
        <Typography
          fontFamily={"Inter"}
          fontSize={"20px"}
          fontStyle={"normal"}
          fontWeight={400}
          lineHeight={"30px"}
          color="var(--Gray-600, #475467)"
          alignSelf={'stretch'}
          textAlign={'center'}
          padding={"0 5px"}
          style={{ textWrap: "balance" }}
        >
          Add new devices to your inventory and assign categories and groups for easier management. Devices in your inventory can be assigned to staff or consumers permanently or temporarily. You can also mark devices with different statuses for condition and location. Include a device value to track deposits and fees.
        </Typography>
        <Link to={"/inventory/new-item"}>
          {" "}
          <Button
            style={{
              width: "fit-content",
              border: "1px solid var(--blue-dark-600, #155EEF)",
              borderRadius: "8px",
              background: "var(--blue-dark-600, #155EEF)",
              boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
            }}
          >
            <Icon
              icon="ic:baseline-plus"
              color="var(--base-white, #FFF"
              width={20}
              height={20}
            />
            &nbsp;
            <Typography
              textTransform={"none"}
              style={{
                color: "var(--base-white, #FFF",
                fontSize: "14px",
                fontWeight: "600",
                fontFamily: "Inter",
                lineHeight: "20px",
              }}
            >
              Add new item
            </Typography>
          </Button>
        </Link>
      </Grid>
    </Grid>
  }

  const dictionary = {
    'Permanent': "Owned",
    'Rent': "Leased",
    'Sale': 'For sale'
  }
  const cellStyle = {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center"
  }
  const columns = [{
    title: 'Device type',
    dataIndex: 'data',
    key: 'data',
    sorter: {
      compare: (a, b) => ("" + a.data.item_group).localeCompare(b.data.item_group),
    },
    render: (record) => (
      <span style={cellStyle}><Avatar size={'80px'} src={groupingByDeviceType[record.item_group] ? groupingByDeviceType[record.item_group][0].source : `${<GeneralDeviceIcon />}`}></Avatar>&nbsp; <Typography
        style={Subtitle}
        textTransform={"capitalize"}
      >{record.item_group}<br />
        {record.category_name}</Typography></span>
    )
  },
  {
    title: 'Status',
    dataIndex: 'warehouse',
    key: 'warehouse',
    sorter: {
      compare: (a, b) => ("" + a.warehouse).localeCompare(b.warehouse),
    },
    render: (warehouse) => (
      <span
        style={{
          borderRadius: "16px",
          justifyContent: "center",
          display: "flex",
          padding: "2px 8px",
          alignItems: "center",
          background: `${warehouse === 0
            ? "var(--blue-50, #EFF8FF)"
            : "var(--success-50, #ECFDF3)"
            }`,
          width: "fit-content",
        }}
      >
        <Typography
          color={`${warehouse === 0
            ? "var(--blue-700, #175CD3)"
            : "var(--success-700, #027A48)"
            }`}
          style={Subtitle}
          textTransform={"capitalize"}
        >
          <Icon
            icon="tabler:point-filled"
            rotate={3}
            color={`${warehouse === 0
              ? "#2E90FA"
              : "#12B76A"
              }`}
          />
          {warehouse === 0
            ? "In Use"
            : "In Stock"}
        </Typography>
      </span>
    )
  },
  {
    title: 'Ownership',
    dataIndex: 'ownership',
    key: 'ownership',
    sorter: {
      compare: (a, b) => ("" + a.ownership).localeCompare(b.ownership),
    },
    render: (ownership) => (
      <span
        style={{
          borderRadius: "16px",
          justifyContent: "center",
          display: "flex",
          padding: "2px 8px",
          alignItems: "center",
          background: `${ownership === 'Permanent'
            ? "var(--blue-50, #EFF8FF)"
            : "var(--success-50, #ECFDF3)"
            }`,
          width: "fit-content",
        }}
      >
        <Typography
          color={`${ownership === 'Permanent'
            ? "var(--blue-700, #175CD3)"
            : "var(--success-700, #027A48)"
            }`}
          style={Subtitle}
          textTransform={"capitalize"}
        >
          <Icon
            icon="tabler:point-filled"
            rotate={3}
            color={`${ownership === 'Permanent'
              ? "#2E90FA"
              : "#12B76A"
              }`}
          />
          {dictionary[ownership]}
        </Typography>
      </span>
    )
  }, {
    title: 'Group',
    dataIndex: 'category_name',
    key: 'category_name',
    sorter: {
      compare: (a, b) => ("" + a.category_name).localeCompare(b.category_name),
    },
    render: (category_name) => (
      <span style={cellStyle}> <Typography
        style={Subtitle}
        textTransform={"capitalize"}
      >{category_name}</Typography></span>
    )
  },
  {
    title: 'Location',
    dataIndex: 'data',
    key: 'data',
    sorter: {
      compare: (a, b) => ("" + a.data.location).localeCompare(b.data.location),
    },
    render: (data) => (
      <span style={cellStyle}> <Typography
        style={Subtitle}
        textTransform={"capitalize"}
      >{data.warehouse === 1 ? data.location : data.event_name}</Typography></span>
    )
  },
  {
    title: 'Main Serial Number',
    dataIndex: 'serial_number',
    key: 'serial_number',
    sorter: (a, b) => a.serial_number - b.serial_number,
    render: (serial_number) => (
      <span style={cellStyle}> <Typography
        style={Subtitle}
        textTransform={"capitalize"}
      >{serial_number}</Typography></span>
    )
  },
  {
    title: 'Value',
    dataIndex: 'cost',
    key: 'cost',
    sorter: {
      compare: (a, b) => ("" + a.cost).localeCompare(b.cost),
    },
    render: (cost) => (
      <span style={cellStyle}> <Typography
        style={Subtitle}
        textTransform={"capitalize"}
      >${cost}</Typography></span>
    )
  },
  {
    title: '',
    dataIndex: 'data',
    key: 'data',
    render: (record) => (
      <span style={cellStyle} onClick={() => navigate(`/inventory/item?id=${record.item_id}`)}>
        <RightNarrowInCircle />
      </span>
    )
  }]
  return (
    <Grid container spacing={1}>
      <Grid display={'flex'} justifyContent={'flex-end'} alignItems={'center'} margin={'0.3rem'} item xs={12} sm={12} md={12} lg={12}>
        <Button onClick={() => queryClient.invalidateQueries(['listOfItemsInStock', 'imagePerItemList'])} style={BlueButton}>
          <Typography style={{ ...BlueButtonText, ...CenteringGrid }}>
            <RefreshIcon />&nbsp;Refresh
          </Typography>
        </Button>
      </Grid>
      <Table pagination={{
        position: ['bottomCenter'],
      }} style={{ width: "100%" }} columns={columns} dataSource={dataToDisplay()} className="table-ant-customized" />
      <Divider />
      {dataToDisplay().length === 0 && (!searchItem || searchItem === "") && displayWelcomeMessage()}
    </Grid>
  );

};

export default ItemTable;

ItemTable.propTypes = {
  searchItem: PropTypes.string,
  location: PropTypes.object
}