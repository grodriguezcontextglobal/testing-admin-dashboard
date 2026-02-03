import { Grid, InputAdornment, OutlinedInput } from "@mui/material";
import { Divider } from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../components/UX/buttons/DangerButton";
import Loading from "../../components/animation/Loading";
import { MagnifyIcon } from "../../components/icons/MagnifyIcon";
import "../../styles/global/OutlineInput.css";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import { TextFontSize20LineHeight30 } from "../../styles/global/TextFontSize20HeightLine30";
import { Title } from "../../styles/global/Title";
import MainAdminSettingPage from "./MainAdminSettingPage";
import DeleteStaffMember from "./action/DeleteStaffMember";
import { NewStaffMember } from "./action/NewStaffMember";
const MainPage = () => {
  const { register, watch, setValue } = useForm();
  const [modalState, setModalState] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState(false);
  const { user } = useSelector((state) => state.admin);
  const [loadingStatus, setLoadingStatus] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setValue("searchAdmin", ".");
    setLoadingStatus(true);
    setTimeout(() => {
      setValue("searchAdmin", "");
      setLoadingStatus(false);
    }, 900);
    return () => {
      controller.abort();
    };
  }, []);

  return (
    <>
      <Grid
        display={"flex"}
        alignItems={"center"}
        justifyContent={"center"}
        container
      >
        <Grid
          display={"flex"}
          alignItems={"center"}
          justifyContent={"space-between"}
          item
          xs={12}
          sm={12}
          md={3}
          lg={3}
        >
          <p
            style={{
              ...Title,
              padding: "16px 24px 16px 0",
              textTransform: "none",
              textAlign: "left",
            }}
          >
            Staff
          </p>
        </Grid>
        <Grid
          display={Number(user.role) < 2 ? "flex" : "none"}
          gap={2}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: {
              xs: "flex-start",
              sm: "flex-start",
              md: "flex-end",
              lg: "flex-end",
            },
          }}
          item
          xs={12}
          sm={12}
          md={9}
          lg={9}
        >
          <BlueButtonComponent
            title={"Add new staff"}
            func={() => setModalState(true)}
            // icon={<WhiteCirclePlusIcon />}
          />
          <DangerButtonComponent
            style={{
              display: `${Number(user.role) > 1 ? "none" : "flex"}`,
              width: "fit-content",
            }}
            func={() => setDeleteModalState(true)}
            title={"Delete staff members"}
          />
        </Grid>

        <Divider />
        <Grid
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          margin={"0 0 0.5rem"}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <p
            style={{
              ...TextFontSize20LineHeight30,
              fontWeight: 500,
              color: "#000",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            Staff: &nbsp;
          </p>
          <Grid item xs sm md lg>
            <OutlinedInput
              {...register("searchAdmin")}
              style={OutlinedInputStyle}
              fullWidth
              placeholder="Search"
              startAdornment={
                <InputAdornment position="start">
                  <MagnifyIcon />
                </InputAdornment>
              }
            />
          </Grid>
        </Grid>
        <Grid item xs={12} sm={12} md={12} lg={12}>
          {loadingStatus ? (
            <Loading />
          ) : (
            <MainAdminSettingPage
              searchAdmin={watch("searchAdmin")}
              modalState={modalState}
              loadingRenderInfoStaff={loadingStatus}
            />
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
