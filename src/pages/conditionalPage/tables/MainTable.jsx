import { Grid } from "@mui/material";
import RefreshButton from "../../../components/utils/UX/RefreshButton";
import { Avatar, Table, Typography } from "antd";
import { RightNarrowInCircle } from "../../../components/icons/RightNarrowInCircle";
// import { data } from "../mock/mockData";
import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { devitrakApi } from "../../../api/devitrakApi";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import Loading from "../../../components/animation/Loading";
const MainTable = () => {
  const styling = {
    fontSize: "12px",
    fontFamily: "Inter",
    fontStyle: "normal",
    fontWeight: 400,
    lineHeight: "18px",
    textAlign: "left",
    textTransform: "capitalize",
    justifyContent: "flex-start",
    color: "var(--gray-600, #475467)",
  };

  const { user } = useSelector((state) => state.admin);
  const membersDataQuery = useQuery({
    queryKey: ["membersInfoQuery"],
    queryFn: () =>
      devitrakApi.post("/db_member/consulting-member", {
        company_id: user?.sqlInfo?.company_id,
      }),
    enabled: !!user?.sqlInfo?.company_id,
  });

  const [membersData, setMembersData] = useState([]);

  useEffect(() => {
    if (membersDataQuery?.data?.data?.members.length) {
      setMembersData(membersDataQuery?.data?.data?.members);
    }
  }, [membersDataQuery?.data?.data]);

  const columns = [
    {
      title: "Name",
      align: "left",
      width: "25%",
      sorter: {
        compare: (a, b) => ("" + a.name).localeCompare(b.name),
      },
      render: (_, record) => {
        const initials = String(
          record?.first_name + " " + record?.last_name
        ).split(" ");
        return (
          <span
            key={`${_}`}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignSelf: "flex-start",
            }}
          >
            <Avatar src={record?.image_url}>
              {!record?.image_url && initials.map((initial) => initial[0])}
            </Avatar>
            &nbsp;
            <div
              style={{
                width: "70%",
                flexDirection: "column",
                justifyContent: "flex-start",
              }}
            >
              <Typography
                style={{
                  justifyContent: "flex-start",
                  color: "var(--gray900, #101828)",
                  fontSize: "14px",
                  fontFamily: "Inter",
                  lineHeight: "20px",
                  fontWeight: 500,
                }}
              >
                {record?.first_name + " " + record?.last_name}
              </Typography>
            </div>
          </span>
        );
      },
    },
    {
      title: "Email address",
      dataIndex: "email",
      responsive: ["lg"],
      sorter: {
        compare: (a, b) => ("" + a.email).localeCompare(b.email),
      },
    },
    {
      title: "Phone number",
      dataIndex: "phone",
      responsive: ["lg"],
      sorter: {
        compare: (a, b) => ("" + a.phone).localeCompare(b.phone),
      },
      render: (_, record) => {
        return (
          <Typography style={styling}>
            {record?.phone_number ? record.phone_number : "+1-000-000-0000"}
          </Typography>
        );
      },
    },
    {
      title: "Address",
      dataIndex: "address",
      responsive: ["lg"],
      sorter: {
        compare: (a, b) => ("" + a.address).localeCompare(b.address),
      },
    },
    {
      title: "",
      key: "action",
      align: "center",
      width: "5%",
      render: (_, record) => {
        return (
          <>
            <NavLink to={`/member/${record?.member_id}/main`}>
              <RightNarrowInCircle />
            </NavLink>
          </>
        );
      },
    },
  ];

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
        <RefreshButton propsFn={() => membersDataQuery.refetch()} />
        {/* <DownLoadReportButton /> */}
      </Grid>
      {membersDataQuery.isLoading ? (
        <Loading />
      ) : (
        <Table
          style={{ width: "100%", cursor: "pointer" }}
          dataSource={membersData}
          columns={columns}
          rowClassName="editable-row"
          className="table-ant-customized"
        />
      )}{" "}
    </Grid>
  );
};

export default MainTable;
