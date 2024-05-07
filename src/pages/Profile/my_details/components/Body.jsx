import { Icon } from "@iconify/react";
import {
  Grid,
  Button,
  Typography,
  InputLabel,
  OutlinedInput,
  TextField,
  Chip,
} from "@mui/material";
import { Avatar, Divider, Space, notification } from "antd";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import "./Body.css";
import { devitrakApi } from "../../../../api/devitrakApi";
import { onLogin } from "../../../../store/slices/adminSlice";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import GrayButtonText from "../../../../styles/global/GrayButtonText";
import { GrayButton } from "../../../../styles/global/GrayButton";
import { Subtitle } from "../../../../styles/global/Subtitle";
const Body = () => {
  const { eventsPerAdmin } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? "000-000-0000",
      role: user.role,
    },
  });
  const dispatch = useDispatch();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = () => {
    api.open({
      message: 'Information updated',
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
      if (resp) {
        const dataUser = user.data
        dispatch(
          onLogin({
            ...user,
            name: data.name,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            data: {
              ...dataUser,
              name: data.name,
              lastName: data.lastName,
              email: data.email,
              phone: data.phone,
              imageProfile: base64,
            },
          })
        );
        openNotificationWithIcon()
      }
    } else {
      const resp = await devitrakApi.patch(`/admin/admin-user/${user.uid}`, {
        name: data.name,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
      });
      if (resp) {
        const dataUser = user.data
        dispatch(
          onLogin({
            ...user,
            name: data.name,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            data: {
              ...dataUser,
              name: data.name,
              lastName: data.lastName,
              email: data.email,
              phone: data.phone,
            },
          })
        );
        openNotificationWithIcon()
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
          {" "}
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
              <Typography
                style={{ ...Subtitle, fontWeight: 500 }}
              >
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
              {user?.data?.imageProfile ? (
                <Avatar
                  size={{
                    xs: 24,
                    sm: 32,
                    md: 40,
                    lg: 64,
                    xl: 80,
                    xxl: 100,
                  }}
                  src={<img src={user?.data?.imageProfile} alt="profile" />}
                />
              ) : (
                <Avatar>
                  {user?.name[0]}
                  {user?.lastName[0]}
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
                // boxShadow: "0px 1px 2px rgba(16,24,40,0.05)",
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
                <Typography
                  style={{ ...Subtitle, fontWeight: 400 }}>
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
            <OutlinedInput disabled style={{ ...OutlinedInputStyle }} {...register("role")} fullWidth />
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
            <Space size={[8, 16]} wrap>
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
          >
            <Typography
              textTransform={"none"}
              style={GrayButtonText}
            >
              Cancel
            </Typography>
          </Button>
          <Button
            type="submit"
            style={{ ...BlueButton, width: "fit-content" }}
          >
            <Typography
              textTransform={"none"}
              style={BlueButtonText}
            >
              Save
            </Typography>
          </Button>
        </Grid>
      </form>    </>

  );
};

export default Body;
