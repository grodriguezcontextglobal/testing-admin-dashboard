import { Grid, InputAdornment, OutlinedInput } from "@mui/material";
import { Divider } from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { MagnifyIcon, WhitePlusIcon } from "../../components/icons/Icons";
import { BlueButton } from "../../styles/global/BlueButton";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import "../../styles/global/OutlineInput.css";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import { TextFontSize20LineHeight30 } from "../../styles/global/TextFontSize20HeightLine30";
import { Title } from "../../styles/global/Title";
import MainAdminSettingPage from "./MainAdminSettingPage";
import { NewStaffMember } from "./action/NewStaffMember";
import Loading from "../../components/animation/Loading";
const MainPage = () => {
  const { register, watch, setValue } = useForm();
  const [modalState, setModalState] = useState(false);
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
          md={12}
          lg={12}
        >
          <p style={{ ...Title, textTransform: "none", textAlign: "left" }}>
            Staff
          </p>
          <Grid
            display={Number(user.role) < 2 ? "flex" : "none"}
            alignItems={"center"}
            justifyContent={"flex-end"}
            item
            xs={2}
            sm={2}
            md={2}
            lg={2}
          >
            <button style={BlueButton} onClick={() => setModalState(true)}>
              <WhitePlusIcon />
              <p style={{ ...BlueButtonText, textTransform: "none" }}>
                Add new staff
              </p>
            </button>
          </Grid>
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
        <NewStaffMember modalState={modalState} setModalState={setModalState} />
      )}
    </>
  );
};

export default MainPage;
