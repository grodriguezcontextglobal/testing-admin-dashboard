import { Grid, InputAdornment, OutlinedInput } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import { WhiteCirclePlusIcon } from "../../components/icons/WhiteCirclePlusIcon";
import DangerButtonComponent from "../../components/UX/buttons/DangerButton";
import { Divider } from "antd";
import { TextFontSize20LineHeight30 } from "../../styles/global/TextFontSize20HeightLine30";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import { MagnifyIcon } from "../../components/icons/MagnifyIcon";
import Loading from "../../components/animation/Loading";
import { Title } from "../../styles/global/Title";
import MainTable from "./tables/MainTable";
import AddNewMember from "./components/modals/AddNewMember";
import DeleteMember from "./components/modals/DeleteMember";

const MainPage = () => {
  const location = useLocation();
  const slug = location.pathname.split("/").filter(Boolean).at(-1);
  const titleParams = String(slug || "").replace(/-/g, " ");
  const [addingNewMember, setAddingNewMember] = useState(false)
  const [removingMember, setRemovingMember] = useState(false)
  const { register, setValue } = useForm();
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
              textTransform: "capitalize",
              textAlign: "left",
            }}
          >
            {titleParams}
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
            title={`Add new ${titleParams}`}
            func={() => setAddingNewMember(true)}
            icon={<WhiteCirclePlusIcon />}
          />
          <DangerButtonComponent
            style={{
              display: `${Number(user.role) > 1 ? "none" : "flex"}`,
              width: "fit-content",
            }}
            func={() => setRemovingMember(true)}
            title={`Delete ${titleParams}`}
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
            Search {titleParams}: &nbsp;
          </p>
          <Grid item xs sm md lg>
            <OutlinedInput
              {...register("searchMember")}
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
            <MainTable />
          )}
        </Grid>
      </Grid>
      {
        addingNewMember && (
          <AddNewMember
            openModal={addingNewMember}
            setOpenModal={setAddingNewMember}
          />
        )
      }
      {
        removingMember && (
          <DeleteMember
            openModal={removingMember}
            setOpenModal={setRemovingMember}
          />
        )
      }
    </>
  );
};

export default MainPage;
