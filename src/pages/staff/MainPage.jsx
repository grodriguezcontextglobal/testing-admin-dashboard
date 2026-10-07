import { useLocation } from "react-router-dom";
import { Grid, InputAdornment, OutlinedInput } from "@mui/material";
import { useState , useEffect} from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../components/UX/buttons/DangerButton";
import PageHeader from "../../components/UX/pageHeader/PageHeader";
import { MagnifyIcon } from "../../components/icons/MagnifyIcon";
import { usePermission } from "../../hooks/usePermission";
import "../../styles/global/OutlineInput.css";
import "./components/staffViewTabs.css";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import MainAdminSettingPage from "./MainAdminSettingPage";
import DeleteStaffMember from "./action/DeleteStaffMember";
import { NewStaffMember } from "./action/NewStaffMember";
import StaffKpiSection from "./components/StaffKpiSection";
import StaffAssignedDevicesTable from "./components/StaffAssignedDevicesTable";

const MainPage = () => {
  const { register, watch } = useForm();
  const { user } = useSelector((state) => state.admin);
  const [modalState, setModalState] = useState(false);
  const [activeView, setActiveView] = useState("staff");
  const location = useLocation();
  // command-menu quick action: open the add-staff modal on arrival (once)
  useEffect(() => {
    if (location.state?.quickAction === "create") {
      setModalState(true);
      window.history.replaceState({}, "");
    }
  }, [location.state]);
  const [deleteModalState, setDeleteModalState] = useState(false);
  const canManageStaff = usePermission("staff:create");

  return (
    <>
      <Grid
        display={"flex"}
        alignItems={"center"}
        justifyContent={"center"}
        container
      >
        <PageHeader
          title="Staff"
          supportingText={`Manage ${
            user?.company ?? "your company"
          }'s team members, their roles, and access.`}
          actions={
            canManageStaff ? (
              <>
                <BlueButtonComponent
                  title={"Add new staff"}
                  func={() => setModalState(true)}
                />
                <DangerButtonComponent
                  styles={{ width: "fit-content" }}
                  func={() => setDeleteModalState(true)}
                  title={"Delete staff members"}
                />
              </>
            ) : null
          }
        />
        <StaffKpiSection />
        {/* The same navigator the members page has: the table is no longer
            the only thing here, because what the staff are holding is read as
            often as the roster (asked 2026-10-06). No Overdue tab: staff keep
            devices with no return date (2026-10-07). */}
        <Grid item xs={12} sm={12} md={12} lg={12}>
          <div role="tablist" className="staff-view-tabs">
            {[
              { key: "staff", label: "Staff" },
              { key: "devices", label: "Assigned devices" },
            ].map((view) => (
              <button
                key={view.key}
                type="button"
                role="tab"
                aria-selected={activeView === view.key}
                className={`staff-view-tabs__tab${
                  activeView === view.key ? " staff-view-tabs__tab--on" : ""
                }`}
                onClick={() => setActiveView(view.key)}
              >
                {view.label}
              </button>
            ))}
          </div>
        </Grid>

        {activeView === "staff" && (
          <Grid
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            margin={"0 0 0.5rem"}
            item
            xs={12}
          >
            <OutlinedInput
              {...register("searchAdmin")}
              style={OutlinedInputStyle}
              fullWidth
              placeholder="Search staff by name, email, or role"
              startAdornment={
                <InputAdornment position="start">
                  <MagnifyIcon />
                </InputAdornment>
              }
            />
          </Grid>
        )}
        <Grid item xs={12} sm={12} md={12} lg={12}>
          {activeView === "staff" ? (
            <MainAdminSettingPage
              searchAdmin={watch("searchAdmin")}
              modalState={modalState}
            />
          ) : (
            <StaffAssignedDevicesTable />
          )}
        </Grid>
      </Grid>

      {modalState && (
        <NewStaffMember
          modalState={modalState}
          setModalState={setModalState}
          deletingStaffMembers={deleteModalState}
        />
      )}
      {deleteModalState && (
        <DeleteStaffMember
          modalState={deleteModalState}
          setModalState={setDeleteModalState}
        />
      )}
    </>
  );
};

export default MainPage;
