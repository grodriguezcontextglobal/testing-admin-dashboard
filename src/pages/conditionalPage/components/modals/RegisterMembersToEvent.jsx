import { useQuery } from "@tanstack/react-query";
import { Tooltip } from "antd";
import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import renderingTitle from "../../../../components/general/renderingTitle";
import { useStatusNotification } from "../../../../components/notification/alerts/useStatusNotification";
import BlueButtonConfirmationComponent from "../../../../components/UX/buttons/BlueButtonConfirmation";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import SelectComponent from "../../../../components/UX/dropdown/SelectComponent";
import Input from "../../../../components/UX/inputs/Input";
import Label from "../../../../components/UX/inputs/Label";
import ModalUX from "../../../../components/UX/modal/ModalUX";
import {
  ProfileErrorState,
  ProfileStatTiles,
  StatusChip,
} from "../../../../components/UX/profile";
import SelectableTable from "../../../../components/UX/tables/SelectableTable";
import "../../../../styles/global/actionForm.css";
import {
  buildAttendanceEmail,
  buildConfirmationLink,
  filterInviteRows,
  getConfirmationRecipient,
  inviteSelectionCounts,
  selectableInviteKeys,
} from "../../utils/eventRegistrationUtils";

const stepClass = (done) =>
  `action-form__step${done ? " action-form__step--done" : ""}`;

/**
 * "Register [members] to event" — a Members page action.
 *
 * Two steps in one dialog: pick an active event, then pick members from the
 * page's own members table (same query/cache key as MainTable — no refetch).
 * Sending only emails an attendance-confirmation link per selected member;
 * nothing is persisted to the consumers collection here. A member becomes an
 * attendee only when the recipient confirms on the public landing page — see
 * AttendanceConfirmationLanding.jsx.
 *
 * The table had no search, which is workable for a demo company and not for a
 * school with eight hundred students in one list of checkboxes, and no count of
 * the members it had quietly disabled — a run that left out thirty minors with
 * no guardian email on file looked exactly like one that left out none. It also
 * sent to everyone selected the moment the button was pressed; outbound email
 * to a few hundred guardians now asks first.
 */
const RegisterMembersToEvent = ({ openModal, setOpenModal, audienceLabel = "members" }) => {
  const { user } = useSelector((state) => state.admin);
  const { notify, contextHolder } = useStatusNotification();

  const [selectedEventOption, setSelectedEventOption] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);

  const selectedEvent = selectedEventOption?.original ?? null;

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
    return members.map((member) => ({
      ...member,
      key: member.member_id,
      _recipient: getConfirmationRecipient(member),
    }));
  }, [membersQuery?.data]);

  const visibleRows = useMemo(() => filterInviteRows(rows, search), [rows, search]);
  const counts = useMemo(
    () => inviteSelectionCounts(rows, selectedKeys),
    [rows, selectedKeys]
  );
  const selectedRows = useMemo(
    () => rows.filter((row) => selectedKeys.includes(row.key)),
    [rows, selectedKeys]
  );

  const closeModal = () => {
    if (sending) return;
    setSelectedEventOption(null);
    setSelectedKeys([]);
    setSearch("");
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
        // customize-message-notification (not the generic send-notification)
        // because its controller renders a custom HTML template rather than
        // wrapping the body in the default one. `staff` is the recipient field
        // that endpoint expects — the name is historical, not a role.
        return devitrakApi.post("/nodemailer/customize-message-notification", {
          staff: email.to,
          subject: email.subject,
          message: email.message,
          company: user?.company,
        });
      })
    );

    const failures = results
      .map((result, index) => ({ result, member: selectedRows[index] }))
      .filter(({ result }) => result.status === "rejected");

    setSending(false);
    notify(
      failures.length === 0 ? "success" : "warning",
      failures.length === 0
        ? `${results.length} invitation${results.length === 1 ? "" : "s"} sent`
        : `${results.length - failures.length} of ${results.length} invitations sent`,
      failures.length > 0
        ? failures
            .map(
              ({ member, result }) =>
                `${member.first_name} ${member.last_name}: ${
                  result.reason?.message ?? "Send failed."
                }`
            )
            .join(" · ")
        : undefined
    );

    if (failures.length === 0) {
      closeModal();
    } else {
      // Leave only what did not go out selected, so pressing again retries
      // exactly those and does not email anyone twice.
      setSelectedKeys(failures.map(({ member }) => member.key));
    }
  };

  const columns = [
    {
      title: "Name",
      key: "name",
      render: (_, record) =>
        `${record.first_name ?? ""} ${record.last_name ?? ""}`.trim() || "—",
    },
    {
      title: "Invitation goes to",
      key: "recipient",
      render: (_, record) => record._recipient.email || "—",
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        if (record._recipient.error) {
          return <StatusChip label="No guardian email on file" tone="critical" pip />;
        }
        if (record._recipient.isGuardian) {
          return <StatusChip label="Minor — guardian" tone="warning" pip />;
        }
        return <StatusChip label="Member" tone="neutral" />;
      },
    },
  ];

  const body = (
    <div className="action-form">
      {contextHolder}

      <p className="action-form__lead">
        Each selected {audienceLabel.replace(/s$/, "")} is emailed a link to
        confirm attendance. Nobody is registered until they confirm.
      </p>

      {/* 1 — the event */}
      <section className={stepClass(Boolean(selectedEvent))}>
        <div className="action-form__step-head">
          <h3 className="action-form__step-title">
            <span className="action-form__step-index">1</span>
            Which event
          </h3>
        </div>

        {eventsQuery.isError ? (
          <ProfileErrorState
            title="Couldn't load the events"
            description="The service didn't respond. Nothing was changed."
          />
        ) : listOfEvents.length === 0 && !eventsQuery.isLoading ? (
          <p className="action-form__empty">There are no active events to invite to.</p>
        ) : (
          <SelectComponent
            placeholder="Search active events…"
            items={listOfEvents.map((event) => ({
              id: event.id,
              label: event.eventInfoDetail.eventName,
              original: event,
            }))}
            value={selectedEventOption}
            onSelect={(option) => setSelectedEventOption(option ?? null)}
            isRequired
          />
        )}
      </section>

      {/* 2 — who goes */}
      {selectedEvent && (
        <section className={stepClass(counts.selected > 0)}>
          <div className="action-form__step-head">
            <h3 className="action-form__step-title">
              <span className="action-form__step-index">2</span>
              Who to invite
            </h3>
          </div>

          {membersQuery.isError ? (
            <ProfileErrorState
              title={`Couldn't load the ${audienceLabel}`}
              description="The service didn't respond. Nothing was changed."
            />
          ) : (
            <>
              <ProfileStatTiles
                tiles={[
                  { label: "Selected", value: counts.selected },
                  { label: "Can be invited", value: counts.selectable },
                  {
                    label: "Missing an email",
                    value: counts.blocked,
                    tone: counts.blocked > 0 ? "critical" : "neutral",
                  },
                ]}
              />

              <div className="action-form__field">
                <Label htmlFor="invite-search">Search</Label>
                <Input
                  id="invite-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Name, email or guardian email"
                  disabled={sending}
                />
              </div>

              <div className="action-form__toolbar">
                <p className="action-form__count">
                  <strong>{visibleRows.length}</strong> of {counts.total}{" "}
                  {audienceLabel}
                </p>
                <GrayButtonComponent
                  size="sm"
                  buttonType="button"
                  disabled={sending || counts.selectable === 0}
                  title={
                    counts.selected === counts.selectable
                      ? "Clear selection"
                      : `Select all ${counts.selectable} that can be invited`
                  }
                  func={() =>
                    setSelectedKeys(
                      counts.selected === counts.selectable ? [] : selectableInviteKeys(rows)
                    )
                  }
                />
              </div>

              <div className="action-form__scroll">
                <SelectableTable
                  dataSource={visibleRows}
                  columns={columns}
                  rowKey="key"
                  loading={membersQuery.isLoading}
                  selectionMode="multiple"
                  selectedRowKeys={selectedKeys}
                  onSelectionChange={setSelectedKeys}
                  rowSelectionConfig={{
                    getCheckboxProps: (record) => ({
                      disabled: Boolean(record._recipient.error) || sending,
                    }),
                    renderCell: (checked, record, index, originNode) =>
                      record._recipient.error ? (
                        <Tooltip title="Add a guardian email to this member first">
                          {originNode}
                        </Tooltip>
                      ) : (
                        originNode
                      ),
                  }}
                />
              </div>
            </>
          )}
        </section>
      )}

      <div className="action-form__footer">
        <p className="action-form__consequence">
          {counts.blocked > 0
            ? `${counts.blocked} ${audienceLabel} cannot be invited until a guardian email is on file.`
            : "Emails go out immediately and cannot be recalled."}
        </p>
        <GrayButtonComponent
          title="Cancel"
          buttonType="button"
          disabled={sending}
          func={closeModal}
        />
        <BlueButtonConfirmationComponent
          title={
            counts.selected > 0
              ? `Send ${counts.selected} invitation${counts.selected === 1 ? "" : "s"}`
              : "Send invitations"
          }
          buttonType="button"
          disabled={!selectedEvent || counts.selected === 0 || sending}
          loadingState={sending}
          confirmationTitle={`Email ${counts.selected} invitation${
            counts.selected === 1 ? "" : "s"
          }?`}
          confirmationDescription={`They go out now for ${
            selectedEventOption?.label ?? "the event"
          } and cannot be recalled.`}
          okText="Send"
          func={handleSend}
        />
      </div>
    </div>
  );

  return (
    <ModalUX
      title={renderingTitle(`Register ${audienceLabel} to event`)}
      body={body}
      openDialog={openModal}
      closeModal={closeModal}
      closable={!sending}
      width={1000}
      footer={null}
    />
  );
};

RegisterMembersToEvent.propTypes = {
  openModal: PropTypes.bool.isRequired,
  setOpenModal: PropTypes.func.isRequired,
  audienceLabel: PropTypes.string,
};

export default RegisterMembersToEvent;
