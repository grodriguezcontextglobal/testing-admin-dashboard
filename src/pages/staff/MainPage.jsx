import {
  Button,
  Grid,
  InputAdornment,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { Divider } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { MagnifyIcon, WhitePlusIcon } from "../../components/icons/Icons";
import { BlueButton } from "../../styles/global/BlueButton";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import '../../styles/global/OutlineInput.css';
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import { TextFontSize20LineHeight30 } from "../../styles/global/TextFontSize20HeightLine30";
import { Title } from "../../styles/global/Title";
import MainAdminSettingPage from "./MainAdminSettingPage";
import { NewStaffMember } from "./action/NewStaffMember";
const MainPage = () => {
  const { register, watch } = useForm();
  const [modalState, setModalState] = useState(false);
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
          xs={12} sm={12} md={12} lg={12}>
          <Typography
            textTransform={"none"}
            style={Title}
            textAlign={"left"}
          >
            Staff
          </Typography>
          <Grid display={"flex"}
            alignItems={"center"}
            justifyContent={"flex-end"} item xs={2} sm={2} md={2} lg={2}>
            <Button
              style={BlueButton}
              onClick={() => setModalState(true)}
            >
              <WhitePlusIcon />
              <Typography
                textTransform={"none"}
                style={BlueButtonText}
              >
                Add new staff
              </Typography>
            </Button>
          </Grid>
        </Grid>
        <Divider />
        <Grid display={'flex'} justifyContent={"space-between"} alignItems={"center"} margin={'0 0 0.5rem'} item xs={12} sm={12} md={12} lg={12}>
          <Typography style={{ ...TextFontSize20LineHeight30, fontWeight: 500, color: '#000', display: "flex", justifyContent: "flex-start", alignItems: "center" }}>Staff: &nbsp;</Typography>
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
          <MainAdminSettingPage searchAdmin={watch("searchAdmin")} />
        </Grid>

      </Grid>
      {
        modalState && <NewStaffMember modalState={modalState} setModalState={setModalState} />
      }

    </>
  );
};

export default MainPage;
