import { yupResolver } from "@hookform/resolvers/yup";
import { Icon } from "@iconify/react";
import {
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from "@mui/material";
import { Card, Divider, Space } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import { EmailIcon } from "../../../../components/icons/EmailIcon";
import { ProfileIcon } from "../../../../components/icons/ProfileIcon";
import { onAddEventStaff } from "../../../../store/slices/eventSlice";
import "../../../../styles/global/ant-select.css";
import { AntSelectorStyle } from "../../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { LightBlueButton } from "../../../../styles/global/LightBlueButton";
import LightBlueButtonText from "../../../../styles/global/LightBlueButtonText";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
const schema = yup.object().shape({
  firstName: yup.string(),
  lastName: yup.string(),
  email: yup.string().email("Email format is not valid"),
  role: yup.string(),
});

const Form = () => {
  const { staff } = useSelector((state) => state.event);
  const { register, setValue, watch, handleSubmit } = useForm({
    resolver: yupResolver(schema),
  });
  const [adminStaff, setAdminStaff] = useState(staff.adminUser ?? []);
  const [headsetAttendeesStaff, setHeadsetAttendeesStaff] = useState(
    staff.headsetAttendees ?? []
  );
  const { subscription } = useSelector((state) => state.subscription);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const addNewMember = (e) => {
    e.preventDefault();
    const newMemberProfile = {
      firstName: watch("firstName"),
      lastName: watch("lastName"),
      email: watch("email"),
      role: watch("role"),
    };
    if (newMemberProfile.role === "Administrator") {
      let newAdminList = [...adminStaff, newMemberProfile];
      setAdminStaff(newAdminList);
      setValue("firstName", "");
      setValue("lastName", "");
      setValue("email", "");
      return;
    }
    let newHeadsetAttendeesList = [...headsetAttendeesStaff, newMemberProfile];
    setHeadsetAttendeesStaff(newHeadsetAttendeesList);
    setValue("firstName", "");
    setValue("lastName", "");
    setValue("email", "");
    return;
  };

  const checkAdminSpots = () => {
    if (adminStaff?.length > 0) {
      if (adminStaff) return adminStaff.length;
      return 0;
    }
    return 0;
  };
  const checkAssistantsSpots = () => {
    if (headsetAttendeesStaff?.length > 0) {
      if (headsetAttendeesStaff) return headsetAttendeesStaff.length;
      return 0;
    }
    return 0;
  };

  const handleDeleteMember = (props) => {
    const updateAdminMemberList = adminStaff?.filter(
      (value) => value.email !== props
    );
    return setAdminStaff(updateAdminMemberList);
  };
  const handleHeadsetAttendeeDeleteMember = (props) => {
    const updateHeadsetMemberList = headsetAttendeesStaff?.filter(
      (value) => value.email !== props
    );
    return setHeadsetAttendeesStaff(updateHeadsetMemberList);
  };
  const handleEventInfo = async (data) => {
    const newMemberProfile = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: data.role,
    };
    if (newMemberProfile.email === "") {
      const format = {
        adminUser: adminStaff,
        headsetAttendees: headsetAttendeesStaff,
      };
      dispatch(onAddEventStaff(format));
      return navigate("/create-event-page/device-detail");
    } else {
      if (newMemberProfile.role === "Administrator") {
        const format = {
          adminUser: [...adminStaff, newMemberProfile],
          headsetAttendees: headsetAttendeesStaff,
        };
        setAdminStaff([...adminStaff, newMemberProfile]);
        dispatch(onAddEventStaff(format));
        return navigate("/create-event-page/device-detail");
      } else {
        const format = {
          adminUser: adminStaff,
          headsetAttendees: [...headsetAttendeesStaff, newMemberProfile],
        };
        setHeadsetAttendeesStaff([...headsetAttendeesStaff, newMemberProfile]);
        dispatch(onAddEventStaff(format));
        return navigate("/create-event-page/device-detail");
      }
    }
  };

  return (
    <Grid
      display={"flex"}
      justifyContent={"space-around"}
      alignItems={"center"}
      gap={2}
      container
    >
      <Grid
        display={"flex"}
        flexDirection={"column"}
        alignItems={"flex-start"}
        gap={"24px"}
        margin={"1rem auto"}
        item
        xs={12}
      >
        <form
          style={{
            width: "100%",
            justifyContent: "flex-start",
            alignItems: "center",
            textAlign: "left",
          }}
          onSubmit={handleSubmit(handleEventInfo)}
          className="form"
        >
          <Grid
            display={"flex"}
            flexDirection={"column"}
            alignItems={"flex-start"}
            alignSelf={"stretch"}
            gap={"24px"}
            style={{
              borderRadius: "8px",
              border: "1px solid var(--gray-300, #D0D5DD)",
              background: "var(--gray-100, #F2F4F7)",
              padding: "24px",
            }}
            item
            xs={12}
          >
            <Grid
              display={"flex"}
              justifyContent={"center"}
              alignItems={"flex-start"}
              alignSelf={"stretch"}
              gap={"24px"}
              item
              xs={12}
            >
              <Grid item xs={12}>
                <InputLabel>Role</InputLabel>
                <FormControl fullWidth>
                  <Select
                    className="custom-autocomplete"
                    style={{ ...AntSelectorStyle, background: "#fff" }}
                    {...register("role")}
                  >
                    <MenuItem
                      defaultChecked
                      defaultValue={"Select role"}
                      disabled
                    >
                      <Typography>Select role</Typography>
                    </MenuItem>
                    {checkAdminSpots() === subscription?.adminUser ? null : (
                      <MenuItem value={"Administrator"}>
                        <Typography>Administrator</Typography>
                      </MenuItem>
                    )}
                    <MenuItem value={"HeadsetAttendees"}>
                      <Typography>Assistant</Typography>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Grid
              display={"flex"}
              justifyContent={"space-between"}
              alignItems={"flex-start"}
              alignSelf={"stretch"}
              gap={"24px"}
              item
              xs={12}
            >
              <Grid item xs={6}>
                <InputLabel fullWidth>First Name</InputLabel>
                <OutlinedInput
                  {...register("firstName")}
                  style={OutlinedInputStyle}
                  placeholder="First name"
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <InputLabel fullWidth>Last Name</InputLabel>
                <OutlinedInput
                  {...register("lastName")}
                  style={OutlinedInputStyle}
                  placeholder="Last name"
                  fullWidth
                />
              </Grid>
            </Grid>
            <Grid
              display={"flex"}
              justifyContent={"center"}
              alignItems={"flex-start"}
              alignSelf={"stretch"}
              gap={"24px"}
              item
              xs={12}
            >
              <Grid item xs={12}>
                <InputLabel fullWidth>Email</InputLabel>
                <OutlinedInput
                  {...register("email")}
                  style={OutlinedInputStyle}
                  type="email"
                  placeholder="Email"
                  fullWidth
                />
              </Grid>
            </Grid>
          </Grid>
          <Button
            onClick={(e) => addNewMember(e)}
            style={{
              ...LightBlueButton,
              ...CenteringGrid,
              width: "100%",
              margin: "3dvh 0",
            }}
          >
            <Icon
              icon="ic:baseline-plus"
              color={"var(--blue-dark-800, #0040C1)"}
              width={20}
              height={20}
            />
            &nbsp;
            <Typography
              style={{ ...LightBlueButtonText, textTransform: "none" }}
            >
              {" "}
              Save and add more staff
            </Typography>
          </Button>
          <Button
            type="submit"
            style={{
              ...BlueButton,
              width: "100%",
            }}
          >
            <Typography style={{ ...BlueButtonText }}>
              {staff?.adminUser.length > 0
                ? "Save changes to continue"
                : "Save and continue"}
            </Typography>
          </Button>
        </form>

        <Grid
          display={"flex"}
          flexDirection={"column"}
          alignItems={"flex-start"}
          alignSelf={"stretch"}
          gap={"24px"}
          style={{
            borderRadius: "8px",
            border: "1px solid var(--gray-300, #D0D5DD)",
            background: "var(--gray-100, #F2F4F7)",
            padding: "24px",
            width: "100%",
          }}
          item
          xs={12}
        >
          <InputLabel
            fullWidth
            style={{
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            Admin staff &nbsp;
            <Typography>Admin spots {checkAdminSpots()}</Typography>
          </InputLabel>
          <Space size={[8, 16]} wrap>
            {adminStaff?.map((member) => {
              return (
                <Card key={member.email}>
                  <label>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <ProfileIcon /> {member.firstName} {member.lastName}
                      </div>{" "}
                      <button
                        style={{
                          display: "flex",
                          alignItems: "center",
                          borderRadius: "8px",
                          border: "1px solid var(--gray-300, #D0D5DD)",
                          background: "var(--gray-100, #F2F4F7)",
                          color: "var(--danger-action)",
                          padding: "4px 8px",
                          width: "fit-content",
                        }}
                        onClick={() => handleDeleteMember(member.email)}
                      >
                        x
                      </button>
                    </div>
                    <EmailIcon /> {member.email}
                  </label>
                </Card>
              );
            })}
          </Space>
        </Grid>
        <Divider
          style={{
            margin: "0.1rem auto",
          }}
        />
        <Grid
          display={"flex"}
          flexDirection={"column"}
          alignItems={"flex-start"}
          alignSelf={"stretch"}
          gap={"24px"}
          style={{
            borderRadius: "8px",
            border: "1px solid var(--gray-300, #D0D5DD)",
            background: "var(--gray-100, #F2F4F7)",
            padding: "24px",
            width: "100%",
          }}
          item
          xs={12}
        >
          <InputLabel
            fullWidth
            style={{
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            Assistant staff&nbsp;
            <Typography>Assistant spots {checkAssistantsSpots()}</Typography>
          </InputLabel>
          <Space size={[8, 16]} wrap>
            {headsetAttendeesStaff?.map((member) => {
              return (
                <Card style={{ padding: "4px 2px" }} key={member.email}>
                  <label>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <ProfileIcon /> {member.firstName} {member.lastName}
                      </div>{" "}
                      <button
                        style={{
                          display: "flex",
                          alignItems: "center",
                          borderRadius: "8px",
                          border: "1px solid var(--gray-300, #D0D5DD)",
                          background: "var(--gray-100, #F2F4F7)",
                          color: "var(--danger-action)",
                          padding: "4px 8px",
                          width: "fit-content",
                        }}
                        onClick={() =>
                          handleHeadsetAttendeeDeleteMember(member.email)
                        }
                      >
                        x
                      </button>
                    </div>
                    <EmailIcon /> {member.email}
                  </label>
                </Card>
              );
            })}
          </Space>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Form;
