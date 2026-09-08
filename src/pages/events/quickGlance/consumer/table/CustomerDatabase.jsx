import { Icon } from "@iconify/react/dist/iconify.js";
import { Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, Table } from "antd";
import PropTypes from "prop-types";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  onAddCustomerInfo,
  onAddUsersOfEventList,
} from "../../../../../store/slices/customerSlice";
import { onAddCustomer } from "../../../../../store/slices/stripeSlice";
import "../../../../../styles/global/ant-table.css";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import {
  CONSUMER_STATUSES,
  consumerStatus,
  matchesStatusFilter,
  normalizeConsumerStatus,
  statusColumnFilterValue,
  statusFilterFromTableChange,
} from "../utils/consumerStatusFilter";

/**
 * Presentation only: the rows, the search and the status filter are all owned
 * by CustomerInformationSection, which needs the same data to put counts on
 * the legend pills.
 *
 * The Status column is controlled by `statusFilter`, so the pills and the
 * column dropdown are one selection instead of two that intersect;
 * `onStatusFilterChange` is how the dropdown hands its own choice back.
 */
export const CustomerDatabase = ({
  rows = [],
  loading = false,
  statusFilter = null,
  onStatusFilterChange,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const handleDataDetailUser = (record) => {
    let userFormatData = {
      ...record.entireData,
      uid: record.entireData.id ?? record.entireData.uid,
    };
    dispatch(onAddCustomerInfo(userFormatData));
    dispatch(onAddCustomer(userFormatData));
    /* One array is ONE key, and no query is registered under the triple, so
       this invalidated nothing. Three keys, three calls. */
    ["transactionsList", "listOfDevicesAssigned", "listOfNoOperatingDevices"].forEach(
      (queryKey) => queryClient.invalidateQueries({ queryKey: [queryKey] }),
    );
    navigate(
      `/events/event-attendees/${record.entireData.id}/transactions-details`
    );
  };

  const columns = [
    {
      title: "Consumer",
      dataIndex: "user",
      width: "20%",
      responsive: ["md", "lg"],
      sorter: {
        compare: (a, b) => ("" + a.user).localeCompare(b.user),
      },
      render: (user) => (
        <span style={{ display: "flex" }} key={`${user}`}>
          <Avatar>
            {user[0][0]}
            {user[1][0]}
          </Avatar>
          &nbsp;
          <div
            key={`${user[0]}${user[1]}`}
            style={{
              flexDirection: "column",
              color: "var(--gray-900, #101828)",
              fontSize: "14px",
              fontFamily: "Inter",
              lineHeight: "20px",
              fontWeight: "500",
            }}
          >
            <Typography
              textTransform={"capitalize"}
              style={{ width: "100%", textWrap: "balance" }}
            >
              {user[0]}&nbsp;
              {user[1]}
            </Typography>
          </div>
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: "15%",
      responsive: ["md", "lg"],
      showSorterTooltip: { target: "full-header" },
      filters: CONSUMER_STATUSES.map((status) => ({
        text: status.label,
        value: status.value,
      })),
      filteredValue: statusColumnFilterValue(statusFilter),
      onFilter: (value, record) => matchesStatusFilter(value, record.status),
      sorter: {
        /* Read `a.status.status` before, which is undefined — `status` is the
           bucket number itself — so every row sorted as 0 and the sorter did
           nothing at all. */
        compare: (a, b) =>
          normalizeConsumerStatus(a.status) - normalizeConsumerStatus(b.status),
      },
      render: (status) => {
        const bucket = consumerStatus(status);
        return (
          <span
            style={{
              borderRadius: "16px",
              justifyContent: "center",
              display: "flex",
              padding: "2px 8px",
              alignItems: "center",
              background: bucket.backgroundColor,
              width: "fit-content",
            }}
          >
            <Typography
              color={bucket.color}
              textTransform={"capitalize"}
              style={{
                ...Subtitle,
                fontWeight: 500,
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                color: bucket.color,
              }}
            >
              <Icon
                icon="tabler:point-filled"
                rotate={3}
                color={bucket.color}
              />
              {bucket.label}
            </Typography>
          </span>
        );
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      sorter: {
        compare: (a, b) => ("" + a.email).localeCompare(b.email),
      },
      width: "20%",
      render: (email) => (
        <p style={{ ...Subtitle, textWrap: "ellipsis", overflow: "hidden" }}>{email}</p>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      width: "15%",
      sorter: {
        compare: (a, b) => ("" + a.phone).localeCompare(b.phone),
      },
      render: (phone) => (
        <p style={{ ...Subtitle, textWrap: "balance" }}>{phone}</p>
      ),
    },
    {
      title: "",
      key: "action",
      align: "right",
      width: "5%",
      responsive: ["lg"],
      render: () => (
        <Icon
          icon="fluent:arrow-circle-right-20-regular"
          color="#475467"
          width={25}
          height={25}
        />
      ),
    },
  ];

  /* The consumer list is read from Redux by the modals that assign a device,
     so it keeps being published from here. */
  useEffect(() => {
    dispatch(onAddUsersOfEventList(rows));
  }, [rows, dispatch]);

  return (
    <Table
      sticky
      size="large"
      columns={columns}
      dataSource={rows}
      loading={loading}
      pagination={{
        position: ["bottomCenter"],
      }}
      className="table-ant-customized"
      style={{ cursor: "pointer" }}
      onChange={(_pagination, filters) =>
        onStatusFilterChange?.(statusFilterFromTableChange(filters))
      }
      onRow={(record) => {
        return { onClick: () => handleDataDetailUser(record) };
      }}
    />
  );
};

CustomerDatabase.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  statusFilter: PropTypes.number,
  onStatusFilterChange: PropTypes.func,
};
