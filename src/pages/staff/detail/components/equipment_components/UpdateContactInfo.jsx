import { yupResolver } from "@hookform/resolvers/yup";
import { Avatar } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import renderingTitle from "../../../../../components/general/renderingTitle";
import { useStatusNotification } from "../../../../../components/notification/alerts/useStatusNotification";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import Input from "../../../../../components/UX/inputs/Input";
import Label from "../../../../../components/UX/inputs/Label";
import ModalUX from "../../../../../components/UX/modal/ModalUX";
import { useRoleLabel } from "../../../../../hooks/useRoleLabel";
import { onLogin } from "../../../../../store/slices/adminSlice";
import { onAddStaffProfile } from "../../../../../store/slices/staffDetailSlide";
import {
  buildAdminUserPayload,
  buildLoginUpdate,
  buildStaffProfileUpdate,
  convertToBase64,
  editProfileSchema,
  validateImageSize,
} from "../../utils/editProfileUtils";
import "../../../../../styles/global/actionForm.css";

/**
 * Your own name, email, phone and photo.
 *
 * This was four files — `UpdateContactInfo` wrapping `ContactInfo` wrapping a
 * `Header` and a `Body` — for one form, plus a `Body.css` whose only rule was a
 * selector chain built out of MUI's generated emotion hashes
 * (`div.MuiGrid-root...css-11lq3yg-MuiGrid-root > div > ...`), which stopped
 * matching anything the first time MUI changed a class name.
 *
 * The form itself rendered its Cancel/Save pair twice, once above the fields and
 * once below, reported an oversized image through `alert()`, had no pending
 * state so it could be submitted twice, read the current email from
 * `profile.user` while writing it back as `email`, and labelled the role with
 * `roleLabel(profile.role)` — the numeric role, which the scoped roles do not
 * have, so those rendered blank.
 *
 * It is also the reason the write target matters: the PATCH goes to
 * `/admin/admin-user/{user.uid}` — the signed-in user, not the profile being
 * viewed. The action is only ever offered on your own profile, and it now
 * refuses to run anywhere else instead of silently editing your own record.
 */
const UpdateContactInfo = () => {
  const { user } = useSelector((state) => state.admin);
  const { profile } = useSelector((state) => state.staffDetail);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const roleLabel = useRoleLabel();
  const { notify, contextHolder } = useStatusNotification();

  const [notice, setNotice] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const isOwnProfile = user.email === (profile.email ?? profile.user);
  const info = profile.adminUserInfo ?? {};

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
    navigate(`/staff/${profile.adminUserInfo.id}/main`);
  };

  const updateCompanyEmployee = (data) => {
    const employees = [...(user.companyData.employees ?? [])];
    const index = employees.findIndex(
      (item) => item.user === (profile.email ?? profile.user)
    );
    if (index < 0) return null;

    employees[index] = {
      ...employees[index],
      user: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
    };
    return devitrakApi.patch(`/company/update-company/${user.companyData.id}`, {
      employees,
    });
  };

  const onSubmit = async (data) => {
    setNotice(null);

    if (!isOwnProfile) {
      return setNotice(
        "This form edits your own account. Use “Change role” or the staff list for someone else."
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
        `/admin/admin-user/${user.uid}`,
        buildAdminUserPayload(data, base64)
      );

      dispatch(onAddStaffProfile(buildStaffProfileUpdate(profile, data, base64)));
      dispatch(onLogin(buildLoginUpdate(user, data, base64)));
      await updateCompanyEmployee(data);

      notify("success", "Your details were updated.");
      return closeModal();
    } catch {
      setNotice("Your details were not saved. Nothing changed.");
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
        This is how you appear to the rest of the company. Your role is set by an
        administrator and cannot be changed here.
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
              id="file-upload"
              type="file"
              disabled={isSaving}
              inputProps={{ accept: ".jpeg,.png,.jpg" }}
            />
            <p className="action-form__step-note">PNG or JPG · 1 MB max</p>
          </div>
        </div>
      </div>

      <dl className="action-form__summary">
        <div>
          <dt>Role</dt>
          {/* roleType first: the scoped roles carry no numeric role, so reading
              `profile.role` rendered them blank. */}
          <dd>{roleLabel(profile.roleType || profile.role) || "—"}</dd>
        </div>
      </dl>

      {notice && <p className="action-form__notice">{notice}</p>}

      <div className="action-form__footer">
        <GrayButtonComponent
          title="Cancel"
          buttonType="button"
          disabled={isSaving}
          func={closeModal}
        />
        <BlueButtonComponent
          title="Save changes"
          buttonType="submit"
          isDisabled={isSaving || !isOwnProfile}
          isLoading={isSaving}
        />
      </div>
    </form>
  );

  return (
    <ModalUX
      title={renderingTitle("Your contact details")}
      openDialog
      closeModal={closeModal}
      closable={!isSaving}
      footer={null}
      width={560}
      body={body}
    />
  );
};

export default UpdateContactInfo;
