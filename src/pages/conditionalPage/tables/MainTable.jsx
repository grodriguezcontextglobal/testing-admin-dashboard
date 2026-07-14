import { Grid } from "@mui/material";
import { Avatar, Typography } from "antd";
import { RightNarrowInCircle } from "../../../components/icons/RightNarrowInCircle";
import RefreshButton from "../../../components/utils/UX/RefreshButton";
import TableHeader from "../../../components/UX/TableHeader";
// import { data } from "../mock/mockData";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import DevitrakLoading from "../../../components/animation/DevitrakLoading";
import BaseTable from "../../../components/UX/tables/BaseTable";
import { onAddMemberInfo } from "../../../store/slices/memberSlice";
import { Subtitle } from "../../../styles/global/Subtitle";
import { getIndustryProfile } from "../../../config/industryProfiles";
const MainTable = ({ state }) => {
  // For cells that stack two lines (grade+homeroom, badge+rep) — must NOT
  // use styleCellColumns, whose position:absolute makes lines overlap.
  const stackedCellStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "2px",
    textAlign: "left",
  };
  const stackedPrimaryText = {
    fontFamily: "Inter, sans-serif",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 500,
    color: "var(--gray-900, #171d1a)",
    margin: 0,
  };
  const stackedSecondaryText = {
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    lineHeight: "16px",
    color: "var(--gray-500, #777b73)",
    margin: 0,
  };
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
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [membersData, setMembersData] = useState([]);
  const { user } = useSelector((state) => state.admin);
  const industryProfile = getIndustryProfile(user?.companyData?.industry);
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

  const memberSelection = (record) => {
    dispatch(onAddMemberInfo(record))
    return navigate(`/member/${record?.member_id}/main`)
  }
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
          record?.first_name[0] + " " + record?.last_name[0],
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
      title: "Grade",
      key: "gradeColumn",
      dataIndex: "grade",
      width: "10%",
      sorter: {
        compare: (a, b) => ("" + (a.grade ?? "")).localeCompare("" + (b.grade ?? ""), undefined, { numeric: true }),
      },
      filters: [...new Set((membersData || []).map((m) => m.grade).filter(Boolean))]
        .sort((a, b) => ("" + a).localeCompare("" + b, undefined, { numeric: true }))
        .map((g) => ({ text: `Grade ${g}`, value: g })),
      onFilter: (value, record) => record.grade === value,
      render: (grade, record) => (
        <span style={stackedCellStyle}>
          <Typography style={stackedPrimaryText}>
            {grade ? `Grade ${grade}` : "—"}
          </Typography>
          {record.homeroom && (
            <Typography style={stackedSecondaryText}>{record.homeroom}</Typography>
          )}
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: "14%",
      filters: [
        { text: "Adult", value: "adult" },
        { text: "Minor — has representative", value: "minor_ok" },
        { text: "Minor — representative missing", value: "minor_missing" },
      ],
      onFilter: (value, record) => {
        const isMinor = Number(record.minor) === 1;
        const hasRep = Boolean(record.parent_guardian_email?.trim?.());
        if (value === "adult") return !isMinor;
        if (value === "minor_ok") return isMinor && hasRep;
        return isMinor && !hasRep;
      },
      render: (_, record) => {
        const isMinor = Number(record.minor) === 1;
        const hasRep = Boolean(record.parent_guardian_email?.trim?.());
        const badge = (bg, border, color, text) => (
          <span
            style={{
              display: "inline-block",
              padding: "2px 10px",
              borderRadius: "var(--radius-full, 9999px)",
              border: `1px solid ${border}`,
              background: bg,
              color,
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {text}
          </span>
        );
        if (!isMinor) {
          return badge(
            "var(--gray-50, #f7f7f4)",
            "var(--gray-300, #c6c7bb)",
            "var(--gray-700, #454944)",
            "Adult"
          );
        }
        if (hasRep) {
          return (
            <span style={stackedCellStyle}>
              {badge(
                "var(--blue-50, #eff8ff)",
                "var(--blue-200, #b2ddff)",
                "var(--blue-800, #1849a9)",
                "Minor"
              )}
              <Typography style={stackedSecondaryText}>
                Rep: {record.parent_guardian_first_name} {record.parent_guardian_last_name}
              </Typography>
            </span>
          );
        }
        return badge(
          "var(--error-25, #fdf7f5)",
          "var(--error-300, #e28f75)",
          "var(--error-700, #9a3922)",
          "Minor — rep missing"
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
            <Typography style={styleCellColumns}>
              {String(address).trim().length < 6 ? "" : address}
            </Typography>
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
              to={`/member/${record?.member_id}/main`}
              state={{ referencing: state }}
            >
              <button onClick={() => memberSelection(record)} style={{ margin: 0, padding: 0, outline: "none", border: "none", background:"transparent" }}>
                <RightNarrowInCircle />
              </button>
            </NavLink>
          </span>
        );
      },
    },
  ];
  return (
    <Grid margin={"15px 0 0 0"} padding={0} container>
      <TableHeader
        leftCta={<RefreshButton propsFn={() => membersDataQuery.refetch()} />}
      />
      {membersDataQuery.isLoading ? (
        <DevitrakLoading />
      ) : (
        <BaseTable
          style={{ width: "100%", cursor: "pointer", ...tableStyle }}
          dataSource={membersData}
          // industry profile decides whether the Grade column applies
          columns={columns.filter(
            (c) => c.key !== "gradeColumn" || industryProfile.fields.grade
          )}
          rowClassName="editable-row"
          enablePagination={true}
          pageSize={10}
          rowKey={(record) => record.member_id}
          onRow={(record) => {
            return {
              onClick: () => {
                memberSelection(record)
              },
            };
          }}
        />
      )}{" "}
    </Grid>
  );
};

export default MainTable;
