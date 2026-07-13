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
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import MainAdminSettingPage from "./MainAdminSettingPage";
import DeleteStaffMember from "./action/DeleteStaffMember";
import { NewStaffMember } from "./action/NewStaffMember";
import StaffKpiSection from "./components/StaffKpiSection";

const MainPage = () => {
  const { register, watch } = useForm();
  const { user } = useSelector((state) => state.admin);
  const [modalState, setModalState] = useState(false);
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
                  style={{ width: "fit-content" }}
                  func={() => setDeleteModalState(true)}
                  title={"Delete staff members"}
                />
              </>
            ) : null
          }
        />
        <StaffKpiSection />
        <Grid
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          margin={"12px 0 0.5rem"}
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
        <Grid item xs={12} sm={12} md={12} lg={12}>
          <MainAdminSettingPage
            searchAdmin={watch("searchAdmin")}
            modalState={modalState}
          />
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
