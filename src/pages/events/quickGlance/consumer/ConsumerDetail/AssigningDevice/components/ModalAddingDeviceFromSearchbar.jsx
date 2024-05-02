import { SearchOutlined } from "@ant-design/icons";
import { Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Button, Input, Modal, Space, Table } from "antd";
// import _ from 'lodash';
import { useEffect, useRef, useState } from "react";
import Highlighter from "react-highlight-words";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../../api/devitrakApi";
import { onOpenDeviceAssignmentModalFromSearchPage } from "../../../../../../../store/slices/devicesHandleSlice";
import AddingDeviceToPaymentIntentFromSearchBar from "../AddingDeviceToPaymentIntentFromSearchBar";


const ModalAddingDeviceFromSearchbar = () => {
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);
  const { paymentIntentSelected, paymentIntentDetailSelected, customer } =
    useSelector((state) => state.stripe);
  const findindAssignedInPaymentIntentQuery = useQuery({
    queryKey: ['assignedDeviceInPaymentIntent'],
    queryFn: () => devitrakApi.post("/receiver/receiver-assigned", {
      'paymentIntent': paymentIntentSelected,
    }),
    enabled: false,
    refetchOnMount: false,
  })

  useEffect(() => {
    const controller = new AbortController()
    findindAssignedInPaymentIntentQuery.refetch()
    return () => {
      controller.abort()
    }
  }, [])

  const dispatch = useDispatch();
  const { openModalToAssignDevice } = useSelector(
    (state) => state.devicesHandle
  );
  const refetchingFn = () => {
    return findindAssignedInPaymentIntentQuery.refetch()
  }
  const closeModal = () => {
    dispatch(onOpenDeviceAssignmentModalFromSearchPage(false));
  };
  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };
  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }) => (
      <div
        key={dataIndex}
        style={{
          padding: 8,
        }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{
            marginBottom: 8,
            display: "block",
          }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{
              width: 90,
            }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{
              width: 90,
            }}
          >
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({
                closeDropdown: false,
              });
              setSearchText(selectedKeys[0]);
              setSearchedColumn(dataIndex);
            }}
          >
            Filter
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined
        style={{
          color: filtered ? "#1677ff" : undefined,
        }}
      />
    ),
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{
            backgroundColor: "#ffc069",
            padding: 0,
          }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });
  if (findindAssignedInPaymentIntentQuery.data) {
    const deviceAssignedListQuery = findindAssignedInPaymentIntentQuery?.data?.data?.receiver; //*need to get the final result form finding assigned device query

    const foundTransactionAndDevicesAssigned = () => {
      if (deviceAssignedListQuery?.length) return deviceAssignedListQuery
      return []
    };
    const checkDevicesInTransaction = () => {
      const result = new Set()
      for (let data of foundTransactionAndDevicesAssigned()) {
        result.add(data.device)
      }
      return Array.from(result);
    };
    const columns = [
      {
        title: "Device serial number",
        dataIndex: "serialNumber",
        key: "serialNumber",
        ...getColumnSearchProps("serialNumber"),
        sorter: {
          compare: (a, b) => ("" + a.serialNumber).localeCompare(b.serialNumber),
        },
        sortDirections: ["descend", "ascend"],
        width: "30%",
      },
      {
        title: "Type",
        dataIndex: "deviceType",
        key: "deviceType",
        width: "20%",
        sorter: {
          compare: (a, b) => ("" + a.deviceType).localeCompare(b.deviceType),
        },
        sortDirections: ["descend", "ascend"],
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        sorter: {
          compare: (a, b) => ("" + a.status).localeCompare(b.status),
        },
        sortDirections: ["descend", "ascend"],
        render: (status) => (
          <Typography
            textTransform={"none"}
            textAlign={"left"}
            fontWeight={400}
            fontSize={"16px"}
            fontFamily={"Inter"}
            lineHeight={"24px"}
          >
            {typeof status === "string" ? status : status ? "In-use" : "Returned"}
          </Typography>
        ),
      }];
    const renderTitle = () => {
      return (
        <Typography
          fontFamily={"Inter"}
          fontWeight={400}
          fontSize={"24px"}
          lineHeight={"30px"}
          textAlign={"left"}
          textTransform={"none"}
          padding={"12px"}
          style={{
            textWrap: "balance",
          }}
        >
          Assigning device to{" "}
          <span
            style={{
              textTransform: "capitalize",
            }}
          >
            {customer.name}, {customer.lastName}
          </span>
        </Typography>
      );
    };
    return (
      <Modal
        title={renderTitle()}
        centered
        open={openModalToAssignDevice}
        onOk={() => closeModal()}
        onCancel={() => closeModal()}
        width={1000}
        footer={[]}
        maskClosable={false}
      >
        <Grid container>
          {foundTransactionAndDevicesAssigned()?.length ===
            paymentIntentDetailSelected?.device ? null : (
            <Grid
              display={"flex"}
              alignItems={"center"}
              justifyContent={"center"}
              item
              xs={12} sm={12} md={12} lg={12}
            >
              <AddingDeviceToPaymentIntentFromSearchBar refetchingFn={refetchingFn} key={'adding-single-device'} />

            </Grid>
          )}
          <Grid item xs={12}>
            {checkDevicesInTransaction().length > 0 && (
              <Table
                columns={columns}
                dataSource={checkDevicesInTransaction()}
                pagination={{
                  position: ["bottomLeft"],
                }}
              />
            )}
          </Grid>
        </Grid>
      </Modal>
    );
  }
};

export default ModalAddingDeviceFromSearchbar;
