import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../../../../components/UX/buttons/DangerButton";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import ReusableCardWithHeaderAndFooter from "../../../../../../components/UX/cards/ReusableCardWithHeaderAndFooter";
import Chip from "../../../../../../components/UX/Chip/Chip";
import CheckboxReusableComponent from "../../../../../../components/UX/checkbox/CheckboxReusableComponent";
import BaseTable from "../../../../../../components/UX/tables/BaseTable";
import {
  hasPermission,
  resolveRoleType,
  ROLE_LEVELS,
} from "../../../../../../config/roles";
import { onAddStaffProfile } from "../../../../../../store/slices/staffDetailSlide";
import { AntSelectorStyle } from "../../../../../../styles/global/AntSelectorStyle";
import { Subtitle } from "../../../../../../styles/global/Subtitle";

const LOCATION_PERMISSION_FIELDS = [
  { perm: "create",   color: "success", hint: "Allows creating new items in this location." },
  { perm: "update",   color: "info",    hint: "Allows editing existing items in this location." },
  { perm: "transfer", color: "warning", hint: "Allows transferring items to/from this location." },
  { perm: "delete",   color: "error",   hint: "Allows deleting items from this location." },
  { perm: "view",     color: "default", hint: "Allows viewing items and details in this location." },
  { perm: "assign",   color: "warning", hint: "Allows assigning items to users/events from this location." },
];

const DEFAULT_FORM_VALUES = {
  location: "",
  create: false,
  update: false,
  transfer: false,
  delete: false,
  view: true,
  assign: false,
};

const AssignLocationManager = () => {
  const { user } = useSelector((state) => state.admin);
  const { profile } = useSelector((state) => state.staffDetail);
  const queryClient = useQueryClient();
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const dispatch = useDispatch();

  const roleType = resolveRoleType(user);
  const canAssignLocation = hasPermission("staff:assign_location", roleType);

  const { register, handleSubmit, setValue, reset, watch } = useForm({
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const { data: companyDataQuery } = useQuery({
    queryKey: ["companyData", user.companyData.id, { type: "done" }],
    queryFn: () =>
      devitrakApi.post("/company/search-company", {
        _id: user.companyData.id,
      }),
    enabled: !!user.companyData.id,
  });

  const { data: listOfLocations } = useQuery({
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
        },
      ),
    enabled: !!user.sqlInfo.company_id && !!user.email,
  });

  const locationOptions = listOfLocations?.data?.data
    ? Object.keys(listOfLocations.data.data).map((loc) => ({
        label: loc,
        value: loc,
      }))
    : [];

  const companyInfo = companyDataQuery?.data?.company?.[0];
  const currentEmployeeIndex = companyInfo?.employees?.findIndex(
    (e) => e.user === profile.email,
  );
  const currentEmployee =
    currentEmployeeIndex > -1
      ? companyInfo.employees[currentEmployeeIndex]
      : null;

  const managerLocations = currentEmployee?.preference?.managerLocation || [];

  // "Manager" is a derived "select all" — not a stored field
  const isManagerChecked = LOCATION_PERMISSION_FIELDS.every(({ perm }) =>
    watch(perm),
  );
  const handleManagerChange = (e) => {
    LOCATION_PERMISSION_FIELDS.forEach(({ perm }) =>
      setValue(perm, e.target.checked),
    );
  };

  const handleEdit = (item) => {
    const locationName = item?.location || "";
    const actions = item?.actions || {};
    setEditingLocation(locationName);
    setValue("location", locationName);
    LOCATION_PERMISSION_FIELDS.forEach(({ perm }) =>
      setValue(perm, Boolean(actions[perm])),
    );
  };

  const buildUpdatedEmployees = (updatedManagerLocations) => {
    const updatedLocationStrings = updatedManagerLocations.map((m) => m.location);
    const updatedEmployees = [...companyInfo.employees];
    updatedEmployees[currentEmployeeIndex] = {
      ...currentEmployee,
      preference: {
        ...currentEmployee.preference,
        inventory_location: updatedLocationStrings,
        managerLocation: updatedManagerLocations,
      },
    };
    return updatedEmployees;
  };

  const onSubmit = async (data) => {
    if (!companyInfo || !currentEmployee) return;
    setLoadingUpdate(true);
    try {
      const newAssignment = {
        location: data.location,
        actions: {
          create: data.create || false,
          update: data.update || false,
          transfer: data.transfer || false,
          delete: data.delete || false,
          view: data.view || false,
          assign: data.assign || false,
        },
      };

      const updatedManagerLocations = [...managerLocations];
      const existingIndex = updatedManagerLocations.findIndex(
        (m) => m.location === data.location,
      );
      if (existingIndex > -1) {
        updatedManagerLocations[existingIndex] = newAssignment;
      } else {
        updatedManagerLocations.push(newAssignment);
      }

      const updatingCompanyEmployeePreference = await devitrakApi.patch(
        `/company/update-company/${companyInfo.id}`,
        { employees: buildUpdatedEmployees(updatedManagerLocations) },
      );

      message.success("Location assignment updated successfully.");
      reset();
      setEditingLocation(null);
      queryClient.invalidateQueries({
        queryKey: ["companyData", user.companyData.id, { type: "done" }],
        exact: true,
        refetchType: "active",
      });
      dispatch(
        onAddStaffProfile({
          ...profile,
          preference: {
            ...updatingCompanyEmployeePreference.data.company.employees[
              currentEmployeeIndex
            ].preference,
          },
          companyData:
            updatingCompanyEmployeePreference.data.company ?? profile.companyData,
        }),
      );
    } catch {
      message.error("Failed to assign location.");
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleDelete = async (locationToDelete) => {
    if (!companyInfo || !currentEmployee) return;
    setLoadingUpdate(true);
    try {
      const updatedManagerLocations = managerLocations.filter(
        (m) => m.location !== locationToDelete,
      );

      await devitrakApi.patch(`/company/update-company/${companyInfo.id}`, {
        employees: buildUpdatedEmployees(updatedManagerLocations),
      });

      message.success("Location assignment removed.");
      queryClient.invalidateQueries({
        queryKey: ["companyData", user.companyData.id],
      });
    } catch {
      message.error("Failed to remove assignment.");
    } finally {
      setLoadingUpdate(false);
    }
  };

  const columns = [
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      render: (text) => (
        <span
          style={{
            color: "var(--gray-900, #101828)",
            fontFamily: "Inter",
            fontSize: "14px",
            fontWeight: 500,
            lineHeight: "20px",
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Permissions",
      key: "permissions",
      render: (_, record) => (
        <Grid container gap={1}>
          {LOCATION_PERMISSION_FIELDS.filter(
            ({ perm }) => record.actions?.[perm],
          ).map(({ perm, color }) => (
            <Chip
              key={perm}
              label={perm.charAt(0).toUpperCase() + perm.slice(1)}
              color={color}
              size="small"
              variant="ghost"
            />
          ))}
          {!Object.values(record.actions || {}).some(Boolean) && (
            <Chip label="Read Only" color="default" size="small" variant="ghost" />
          )}
        </Grid>
      ),
    },
    ...(canAssignLocation
      ? [
          {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
              <Grid container gap={1}>
                <GrayButtonComponent
                  title="Edit"
                  func={() => handleEdit(record)}
                  buttonType="button"
                  styles={{ width: "fit-content" }}
                />
                <DangerButtonComponent
                  title="Remove"
                  func={() => handleDelete(record.location)}
                  buttonType="button"
                  styles={{ width: "fit-content" }}
                />
              </Grid>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      {canAssignLocation && (
        <ReusableCardWithHeaderAndFooter
          title="Assign Location / Permissions"
          style={{ width: "100%" }}
          actions={[
            <Grid
              key="footer-actions-buttons"
              container
              style={{
                justifyContent: "flex-start",
                gap: "24px",
                padding: "0 24px",
                margin: "3dvh 0",
              }}
            >
              <BlueButtonComponent
                form="assignLocationForm"
                buttonType="submit"
                title={editingLocation ? "Update Assignment" : "Assign Location"}
                loadingState={loadingUpdate}
                styles={{ width: "fit-content" }}
              />
              {editingLocation && (
                <GrayButtonComponent
                  title="Cancel"
                  func={() => {
                    setEditingLocation(null);
                    reset();
                  }}
                  styles={{ width: "fit-content" }}
                />
              )}
            </Grid>,
          ]}
        >
          <p style={{ ...Subtitle, marginBottom: "16px" }}>
            Assign this staff member to a specific location and define their
            permissions.
          </p>
          <form id="assignLocationForm" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12} marginTop={3}>
                <InputLabel
                  style={{ width: "100%", textAlign: "left" }}
                  htmlFor="location"
                >
                  Location
                </InputLabel>
                <FormControl fullWidth>
                  <Select
                    {...register("location", { required: true })}
                    value={watch("location")}
                    onChange={(e) => setValue("location", e.target.value)}
                    disabled={!!editingLocation}
                    displayEmpty
                    style={AntSelectorStyle}
                    renderValue={(selected) =>
                      selected || (
                        <span style={{ color: "#aaa" }}>Select a location</span>
                      )
                    }
                  >
                    <MenuItem disabled value="">
                      <em>Select a location</em>
                    </MenuItem>
                    {locationOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <InputLabel sx={{ marginBottom: "25px" }}>
                  Permissions
                </InputLabel>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6} md={4}>
                    <CheckboxReusableComponent
                      checked={isManagerChecked}
                      onChange={handleManagerChange}
                      name="manager"
                      label={
                        <p style={{ width: "100%", textAlign: "left" }}>
                          Manager
                        </p>
                      }
                      hint="Grants all permissions for this location."
                    />
                  </Grid>
                  {LOCATION_PERMISSION_FIELDS.map(({ perm, hint }) => (
                    <Grid item xs={12} sm={6} md={4} key={perm}>
                      <CheckboxReusableComponent
                        {...register(perm)}
                        checked={watch(perm)}
                        onChange={(e) => setValue(perm, e.target.checked)}
                        name={perm}
                        label={
                          <p style={{ width: "100%", textAlign: "left" }}>
                            {perm.charAt(0).toUpperCase() + perm.slice(1)}
                          </p>
                        }
                        hint={hint}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </form>
        </ReusableCardWithHeaderAndFooter>
      )}

      <ReusableCardWithHeaderAndFooter
        style={{ width: "100%", margin: canAssignLocation ? "3dvh 0 0" : "0" }}
        title="Assigned Locations"
      >
        <BaseTable
          columns={columns}
          dataSource={managerLocations}
          enablePagination={true}
          pageSize={5}
        />
      </ReusableCardWithHeaderAndFooter>
    </>
  );
};

export default AssignLocationManager;
