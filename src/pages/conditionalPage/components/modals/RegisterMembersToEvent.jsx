import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { notification, Tooltip, Typography } from "antd";
import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import PillUIComponent from "../../../../components/UX/Chip/PillUIComponent";
import ModalUX from "../../../../components/UX/modal/ModalUX";
import SelectableTable from "../../../../components/UX/tables/SelectableTable";
import { AntSelectorStyle } from "../../../../styles/global/AntSelectorStyle";
import {
  buildAttendanceEmail,
  buildConfirmationLink,
  getConfirmationRecipient,
} from "../../utils/eventRegistrationUtils";

/**
 * "Register [members] to event" — Members page action. Two steps in one
 * dialog: pick an active event, then pick members from the page's own
 * members table (same query/cache key as MainTable — no refetch). Sending
 * only emails an attendance-confirmation link per selected member; nothing
 * is persisted to the consumers collection here (that happens only when the
 * recipient confirms on the public /attendance-confirmation landing — see
 * AttendanceConfirmationLanding.jsx).
 */
const RegisterMembersToEvent = ({ openModal, setOpenModal, audienceLabel = "members" }) => {
  const { user } = useSelector((state) => state.admin);
  const [api, contextHolder] = notification.useNotification();
  const [selectedEventRaw, setSelectedEventRaw] = useState("");
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [sending, setSending] = useState(false);

  const selectedEvent = useMemo(() => {
    if (!selectedEventRaw) return null;
    try {
      return JSON.parse(selectedEventRaw);
    } catch {
      return null;
    }
  }, [selectedEventRaw]);

  // Same query + cache key precedent as AssignStaffMemberToEvent.jsx.
  const eventsQuery = useQuery({
    queryKey: ["eventsPerCompanyList"],
    queryFn: () =>
      devitrakApi.post("/event/event-list", {
        company: user.company,
        type: "event",
        active: true,
      }),
    refetchOnMount: false,
  });
  const listOfEvents = eventsQuery?.data?.data?.list ?? [];

  // Reuses MainTable's query/cache key on purpose — the members list was
  // already fetched to render the page behind this modal.
  const membersQuery = useQuery({
    queryKey: ["membersInfoQuery"],
    queryFn: () =>
      devitrakApi.post("/db_member/consulting-member", {
        company_id: user?.sqlInfo?.company_id,
      }),
    enabled: !!user?.sqlInfo?.company_id,
  });
  const rows = useMemo(() => {
    const members = membersQuery?.data?.data?.members ?? [];
    return members.map((member) => {
      const recipient = getConfirmationRecipient(member);
      return {
        ...member,
        key: member.member_id,
        _recipient: recipient,
      };
    });
  }, [membersQuery?.data]);

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedKeys.includes(row.key)),
    [rows, selectedKeys],
  );

  const closeModal = () => {
    setSelectedEventRaw("");
    setSelectedKeys([]);
    setOpenModal(false);
  };

  const handleSend = async () => {
    if (!selectedEvent || selectedRows.length === 0) return;
    setSending(true);
    const company = { id: user?.companyData?.id, name: user?.company };
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    const results = await Promise.allSettled(
      selectedRows.map(async (member) => {
        const recipient = member._recipient;
        if (recipient.error) {
          throw new Error(`${member.first_name} ${member.last_name}: ${recipient.error}`);
        }
        const confirmationLink = buildConfirmationLink(origin, member, selectedEvent, company);
        const email = buildAttendanceEmail({
          member,
          event: selectedEvent,
          recipient,
          confirmationLink,
        });
        // Payload envelope mirrors DeleteItemModal.jsx's use of the same
        // generic nodemailer endpoint.
        return devitrakApi.post("/nodemailer/internal-single-email-notification", {
          staff: email.to,
          subject: email.subject,
          message: email.message,
          company: user?.company,
        });
      }),
    );

    const failures = results
      .map((result, index) => ({ result, member: selectedRows[index] }))
      .filter(({ result }) => result.status === "rejected");

    setSending(false);
    api.open({
      message:
        failures.length === 0
          ? `${results.length} invitation(s) sent`
          : `${results.length - failures.length} of ${results.length} invitation(s) sent`,
      description:
        failures.length > 0
          ? failures
              .map(({ member, result }) => `${member.first_name} ${member.last_name}: ${result.reason?.message ?? "Send failed."}`)
              .join(" | ")
          : undefined,
    });

    if (failures.length === 0) {
      closeModal();
    } else {
      setSelectedKeys(failures.map(({ member }) => member.key));
    }
  };

  const columns = [
    {
      title: "Name",
      key: "name",
      render: (_, record) => `${record.first_name ?? ""} ${record.last_name ?? ""}`.trim(),
    },
    {
      title: "Email",
      key: "email",
      render: (_, record) =>
        record._recipient.isGuardian
          ? <Typography.Text type="secondary">{record.email || "—"}</Typography.Text>
          : record.email,
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        if (!record._recipient.isGuardian) return null;
        return (
          <PillUIComponent color={record._recipient.error ? "error" : "brand"} size="sm">
            {record._recipient.error ? "Minor — guardian email missing" : "Minor — guardian will be emailed"}
          </PillUIComponent>
        );
      },
    },
    {
      title: "Guardian email",
      key: "guardianEmail",
      render: (_, record) =>
        record._recipient.isGuardian ? record.parent_guardian_email || "—" : "—",
    },
  ];

  const body = (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <InputLabel style={{ marginBottom: "6px" }}>Event</InputLabel>
        <FormControl fullWidth>
          <Select
            className="custom-autocomplete"
            style={{ ...AntSelectorStyle, background: "#fff" }}
            value={selectedEventRaw}
            displayEmpty
            onChange={(e) => setSelectedEventRaw(e.target.value)}
          >
            <MenuItem disabled value="">
              Select an active event
            </MenuItem>
            {listOfEvents.map((item) => (
              <MenuItem key={item.id} value={JSON.stringify(item)}>
                {item.eventInfoDetail.eventName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      {selectedEvent && (
        <div>
          <InputLabel style={{ marginBottom: "6px" }}>
            Select {audienceLabel} to invite
          </InputLabel>
          <SelectableTable
            dataSource={rows}
            columns={columns}
            rowKey="key"
            loading={membersQuery.isLoading}
            selectionMode="multiple"
            selectedRowKeys={selectedKeys}
            onSelectionChange={(keys) => setSelectedKeys(keys)}
            rowSelectionConfig={{
              getCheckboxProps: (record) => ({
                disabled: Boolean(record._recipient.error),
              }),
              renderCell: (checked, record, index, originNode) =>
                record._recipient.error ? (
                  <Tooltip title="Missing guardian email — update the member first">
                    {originNode}
                  </Tooltip>
                ) : (
                  originNode
                ),
            }}
          />
        </div>
      )}
    </div>
  );

  return (
    <>
      {contextHolder}
      <ModalUX
        title={<p style={{ margin: 0, fontFamily: "Inter", fontSize: 18, fontWeight: 600 }}>
          Register {audienceLabel} to event
        </p>}
        body={body}
        openDialog={openModal}
        closeModal={closeModal}
        width={1000}
        footer={[
          <div key="footer" style={{ display: "flex", gap: 12, justifyContent: "flex-end", width: "100%" }}>
            <GrayButtonComponent title="Cancel" func={closeModal} />
            <BlueButtonComponent
              title={`Send invitation(s)${selectedRows.length ? ` (${selectedRows.length})` : ""}`}
              func={handleSend}
              disabled={!selectedEvent || selectedRows.length === 0}
              loadingState={sending}
            />
          </div>,
        ]}
      />
    </>
  );
};

RegisterMembersToEvent.propTypes = {
  openModal: PropTypes.bool.isRequired,
  setOpenModal: PropTypes.func.isRequired,
  audienceLabel: PropTypes.string,
};

export default RegisterMembersToEvent;
