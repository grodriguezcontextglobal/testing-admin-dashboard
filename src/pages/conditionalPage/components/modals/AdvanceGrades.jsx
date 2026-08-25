import { Icon } from "@iconify/react";
import { Grid } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Typography } from "antd";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import { registerStaffActivity } from "../../../../api/activityLog";
import BlueButtonConfirmationComponent from "../../../../components/UX/buttons/BlueButtonConfirmation";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../../components/UX/modal/ModalUX";
import BaseTable from "../../../../components/UX/tables/BaseTable";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import {
  buildGradeAdvancementPlan,
  summarizeGradeAdvancementPlan,
} from "../../utils/gradeAdvancementUtils";
import { useStatusNotification } from "../../../../components/notification/alerts/useStatusNotification";

const cellNameStyle = {
  fontSize: "14px",
  fontFamily: "Inter",
  fontWeight: 500,
  lineHeight: "20px",
  color: "var(--gray-900, #101828)",
};

const STATUS_BADGE = {
  advanced: { text: "Advances", bg: "var(--blue-50, #eff8ff)", border: "var(--blue-200, #b2ddff)", color: "var(--blue-800, #1849a9)" },
  graduated: { text: "Graduates", bg: "var(--success-50, #ecfdf3)", border: "var(--success-300, #6ce9a6)", color: "var(--success-700, #027a48)" },
  already_graduated: { text: "Already graduated", bg: "var(--gray-50, #f7f7f4)", border: "var(--gray-300, #c6c7bb)", color: "var(--gray-700, #454944)" },
  unrecognized: { text: "Needs review — unchanged", bg: "var(--error-25, #fdf7f5)", border: "var(--error-300, #e28f75)", color: "var(--error-700, #9a3922)" },
};

const StatusBadge = ({ status }) => {
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.unrecognized;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "var(--radius-full, 9999px)",
        border: `1px solid ${badge.border}`,
        background: badge.bg,
        color: badge.color,
        fontFamily: "Inter, sans-serif",
        fontSize: "12px",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {badge.text}
    </span>
  );
};

/**
 * "Fast forward" — bulk end-of-year grade advancement for every student in
 * the company. Grade is free text (no backend catalog), so the plan
 * (gradeAdvancementUtils) canonicalises each value and walks a fixed
 * PK3→PK4→K→1→...→12→Graduated sequence; unrecognized grade values are
 * shown for manual review and never touched.
 * Applies one PATCH /db_member/update-member-info per student that actually
 * changes (advanced/graduated) — there's no bulk-grade endpoint yet.
 */
const AdvanceGrades = ({ openModal, setOpenModal }) => {
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.admin);
  const { notify, contextHolder } = useStatusNotification();

  const membersQuery = useQuery({
    queryKey: ["allMembersForGradeAdvancement"],
    queryFn: () =>
      devitrakApi.post("/db_member/consulting-member", {
        company_id: user?.sqlInfo?.company_id,
      }),
    enabled: !!user?.sqlInfo?.company_id,
  });

  const members = useMemo(() => {
    const payload = membersQuery.data?.data;
    const list = payload?.members || payload?.data || payload;
    return Array.isArray(list) ? list : [];
  }, [membersQuery.data]);

  const plan = useMemo(() => buildGradeAdvancementPlan(members), [members]);
  const summary = useMemo(() => summarizeGradeAdvancementPlan(plan), [plan]);
  const toApply = useMemo(
    () => plan.filter((p) => p.status === "advanced" || p.status === "graduated"),
    [plan]
  );

  const applyMutation = useMutation({
    mutationFn: async (items) => {
      let succeeded = 0;
      let failed = 0;
      for (const item of items) {
        try {
          await devitrakApi.patch("/db_member/update-member-info", {
            member_id: item.member_id,
            company_id: user?.sqlInfo?.company_id,
            grade: item.nextGrade,
          });
          registerStaffActivity({
            action: "UPDATE",
            target_model: "Member",
            target_id: item.member_id,
            details: { grade: item.nextGrade, reason: "grade_advancement" },
          });
          succeeded += 1;
        } catch {
          failed += 1;
        }
      }
      return { succeeded, failed };
    },
    onSuccess: ({ succeeded, failed }) => {
      queryClient.invalidateQueries({ queryKey: ["allMembersForGradeAdvancement"], exact: true });
      queryClient.invalidateQueries({ queryKey: ["membersInfoQuery"], exact: true });
      if (failed > 0) {
        notify(
          "warning",
          "Grade advancement finished with errors",
          `${succeeded} student(s) updated, ${failed} failed. Please retry for the failed students.`,
        );
      } else {
        notify(
          "success",
          "Grades advanced",
          `${succeeded} student(s) updated successfully.`,
        );
        setOpenModal(false);
      }
    },
  });

  const columns = [
    {
      title: "Student",
      key: "student",
      render: (_, record) => (
        <Typography style={cellNameStyle}>
          {`${record.first_name} ${record.last_name}`.trim() || "—"}
        </Typography>
      ),
    },
    { title: "Current grade", dataIndex: "currentGrade", render: (v) => v || "—" },
    { title: "Next grade", dataIndex: "nextGrade", render: (v) => v || "—" },
    {
      title: "Result",
      key: "status",
      render: (_, record) => <StatusBadge status={record.status} />,
    },
  ];

  const body = (
    <Grid container margin={"15px 0 0 0"} padding={0} gap={0}>
      <Grid item xs={12} marginBottom={"0.75rem"}>
        <Typography>
          {summary.advanced} will advance a grade, {summary.graduated} will graduate,{" "}
          {summary.alreadyGraduated} already graduated (unchanged), {summary.unrecognized} have an
          unrecognized grade value and will be left unchanged for manual review.
        </Typography>
      </Grid>

      <BaseTable
        style={{ width: "100%" }}
        dataSource={plan}
        columns={columns}
        rowKey={(record) => record.member_id}
        className="table-ant-customized"
        enablePagination={true}
        pageSize={10}
        loading={membersQuery.isLoading}
      />

      <Grid item xs={12} marginTop={"0.5rem"}>
        <BlueButtonConfirmationComponent
          title={`Advance grades (${toApply.length} student${toApply.length === 1 ? "" : "s"})`}
          func={() => applyMutation.mutate(toApply)}
          styles={{ width: "100%" }}
          isDisabled={toApply.length === 0}
          isLoading={applyMutation.isPending}
          confirmationTitle={`Advance grades for ${toApply.length} student(s)?`}
          confirmationDescription="This updates each student's grade immediately. This action cannot be undone."
        />
      </Grid>
    </Grid>
  );

  return (
    <>
      {contextHolder}
      <ModalUX
        title={<p style={TextFontSize30LineHeight38}>Advance grades (fast forward)</p>}
        body={body}
        openDialog={openModal}
        closeModal={() => setOpenModal(false)}
        width={1000}
        footer={
          <GrayButtonComponent
            title="Refresh"
            iconLeading={<Icon icon="jam:refresh" />}
            func={() => membersQuery.refetch()}
            size="sm"
          />
        }
        modalStyles={{}}
      />
    </>
  );
};

export default AdvanceGrades;
