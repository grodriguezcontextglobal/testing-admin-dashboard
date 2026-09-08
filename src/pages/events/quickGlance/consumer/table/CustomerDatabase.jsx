import { Icon } from "@iconify/react/dist/iconify.js";
import { Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, Table } from "antd";
import PropTypes from "prop-types";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import {
  onAddCustomerInfo,
  onAddUsersOfEventList,
} from "../../../../../store/slices/customerSlice";
import { onAddCustomer } from "../../../../../store/slices/stripeSlice";
import "../../../../../styles/global/ant-table.css";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import checkTypeFetchResponse from "../../../../../components/utils/checkTypeFetchResponse";
import {
  CONSUMER_STATUSES,
  consumerStatus,
  matchesStatusFilter,
  normalizeConsumerStatus,
  statusColumnFilterValue,
  statusFilterFromTableChange,
} from "../utils/consumerStatusFilter";

/**
 * `statusFilter` is owned by the legend above the table, and the Status column
 * is controlled by it, so the pills and the column dropdown are one selection
 * instead of two that intersect. `onStatusFilterChange` is how the dropdown
 * hands its own choice back to the pills.
 */
export const CustomerDatabase = ({
  searchAttendees,
  statusFilter = null,
  onStatusFilterChange,
}) => {
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const attendeesAndTransactionsEventQuery = useQuery({
    queryKey: ["checking_new_path_to"],
    queryFn: () =>
      devitrakApi.get(
        `/event/all-users-and-transactions-per-event?event_providers=${event.id}&company_providers=${user.companyData.id}`
      ),
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    attendeesAndTransactionsEventQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);
  const queryClient = useQueryClient();
  const handleDataDetailUser = (record) => {
    let userFormatData = {
      ...record.entireData,
      uid: record.entireData.id ?? record.entireData.uid,
    };
    dispatch(onAddCustomerInfo(userFormatData));
    dispatch(onAddCustomer(userFormatData));
    queryClient.invalidateQueries([
      "transactionsList",
      "listOfDevicesAssigned",
      "listOfNoOperatingDevices",
    ]);
    navigate(
      `/events/event-attendees/${record.entireData.id}/transactions-details`
    );
  };

  const response = attendeesAndTransactionsEventQuery?.data?.data?.data;

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

  const checkEventsPerCompany = () => {
    const list = checkTypeFetchResponse(response);
    if (list) {
      if (searchAttendees?.length > 0) {
        const check = list?.filter((item) =>
          JSON.stringify(item)
            .toLowerCase()
            .includes(String(searchAttendees).toLowerCase())
        );
        return check;
      }
      return list;
    }
    return [];
  };

  const getInfoNeededToBeRenderedInTable = () => {
    let result = [];
    let mapTemplate = {};
    for (let data of checkEventsPerCompany()) {
      mapTemplate = {
        user: [data.user.name, data.user.lastName],
        email: data.user.email,
        status: data.transactions,
        phone: data.user.phoneNumber,
        key: data.user.id,
        entireData: data.user,
      };
      result = [...result, mapTemplate];
    }
    return result;
  };

  useEffect(() => {
    const result = getInfoNeededToBeRenderedInTable();
    dispatch(onAddUsersOfEventList(result));
  }, [response, searchAttendees]);

  return (
    <Table
      sticky
      size="large"
      columns={columns}
      dataSource={getInfoNeededToBeRenderedInTable()}
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
  searchAttendees: PropTypes.string,
  statusFilter: PropTypes.number,
  onStatusFilterChange: PropTypes.func,
};
