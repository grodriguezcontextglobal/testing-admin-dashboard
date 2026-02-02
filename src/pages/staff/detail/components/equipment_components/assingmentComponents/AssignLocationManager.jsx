import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
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
import { onAddStaffProfile } from "../../../../../../store/slices/staffDetailSlide";
import { AntSelectorStyle } from "../../../../../../styles/global/AntSelectorStyle";
import BaseTable from "../../../../../../components/ux/tables/BaseTable";
import { Subtitle } from "../../../../../../styles/global/Subtitle";

const AssignLocationManager = () => {
  const { user } = useSelector((state) => state.admin);
  const { profile } = useSelector((state) => state.staffDetail);
  const queryClient = useQueryClient();
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const dispatch = useDispatch();

  const { register, handleSubmit, setValue, reset, watch } = useForm({
    defaultValues: {
      location: "",
      create: false,
      update: false,
      transfer: false,
      delete: false,
      view: false,
      assign: false,
    },
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
          role: Number(
            user.companyData.employees.find((emp) => emp.user === user.email)
              .role,
          ),
          preference:
            user.companyData.employees.find((emp) => emp.user === user.email)
              .preference || [],
        },
      ),
    enabled: !!user.sqlInfo.company_id && !!user.email,
  });

  const locations = listOfLocations?.data?.data
    ? Object.keys(listOfLocations.data.data)
    : [];

  const options = locations.map((loc) => ({ label: loc, value: loc }));

  const companyInfo = companyDataQuery?.data?.company?.[0];
  const currentEmployeeIndex = companyInfo?.employees?.findIndex(
    (e) => e.user === profile.email,
  );
  const currentEmployee =
    currentEmployeeIndex > -1
      ? companyInfo.employees[currentEmployeeIndex]
      : null;

  const managerLocations = currentEmployee?.preference?.managerLocation || [];

  const onSubmit = async (data) => {
    if (!companyInfo || !currentEmployee) return;
    setLoadingUpdate(true);
    try {
      const newPermissions = {
        create: data.create || false,
        update: data.update || false,
        transfer: data.transfer || false,
        delete: data.delete || false,
        view: data.view || false,
        assign: data.assign || false,
      };

      const newAssignment = {
        location: data.location,
        actions: newPermissions,
      };
      let updatedManagerLocations = [...managerLocations];
      const existingIndex = updatedManagerLocations.findIndex(
        (m) => m.location === data.location,
      );
      if (existingIndex > -1) {
        updatedManagerLocations[existingIndex] = newAssignment;
      } else {
        updatedManagerLocations.push(newAssignment);
      }
      const updatedLocationStrings = updatedManagerLocations.map(
        (m) => m.location,
      );

      const updatedEmployees = [...companyInfo.employees];
      updatedEmployees[currentEmployeeIndex] = {
        ...currentEmployee,
        preference: {
          ...currentEmployee.preference,
          inventory_location: updatedLocationStrings,
          managerLocation: updatedManagerLocations,
        },
      };

      const updatingCompanyEmployeePreference = await devitrakApi.patch(
        `/company/update-company/${companyInfo.id}`,
        {
          employees: updatedEmployees,
        },
      );

      message.success("Location manager assigned/updated successfully.");
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
            updatingCompanyEmployeePreference.data.company ??
            profile.companyData,
        }),
      );
    } catch (error) {
      console.error(error);
      message.error("Failed to assign location manager.");
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
      const updatedLocationStrings = updatedManagerLocations.map(
        (m) => m.location,
      );

      const updatedEmployees = [...companyInfo.employees];
      updatedEmployees[currentEmployeeIndex] = {
        ...currentEmployee,
        preference: {
          ...currentEmployee.preference,
          inventory_location: updatedLocationStrings,
          managerLocation: updatedManagerLocations,
        },
      };

      await devitrakApi.patch(`/company/update-company/${companyInfo.id}`, {
        employees: updatedEmployees,
      });

      message.success("Location assignment removed.");
      queryClient.invalidateQueries({
        queryKey: ["companyData", user.companyData.id],
      });
    } catch (error) {
      console.error(error);
      message.error("Failed to remove assignment.");
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleEdit = (item) => {
    if (!item || typeof item !== "object") {
      console.error("Invalid item passed to handleEdit");
      return;
    }

    const locationName = item.location || "";
    const actions = item.actions || {};

    setEditingLocation(locationName);

    setValue("location", locationName);
    setValue("create", Boolean(actions.create));
    setValue("update", Boolean(actions.update));
    setValue("transfer", Boolean(actions.transfer));
    setValue("delete", Boolean(actions.delete));
    setValue("view", Boolean(actions.view));
    setValue("assign", Boolean(actions.assign));
  };

  const columns = [
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      render: (text) => (
        <Typography
          style={{
            color: "var(--gray-900, #101828)",
            fontFamily: "Inter",
            fontSize: "14px",
            fontStyle: "normal",
            fontWeight: 500,
            lineHeight: "20px",
          }}
        >
          {text}
        </Typography>
      ),
    },
    {
      title: "Permissions",
      key: "permissions",
      render: (_, record) => (
        <Grid container gap={1}>
          {record.actions.create && (
            <Chip label="Create" color="success" size="small" variant="ghost" />
          )}
          {record.actions.update && (
            <Chip label="Update" color="info" size="small" variant="ghost" />
          )}
          {record.actions.transfer && (
            <Chip
              label="Transfer"
              color="warning"
              size="small"
              variant="ghost"
            />
          )}
          {record.actions.delete && (
            <Chip label="Delete" color="error" size="small" variant="ghost" />
          )}
          {record.actions.view && (
            <Chip label="View" color="default" size="small" variant="ghost" />
          )}
          {record.actions.assign && (
            <Chip label="Assign" color="warning" size="small" variant="ghost" />
          )}
          {!Object.values(record.actions).some(Boolean) && (
            <Chip
              label="Read Only"
              color="default"
              size="small"
              variant="ghost"
            />
          )}
        </Grid>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Grid container gap={1}>
          <GrayButtonComponent
            title="Edit"
            func={() => handleEdit(record)}
            icon={<EditOutlined />}
            buttonType="button"
            styles={{ width: "fit-content" }}
          />
          <DangerButtonComponent
            title="Remove"
            func={() => handleDelete(record.location)}
            icon={<DeleteOutlined />}
            buttonType="button"
            styles={{ width: "fit-content" }}
          />
        </Grid>
      ),
    },
  ];

  return (
    <>
      <ReusableCardWithHeaderAndFooter
        title={
          <Typography
            variant="h6"
            style={{
              marginBottom: "16px",
            }}
          >
            Assign Location/Permissions
          </Typography>
        }
        style={{ width: "100%" }}
        actions={[
          <Grid
            key="footer-actions-buttons"
            container
            spacing={2}
            style={{
              justifyContent: "flex-start",
              gap: "24px",
              padding: "0px 24px",
              margin: "3dvh 0",
            }}
          >
            <BlueButtonComponent
              form="assignLocationForm"
              buttonType="submit"
              title={
                editingLocation
                  ? "Update Assignment"
                  : "Assign Location/Permissions"
              }
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
        <Typography
          paragraph
          style={Subtitle}
        >
          Assign this staff member for specific locations and define
          permissions.
        </Typography>
        <form id="assignLocationForm" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid marginTop={3} justifyContent="flex-start" item xs={12} md={12} lg={12}>
              <InputLabel style={{width:"100%", textAlign:"left"}} htmlFor="location">Location</InputLabel>
              <FormControl fullWidth>
                <Select
                  {...register("location", { required: true })}
                  value={watch("location")}
                  onChange={(e) => setValue("location", e.target.value)}
                  disabled={!!editingLocation}
                  displayEmpty
                  style={AntSelectorStyle}
                  renderValue={(selected) => {
                    if (!selected) {
                      return (
                        <span style={{ color: "#aaa" }}>Select a location</span>
                      );
                    }
                    return selected;
                  }}
                >
                  <MenuItem disabled value="">
                    <em>Select a location</em>
                  </MenuItem>
                  {options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <InputLabel>Permissions</InputLabel>
              <Grid container spacing={1}>
                {[
                  "create",
                  "update",
                  "transfer",
                  "delete",
                  "view",
                  "assign",
                ].map((perm) => (
                  <Grid item xs={6} sm={4} key={perm}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          {...register(perm)}
                          checked={watch(perm)}
                          onChange={(e) => setValue(perm, e.target.checked)}
                        />
                      }
                      label={perm.charAt(0).toUpperCase() + perm.slice(1)}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </form>
      </ReusableCardWithHeaderAndFooter>
      <ReusableCardWithHeaderAndFooter
        style={{ width: "100%", margin: "3dvh 0 0" }}
        title={
          <Typography
            variant="h6"
            style={{
              marginBottom: "16px",
              color: "var(--gray-900, #101828)",
              fontFamily: "Inter",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            Assigned Locations
          </Typography>
        }
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
