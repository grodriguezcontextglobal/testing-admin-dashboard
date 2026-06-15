import { Icon } from "@iconify/react";
import { InputLabel, OutlinedInput, TextField } from "@mui/material";
import { Avatar, Divider, notification } from "antd";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../../../components/UX/buttons/GrayButton";
import { BadgeWithDot } from "../../../../../../../components/base/badges/badges";
import dicRole from "../../../../../../../components/general/dicRole";
import { onLogin } from "../../../../../../../store/slices/adminSlice";
import { onAddStaffProfile } from "../../../../../../../store/slices/staffDetailSlide";
import { OutlinedInputStyle } from "../../../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../../../styles/global/Subtitle";

const fieldRowStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "24px",
  padding: "16px 0",
};

const labelColStyle = {
  width: "33%",
  minWidth: "120px",
  paddingTop: "10px",
  flexShrink: 0,
};

const inputColStyle = {
  flex: 1,
  minWidth: 0,
};

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
    api.open({ message: "Information updated" });
  };

  const listOfEvents = () => {
    const events = new Set();
    if (eventsPerAdmin["active"]) {
      for (let data of eventsPerAdmin["active"]) events.add(data);
    }
    if (eventsPerAdmin["completed"]) {
      for (let data of eventsPerAdmin["completed"]) events.add(data);
    }
    return Array.from(events);
  };

  function convertToBase64(file) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });
  }

  const updatingEmployeesCompany = (props) => {
    let copy = [...user.companyData.employees];
    const idx = copy.findIndex((el) => el.user === profile.user);
    if (idx > -1) {
      copy[idx] = {
        ...copy[idx],
        user: props.email,
        firstName: props.firstName,
        lastName: props.lastName,
      };
    }
    return copy;
  };

  const handleUpdatePersonalInfo = async (data) => {
    let base64;
    if (data.photo.length > 0 && data.photo[0].size > 1048576) {
      return alert("Image is bigger than allowed. Please resize or select a new one.");
    } else if (data.photo.length > 0) {
      base64 = await convertToBase64(data.photo[0]);
    }

    const patchPayload = {
      name: data.name,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      ...(base64 ? { imageProfile: base64 } : {}),
    };

    const resp = await devitrakApi.patch(`/admin/admin-user/${user.uid}`, patchPayload);
    if (resp.data) {
      dispatch(
        onAddStaffProfile({
          ...profile,
          firstName: data.name,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          adminUserInfo: { ...profile.adminUserInfo, phone: data.phone },
        }),
      );
      dispatch(
        onLogin({
          ...user,
          name: data.name,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
        }),
      );
      await devitrakApi.patch(`/company/update-company/${user.companyData.id}`, {
        employees: updatingEmployeesCompany({
          firstName: data.name,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
        }),
      });
      openNotificationWithIcon();
      navigate(`/staff/${profile.adminUserInfo.id}/main`);
    }
  };

  const actionButtons = (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "12px",
        margin: "12px 0",
      }}
    >
      <GrayButtonComponent
        title="Cancel"
        func={() => navigate(`/staff/${profile.adminUserInfo.id}/main`)}
        buttonType="button"
      />
      <BlueButtonComponent title="Save" buttonType="submit" />
    </div>
  );

  return (
    <>
      {contextHolder}
      <form onSubmit={handleSubmit(handleUpdatePersonalInfo)} style={{ width: "100%" }}>
        {actionButtons}

        {/* Name */}
        <div style={fieldRowStyle}>
          <div style={labelColStyle}>
            <InputLabel>
              <span style={{ ...Subtitle, fontWeight: 500 }}>Name</span>
            </InputLabel>
          </div>
          <div style={{ ...inputColStyle, display: "flex", gap: "12px" }}>
            <OutlinedInput
              style={OutlinedInputStyle}
              placeholder="First name"
              {...register("name", { required: true })}
              fullWidth
            />
            <OutlinedInput
              style={OutlinedInputStyle}
              placeholder="Last name"
              {...register("lastName", { required: true })}
              fullWidth
            />
          </div>
        </div>
        <Divider style={{ margin: 0 }} />

        {/* Phone */}
        <div style={fieldRowStyle}>
          <div style={labelColStyle}>
            <InputLabel>
              <span style={{ ...Subtitle, fontWeight: 500 }}>Phone number</span>
            </InputLabel>
          </div>
          <div style={inputColStyle}>
            <OutlinedInput
              style={OutlinedInputStyle}
              {...register("phone", { required: true })}
              fullWidth
            />
          </div>
        </div>
        <Divider style={{ margin: 0 }} />

        {/* Email */}
        <div style={fieldRowStyle}>
          <div style={labelColStyle}>
            <InputLabel>
              <span style={{ ...Subtitle, fontWeight: 500 }}>Email address</span>
            </InputLabel>
          </div>
          <div style={inputColStyle}>
            <OutlinedInput
              style={OutlinedInputStyle}
              {...register("email", { required: true })}
              fullWidth
            />
          </div>
        </div>
        <Divider style={{ margin: 0 }} />

        {/* Photo */}
        <div style={fieldRowStyle}>
          <div style={labelColStyle}>
            <InputLabel>
              <span style={{ ...Subtitle, fontWeight: 500 }}>Your photo</span>
            </InputLabel>
          </div>
          <div style={{ ...inputColStyle, display: "flex", alignItems: "flex-start", gap: "16px" }}>
            {profile?.adminUserInfo?.imageProfile ? (
              <Avatar style={{ width: "4rem", height: "4rem", flexShrink: 0 }}>
                <img
                  src={profile.adminUserInfo.imageProfile}
                  alt="profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Avatar>
            ) : (
              <Avatar style={{ width: "4rem", height: "4rem", flexShrink: 0 }}>
                {`${profile?.firstName?.[0] ?? ""}${profile?.lastName?.[0] ?? ""}`}
              </Avatar>
            )}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                borderRadius: "12px",
                border: "1px solid var(--gray-200, #EAECF0)",
                background: "#fff",
                padding: "16px",
              }}
            >
              <Avatar
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  border: "6px solid var(--gray-50, #F9FAFB)",
                  borderRadius: "28px",
                }}
              >
                <Icon icon="tabler:cloud-upload" color="#475467" width={20} height={20} />
              </Avatar>
              <TextField
                {...register("photo")}
                id="file-upload"
                type="file"
                className="photo_input"
                inputProps={{ accept: ".jpeg,.png,.jpg" }}
                style={{ outline: "none", border: "transparent" }}
              />
              <p style={{ ...Subtitle, fontWeight: 400, margin: 0 }}>
                SVG, PNG, JPG or GIF (max. 1MB)
              </p>
            </div>
          </div>
        </div>
        <Divider style={{ margin: 0 }} />

        {/* Role (read-only) */}
        <div style={fieldRowStyle}>
          <div style={labelColStyle}>
            <InputLabel>
              <span style={{ ...Subtitle, fontWeight: 500 }}>Role</span>
            </InputLabel>
          </div>
          <div style={inputColStyle}>
            <OutlinedInput
              disabled
              style={OutlinedInputStyle}
              {...register("role")}
              fullWidth
            />
          </div>
        </div>
        <Divider style={{ margin: 0 }} />

        {/* Events */}
        <div style={fieldRowStyle}>
          <div style={labelColStyle}>
            <InputLabel>
              <span style={{ ...Subtitle, fontWeight: 500 }}>Events</span>
            </InputLabel>
          </div>
          <div style={{ ...inputColStyle, display: "flex", flexWrap: "wrap", gap: "8px", paddingTop: "10px" }}>
            {listOfEvents().map((evt) => (
              <BadgeWithDot
                key={evt?.eventInfoDetail?.eventName}
                color="brand"
              >
                {evt?.eventInfoDetail?.eventName}
              </BadgeWithDot>
            ))}
          </div>
        </div>
        <Divider style={{ margin: 0 }} />

        {actionButtons}
      </form>
    </>
  );
};

export default Body;
