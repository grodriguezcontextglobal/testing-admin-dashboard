import { Grid } from "@mui/material";
import { Avatar, Table, Typography } from "antd";
import { RightNarrowInCircle } from "../../../components/icons/RightNarrowInCircle";
import RefreshButton from "../../../components/utils/UX/RefreshButton";
// import { data } from "../mock/mockData";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import { onAddMemberInfo } from "../../../store/slices/memberSlice";
import { Subtitle } from "../../../styles/global/Subtitle";
const MainTable = ({state}) => {
  const styleCellColumns = {
    justifyContent: "flex-start",
    ...Subtitle,
    // color: "var(--gray900, #101828)",
    // fontSize: "14px",
    // fontFamily: "Inter",
    // lineHeight: "20px",
    // fontWeight: 500,
    position: "absolute",
    top: 15,
    left: 0,
  };
  const tableStyle = {
    position: "absolute !important",
  };
  const dispatch = useDispatch();
  const [membersData, setMembersData] = useState([]);
  const { user } = useSelector((state) => state.admin);
  const membersDataQuery = useQuery({
    queryKey: ["membersInfoQuery"],
    queryFn: () =>
      devitrakApi.post("/db_member/consulting-member", {
        company_id: user?.sqlInfo?.company_id,
      }),
    enabled: !!user?.sqlInfo?.company_id,
  });
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
          record?.first_name[0] + " " + record?.last_name[0]
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
            <Avatar src={record?.image_url} size={"large"}>
              {!record?.image_url && initials}
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
                  ...Subtitle,
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
      width: "20%",
      sorter: {
        compare: (a, b) => ("" + a.email).localeCompare(b.email),
      },
      render: (email) => {
        return (
          <span
            key={email}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignSelf: "flex-start",
              height: "100%",
            }}
          >
            <Typography style={styleCellColumns}>{email}</Typography>
          </span>
        );
      },
    },
    {
      title: "Phone number",
      dataIndex: "phone",
      responsive: ["lg"],
      width: "15%",
      sorter: {
        compare: (a, b) => ("" + a.phone).localeCompare(b.phone),
      },
      render: (_, record) => {
        return (
          <span
            key={`${record?.phone_number}`}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignSelf: "flex-start",
            }}
          >
            <Typography style={styleCellColumns}>
              {record?.phone_number}
            </Typography>
          </span>
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
      render: (address) => {
        return (
          <span
            key={address}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignSelf: "flex-start",
            }}
          >
            <Typography style={styleCellColumns}>{address}</Typography>
          </span>
        );
      },
    },
    {
      title: "",
      key: "action",
      align: "center",
      width: "5%",
      render: (_, record) => {
        return (
          <span style={styleCellColumns}>
            <NavLink
              onClick={() => dispatch(onAddMemberInfo(record))}
              to={`/member/${record?.member_id}/main`}
              state={{ referencing: state }}
            >
              <RightNarrowInCircle />
            </NavLink>
          </span>
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
          style={{ width: "100%", cursor: "pointer", ...tableStyle }}
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
