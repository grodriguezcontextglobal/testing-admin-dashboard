import { yupResolver } from "@hookform/resolvers/yup";
import { Avatar } from "antd";
import PropTypes from "prop-types";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import renderingTitle from "../../../components/general/renderingTitle";
import { useStatusNotification } from "../../../components/notification/alerts/useStatusNotification";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import Input from "../../../components/UX/inputs/Input";
import Label from "../../../components/UX/inputs/Label";
import ModalUX from "../../../components/UX/modal/ModalUX";
import { onLogin } from "../../../store/slices/adminSlice";
import { onAddStaffProfile } from "../../../store/slices/staffDetailSlide";
import "../../../styles/global/actionForm.css";
import {
  buildAdminUserPayload,
  buildLoginUpdate,
  buildStaffProfileUpdate,
  convertToBase64,
  editProfileSchema,
  validateImageSize,
} from "./utils/editProfileUtils";

/**
 * An administrator correcting another person's name, email, phone or photo.
 *
 * The component existed but nothing ever rendered it, and two things in it would
 * have gone wrong the moment something did. It PATCHed
 * `/admin/admin-user/{profile.id}` — a field the staff profile does not carry;
 * the AdminUser id is `profile.adminUserInfo.id`, which is what the routes and
 * the contract checks read — and it dispatched `onLogin(...)` unconditionally,
 * so editing a colleague would have rewritten the signed-in session with their
 * name and email.
 *
 * Both are fixed, the form fields read the profile under the spellings it
 * actually uses, and it is reachable: it is the "Edit details" action on the
 * profile's action rail.
 */
const EditProfileModal = ({ editProfile, setEditProfile }) => {
  const { profile } = useSelector((state) => state.staffDetail);
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const { notify, contextHolder } = useStatusNotification();

  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const info = profile.adminUserInfo ?? {};
  const isOwnProfile = user.email === (profile.email ?? profile.user);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(editProfileSchema),
    defaultValues: {
      firstName: profile.firstName ?? info.name ?? "",
      lastName: profile.lastName ?? info.lastName ?? "",
      email: profile.email ?? profile.user ?? "",
      phone: info.phone ?? "",
      image: "",
    },
  });

  const closeModal = () => {
    if (isSaving) return;
    setEditProfile(false);
  };

  const onSubmit = async (data) => {
    setNotice(null);

    if (!info.id) {
      return setNotice(
        "This staff record is incomplete. Reopen the profile and try again."
      );
    }

    const imageCheck = validateImageSize(data.image);
    if (!imageCheck.valid) return setNotice(imageCheck.error);

    setIsSaving(true);
    try {
      const base64 = imageCheck.hasImage
        ? await convertToBase64(data.image[0])
        : null;

      await devitrakApi.patch(
        `/admin/admin-user/${info.id}`,
        buildAdminUserPayload(data, base64)
      );

      dispatch(onAddStaffProfile(buildStaffProfileUpdate(profile, data, base64)));
      // Only when the profile *is* the signed-in user: this used to run
      // unconditionally, which would have renamed your own session.
      if (isOwnProfile) dispatch(onLogin(buildLoginUpdate(user, data, base64)));

      notify(
        "success",
        "Details updated.",
        `${data.firstName} ${data.lastName} was saved.`
      );
      return closeModal();
    } catch {
      setNotice("The details were not saved. Nothing changed.");
    } finally {
      setIsSaving(false);
    }
  };

  const initials = `${profile?.firstName?.[0] ?? ""}${
    profile?.lastName?.[0] ?? ""
  }`;

  const body = (
    <form className="action-form" onSubmit={handleSubmit(onSubmit)}>
      {contextHolder}

      <p className="action-form__lead">
        This changes the account record, not their role or their access. Both are
        managed from the profile.
      </p>

      <div className="action-form__grid">
        <div className="action-form__field">
          <Label>First name</Label>
          <Input
            {...register("firstName")}
            disabled={isSaving}
            error={!!errors.firstName}
            helperText={errors.firstName?.message}
          />
        </div>
        <div className="action-form__field">
          <Label>Last name</Label>
          <Input
            {...register("lastName")}
            disabled={isSaving}
            error={!!errors.lastName}
            helperText={errors.lastName?.message}
          />
        </div>
        <div className="action-form__field action-form__field--wide">
          <Label>Email</Label>
          <Input
            {...register("email")}
            type="email"
            disabled={isSaving}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
        </div>
        <div className="action-form__field action-form__field--wide">
          <Label>Phone number</Label>
          <Input
            {...register("phone")}
            disabled={isSaving}
            placeholder="000-000-0000"
          />
        </div>
      </div>

      <div className="action-form__step">
        <div className="action-form__step-head">
          <h3 className="action-form__step-title">Photo</h3>
        </div>
        <div className="action-form__row">
          <Avatar size={56} src={info.imageProfile}>
            {initials}
          </Avatar>
          <div className="action-form__field">
            <Input
              {...register("image")}
              id="edit-profile-file-upload"
              type="file"
              disabled={isSaving}
              inputProps={{ accept: ".jpeg,.png,.jpg" }}
            />
            <p className="action-form__step-note">PNG or JPG · 1 MB max</p>
          </div>
        </div>
      </div>

      {notice && <p className="action-form__notice">{notice}</p>}

      <div className="action-form__footer">
        <GrayButtonComponent
          title="Cancel"
          buttonType="button"
          disabled={isSaving}
          func={closeModal}
        />
        <BlueButtonComponent
          title="Save details"
          buttonType="submit"
          isDisabled={isSaving}
          isLoading={isSaving}
        />
      </div>
    </form>
  );

  return (
    <ModalUX
      title={renderingTitle("Edit staff details")}
      openDialog={editProfile}
      closeModal={closeModal}
      closable={!isSaving}
      footer={null}
      width={560}
      body={body}
    />
  );
};

EditProfileModal.propTypes = {
  editProfile: PropTypes.bool,
  setEditProfile: PropTypes.func,
};

export default EditProfileModal;
