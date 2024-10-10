import { Icon } from "@iconify/react";
import { Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Table } from "antd";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import Loading from "../../../../components/animation/Loading";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { TextFontSize20LineHeight30 } from "../../../../styles/global/TextFontSize20HeightLine30";
import ListEquipment from "./equipment_components/ListEquipment";

const TableStaffDetail = () => {
  const { profile } = useSelector((state) => state.staffDetail);
  const { user } = useSelector((state) => state.admin);
  const eventQuery = useQuery({
    queryKey: ["events"],
    queryFn: () =>
      devitrakApi.post("/event/event-list", {
        company: user.company,
        type: "event",
      }),
    // enabled: false,
    refetchOnMount: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    eventQuery.refetch();
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.activeInCompany]);

  const columns = [
    {
      title: "Event",
      dataIndex: "event",
      align: "left",
      sorter: {
        compare: (a, b) => ("" + a.event).localeCompare(b.event),
      },
      render: (event) => (
        <span key={`${event}`}>
          <div
            key={`${event}`}
            style={{
              flexDirection: "column",
              fontSize: "14px",
              fontFamily: "Inter",
              lineHeight: "20px",
            }}
          >
            <Typography textTransform={"capitalize"}>{event}</Typography>
          </div>
        </span>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      width: "25%",
      responsive: ["lg"],

      sorter: {
        compare: (a, b) => ("" + a.role).localeCompare(b.role),
      },
      render: (role) => (
        <span
          style={{
            alignItems: "center",
            background: `${
              role !== "Damaged" ? "var(--blue-50, #EFF8FF)" : "#ffefef"
            }`,
            borderRadius: "16px",
            display: "flex",
            justifyContent: "center",
            padding: "2px 8px",
            width: "fit-content",
          }}
        >
          <Typography
            fontSize={"12px"}
            fontFamily={"Inter"}
            fontStyle={"normal"}
            fontWeight={500}
            lineHeight={"18px"}
            textAlign={"center"}
            textTransform={"capitalize"}
          >
            {role}
          </Typography>
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: "25%",
      sorter: {
        compare: (a, b) => ("" + a.status).localeCompare(b.status),
      },
      render: (status) => (
        <span
          style={{
            borderRadius: "16px",
            justifyContent: "center",
            display: "flex",
            padding: "2px 8px",
            alignItems: "center",
            background: `${
              status
                ? "var(--primary-50, #F9F5FF)"
                : "var(--success-50, #ECFDF3)"
            }`,
            width: "fit-content",
          }}
        >
          <Typography
            color={`${
              status
                ? "var(--primary-700, #6941C6)"
                : "var(--success-700, #027A48)"
            }`}
            fontSize={"12px"}
            fontFamily={"Inter"}
            fontStyle={"normal"}
            fontWeight={500}
            lineHeight={"18px"}
            textAlign={"center"}
            textTransform={"capitalize"}
          >
            <Icon
              icon="tabler:point-filled"
              rotate={3}
              color={`${status ? "var(--primary-700, #6941C6)" : "#12B76A"}`}
            />
            {status ? "Active" : "Completed"}
          </Typography>
        </span>
      ),
    },
  ];

  if (eventQuery.isLoading)
    return (
      <div style={CenteringGrid}>
        <Loading />
      </div>
    );
  if (eventQuery.data || eventQuery.isFetched || eventQuery.isRefetching) {
    const dataPerCompany = () => {
      const groupOfCompanies = eventQuery?.data?.data?.list;
      return groupOfCompanies;
    };
    dataPerCompany();

    const sortData = () => {
      let result = [];
      let index = 0;
      if (dataPerCompany()) {
        for (let data of dataPerCompany()) {
          if (
            data.staff.adminUser?.some((item) => item.email === profile.email)
          ) {
            result.splice(index, 0, { ...data, role: "Administrator" });
            index++;
          } else if (
            data.staff.headsetAttendees?.some(
              (item) => item.email === profile.email
            )
          ) {
            result.splice(index, 0, { ...data, role: "Coordinator" });
            index++;
          }
        }
      }
      return result;
    };
    sortData();
    const dataToRenderInTable = () => {
      let tableData = [];
      let index = 0;
      for (let data of sortData()) {
        tableData.splice(index, 0, {
          event: data.eventInfoDetail.eventName,
          status: data.active,
          role: data.role,
          entireData: data,
        });
      }
      return tableData;
    };
    dataToRenderInTable();

    return (
      <Grid
        style={{
          padding: "5px",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
        container
      >
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          margin={"2rem auto 1rem"}
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <p
            style={{
              ...TextFontSize20LineHeight30,
              fontWeight: 500,
              color: "#000",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            Current assigned devices:&nbsp;
          </p>
        </Grid>
        <ListEquipment />
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          margin={"2rem auto 1rem"}
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <p
            style={{
              ...TextFontSize20LineHeight30,
              fontWeight: 500,
              color: "#000",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            Events assigned:&nbsp;
          </p>
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          item
          xs={12}
        >
          <Table
            sticky
            size="large"
            columns={columns}
            style={{ width: "100%" }}
            dataSource={dataToRenderInTable() ? dataToRenderInTable() : []}
            pagination={{
              position: ["bottomCenter"],
            }}
            className="table-ant-customized"
          />
        </Grid>
      </Grid>
    );
  }
};

export default TableStaffDetail;
