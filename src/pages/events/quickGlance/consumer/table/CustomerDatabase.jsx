import { Typography } from "@mui/material";
import { Table } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  onAddCustomerInfo,
  onAddUsersOfEventList,
} from "../../../../../store/slices/customerSlice";
import { onAddCustomer } from "../../../../../store/slices/stripeSlice";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { devitrakApi } from "../../../../../api/devitrakApi";
import "../../../../../styles/global/ant-table.css";
import { useEffect } from "react";

export const CustomerDatabase = ({ searchAttendees }) => {
  const { user } = useSelector((state) => state.admin);
  const { choice, event } = useSelector((state) => state.event);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const attendeesEventQuery = useQuery({
    queryKey: ["consumersList"],
    queryFn: () =>
      devitrakApi.get(
        `/auth/user-query?event_providers=${event.id}&company_providers=${user.companyData.id}`
      ),
    refetchOnMount: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    attendeesEventQuery.refetch();
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
  const columns = [
    {
      title: "Company",
      dataIndex: "company",
      align: "left",
      width: "25%",
      responsive: ["lg"],
      sorter: {
        compare: (a, b) => ("" + a.company).localeCompare(b.company),
      },
      render: (company) => (
        <span key={`${company}`}>
          {company.map((detail, index) => {
            return (
              <div
                key={`${detail}-${index}`}
                style={{
                  flexDirection: "column",
                  color: `${
                    index === 0
                      ? "var(--gray-900, #101828)"
                      : "var(--gray-600, #475467)"
                  }`,
                  fontSize: "14px",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                  fontWeight: `${index === 0 ? "500" : null}`,
                }}
              >
                {detail}
              </div>
            );
          })}
        </span>
      ),
    },
    {
      title: "Consumer",
      dataIndex: "user",
      width: "30%",
      responsive: ["md", "lg"],
      sorter: {
        compare: (a, b) => ("" + a.user).localeCompare(b.user),
      },
      render: (user) => (
        <span key={`${user}`}>
          {user.map((detail, index) => {
            return (
              <div
                key={`${detail[0]}${detail[1]}`}
                style={{
                  flexDirection: "column",
                  color: `${
                    index === 0
                      ? "var(--gray-900, #101828)"
                      : "var(--gray-600, #475467)"
                  }`,
                  fontSize: "14px",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                  fontWeight: `${index === 0 ? "500" : null}`,
                }}
              >
                <Typography textTransform={"capitalize"}>{detail}</Typography>
              </div>
            );
          })}
        </span>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      width: "30%",
      sorter: {
        compare: (a, b) => ("" + a.email).localeCompare(b.email),
      },
    },
  ];

  const checkEventsPerCompany = () => {
    const list = attendeesEventQuery?.data?.data?.users;
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
    // let index = checkEventsPerCompany()?.length - 1;
    // const notElementToDelete = 0;
    let mapTemplate = {};
    for (let data of checkEventsPerCompany()) {
      mapTemplate = {
        company: [choice, user.company],
        user: [data.name, data.lastName],
        email: data.email,
        key: data.id,
        entireData: data,
      };
      result = [...result, mapTemplate];
      // result.splice(index, notElementToDelete, mapTemplate);
      // index--;
    }
    dispatch(onAddUsersOfEventList(result));
    return result;
  };

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
      onRow={(record) => {
        return { onClick: () => handleDataDetailUser(record) };
      }}
    />
  );
};
