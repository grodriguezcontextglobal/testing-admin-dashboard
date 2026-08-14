import { Icon } from "@iconify/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Drawer } from "antd";
import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import Input from "../../../../../components/UX/inputs/Input";
import { useStatusNotification } from "../../../../../components/notification/alerts/useStatusNotification";
import { formatDate } from "../../../../../components/utils/dateFormat";
import { onAddStaffProfile } from "../../../../../store/slices/staffDetailSlide";
import {
  classifyAssignmentError,
  getAssignmentErrorMessage,
} from "../../../../conditionalPage/utils/assignmentErrorUtils";
import { buildAssignmentRollbackPayload } from "../../../../conditionalPage/utils/leaseReturnUtils";
import useAssignmentConsentGate from "../hooks/useAssignmentConsentGate";
import { clean, resolveLocation } from "../utils/deviceProfileModel";
import "../deviceProfile.css";

/**
 * Assign this device, from the device.
 *
 * The only assignment path that existed ran person -> category -> location ->
 * starting serial -> quantity, with the address typed by hand. Standing in
 * front of the device, all of that is already known: quantity is one, the
 * serial is this page, and the location has a sensible default. What's left is
 * who, and when it's due.
 *
 * One search covers every kind of person so nobody has to know which table a
 * name lives in. Students and members are written here against the first-class
 * lease table; staff hand off to the staff flow, which still creates a
 * pseudo-event and is not worth a second implementation.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const isoDay = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 10);
};

const presetDate = (days) => isoDay(new Date(Date.now() + days * DAY_MS));

const fullName = (member) =>
  [clean(member?.first_name), clean(member?.last_name)].filter(Boolean).join(" ");

const initials = (label) =>
  String(label ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("") || "?";

const AssignDeviceDrawer = ({ open, onClose, item, onAssigned }) => {
  const { user } = useSelector((state) => state.admin);
  const companyId = user?.sqlInfo?.company_id;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify, contextHolder } = useStatusNotification();

  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState(null);
  const [dueDate, setDueDate] = useState(() => presetDate(14));
  const [where, setWhere] = useState(() => resolveLocation(item) ?? "");
  const [saving, setSaving] = useState(false);

  const rosterQuery = useQuery({
    queryKey: ["companyMemberRoster", String(companyId ?? "")],
    queryFn: () =>
      devitrakApi.post("/db_member/consulting-member", { company_id: companyId }),
    enabled: open && Boolean(companyId),
    staleTime: 5 * 60 * 1000,
  });

  const staffQuery = useQuery({
    queryKey: ["employeesPerCompanyList"],
    queryFn: () =>
      devitrakApi.post("/company/search-company", { _id: user?.companyData?.id }),
    enabled: open && Boolean(user?.companyData?.id),
    staleTime: 5 * 60 * 1000,
  });

  const people = useMemo(() => {
    const members = (rosterQuery.data?.data?.members ?? []).map((member) => ({
      kind: "member",
      id: member.member_id,
      label: fullName(member) || `Member #${member.member_id}`,
      meta: [clean(member.grade) && `Grade ${clean(member.grade)}`, clean(member.email)]
        .filter(Boolean)
        .join(" · "),
      chip: Number(member.minor) === 1 ? "Student" : "Member",
      raw: member,
    }));

    const staff = (staffQuery.data?.data?.company?.[0]?.employees ?? []).map(
      (employee) => ({
        kind: "staff",
        id: employee.user,
        label:
          [clean(employee.firstName), clean(employee.lastName)]
            .filter(Boolean)
            .join(" ") || clean(employee.user),
        meta: clean(employee.user),
        chip: "Staff",
        raw: employee,
      })
    );

    return [...members, ...staff];
  }, [rosterQuery.data, staffQuery.data]);

  const results = useMemo(() => {
    const needle = term.trim().toLowerCase();
    if (!needle) return people.slice(0, 8);
    return people
      .filter((person) =>
        `${person.label} ${person.meta}`.toLowerCase().includes(needle)
      )
      .slice(0, 12);
  }, [people, term]);

  const gate = useAssignmentConsentGate(
    selected?.kind === "member" ? selected.raw : null
  );

  const close = () => {
    if (saving) return;
    setTerm("");
    setSelected(null);
    onClose();
  };

  /**
   * Staff assignment still lives on the staff profile. Hydrate the same Redux
   * slice that flow reads from before navigating, otherwise it lands on an
   * empty form.
   */
  const handOffToStaff = async (person) => {
    try {
      setSaving(true);
      const [individual, companyInfo] = await Promise.all([
        devitrakApi.post("/staff/admin-users", { email: person.id }),
        devitrakApi.post("/company/search-company", { company_name: user.company }),
      ]);
      const adminUser = individual?.data?.adminUsers?.[0];
      const company = companyInfo?.data?.company?.[0];
      if (!adminUser || !company) {
        throw new Error("That staff member's profile could not be loaded.");
      }
      const employee = company.employees.find((entry) => entry.user === adminUser.email);
      dispatch(
        onAddStaffProfile({
          ...employee,
          email: employee?.user,
          adminUserInfo: adminUser,
          companyData: company,
        })
      );
      navigate(`/staff/${adminUser.id}/assignment`);
    } catch (error) {
      notify("error", error.message, "");
    } finally {
      setSaving(false);
    }
  };

  const assignToMember = async () => {
    const member = selected.raw;
    try {
      setSaving(true);
      const stamp = new Date().toISOString();

      // Verification first, deliberately. The member flow marks the device out
      // of the warehouse before creating its lease, so a failure between the
      // two leaves a unit that is missing from stock and held by nobody.
      const verification = await devitrakApi.post(
        "/document/verification/member/signed_document",
        {
          contract_list: [],
          date: stamp,
          company_id: companyId,
          member_id: member.member_id,
          assigner_staff_member_id: user.sqlMemberInfo.staff_id,
        }
      );
      const verificationId = verification?.data?.verificationInfo?._id;

      await devitrakApi.post("/db_item/item-out-warehouse", {
        warehouse: 0,
        logistic_status: "assigned",
        company_id: companyId,
        item_group: item.item_group,
        category_name: item.category_name,
        data: [item.serial_number],
      });

      // Moving verification first was not enough: the warehouse write above still
      // lands before the lease, so anything that rejects the lease — a minor
      // without recorded consent answers CONSENT_REQUIRED — used to leave this
      // unit out of stock and held by nobody. Put it back before reporting.
      try {
        const lease = await devitrakApi.post(
          "/db_member/new-member-assigned-device-lease",
          {
            staff_member_id: user.sqlMemberInfo.staff_id,
            company_id: companyId,
            location: where,
            member_id: member.member_id,
            device_id: item.item_id,
            verification_id: verificationId,
            expected_return_date: formatDate(new Date(dueDate)),
            returned: 0,
            assigned_date: formatDate(new Date()),
          }
        );
        if (!lease?.data?.ok) throw new Error("Failed to create the device lease record.");
      } catch (error) {
        const rollback = buildAssignmentRollbackPayload({
          serials: [item.serial_number],
          itemGroup: item.item_group,
          categoryName: item.category_name,
          companyId,
        });
        if (rollback) {
          try {
            await devitrakApi.post("/db_item/item-out-warehouse", rollback);
          } catch {
            // Best-effort undo. When it fails too, inventory disagrees with
            // reality and only a human can reconcile it, so say which unit.
            error.strandedSerials = [item.serial_number];
          }
        }
        throw error;
      }

      ["trackingItemActivity", "infoItemSql", "deviceMemberLeases", "memberAssignedDevices", "listOfItemsInStock"].forEach(
        (key) => queryClient.invalidateQueries({ queryKey: [key] })
      );

      notify("success", `${item.serial_number} assigned to ${selected.label}.`, "");
      onAssigned?.();
      close();
    } catch (error) {
      const base = getAssignmentErrorMessage(classifyAssignmentError(error));
      const message = error.strandedSerials?.length
        ? `${base} WARNING: ${error.strandedSerials.join(
            ", "
          )} could not be returned to stock — fix it in inventory before assigning again.`
        : base;
      notify("error", message, "");
    } finally {
      setSaving(false);
    }
  };

  const canAssign =
    selected?.kind === "member" && !gate.blocking && Boolean(dueDate) && !saving;

  return (
    <Drawer
      open={open}
      onClose={close}
      width={452}
      title={`Assign ${clean(item.serial_number) || "device"}`}
      maskClosable={!saving}
      destroyOnClose
    >
      {contextHolder}
      <div className="assign-drawer">
        <p className="assign-drawer__sub">
          {clean(item.item_group)} · in stock at {resolveLocation(item) ?? "an unrecorded location"}
        </p>

        <div className="assign-field">
          <label htmlFor="assign-who">Who&apos;s taking it</label>
          <Input
            id="assign-who"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search students, members and staff"
            disabled={saving}
            fullWidth
          />
          <span className="assign-hint">
            One search across every kind of person — the record type is a result,
            not a decision you make first.
          </span>
        </div>

        {(rosterQuery.isLoading || staffQuery.isLoading) && (
          <p className="assign-hint">Loading people…</p>
        )}

        <div className="assign-results">
          {results.length === 0 && !rosterQuery.isLoading && (
            <p className="assign-hint">Nobody matches “{term}”.</p>
          )}
          {results.map((person) => {
            const active =
              selected?.kind === person.kind && String(selected?.id) === String(person.id);
            return (
              <button
                type="button"
                key={`${person.kind}-${person.id}`}
                className={`assign-result${active ? " is-selected" : ""}`}
                onClick={() => setSelected(person)}
                disabled={saving}
              >
                <span className="assign-result__avatar">{initials(person.label)}</span>
                <span className="assign-result__body">
                  <span className="assign-result__name">{person.label}</span>
                  {person.meta && (
                    <span className="assign-result__meta">{person.meta}</span>
                  )}
                </span>
                <span className={`assign-chip assign-chip--${person.kind}`}>
                  {person.chip}
                </span>
                {active && (
                  <Icon
                    icon="tabler:check"
                    width={18}
                    color="var(--blue-dark-600, #155dee)"
                  />
                )}
              </button>
            );
          })}
        </div>

        {selected?.kind === "staff" && (
          <div className="assign-notice assign-notice--info">
            <Icon icon="tabler:info-circle" width={17} />
            <span>
              Staff assignments run through the staff profile, which also handles
              their liability contract. We&apos;ll take you there with{" "}
              {clean(item.serial_number)} in hand.
            </span>
          </div>
        )}

        {selected?.kind === "member" && gate.message && (
          <div className={`assign-notice assign-notice--${gate.tone}`}>
            <Icon
              icon={gate.blocking ? "tabler:alert-triangle" : "tabler:shield-check"}
              width={17}
            />
            <span>
              {gate.title && <strong>{gate.title}. </strong>}
              {gate.message}
              {gate.fixHref && (
                <>
                  {" "}
                  <a href={gate.fixHref}>Fix this first</a>.
                </>
              )}
            </span>
          </div>
        )}

        {selected?.kind === "member" && (
          <>
            <div className="assign-field">
              <label htmlFor="assign-due">Due back</label>
              <div className="assign-presets">
                {[
                  { label: "1 week", days: 7 },
                  { label: "2 weeks", days: 14 },
                  { label: "30 days", days: 30 },
                ].map((preset) => (
                  <button
                    type="button"
                    key={preset.days}
                    className={`assign-preset${
                      dueDate === presetDate(preset.days) ? " is-active" : ""
                    }`}
                    onClick={() => setDueDate(presetDate(preset.days))}
                    disabled={saving}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <Input
                id="assign-due"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                disabled={saving}
                fullWidth
              />
              <span className="assign-hint">
                Required. This is what drives overdue alerts — without it every
                loan reads as due the day it was made.
              </span>
            </div>

            <div className="assign-field">
              <label htmlFor="assign-where">Where it&apos;ll be used</label>
              <Input
                id="assign-where"
                value={where}
                onChange={(event) => setWhere(event.target.value)}
                placeholder="e.g. Lincoln High School, Room 214"
                disabled={saving}
                fullWidth
              />
              <span className="assign-hint">Prefilled from the device&apos;s current location.</span>
            </div>
          </>
        )}

        <div className="assign-foot">
          <GrayButtonComponent title="Cancel" func={close} disabled={saving} />
          {selected?.kind === "staff" ? (
            <BlueButtonComponent
              title={`Continue on ${selected.label}'s profile`}
              func={() => handOffToStaff(selected)}
              loadingState={saving}
              disabled={saving}
            />
          ) : (
            <BlueButtonComponent
              title={
                selected ? `Assign to ${selected.label}` : "Pick someone to assign to"
              }
              func={assignToMember}
              loadingState={saving}
              disabled={!canAssign}
            />
          )}
        </div>
      </div>
    </Drawer>
  );
};

AssignDeviceDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  item: PropTypes.object.isRequired,
  onAssigned: PropTypes.func,
};

AssignDeviceDrawer.defaultProps = {
  open: false,
  onAssigned: null,
};

export default AssignDeviceDrawer;
