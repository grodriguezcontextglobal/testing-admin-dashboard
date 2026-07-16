import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal, Select, Table, Tag, Input, message, notification } from "antd";
import { Typography } from "@mui/material";
import { devitrakApi } from "../../../api/devitrakApi";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";

/**
 * Overdue devices dashboard (school track): outstanding leases past their
 * expected return date, with per-row / bulk guardian reminders and an
 * end-of-term bulk return action.
 */
const OverdueDevicesTable = () => {
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [api, contextHolder] = notification.useNotification();
  const [gradeFilter, setGradeFilter] = useState(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("returned");
  const [bulkNote, setBulkNote] = useState("");
  const [working, setWorking] = useState(false);

  const companyId = user?.sqlInfo?.company_id;
  const overdueQuery = useQuery({
    queryKey: ["overdueLeasesQuery", companyId],
    queryFn: () =>
      devitrakApi.post("/db_member/overdue-leases", { company_id: companyId }),
    enabled: !!companyId,
  });

  const rows = useMemo(() => {
    const all = overdueQuery?.data?.data?.rows || [];
    return gradeFilter ? all.filter((r) => r.grade === gradeFilter) : all;
  }, [overdueQuery?.data?.data?.rows, gradeFilter]);

  const grades = useMemo(() => {
    const all = overdueQuery?.data?.data?.rows || [];
    return [...new Set(all.map((r) => r.grade).filter(Boolean))].sort((a, b) =>
      String(a).localeCompare(String(b), undefined, { numeric: true })
    );
  }, [overdueQuery?.data?.data?.rows]);

  const sendReminder = async (row) => {
    const recipients = [row.email];
    if (row.minor === 1 && row.parent_guardian_email) {
      recipients.push(row.parent_guardian_email);
    }
    const dueDate = row.expected_return_date
      ? new Date(row.expected_return_date).toLocaleDateString()
      : "its due date";
    await devitrakApi.post("/nodemailer/single-email-notification", {
      consumer: recipients,
      subject: `Overdue device reminder - ${user.companyData.company_name}`,
      message: `Hi ${row.first_name},\n\nOur records show the device ${
        row.device_serial_number || row.device_item_group || ""
      } assigned to you was due back on ${dueDate} and is now ${
        row.days_overdue
      } day(s) overdue. Please return it as soon as possible.\n\n${
        user.companyData.company_name
      }`,
      eventSelected: "",
      company: user.companyData.company_name,
    });
  };

  const handleSingleReminder = async (row) => {
    try {
      await sendReminder(row);
      api.open({
        message: "Reminder queued",
        description: `${row.first_name} ${row.last_name}${
          row.minor === 1 && row.parent_guardian_email ? " (guardian CC'd)" : ""
        }`,
      });
    } catch {
      message.error("Failed to queue the reminder email.");
    }
  };

  const handleAllReminders = async () => {
    if (!rows.length || working) return;
    setWorking(true);
    let sent = 0;
    for (const row of rows) {
      try {
        await sendReminder(row);
        sent += 1;
      } catch {
        // continue with the rest; summary reported below
      }
    }
    setWorking(false);
    api.open({
      message: "Reminders queued",
      description: `${sent} of ${rows.length} reminder emails queued (guardians CC'd for minors).`,
    });
  };

  const handleBulkReturn = async () => {
    if (working) return;
    try {
      setWorking(true);
      const body = {
        company_id: companyId,
        return_status: bulkStatus,
        condition_note: bulkNote || null,
      };
      if (gradeFilter) body.grade = gradeFilter;
      const res = await devitrakApi.post("/db_member/bulk-return", body);
      setBulkModalOpen(false);
      setBulkNote("");
      message.success(
        `${res?.data?.returned ?? 0} lease(s) closed, ${
          res?.data?.devicesRestocked ?? 0
        } device(s) restocked.`
      );
      queryClient.invalidateQueries({ queryKey: ["overdueLeasesQuery"] });
    } catch {
      message.error("Bulk return failed.");
    } finally {
      setWorking(false);
    }
  };

  const columns = [
    {
      title: "Student",
      key: "student",
      render: (_, r) => (
        <button
          type="button"
          onClick={() => navigate(`/member/${r.member_id}/main`)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            color: "var(--action-700, #004eeb)",
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          {r.first_name} {r.last_name}
        </button>
      ),
    },
    {
      title: "Grade",
      dataIndex: "grade",
      render: (g, r) => (
        <Typography style={{ fontSize: 14 }}>
          {g || "—"}
          {r.homeroom ? ` · ${r.homeroom}` : ""}
        </Typography>
      ),
    },
    {
      title: "Device",
      key: "device",
      render: (_, r) => (
        <Typography style={{ fontSize: 14 }}>
          {r.device_serial_number || "—"}
          {r.device_item_group ? ` (${r.device_item_group})` : ""}
        </Typography>
      ),
    },
    {
      title: "Due date",
      dataIndex: "expected_return_date",
      render: (d) => (
        <Typography style={{ fontSize: 14 }}>
          {d ? new Date(d).toLocaleDateString() : "—"}
        </Typography>
      ),
    },
    {
      title: "Overdue",
      dataIndex: "days_overdue",
      sorter: (a, b) => a.days_overdue - b.days_overdue,
      defaultSortOrder: "descend",
      render: (days) => (
        <Tag color={days > 7 ? "red" : "orange"}>{days} day{days === 1 ? "" : "s"}</Tag>
      ),
    },
    {
      title: "Guardian",
      key: "guardian",
      render: (_, r) =>
        r.minor === 1 ? (
          <Typography style={{ fontSize: 13, color: "var(--gray-600, #5d615a)" }}>
            {r.parent_guardian_email || "—"}
          </Typography>
        ) : (
          <Typography style={{ fontSize: 13, color: "var(--gray-400, #a2a69b)" }}>
            n/a (adult)
          </Typography>
        ),
    },
    {
      title: "",
      key: "actions",
      render: (_, r) => (
        <GrayButtonComponent
          title="Send reminder"
          func={() => handleSingleReminder(r)}
        />
      ),
    },
  ];

  return (
    <div style={{ width: "100%" }}>
      {contextHolder}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          justifyContent: "flex-start",
          margin: "0 0 12px",
        }}
      >
        <Select
          allowClear
          placeholder="All grades"
          style={{ minWidth: 160 }}
          value={gradeFilter}
          onChange={(v) => setGradeFilter(v ?? null)}
          options={grades.map((g) => ({ label: `Grade ${g}`, value: g }))}
        />
        <GrayButtonComponent
          title={`Send all reminders (${rows.length})`}
          disabled={!rows.length || working}
          func={handleAllReminders}
        />
        <BlueButtonComponent
          title={gradeFilter ? `Mark grade ${gradeFilter} returned…` : "Mark all returned…"}
          disabled={working}
          func={() => setBulkModalOpen(true)}
        />
      </div>
      <Table
        columns={columns}
        dataSource={rows}
        rowKey="lease_id"
        loading={overdueQuery.isLoading}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        locale={{ emptyText: "No overdue devices — everything is on time. 🎉" }}
        scroll={{ x: true }}
      />
      <Modal
        title={
          gradeFilter
            ? `Bulk return — every outstanding device for grade ${gradeFilter}`
            : "Bulk return — every outstanding device"
        }
        open={bulkModalOpen}
        onOk={handleBulkReturn}
        okText="Close leases"
        okButtonProps={{ loading: working }}
        onCancel={() => setBulkModalOpen(false)}
      >
        <p style={{ margin: "0 0 8px", color: "var(--gray-600, #5d615a)" }}>
          Closes all outstanding leases in scope (not just overdue ones) — the
          end-of-term collection action. Devices are restocked to the warehouse
          unless marked lost.
        </p>
        <Select
          style={{ width: "100%", margin: "0 0 8px" }}
          value={bulkStatus}
          onChange={setBulkStatus}
          options={[
            { label: "Returned", value: "returned" },
            { label: "Returned damaged", value: "damaged" },
            { label: "Lost — devices not recovered", value: "lost" },
          ]}
        />
        <Input.TextArea
          placeholder="Condition note (optional), e.g. End-of-year collection 2026"
          value={bulkNote}
          onChange={(e) => setBulkNote(e.target.value)}
          rows={2}
        />
      </Modal>
    </div>
  );
};

export default OverdueDevicesTable;
