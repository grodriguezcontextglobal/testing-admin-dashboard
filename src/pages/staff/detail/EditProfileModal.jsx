import { yupResolver } from "@hookform/resolvers/yup";
import { message } from "antd";
import PropTypes from "prop-types";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import BlueButton from "../../../components/UX/buttons/BlueButton";
import GrayButton from "../../../components/UX/buttons/GrayButton";
import Input from "../../../components/UX/inputs/Input";
import Label from "../../../components/UX/inputs/Label";
import ModalUX from "../../../components/UX/modal/ModalUX";
import { onLogin } from "../../../store/slices/adminSlice";
import { onAddStaffProfile } from "../../../store/slices/staffDetailSlide";
import PlaceholderImage from "../../../assets/placeholder image.webp";
import {
  buildAdminUserPayload,
  buildLoginUpdate,
  buildStaffProfileUpdate,
  convertToBase64,
  editProfileSchema,
  validateImageSize,
} from "./utils/editProfileUtils";

const fieldWrapper = { display: "flex", flexDirection: "column", gap: "6px", width: "100%" };

const EditProfileModal = ({ editProfile, setEditProfile }) => {
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const { profile } = useSelector((state) => state.staffDetail);
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(editProfileSchema),
    defaultValues: {
      firstName: profile.name ?? "",
      lastName: profile.lastName ?? "",
      email: profile.email ?? "",
      phone: profile.phone ?? "",
      image: "",
    },
  });

  const closeModal = () => setEditProfile(false);

  const onSubmit = async (data) => {
    const imageCheck = validateImageSize(data.image);
    if (!imageCheck.valid) {
      return messageApi.error(imageCheck.error);
    }
    setLoading(true);
    try {
      const base64 = imageCheck.hasImage
        ? await convertToBase64(data.image[0])
        : null;
      const resp = await devitrakApi.patch(
        `/admin/admin-user/${profile.id}`,
        buildAdminUserPayload(data, base64),
      );
      if (resp) {
        dispatch(onAddStaffProfile(buildStaffProfileUpdate(profile, data, base64)));
        dispatch(onLogin(buildLoginUpdate(user, data, base64)));
        messageApi.success("Staff information updated");
        closeModal();
      }
    } catch {
      messageApi.error("Could not update staff information. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderTitle = () => (
    <span
      style={{
        color: "var(--gray-900, #101828)",
        fontFamily: "Inter",
        fontSize: "18px",
        fontWeight: 600,
        lineHeight: "28px",
      }}
    >
      Edit staff member details
    </span>
  );

  const body = (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        margin: "8px auto 0",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
        <img
          style={{
            width: "96px",
            height: "96px",
            borderRadius: "9999px",
            objectFit: "cover",
            objectPosition: "center",
            border: "1px solid var(--gray-200, #EAECF0)",
          }}
          src={profile.imageProfile ? profile.imageProfile : PlaceholderImage}
          alt="Staff member profile"
        />
        <span
          style={{
            color: "var(--gray-500, #667085)",
            fontFamily: "Inter",
            fontSize: "12px",
            fontWeight: 500,
            lineHeight: "18px",
          }}
        >
          Assign user&apos;s image · PNG or JPG · 1MB max
        </span>
      </div>

      <div style={{ display: "flex", gap: "16px" }}>
        <div style={fieldWrapper}>
          <Label>First name</Label>
          <Input
            {...register("firstName")}
            error={!!errors.firstName}
            helperText={errors.firstName?.message}
          />
        </div>
        <div style={fieldWrapper}>
          <Label>Last name</Label>
          <Input
            {...register("lastName")}
            error={!!errors.lastName}
            helperText={errors.lastName?.message}
          />
        </div>
      </div>

      <div style={fieldWrapper}>
        <Label>Email</Label>
        <Input
          {...register("email")}
          type="email"
          error={!!errors.email}
          helperText={errors.email?.message}
        />
      </div>

      <div style={fieldWrapper}>
        <Label>Phone</Label>
        <Input {...register("phone")} />
      </div>

      <div style={fieldWrapper}>
        <Label>Picture</Label>
        <Input
          {...register("image")}
          id="file-upload"
          type="file"
          inputProps={{ accept: ".jpeg, .png, .jpg" }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
          paddingTop: "16px",
          borderTop: "1px solid var(--gray-200, #EAECF0)",
        }}
      >
        <GrayButton title="Cancel" func={closeModal} buttonType="button" />
        <BlueButton
          title="Update staff information"
          buttonType="submit"
          isLoading={loading}
        />
      </div>
    </form>
  );

  return (
    <>
      {contextHolder}
      <ModalUX
        title={renderTitle()}
        openDialog={editProfile}
        closeModal={closeModal}
        width={480}
        footer={null}
        body={body}
      />
    </>
  );
};

EditProfileModal.propTypes = {
  editProfile: PropTypes.bool,
  setEditProfile: PropTypes.func,
};

export default EditProfileModal;
