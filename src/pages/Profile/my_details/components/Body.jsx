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
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import dicRole from "../../../../components/general/dicRole";
import { onLogin } from "../../../../store/slices/adminSlice";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../styles/global/Subtitle";
import "./Body.css";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";

const Body = () => {
  const allEventsWhereEmailIsAssignedTo = useQuery({
    queryKey: ["allEventsWhereEmailIsAssignedTo"],
    queryFn: () =>
      devitrakApi.post("/event/staff-all-events", {
        email: user.email,
      }),
    refetchOnMount: false,
  });

  console.log(allEventsWhereEmailIsAssignedTo);
  const { user } = useSelector((state) => state.admin);
  const roleDefinition = dicRole[Number(user.role)];
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? "000-000-0000",
      role: roleDefinition,
    },
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const emailRef = useRef({
    name: user.name,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? "000-000-0000",
  });
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (msg, dur) => {
    api.open({
      message: msg,
      duration: dur,
    });
  };
  const originalDataRef = {
    name: user.name,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? "000-000-0000",
    role: roleDefinition,
  };
  const checkIfOriginalDataHasChange = (props) => {
    if (
      originalDataRef[props] !== "" &&
      originalDataRef[props] !== watch(`${props}`)
    ) {
      return openNotificationWithIcon(
        "Please save updates before leave this tab.",
        0
      );
    }
  };

  const triggerRoutes = () => {
    if (Number(user.role) === Number("4")) {
      return navigate("/events");
    }
    return null; //navigate("/");
  };
  const listOfEvents = () => {
    const events = new Map();
    if (allEventsWhereEmailIsAssignedTo.data) {
      const allEvents = [...allEventsWhereEmailIsAssignedTo.data.data.events];
      for (let data of allEvents) {
        if (!events.has(data.id)) {
          events.set(data.id, data);
        }
      }
    }
    const result = new Set();
    for (let [, value] of events) {
      result.add(value);
    }
    return Array.from(result);
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
    let employeeCompanyDataCopy = [...user.companyData.employees];
    const employeeUpdating = employeeCompanyDataCopy.findIndex(
      (element) => element.user === user.email
    );
    if (employeeUpdating > -1) {
      employeeCompanyDataCopy[employeeUpdating] = {
        ...employeeCompanyDataCopy[employeeUpdating],
        user: props.email,
        firstName: props.name ?? props.firstName,
        lastName: props.lastName,
      };
      return employeeCompanyDataCopy;
    }
    return employeeCompanyDataCopy;
  };

  const updateStaffInEvent = async (props) => {
    const eventsToUpdateStaffInfo = [...listOfEvents()];
    for (let data of eventsToUpdateStaffInfo) {
      const adminStaff = data.staff.adminUser ?? [];
      const headsetStaff = data.staff.headsetAttendees ?? [];
      let staff = [...adminStaff, ...headsetStaff];
      const indexStaff = staff.findIndex(
        (element) => element.email === emailRef.current.email
      );
      if (indexStaff > -1) {
        staff[indexStaff] = {
          ...staff[indexStaff],
          email: props.email,
          firstName: props.name,
          lastName: props.lastName,
        };
        await devitrakApi.patch(`/event/edit-event/${data.id}`, {
          staff: {
            adminUser: staff.filter((element) => element.role === "Administrator"),
            headsetAttendees: staff.filter(
              (element) => element.role === "HeadsetAttendees"
            ),
          },
        });
      }
    }
  };
  const handleUpdatePersonalInfo = async (data) => {
    let base64;
    if (data.photo.length > 0 && data.photo[0].size > 1048576) {
      return alert(
        "Image is bigger than 1mb. Please resize the image or select a new one."
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
        const dataUser = user.data;
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
        const newDataUpdatedEmployeeCompany = {
          firstName: data.name,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
        };
        const newEmployeeData = updatingEmployeesCompany(
          newDataUpdatedEmployeeCompany
        );
        await devitrakApi.patch(
          `/company/update-company/${user.companyData.id}`,
          {
            employees: newEmployeeData,
          }
        );

        openNotificationWithIcon({ "Information updated": 3 });
        return triggerRoutes();
      }
    } else {
      const resp = await devitrakApi.patch(`/admin/admin-user/${user.uid}`, {
        name: data.name,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
      });
      if (resp) {
        const dataUser = user.data;
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
        const newDataUpdatedEmployeeCompany = {
          firstName: data.name,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
        };
        const newEmployeeData = updatingEmployeesCompany(
          newDataUpdatedEmployeeCompany
        );
        await devitrakApi.patch(
          `/company/update-company/${user.companyData.id}`,
          {
            employees: newEmployeeData,
          }
        );
        await updateStaffInEvent(data);
        openNotificationWithIcon({ "Information updated": 3 });
        return triggerRoutes();
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
          <Button type="submit" style={{ ...BlueButton, width: "fit-content" }}>
            <Typography textTransform={"none"} style={BlueButtonText}>
              Save and log out
            </Typography>
          </Button>
        </Grid>
        <Divider />
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
              {checkIfOriginalDataHasChange("name")}
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
              {checkIfOriginalDataHasChange("lastName")}
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
            {checkIfOriginalDataHasChange("phone")}
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
            {checkIfOriginalDataHasChange("email")}
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
                {checkIfOriginalDataHasChange("phone")}
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
            {checkIfOriginalDataHasChange("role")}
            <OutlinedInput
              readOnly
              style={{ ...OutlinedInputStyle }}
              {...register("role")}
              fullWidth
            />
          </Grid>
          <Divider />
          <details
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <summary style={{ width: "30%" }}>
              <Typography
                textTransform={"none"}
                style={{ ...Subtitle, fontWeight: 500, cursor: "pointer" }}
              >
                Events
              </Typography>
            </summary>
            <Grid container>
              <Grid
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  margin: "2dvh 0 0",
                }}
                item
                xs={12}
                sm={12}
                md={12}
                lg={12}
              >
                <Space size={[8, 16]} wrap>
                  {listOfEvents().map((evet) => {
                    return (
                      <Chip
                        key={evet?.eventInfoDetail?.eventName}
                        label={evet?.eventInfoDetail?.eventName}
                        variant="outlined"
                        style={OutlinedInputStyle}
                      />
                      // </Grid>
                    );
                  })}
                </Space>
              </Grid>
            </Grid>
          </details>
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
          <Button type="submit" style={{ ...BlueButton, width: "fit-content" }}>
            <Typography textTransform={"none"} style={BlueButtonText}>
              Save and log out
            </Typography>
          </Button>
        </Grid>
      </form>{" "}
    </>
  );
};

export default Body;
