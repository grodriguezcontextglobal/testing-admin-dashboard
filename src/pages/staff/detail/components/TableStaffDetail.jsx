import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import { BadgeWithDot } from "../../../../components/base/badges/badges";
import DevitrakLoading from "../../../../components/animation/DevitrakLoading";
import BaseTable from "../../../../components/ux/tables/BaseTable";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import ListEquipment from "./equipment_components/ListEquipment";

const sectionHeadingStyle = {
  fontSize: "15px",
  fontWeight: 600,
  color: "#101828",
  margin: "2rem 0 0.75rem",
  lineHeight: "24px",
  padding: 0,
};

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
      sorter: { compare: (a, b) => ("" + a.event).localeCompare(b.event) },
      render: (event) => (
        <span
          style={{
            fontSize: "14px",
            fontFamily: "Inter",
            lineHeight: "20px",
            textTransform: "capitalize",
            color: "#101828",
          }}
        >
          {event}
        </span>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      width: "25%",
      responsive: ["lg"],
      sorter: { compare: (a, b) => ("" + a.role).localeCompare(b.role) },
      render: (role) => (
        <BadgeWithDot color={role === "Administrator" ? "blue" : "indigo"}>
          {role}
        </BadgeWithDot>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: "25%",
      sorter: { compare: (a, b) => ("" + a.status).localeCompare(b.status) },
      render: (status) => (
        <BadgeWithDot color={status ? "brand" : "success"}>
          {status ? "Active" : "Completed"}
        </BadgeWithDot>
      ),
    },
  ];

  if (eventQuery.isLoading)
    return (
      <div style={CenteringGrid}>
        <DevitrakLoading />
      </div>
    );

  if (eventQuery.data || eventQuery.isFetched || eventQuery.isRefetching) {
    const sortData = () => {
      const result = [];
      const data = eventQuery?.data?.data?.list ?? [];
      for (let item of data) {
        if (item.staff.adminUser?.some((m) => m.email === profile.email)) {
          result.push({ ...item, role: "Administrator" });
        } else if (
          item.staff.headsetAttendees?.some((m) => m.email === profile.email)
        ) {
          result.push({ ...item, role: "Coordinator" });
        }
      }
      return result;
    };

    const dataToRenderInTable = () =>
      sortData().map((item) => ({
        event: item.eventInfoDetail.eventName,
        status: item.active,
        role: item.role,
        entireData: item,
      }));

    return (
      <div style={{ padding: "4px 0", width: "100%" }}>
        <h3 style={sectionHeadingStyle}>Current assigned devices</h3>
        <ListEquipment />
        <h3 style={sectionHeadingStyle}>Events assigned</h3>
        <BaseTable
          enablePagination={true}
          columns={columns}
          dataSource={dataToRenderInTable()}
          pageSize={10}
        />
      </div>
    );
  }
};

export default TableStaffDetail;
