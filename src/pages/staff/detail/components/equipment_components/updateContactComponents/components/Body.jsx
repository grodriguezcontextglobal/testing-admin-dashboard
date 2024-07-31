import { Icon } from "@iconify/react";
import {
  Button,
  Chip,
  Grid,
  InputLabel,
  OutlinedInput,
  TextField,
  Typography,
} from "@mui/material";
import { Avatar, Divider, Space, notification } from "antd";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../../api/devitrakApi";
import { onAddStaffProfile } from "../../../../../../../store/slices/staffDetailSlide";
import { BlueButton } from "../../../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../../../styles/global/BlueButtonText";
import { GrayButton } from "../../../../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../../../../styles/global/GrayButtonText";
import { OutlinedInputStyle } from "../../../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../../../styles/global/Subtitle";
import "./Body.css";
import { useNavigate } from "react-router-dom";
import dicRole from "../../../../../../../components/general/dicRole";

const Body = () => {
  const { eventsPerAdmin } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const { profile } = useSelector((state) => state.staffDetail);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: profile.firstName,
      lastName: profile.lastName,
      email: profile.user,
      phone: profile.adminUserInfo.phone ?? "000-000-0000",
      role: dicRole[Number(profile.role)],
    },
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = () => {
    api.open({
      message: "Information updated",
    });
  };
  const listOfEvents = () => {
    const events = new Set();
    if (eventsPerAdmin["active"]) {
      for (let data of eventsPerAdmin["active"]) {
        events.add(data);
      }
    }
    if (eventsPerAdmin["completed"]) {
      for (let data of eventsPerAdmin["completed"]) {
        events.add(data);
      }
    }
    return Array.from(events);
  };

  function convertToBase64(file) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
        resolve(fileReader.result);
      };
      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  }
  const updatingEmployeesCompany = (props) => {
    let employeeCompanyDataCopy = user.companyData.employees;
    console.log("employeeCompanyData", employeeCompanyDataCopy);
    const employeeUpdating = employeeCompanyDataCopy.findIndex(
      (element) => element.user === profile.user
    );
    console.log(employeeUpdating);
    if (employeeUpdating > -1) {
      employeeCompanyDataCopy[employeeUpdating] = {
        ...employeeCompanyDataCopy[employeeUpdating],
        user: props.email,
        firstName: props.firstName,
        lastName: props.lastName,
      };
      return employeeCompanyDataCopy;
    }
    return employeeCompanyDataCopy;
  };
  const handleUpdatePersonalInfo = async (data) => {
    let base64;
    if (data.photo.length > 0 && data.photo[0].size > 1048576) {
      return alert(
        "Image is bigger than allow. Please resize the image or select a new one."
      );
    } else if (data.photo.length > 0) {
      base64 = await convertToBase64(data.photo[0]);
      const resp = await devitrakApi.patch(`/admin/admin-user/${user.uid}`, {
        name: data.name,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        imageProfile: base64,
      });
      if (resp.data) {
        dispatch(
          onAddStaffProfile({
            ...profile,
            firstName: data.name,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            adminUserInfo: {
              ...profile.adminUserInfo,
              phone: data.phone,
            },
          })
        );
        const newDataUpdatedEmployeeCompany = {
          firstName: data.name,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
        };
        await devitrakApi.patch(
          `/company/update-company/${user.companyData.id}`,
          {
            employees: updatingEmployeesCompany(newDataUpdatedEmployeeCompany),
          }
        );

        openNotificationWithIcon();
        return navigate(`/staff/${profile.adminUserInfo.id}/main`);
      }
    } else {
      const resp = await devitrakApi.patch(`/admin/admin-user/${user.uid}`, {
        name: data.name,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
      });
      if (resp.data) {
        dispatch(
          onAddStaffProfile({
            ...profile,
            firstName: data.name,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            adminUserInfo: {
              ...profile.adminUserInfo,
              phone: data.phone,
            },
          })
        );
        const newDataUpdatedEmployeeCompany = {
          firstName: data.name,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
        };
        const newEmployeeData = await updatingEmployeesCompany(
          newDataUpdatedEmployeeCompany
        );
        await devitrakApi.patch(
          `/company/update-company/${user.companyData.id}`,
          {
            employees: newEmployeeData,
          }
        );

        navigate(`/staff/${profile.adminUserInfo.id}/main`);
        navigate(`/staff/${profile.adminUserInfo.id}/main`);
      }
    }
  };
  return (
    <>
      {contextHolder}
      <form
        onSubmit={handleSubmit(handleUpdatePersonalInfo)}
        style={{
          width: "100%",
        }}
      >
        <Grid
          style={{
            padding: "5px",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
          container
        >
          <Grid
            display={"flex"}
            justifyContent={"flex-end"}
            alignItems={"center"}
            marginY={0}
            gap={2}
            item
            xs={12}
            sm={12}
            md={12}
          >
            <Button
              style={{ ...GrayButton, width: "fit-content" }}
              onClick={() =>
                navigate(`/staff/${profile.adminUserInfo.id}/main`)
              }
            >
              <Typography textTransform={"none"} style={GrayButtonText}>
                Cancel
              </Typography>
            </Button>
            <Button
              type="submit"
              style={{ ...BlueButton, width: "fit-content" }}
            >
              <Typography textTransform={"none"} style={BlueButtonText}>
                Save
              </Typography>
            </Button>
          </Grid>
          <Divider />
          <Grid
            display={"flex"}
            flexDirection={"column"}
            alignSelf={"stretch"}
            marginY={0}
            item
            xs={4}
            sm={4}
            md={4}
          >
            <InputLabel style={{ width: "100%" }}>
              <Typography
                textTransform={"none"}
                style={{ ...Subtitle, fontWeight: 500 }}
              >
                Name
              </Typography>
            </InputLabel>
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            marginY={0}
            gap={2}
            item
            xs={6}
            sm={6}
            md={6}
          >
            <Grid
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              marginY={0}
              gap={2}
              item
              xs={6}
              sm={6}
              md={6}
            >
              <OutlinedInput
                style={{ ...OutlinedInputStyle }}
                {...register("name", { required: true })}
                fullWidth
              />
            </Grid>
            <Grid
              display={"flex"}
              justifyContent={"flex-end"}
              alignItems={"center"}
              marginY={0}
              gap={2}
              item
              xs={6}
              sm={6}
              md={6}
            >
              <OutlinedInput
                style={{ ...OutlinedInputStyle }}
                {...register("lastName", { required: true })}
                fullWidth
              />
            </Grid>
          </Grid>
          <Divider />
          <Grid
            display={"flex"}
            flexDirection={"column"}
            alignSelf={"stretch"}
            marginY={0}
            item
            xs={4}
            sm={4}
            md={4}
          >
            <InputLabel style={{ width: "100%" }}>
              <Typography
                textTransform={"none"}
                style={{ ...Subtitle, fontWeight: 500 }}
              >
                Phone number
              </Typography>
            </InputLabel>
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            marginY={0}
            gap={2}
            item
            xs={6}
            sm={6}
            md={6}
          >
            <OutlinedInput
              style={{ ...OutlinedInputStyle }}
              {...register("phone", { required: true })}
              fullWidth
            />
          </Grid>
          <Divider />
          <Grid
            display={"flex"}
            flexDirection={"column"}
            alignSelf={"stretch"}
            marginY={0}
            item
            xs={4}
            sm={4}
            md={4}
          >
            <InputLabel style={{ width: "100%" }}>
              <Typography
                textTransform={"none"}
                style={{ ...Subtitle, fontWeight: 500 }}
              >
                Email address
              </Typography>
            </InputLabel>
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            marginY={0}
            gap={2}
            item
            xs={6}
            sm={6}
            md={6}
          >
            <OutlinedInput
              style={{ ...OutlinedInputStyle }}
              {...register("email", { required: true })}
              fullWidth
            />
          </Grid>
          <Divider />
          <Grid
            display={"flex"}
            flexDirection={"column"}
            alignSelf={"stretch"}
            marginY={0}
            item
            xs={4}
            sm={4}
            md={4}
          >
            <InputLabel style={{ width: "100%" }}>
              <Typography style={{ ...Subtitle, fontWeight: 500 }}>
                Your photo
              </Typography>
            </InputLabel>
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            marginY={0}
            gap={2}
            item
            xs={6}
            sm={6}
            md={6}
          >
            <Grid
              display={"flex"}
              justifyContent={"flex-start"}
              alignSelf={"stretch"}
              marginY={0}
              gap={2}
              item
              xs={4}
              sm={4}
              md={4}
            >
              {profile?.adminUserInfo?.imageProfile ? (
                <Avatar
                  style={{
                    width: "5rem",
                    height: "5rem",
                  }}
                >
                  <img
                    src={profile?.adminUserInfo?.imageProfile}
                    alt={profile?.adminUserInfo?.imageProfile}
                    style={{
                      width: "150px",
                      height: "350px",
                      objectFit: "contain",
                    }}
                  />
                </Avatar>
              ) : (
                <Avatar
                  style={{
                    width: "5rem",
                    height: "5rem",
                  }}
                >
                  {!profile?.adminUserInfo?.imageProfile &&
                    `${profile?.firstName[0]} ${profile?.lastName[0]}`}
                </Avatar>
              )}
            </Grid>
            <Grid
              display={"flex"}
              flexDirection={"column"}
              justifyContent={"center"}
              alignItems={"center"}
              marginBottom={2}
              style={{
                width: "100%",
                borderRadius: "12px",
                border: "1px solid var(--gray-200, #EAECF0)",
                background: "var(--base-white, #FFF)",
              }}
              item
              xs={12}
            >
              <Grid
                display={"flex"}
                justifyContent={"center"}
                alignItems={"center"}
                marginTop={2}
                item
                xs={12}
              >
                <Avatar
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    border: "6px solid var(--gray-50, #F9FAFB)",
                    background: "6px solid var(--gray-50, #F9FAFB)",
                    borderRadius: "28px",
                  }}
                >
                  {" "}
                  <Icon
                    icon="tabler:cloud-upload"
                    color="#475467"
                    width={20}
                    height={20}
                  />
                </Avatar>
              </Grid>
              <Grid
                display={"flex"}
                justifyContent={"center"}
                alignItems={"center"}
                item
                xs={12}
              >
                <TextField
                  {...register("photo")}
                  id="file-upload"
                  type="file"
                  accept=".jpeg, .png, .jpg"
                  style={{
                    outline: "none",
                    border: "transparent",
                  }}
                />
              </Grid>
              <Grid
                display={"flex"}
                justifyContent={"center"}
                alignItems={"center"}
                marginBottom={2}
                item
                xs={12}
              >
                <Typography style={{ ...Subtitle, fontWeight: 400 }}>
                  SVG, PNG, JPG or GIF (max. 1MB)
                </Typography>
              </Grid>
            </Grid>
          </Grid>
          <Divider />
          <Grid
            display={"flex"}
            flexDirection={"column"}
            alignSelf={"stretch"}
            marginY={0}
            item
            xs={4}
            sm={4}
            md={4}
          >
            <InputLabel style={{ width: "100%" }}>
              <Typography
                textTransform={"none"}
                style={{ ...Subtitle, fontWeight: 500 }}
              >
                Role
              </Typography>
            </InputLabel>
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            marginY={0}
            gap={2}
            item
            xs={6}
            sm={6}
            md={6}
          >
            <OutlinedInput
              disabled
              style={{ ...OutlinedInputStyle }}
              {...register("role")}
              fullWidth
            />
          </Grid>
          <Divider />
          <Grid
            display={"flex"}
            flexDirection={"column"}
            alignSelf={"stretch"}
            marginY={0}
            item
            xs={4}
            sm={4}
            md={4}
          >
            <InputLabel style={{ width: "100%" }}>
              <Typography
                textTransform={"none"}
                style={{ ...Subtitle, fontWeight: 500 }}
              >
                Events
              </Typography>
            </InputLabel>
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"flex-start"}
            flexDirection={"column"}
            alignItems={"center"}
            marginY={0}
            gap={2}
            item
            xs={6}
            sm={6}
            md={6}
          >
            <Space
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
              }}
              size={[8, 16]}
              wrap
            >
              {listOfEvents().map((evet) => {
                return (
                  <Grid
                    key={evet?.eventInfoDetail?.eventName}
                    display={"flex"}
                    justifyContent={"flex-start"}
                    alignItems={"center"}
                    padding={"5px"}
                    item
                    xs
                  >
                    <Chip
                      label={evet?.eventInfoDetail?.eventName}
                      variant="outlined"
                      style={OutlinedInputStyle}
                    />
                  </Grid>
                );
              })}
            </Space>
          </Grid>
        </Grid>{" "}
        <Divider />
        <Grid
          display={"flex"}
          justifyContent={"flex-end"}
          alignItems={"center"}
          marginY={0}
          gap={2}
          item
          xs={12}
          sm={12}
          md={12}
        >
          <Button
            style={{ ...GrayButton, width: "fit-content" }}
            onClick={() => navigate(`/staff/${profile.adminUserInfo.id}/main`)}
          >
            <Typography textTransform={"none"} style={GrayButtonText}>
              Cancel
            </Typography>
          </Button>
          <Button type="submit" style={{ ...BlueButton, width: "fit-content" }}>
            <Typography textTransform={"none"} style={BlueButtonText}>
              Save
            </Typography>
          </Button>
        </Grid>
      </form>{" "}
    </>
  );
};

export default Body;
