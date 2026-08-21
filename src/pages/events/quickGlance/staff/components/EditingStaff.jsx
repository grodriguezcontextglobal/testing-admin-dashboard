import { OutlinedInput } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar } from "antd";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { useStatusNotification } from "../../../../../components/notification/alerts/useStatusNotification";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import DangerButtonConfirmationComponent from "../../../../../components/UX/buttons/DangerButtonConfirmation";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import EmptyState from "../../../../../components/UX/emptyState/EmptyState";
import ModalUX from "../../../../../components/UX/modal/ModalUX";
import {
  ProfileErrorState,
  ProfileSkeleton,
  StatusChip,
} from "../../../../../components/UX/profile";
import BaseTable from "../../../../../components/UX/tables/BaseTable";
import {
  onAddEventData,
  onAddEventStaff,
} from "../../../../../store/slices/eventSlice";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import clearCacheMemory from "../../../../../utils/actions/clearCacheMemory";
import {
  buildEmployeeEntry,
  buildInvitationLink,
} from "../../../../staff/action/utils/newStaffMemberUtils";
import "../eventStaff.css";
import {
  EVENT_STAFF_ROLES,
  buildStaffPayload,
  describeEmailLookup,
  isValidEmail,
  mergeEventStaff,
  validateNewStaff,
} from "../utils/eventStaffUtils";

/**
 * Manage an event's staff: add someone, or take someone off.
 *
 * The modal had no title, opened with the fields in the order the code needed
 * rather than the order a person fills them, put its actions left-aligned with
 * Cancel rendered as a destructive red button, and listed the existing staff as
 * antd Cards whose most prominent text was the role — "Administrator" as the
 * card title, the person's name buried in the body.
 *
 * It is two jobs, so it is two labelled sections: add someone, then who is
 * already here. Within the first, email comes first because the answer decides
 * whether a name is needed at all — the old form asked for the email, showed a
 * warning, and then asked for first and last name unconditionally, marked
 * `required`, so adding an existing colleague meant retyping a name the company
 * already had on file.
 *
 * Behaviour fixed along the way:
 *
 *  - A person invited to the company from here was created with `role: 4`,
 *    which `buildEmployeeEntry` maps through LEGACY_ROLE_MAP to
 *    **inventory_manager**. Every event assistant invited through this modal
 *    got company-wide inventory-manager permissions. They are created as
 *    `assistant` (5) now — least privilege; an event role is granted by the
 *    event's own staff lists, not by the company entry.
 *  - The role Select offered three options, but only "administrator" was ever
 *    compared. "Event assistant/staff (remove when event finishes)" was
 *    byte-for-byte identical to the plain assistant option and promised a
 *    clean-up nothing implemented. Two roles now, each stating what it can do.
 *  - The email lookup ran on every keystroke, and its effect depended on
 *    `watch("email")?.length` — so editing `a@b.com` into `x@y.com` never
 *    re-checked, because the length had not changed. Debounced, and keyed on
 *    the value.
 *  - Submitting read `checkingStaffInfo[0].company` unguarded, so submitting
 *    before the lookup resolved threw a TypeError instead of validating.
 *  - `checkStatusAndUpdate` mutated the query response in place
 *    (`employeesList[index].active = true`).
 *  - Adding staff invalidated `["staffEvent"]` but not `["newEndpointQuery"]`,
 *    which is what the staff table behind this modal actually reads — so the
 *    table still showed the old list after the modal closed.
 *  - The whole component returned `undefined` until its query resolved, so
 *    opening it showed nothing at all.
 *  - `removeStaff` had no error handling: a failed removal left the member on
 *    screen with no indication that anything had gone wrong.
 */

/** Least privilege for someone who only needs to exist in the company. */
const COMPANY_ROLE_ASSISTANT = 5;

const EditingStaff = ({ editingStaff, setEditingStaff }) => {
  const { event } = useSelector((state) => state.event);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { notify, contextHolder } = useStatusNotification();

  const [email, setEmail] = useState("");
  const [debouncedEmail, setDebouncedEmail] = useState("");
  const [role, setRole] = useState(null);
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [problems, setProblems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [removingEmail, setRemovingEmail] = useState(null);

  const accountsQuery = useQuery({
    queryKey: ["eventStaffAccounts"],
    queryFn: () => devitrakApi.get("/staff/admin-users"),
    staleTime: 1000 * 60 * 5,
  });

  // One request per pause in typing, not one per character.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedEmail(email.trim()), 350);
    return () => clearTimeout(timer);
  }, [email]);

  const lookupQuery = useQuery({
    queryKey: ["companyMemberLookup", event?.company, debouncedEmail],
    queryFn: () =>
      devitrakApi.post("company/search-company", {
        company_name: event.company,
        "employees.user": debouncedEmail,
      }),
    enabled: Boolean(event?.company) && isValidEmail(debouncedEmail),
  });

  const lookedUpCompany = lookupQuery.data?.data?.company?.[0] ?? null;
  const hint = describeEmailLookup({
    email,
    // Treat a stale debounce as "still checking", so the hint never claims a
    // result for an address the user has already edited.
    isChecking: lookupQuery.isFetching || debouncedEmail !== email.trim(),
    found: Boolean(lookedUpCompany),
    companyName: event?.company,
  });
  const needsCreation = Boolean(hint?.needsCreation);

  const members = useMemo(
    () =>
      mergeEventStaff({
        event,
        adminUsers: accountsQuery.data?.data?.adminUsers,
      }),
    [event, accountsQuery.data]
  );

  const close = () => setEditingStaff(false);

  const applyEventStaff = async (payload) => {
    const response = await devitrakApi.patch(
      `/event/edit-event/${event.id}`,
      payload
    );
    dispatch(onAddEventData(response.data.event));
    dispatch(onAddEventStaff(response.data.event.staff));
    await clearCacheMemory(`event_staff_info=${event.id}`);
    // `newEndpointQuery` is what StaffTable reads; without it the table behind
    // this modal kept showing the pre-change list.
    queryClient.invalidateQueries({ queryKey: ["newEndpointQuery"] });
    queryClient.invalidateQueries({ queryKey: ["eventStaffAccounts"] });
  };

  const inviteToCompany = async () => {
    const companiesQuery = await devitrakApi.post("company/search-company", {
      company_name: event.company,
    });
    const hostCompany = companiesQuery.data.company[0];
    const invitee = {
      name,
      lastName,
      email: email.trim(),
      role: COMPANY_ROLE_ASSISTANT,
    };

    await devitrakApi.patch(`/company/update-company/${hostCompany.id}`, {
      employees: [...hostCompany.employees, buildEmployeeEntry(invitee)],
    });

    await devitrakApi.post("/nodemailer/new_invitation", {
      consumer: invitee.email,
      subject: "Invitation",
      company: event.company,
      link: buildInvitationLink({
        ...invitee,
        company: event.company,
        companyId: hostCompany.id,
      }),
    });

    ["listAdminUsers", "staff", "employeesPerCompanyList"].forEach((queryKey) =>
      queryClient.invalidateQueries({ queryKey: [queryKey], exact: true })
    );
  };

  /** Reactivate an existing company employee, without mutating the response. */
  const reactivateExistingEmployee = async () => {
    const employees = lookedUpCompany.employees ?? [];
    const index = employees.findIndex(
      (entry) => String(entry.user).toLowerCase() === email.trim().toLowerCase()
    );
    if (index < 0) return;

    await devitrakApi.patch(`/company/update-company/${lookedUpCompany.id}`, {
      employees: employees.map((entry, position) =>
        position === index ? { ...entry, active: true } : entry
      ),
    });
  };

  const submit = async () => {
    const validation = validateNewStaff({
      email,
      role,
      needsCreation,
      name,
      lastName,
      existingEmails: members.map((member) => member.email),
    });
    setProblems(validation.problems);
    if (!validation.ok) return;

    setIsSaving(true);
    try {
      if (needsCreation) await inviteToCompany();
      else if (lookedUpCompany) await reactivateExistingEmployee();

      await applyEventStaff(
        buildStaffPayload({
          event,
          action: "add",
          role,
          member: { firstName: name, lastName, email: email.trim() },
        })
      );

      try {
        await devitrakApi.post("/nodemailer/staff_internal_notification", {
          staff: email.trim(),
          subject: `Invitation to Join ${event.eventInfoDetail.eventName} as a Staff Member`,
          company: event.company,
          staffMember: `${name} ${lastName}`.trim() || email.trim(),
          eventInfo: {
            eventName: event.eventInfoDetail.eventName,
            address: event.eventInfoDetail.address,
            dateBegin: event.eventInfoDetail.dateBegin,
          },
          contactInfo: {
            name: event.contactInfo?.name,
            email: event.contactInfo?.email,
          },
        });
      } catch (error) {
        // They are on the event; a failed notice is not a failed addition.
        notify("warning", "Added to the event, but the email did not send.");
      }

      notify("success", `${email.trim()} added to this event.`);
      setEmail("");
      setRole(null);
      setName("");
      setLastName("");
      setProblems([]);
    } catch (error) {
      // The old handler only cleared the spinner.
      setProblems([
        "Could not add this person to the event. Nothing was changed — check the email and try again.",
      ]);
      notify("error", "The staff member was not added.");
    } finally {
      setIsSaving(false);
    }
  };

  const removeMember = async (member) => {
    setRemovingEmail(member.email);
    try {
      await applyEventStaff(
        buildStaffPayload({ event, action: "remove", role: member.role, member })
      );
      notify("success", `${member.name || member.email} removed from this event.`);
    } catch (error) {
      notify("error", "Could not remove this person. Nothing was changed.");
    } finally {
      setRemovingEmail(null);
    }
  };

  const columns = [
    {
      title: "Member",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => String(a.name).localeCompare(b.name),
      render: (_, member) => {
        const initials = (member.name || member.email)
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase())
          .join("");
        return (
          <div className="staff-member">
            <Avatar
              size={36}
              style={{
                backgroundColor: "var(--action-600, #155eef)",
                color: "#fff",
                fontWeight: 600,
                flex: "none",
              }}
            >
              {initials}
            </Avatar>
            <div className="staff-member__text">
              <p className="staff-member__name">{member.name || "—"}</p>
              <p className="staff-member__email">{member.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: "22%",
      responsive: ["sm"],
      sorter: (a, b) => String(a.role).localeCompare(b.role),
      render: (memberRole) => (
        <StatusChip
          tone={memberRole === "Administrator" ? "action" : "neutral"}
          label={memberRole}
        />
      ),
    },
    {
      title: "Account",
      dataIndex: "hasAccount",
      key: "hasAccount",
      width: "20%",
      responsive: ["md"],
      render: (hasAccount, member) =>
        hasAccount ? (
          <StatusChip
            tone={member.online ? "success" : "neutral"}
            pip
            label={member.online ? "Online" : "Offline"}
          />
        ) : (
          // Someone added to the event who has not accepted their invitation
          // yet. The old list showed them identically to an active member.
          <StatusChip tone="warning" label="Invite pending" />
        ),
    },
    {
      title: "",
      key: "actions",
      align: "right",
      width: "16%",
      render: (_, member) => (
        <span className="profile-row-actions">
          <DangerButtonConfirmationComponent
            title="Remove"
            size="sm"
            loadingState={removingEmail === member.email}
            confirmationTitle={`Remove ${member.name || member.email}?`}
            confirmationDescription="They lose access to this event. Their company account is untouched."
            okText="Remove"
            func={() => removeMember(member)}
          />
        </span>
      ),
    },
  ];

  const HintIcon = () => {
    if (hint?.tone === "success") return <Check size={15} style={{ flex: "none" }} />;
    if (hint?.tone === "warning")
      return <AlertTriangle size={15} style={{ flex: "none" }} />;
    return (
      <Loader2 size={15} style={{ flex: "none" }} className="staff-hint__spin" />
    );
  };

  const body = () => {
    if (accountsQuery.isLoading) return <ProfileSkeleton lines={4} />;

    if (accountsQuery.isError) {
      return (
        <ProfileErrorState
          title="Couldn't load the staff list"
          description="The staff service didn't respond, so who is on this event is unknown. Nothing was changed."
          action={
            <GrayButtonComponent
              title="Try again"
              func={() => accountsQuery.refetch()}
            />
          }
        />
      );
    }

    return (
      <div className="staff-editor">
        <p className="staff-editor__intro">
          Staff added here can work {event?.eventInfoDetail?.eventName} only.
          Removing someone does not touch their {event?.company} account.
        </p>

        {/* ── Add someone ─────────────────────────────────────────────── */}
        <section className="staff-section">
          <div className="staff-section__head">
            <h3 className="staff-section__title">Add someone</h3>
          </div>

          {/* Email first: the answer decides whether a name is needed. */}
          <div className="staff-field">
            <label className="staff-field__label" htmlFor="staff-email">
              Work email
            </label>
            <OutlinedInput
              id="staff-email"
              type="email"
              size="small"
              fullWidth
              autoFocus
              placeholder="name@company.com"
              value={email}
              onChange={(changeEvent) => {
                setEmail(changeEvent.target.value);
                setProblems([]);
              }}
              style={OutlinedInputStyle}
            />
            {hint && (
              <p className={`staff-hint staff-hint--${hint.tone}`}>
                <HintIcon />
                {hint.message}
              </p>
            )}
          </div>

          {/* Asked for only when the person has to be created. */}
          {needsCreation && (
            <div className="staff-field__row">
              <div className="staff-field">
                <label className="staff-field__label" htmlFor="staff-first-name">
                  First name
                </label>
                <OutlinedInput
                  id="staff-first-name"
                  size="small"
                  value={name}
                  onChange={(changeEvent) => setName(changeEvent.target.value)}
                  style={OutlinedInputStyle}
                />
              </div>
              <div className="staff-field">
                <label className="staff-field__label" htmlFor="staff-last-name">
                  Last name
                </label>
                <OutlinedInput
                  id="staff-last-name"
                  size="small"
                  value={lastName}
                  onChange={(changeEvent) => setLastName(changeEvent.target.value)}
                  style={OutlinedInputStyle}
                />
              </div>
            </div>
          )}

          <div className="staff-field">
            <span className="staff-field__label">Role on this event</span>
            <div className="staff-roles" role="radiogroup" aria-label="Role on this event">
              {EVENT_STAFF_ROLES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={role === option.value}
                  className={`staff-role${
                    role === option.value ? " is-selected" : ""
                  }`}
                  onClick={() => {
                    setRole(option.value);
                    setProblems([]);
                  }}
                >
                  <span className="staff-role__name">
                    {role === option.value && <Check size={15} />}
                    {option.label}
                  </span>
                  <span className="staff-role__description">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {problems.length > 0 && (
            <ul className="staff-problems" role="alert">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          )}

          <div className="staff-editor__footer">
            <GrayButtonComponent title="Cancel" func={close} />
            <BlueButtonComponent
              title={needsCreation ? "Invite and add to event" : "Add to event"}
              loadingState={isSaving}
              func={submit}
            />
          </div>
        </section>

        {/* ── Who is already here ─────────────────────────────────────── */}
        <section className="staff-section">
          <div className="staff-section__head">
            <h3 className="staff-section__title">On this event</h3>
            <span className="staff-section__count">
              {members.length} {members.length === 1 ? "person" : "people"}
            </span>
          </div>
          {members.length === 0 ? (
            <EmptyState
              compact
              icon="tabler:users-minus"
              title="Nobody is staffing this event yet"
              description="Add the first person above."
            />
          ) : (
            <BaseTable
              className="profile-table"
              columns={columns}
              dataSource={members}
              enablePagination={members.length > 8}
              pageSize={8}
            />
          )}
        </section>
      </div>
    );
  };

  return (
    <>
      {contextHolder}
      <ModalUX
        title="Event staff"
        openDialog={editingStaff}
        closeModal={close}
        width={760}
        footer={[]}
        modalStyles={{ top: "5dvh" }}
        body={body()}
      />
    </>
  );
};

EditingStaff.propTypes = {
  editingStaff: PropTypes.bool.isRequired,
  setEditingStaff: PropTypes.func.isRequired,
};

export default EditingStaff;
