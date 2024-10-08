import {
  Grid,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { Button, Modal } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../apis/devitrakApi";
import { onAddStaffProfile } from "../../../../store/slices/staffDetailSlide";
import { onLogin } from "../../../../store/slices/adminSlice";
import PlaceholderImage from "../../../../icons/placeholder image.webp";
const LOADING_STATUS = {
  error: true,
  loading: true,
  success: false,
  idle: false,
};
const EditProfileModal = ({ editProfile, setEditProfile }) => {
  const [loadingButton, setLoadingButton] = useState(LOADING_STATUS.idle);
  const { profile } = useSelector((state) => state.staffDetail);
  const { user } = useSelector((state) => state.admin);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      firstName: profile.name ? profile.name : "Data does not exist",
      lastName: profile.lastName ? profile.lastName : "Data does not exist",
      email: profile.email ? profile.email : "Data does not exist",
      phone: profile.phone ? profile.phone : "Data does not exist",
      // role: profile.role ? profile.role : "Data does not exist",
      image: profile.imageProfile ? profile.imageProfile : "",
    },
  });
  const dispatch = useDispatch();
  const closeModal = () => {
    setEditProfile(false);
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
  const handleEditStaffInformation = async (data) => {
    setLoadingButton(LOADING_STATUS.loading);
    if (data.image[0].size > 1048576){
      setLoadingButton(LOADING_STATUS.idle)
      return alert(
        "Image is bigger than allow. Please resize the image or select a new one."
      );}
    const base64 = await convertToBase64(data.image[0]);
    const userDataUpdated = {
      ...user.data,
      name: data.name,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      // role: data.role,
      imageProfile: base64,
    };

    const resp = await devitrakApi.patch(`/admin/admin-user/${profile.id}`, {
      name: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      // role: data.role,
      imageProfile: base64,
    });
    if (resp) {
      setLoadingButton(LOADING_STATUS.success);
      dispatch(
        onAddStaffProfile({
          ...profile,
          name: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          // role: data.role,
          imageProfile: base64,
        })
      );
      dispatch(
        onLogin({
          ...user,
          data: userDataUpdated,
          name: data.name,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          // role: data.role,
        })
      );
      closeModal();
    }
  };
  const renderTitle = () => {
    return (
      <Typography
        style={{
          color: "var(--gray-900, #101828)",
          textAlign: "center",
          fontFamily: "Inter",
          fontSize: "18px",
          fontStyle: "normal",
          fontWeight: "600",
          lineHeight: "28px",
        }}
      >
        Edit staff member details
      </Typography>
    );
  };
  return (
    <Modal
      title={renderTitle()}
      style={{
        top: 20,
        zIndex:30
      }}
      open={editProfile}
      onOk={() => closeModal()}
      onCancel={() => closeModal()}
      footer={[]}
      maskClosable = {false}
    >
      {/* <Grid
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
        container
      > */}
      <form
        onSubmit={handleSubmit(handleEditStaffInformation)}
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
          margin: "0.5rem auto",
        }}
      >
        <Grid
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          container
        >
          <Grid
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            margin={"0.5rem auto"}
            gap={5}
            item
            xs={12}
          >
            <Grid item xs={6}>
              <InputLabel
                style={{
                  width: "100%",
                }}
              >
                {" "}
                <Typography
                  style={{
                    color: "var(--gray-700, #344054)",
                    textAlign: "left",
                    fontFamily: "Inter",
                    fontSize: "14px",
                    fontStyle: "normal",
                    fontWeight: "500",
                    lineHeight: "20px",
                  }}
                >
                  First name
                </Typography>
              </InputLabel>
              <OutlinedInput
                {...register("firstName")}
                style={{
                  borderRadius: "8px",
                  border: "1px solid var(--gray-300, #D0D5DD)",
                  background: "var(--base-white, #FFF)",
                  boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                  width: "100%",
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <InputLabel
                style={{
                  width: "100%",
                }}
              >
                {" "}
                <Typography
                  style={{
                    color: "var(--gray-700, #344054)",
                    textAlign: "left",
                    fontFamily: "Inter",
                    fontSize: "14px",
                    fontStyle: "normal",
                    fontWeight: "500",
                    lineHeight: "20px",
                  }}
                >
                  Last name
                </Typography>
              </InputLabel>
              <OutlinedInput
                {...register("lastName")}
                style={{
                  borderRadius: "8px",
                  border: "1px solid var(--gray-300, #D0D5DD)",
                  background: "var(--base-white, #FFF)",
                  boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                  width: "100%",
                }}
              />
            </Grid>
          </Grid>

          <Grid margin={"0.5rem auto"} item xs={12}>
            <InputLabel
              style={{
                width: "100%",
              }}
            >
              {" "}
              <Typography
                style={{
                  color: "var(--gray-700, #344054)",
                  textAlign: "left",
                  fontFamily: "Inter",
                  fontSize: "14px",
                  fontStyle: "normal",
                  fontWeight: "500",
                  lineHeight: "20px",
                }}
              >
                Email
              </Typography>
            </InputLabel>
            <OutlinedInput
              {...register("email")}
              style={{
                borderRadius: "8px",
                border: "1px solid var(--gray-300, #D0D5DD)",
                background: "var(--base-white, #FFF)",
                boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                width: "100%",
              }}
            />
          </Grid>
          <Grid margin={"0.5rem auto"} item xs={12}>
            <InputLabel
              style={{
                width: "100%",
              }}
            >
              {" "}
              <Typography
                style={{
                  color: "var(--gray-700, #344054)",
                  textAlign: "left",
                  fontFamily: "Inter",
                  fontSize: "14px",
                  fontStyle: "normal",
                  fontWeight: "500",
                  lineHeight: "20px",
                }}
              >
                Phone
              </Typography>
            </InputLabel>
            <OutlinedInput
              {...register("phone")}
              style={{
                borderRadius: "8px",
                border: "1px solid var(--gray-300, #D0D5DD)",
                background: "var(--base-white, #FFF)",
                boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                width: "100%",
              }}
            />
          </Grid>
          <Grid margin={"0.5rem auto"} item xs={12}>
            <InputLabel
              style={{
                width: "100%",
              }}
            >
              {" "}
              <Typography
                style={{
                  color: "var(--gray-700, #344054)",
                  textAlign: "left",
                  fontFamily: "Inter",
                  fontSize: "14px",
                  fontStyle: "normal",
                  fontWeight: "500",
                  lineHeight: "20px",
                }}
              >
                Picture
              </Typography>
            </InputLabel>
            <OutlinedInput
              {...register("image")}
              id="file-upload"
              type="file"
              accept=".jpeg, .png, .jpg"
              prefix="File size 1MB max"
              style={{
                borderRadius: "8px",
                border: "1px solid var(--gray-300, #D0D5DD)",
                background: "var(--base-white, #FFF)",
                boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                width: "100%",
              }}
            />
          </Grid>
          <Grid margin={"0.5rem auto"} item xs={12}>
            <InputLabel
              style={{
                width: "100%",
                margin: "0.5rem auto",
              }}
            >
              {" "}
              <Typography
                style={{
                  color: "var(--gray-700, #344054)",
                  textAlign: "left",
                  fontFamily: "Inter",
                  fontSize: "14px",
                  fontStyle: "normal",
                  fontWeight: "500",
                  lineHeight: "20px",
                }}
              >
                Assign user&apos;s image (size max 1MB)
              </Typography>
            </InputLabel>
            <img
              style={{
                width: "25dvh",
                height: "10rem",
                borderRadius: "50%",
                objectFit: "cover",
                objectPosition: "center",
              }}
              src={
                profile.imageProfile ? profile.imageProfile : PlaceholderImage
              }
              alt="profile imag"
            />
          </Grid>
          {/* <Grid
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          margin={"0.5rem auto"}
          item
          xs={12}
        > */}
          <Button
            type="primary"
            block
            htmlType="submit"
            loading={loadingButton}
            style={{
              // width: "fit-content",
              border: "1px solid var(--blue-dark-600, #155EEF)",
              borderRadius: "8px",
              background: "var(--blue-dark-600, #155EEF)",
              boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
            }}
          >
            <Typography
              style={{
                color: "#fff", //"var(--gray-700, #344054)"
                textAlign: "center",
                fontFamily: "Inter",
                fontSize: "14px",
                fontStyle: "normal",
                fontWeight: "500",
                lineHeight: "20px",
              }}
            >
              Update staff information
            </Typography>
          </Button>
        </Grid>
      </form>
      {/* </Grid> */}
    </Modal>
  );
};

export default EditProfileModal;
