import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import Chip from "../../../../components/UX/Chip/Chip";
import EmptyState from "../../../../components/UX/emptyState/EmptyState";
import PageSpinner from "../../../../components/utils/PageSpinner";
import BaseTable from "../../../../components/UX/tables/BaseTable";
import { Subtitle } from "../../../../styles/global/Subtitle";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";
import ListEquipment from "./equipment_components/ListEquipment";

const sectionCardStyle = {
  background: "var(--base-white, #fff)",
  border: "1px solid var(--gray-200, #ddded6)",
  borderRadius: "12px",
  boxShadow: "var(--shadow-xs)",
  padding: "24px",
  width: "100%",
};

const sectionHeadingStyle = {
  ...TextFontsize18LineHeight28,
  color: "var(--gray-900, #171d1a)",
  margin: "0 0 16px",
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
            ...Subtitle,
            textTransform: "capitalize",
            color: "var(--gray-900, #171d1a)",
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
        <Chip
          size="small"
          color={role === "Administrator" ? "info" : "default"}
          label={role}
        />
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: "25%",
      sorter: { compare: (a, b) => ("" + a.status).localeCompare(b.status) },
      render: (status) => (
        <Chip
          size="small"
          color={status ? "info" : "success"}
          label={status ? "Active" : "Completed"}
        />
      ),
    },
  ];

  if (eventQuery.isLoading) return <PageSpinner />;

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

    const dataToRenderInTable = sortData().map((item) => ({
      event: item.eventInfoDetail.eventName,
      status: item.active,
      role: item.role,
      entireData: item,
    }));

    return (
      <div
        style={{
          padding: "4px 0",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <section style={sectionCardStyle}>
          <h3 style={sectionHeadingStyle}>Current assigned devices</h3>
          <ListEquipment />
        </section>
        <section style={sectionCardStyle}>
          <h3 style={sectionHeadingStyle}>Events assigned</h3>
          {dataToRenderInTable.length === 0 ? (
            <EmptyState
              compact
              icon="tabler:calendar-off"
              title="No events assigned"
              description="This staff member has not been assigned to any event yet."
            />
          ) : (
            <BaseTable
              enablePagination={true}
              columns={columns}
              dataSource={dataToRenderInTable}
              pageSize={10}
            />
          )}
        </section>
      </div>
    );
  }
};

export default TableStaffDetail;
