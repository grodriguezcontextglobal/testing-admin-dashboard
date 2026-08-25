import { MenuItem, Select } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import renderingTitle from "../../../../../../components/general/renderingTitle";
import { useStatusNotification } from "../../../../../../components/notification/alerts/useStatusNotification";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import DangerButtonConfirmationComponent from "../../../../../../components/UX/buttons/DangerButtonConfirmation";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import CheckboxReusableComponent from "../../../../../../components/UX/checkbox/CheckboxReusableComponent";
import Label from "../../../../../../components/UX/inputs/Label";
import ModalUX from "../../../../../../components/UX/modal/ModalUX";
import { ProfileSkeleton, StatusChip } from "../../../../../../components/UX/profile";
import BaseTable from "../../../../../../components/UX/tables/BaseTable";
import { ROLE_LEVELS, resolveRoleType } from "../../../../../../config/roles";
import { onAddStaffProfile } from "../../../../../../store/slices/staffDetailSlide";
import { AntSelectorStyle } from "../../../../../../styles/global/AntSelectorStyle";
import "../../../../../../styles/global/actionForm.css";

/** What each permission lets this person do inside one location. */
const PERMISSION_FIELDS = [
  { perm: "view", tone: "neutral", hint: "See the items held here." },
  { perm: "create", tone: "success", hint: "Add new items to this location." },
  { perm: "update", tone: "neutral", hint: "Edit items that are here." },
  { perm: "assign", tone: "warning", hint: "Hand items out from here." },
  { perm: "transfer", tone: "warning", hint: "Move items in and out." },
  { perm: "delete", tone: "critical", hint: "Delete items from this location." },
];

const EMPTY_PERMISSIONS = {
  view: true,
  create: false,
  update: false,
  assign: false,
  transfer: false,
  delete: false,
};

const titleCase = (value) => value.charAt(0).toUpperCase() + value.slice(1);

/**
 * Which locations this person can work in, and what they may do in each.
 *
 * The screen was two stacked cards on a bare route, with no way back to the
 * profile. It is a modal over the profile now, and the three things it got
 * wrong are fixed:
 *
 *   - Removing a location assignment was a plain danger button with no
 *     confirmation, and — unlike saving — it never updated the Redux profile,
 *     so the removed location stayed on screen until a reload.
 *   - The permission checkboxes were spread with `{...register(perm)}` *and*
 *     given `checked` / `onChange`; the same for the location `Select`. A field
 *     cannot be registered and controlled at once, and the registered ref won
 *     on first render. The form is plain state now — there is nothing here that
 *     react-hook-form was doing for it.
 *   - Outcomes were antd `message` toasts rather than the shared notification.
 */
const AssignLocationManager = () => {
  const { user } = useSelector((state) => state.admin);
  const { profile } = useSelector((state) => state.staffDetail);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify, contextHolder } = useStatusNotification();

  const [location, setLocation] = useState("");
  const [permissions, setPermissions] = useState(EMPTY_PERMISSIONS);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const roleType = resolveRoleType(user);

  const companyQuery = useQuery({
    queryKey: ["companyData", user.companyData.id, { type: "done" }],
    queryFn: () =>
      devitrakApi.post("/company/search-company", { _id: user.companyData.id }),
    enabled: !!user.companyData.id,
  });

  const locationsQuery = useQuery({
    queryKey: ["companyLocationsListQuery", user.sqlInfo.company_id],
    queryFn: () =>
      devitrakApi.post(
        `/db_location/companies/${user.sqlInfo.company_id}/locations`,
        {
          company_id: user.sqlInfo.company_id,
          role: ROLE_LEVELS[roleType] ?? 5,
          preference:
            user.companyData.employees.find((emp) => emp.user === user.email)
              ?.preference || [],
        }
      ),
    enabled: !!user.sqlInfo.company_id && !!user.email,
  });

  const locationOptions = useMemo(
    () => Object.keys(locationsQuery.data?.data?.data ?? {}),
    [locationsQuery.data]
  );

  const companyInfo = companyQuery.data?.data?.company?.[0];
  const employeeIndex = companyInfo?.employees?.findIndex(
    (item) => item.user === profile.email
  );
  const employee =
    employeeIndex > -1 ? companyInfo.employees[employeeIndex] : null;
  const assigned = employee?.preference?.managerLocation ?? [];

  const closeModal = () => {
    if (isSaving) return;
    navigate(`/staff/${profile.adminUserInfo.id}/main`);
  };

  const resetForm = () => {
    setEditing(null);
    setLocation("");
    setPermissions(EMPTY_PERMISSIONS);
  };

  // "Manager" is a derived select-all, not a stored field.
  const isManager = PERMISSION_FIELDS.every(({ perm }) => permissions[perm]);
  const setAllPermissions = (checked) =>
    setPermissions(
      PERMISSION_FIELDS.reduce((acc, { perm }) => ({ ...acc, [perm]: checked }), {})
    );

  const startEditing = (row) => {
    setNotice(null);
    setEditing(row.location);
    setLocation(row.location);
    setPermissions(
      PERMISSION_FIELDS.reduce(
        (acc, { perm }) => ({ ...acc, [perm]: Boolean(row.actions?.[perm]) }),
        {}
      )
    );
  };

  const persist = async (nextAssignments) => {
    const employees = [...companyInfo.employees];
    employees[employeeIndex] = {
      ...employee,
      preference: {
        ...employee.preference,
        inventory_location: nextAssignments.map((item) => item.location),
        managerLocation: nextAssignments,
      },
    };

    const response = await devitrakApi.patch(
      `/company/update-company/${companyInfo.id}`,
      { employees }
    );

    // Both paths refresh the profile now; the delete path used to leave the
    // removed location in Redux.
    dispatch(
      onAddStaffProfile({
        ...profile,
        preference:
          response.data?.company?.employees?.[employeeIndex]?.preference ??
          employees[employeeIndex].preference,
        companyData: response.data?.company ?? profile.companyData,
      })
    );
    queryClient.invalidateQueries({
      queryKey: ["companyData", user.companyData.id, { type: "done" }],
      exact: true,
    });
  };

  const handleSave = async () => {
    setNotice(null);

    if (!companyInfo || !employee) {
      return setNotice(
        "This person is not on the company record, so nothing can be assigned."
      );
    }
    if (!location) return setNotice("Choose a location first.");

    setIsSaving(true);
    try {
      const next = [...assigned];
      const index = next.findIndex((item) => item.location === location);
      const entry = { location, actions: { ...permissions } };
      if (index > -1) next[index] = entry;
      else next.push(entry);

      await persist(next);
      notify(
        "success",
        editing ? `${location} updated.` : `${location} assigned.`,
        "Their inventory access changed immediately."
      );
      resetForm();
    } catch {
      setNotice("The assignment was not saved. Nothing changed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (target) => {
    setNotice(null);
    if (!companyInfo || !employee) return;

    setIsSaving(true);
    try {
      await persist(assigned.filter((item) => item.location !== target));
      notify("success", `${target} removed.`, "They can no longer work there.");
      if (editing === target) resetForm();
    } catch {
      setNotice("The assignment was not removed. Nothing changed.");
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    { key: "location", title: "Location", dataIndex: "location" },
    {
      key: "permissions",
      title: "Can",
      render: (_, row) => {
        const granted = PERMISSION_FIELDS.filter(({ perm }) => row.actions?.[perm]);
        if (granted.length === 0) {
          return <StatusChip label="Nothing" tone="neutral" />;
        }
        return (
          <div className="action-form__chips">
            {granted.map(({ perm, tone }) => (
              <StatusChip key={perm} label={titleCase(perm)} tone={tone} />
            ))}
          </div>
        );
      },
    },
    {
      key: "actions",
      title: "",
      align: "right",
      render: (_, row) => (
        <div className="profile-row-actions">
          <GrayButtonComponent
            size="sm"
            title="Edit"
            buttonType="button"
            disabled={isSaving}
            func={() => startEditing(row)}
          />
          <DangerButtonConfirmationComponent
            size="sm"
            title="Remove"
            buttonType="button"
            disabled={isSaving}
            confirmationTitle={`Remove ${row.location}?`}
            confirmationDescription="They lose access to everything held in that location."
            okText="Remove"
            func={() => handleRemove(row.location)}
          />
        </div>
      ),
    },
  ];

  const body = (
    <div className="action-form">
      {contextHolder}

      {companyQuery.isLoading || locationsQuery.isLoading ? (
        <ProfileSkeleton lines={4} />
      ) : (
        <>
          <p className="action-form__lead">
            A person with no location assignment sees the whole warehouse. Adding
            one narrows them to the locations listed here.
          </p>

          <section className="action-form__step">
            <div className="action-form__step-head">
              <h3 className="action-form__step-title">
                {editing ? `Editing ${editing}` : "Add a location"}
              </h3>
              {editing && (
                <GrayButtonComponent
                  size="sm"
                  title="New assignment"
                  buttonType="button"
                  func={resetForm}
                />
              )}
            </div>

            <div className="action-form__field">
              <Label>Location</Label>
              <Select
                className="custom-autocomplete"
                value={location}
                displayEmpty
                disabled={Boolean(editing) || isSaving}
                onChange={(event) => setLocation(event.target.value)}
                style={{ ...AntSelectorStyle, background: "#fff" }}
              >
                <MenuItem value="" disabled>
                  Select a location
                </MenuItem>
                {locationOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </div>

            <div className="action-form__field">
              <Label>What they can do there</Label>
              <div className="action-form__grid">
                <CheckboxReusableComponent
                  name="manager"
                  checked={isManager}
                  disabled={isSaving}
                  onChange={(event) => setAllPermissions(event.target.checked)}
                  label={<p style={{ textAlign: "left" }}>Manager</p>}
                  hint="Everything below."
                />
                {PERMISSION_FIELDS.map(({ perm, hint }) => (
                  <CheckboxReusableComponent
                    key={perm}
                    name={perm}
                    checked={permissions[perm]}
                    disabled={isSaving}
                    onChange={(event) =>
                      setPermissions((current) => ({
                        ...current,
                        [perm]: event.target.checked,
                      }))
                    }
                    label={<p style={{ textAlign: "left" }}>{titleCase(perm)}</p>}
                    hint={hint}
                  />
                ))}
              </div>
            </div>

            <div className="action-form__footer">
              <BlueButtonComponent
                title={editing ? "Update location" : "Assign location"}
                buttonType="button"
                isDisabled={!location || isSaving}
                isLoading={isSaving}
                func={handleSave}
              />
            </div>
          </section>

          <section className="action-form__step">
            <div className="action-form__step-head">
              <h3 className="action-form__step-title">
                Assigned locations ({assigned.length})
              </h3>
            </div>
            {assigned.length === 0 ? (
              <p className="action-form__empty">
                No location assigned — this person can see the whole warehouse.
              </p>
            ) : (
              <BaseTable
                className="profile-table"
                columns={columns}
                dataSource={assigned}
                rowKey={(row) => row.location}
                enablePagination={assigned.length > 5}
                pageSize={5}
                size="small"
              />
            )}
          </section>

          {notice && <p className="action-form__notice">{notice}</p>}

          <div className="action-form__footer">
            <GrayButtonComponent
              title="Done"
              buttonType="button"
              disabled={isSaving}
              func={closeModal}
            />
          </div>
        </>
      )}
    </div>
  );

  return (
    <ModalUX
      title={renderingTitle("Locations & permissions")}
      openDialog
      closeModal={closeModal}
      closable={!isSaving}
      footer={null}
      width={720}
      body={body}
    />
  );
};

export default AssignLocationManager;
