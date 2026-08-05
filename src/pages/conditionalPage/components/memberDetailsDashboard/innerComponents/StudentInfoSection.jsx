import { InputLabel } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { Avatar } from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { devitrakApi } from "../../../../../api/devitrakApi";
import ImageUploaderFormat from "../../../../../classes/imageCloudinaryFormat";
import { convertToBase64 } from "../../../../../components/utils/convertToBase64";
import ImageUploaderUX from "../../../../../components/utils/UX/ImageUploaderUX";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../../../components/UX/buttons/DangerButton";
import Input from "../../../../../components/UX/inputs/Input";
import { useStatusNotification } from "../../../../../components/notification/alerts/useStatusNotification";
import { calculateAgeFlags } from "../../../utils/ageCalculationUtils";

/**
 * MySQL DATE columns arrive as full ISO timestamps ("2010-11-21T05:00:00.000Z").
 * An <input type="date"> silently refuses anything but YYYY-MM-DD and renders
 * blank, so the raw value has to be trimmed before it reaches the field —
 * otherwise the date looks unset, submits empty, and wipes the record.
 */
const toDateInputValue = (value) => {
  if (!value) return "";
  const match = String(value).match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
};

/**
 * Student/member-only half of the member edit page — profile image, name,
 * contact, address, and (for Education companies) grade/homeroom/DOB.
 * Saves independently of guardian data via its own
 * PATCH /db_member/update-member-info call.
 */
const StudentInfoSection = ({
  membersData,
  companyId,
  industryFields,
  onSaved,
}) => {
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [newImageProfileURL, setNewImageProfileURL] = useState(null);
  const [newImageUploaded, setNewImageUploaded] = useState(null);
  const { register, handleSubmit, setValue, watch } = useForm();
  const dobValue = watch("date_of_birth");
  const [ageFlags, setAgeFlags] = useState(
    dobValue ? calculateAgeFlags(dobValue) : { age: null, minor: false, under_13: false }
  );
  const { notify, contextHolder } = useStatusNotification();

  const updateMemberInfoMutation = useMutation({
    mutationKey: ["updateStudentInformationData"],
    mutationFn: async (data) =>
      await devitrakApi.patch("/db_member/update-member-info", {
        company_id: companyId,
        ...data,
      }),
    onSuccess: () => {
      notify(
        "success",
        "Student information updated successfully",
        "The student information has been updated successfully."
      );
      onSaved?.();
    },
    onError: (error) => {
      setErrors([`Failed to update student: ${error?.message || String(error)}`]);
    },
  });

  const updateNewProfileImage = useMutation({
    mutationKey: ["uploadNewProfileImageStudent"],
    mutationFn: async (data) => await devitrakApi.post("cloudinary/upload-image", data),
    onSuccess: (res) => {
      notify(
        "success",
        "New image uploaded successfully.",
        "New profile image was uploaded."
      );
      setValue("image_url", res.data.imageUploaded.secure_url);
      setNewImageUploaded(res.data.imageUploaded.secure_url);
      const payload = {
        member_id: membersData?.member_id ?? membersData?.id,
        first_name: watch("first_name"),
        last_name: watch("last_name"),
        email: watch("email"),
        phone: watch("phone"),
        address: `${watch("street")}, ${watch("city")}, ${watch("state")}, ${watch("zip")}`,
        address_street: watch("street"),
        address_city: watch("city"),
        address_state: watch("state"),
        address_zip: watch("zip"),
        image_url: res.data.imageUploaded.secure_url,
      };
      updateMemberInfoMutation.mutate(payload);
      setNewImageProfileURL(null);
    },
    onError: (error) => {
      setErrors([`Failed to update student: ${error?.message || String(error)}`]);
    },
  });

  useEffect(() => {
    if (membersData) {
      setValue("first_name", membersData?.first_name);
      setValue("last_name", membersData?.last_name);
      setValue("email", membersData?.email);
      setValue("phone", membersData?.phone_number);
      setValue("street", membersData?.address_street);
      setValue("city", membersData?.address_city);
      setValue("state", membersData?.address_state);
      setValue("zip", membersData?.address_zip);
      setValue("grade", membersData?.grade ?? "");
      setValue("homeroom", membersData?.homeroom ?? "");
      setValue("date_of_birth", toDateInputValue(membersData?.date_of_birth));
      setAgeFlags(
        membersData?.date_of_birth
          ? calculateAgeFlags(membersData.date_of_birth)
          : { age: null, minor: false, under_13: false }
      );
    }
  }, [membersData, setValue]);

  const handleImageProfile = async () => {
    if (newImageProfileURL?.length > 0 && newImageProfileURL[0]?.size > 1048576) {
      return alert("Image is bigger than 5mb. Please resize the image or select a new one.");
    } else if (newImageProfileURL?.length > 0) {
      const fileBase64 = await convertToBase64(newImageProfileURL[0]);
      const templateMemberImageUploader = new ImageUploaderFormat(
        fileBase64,
        companyId,
        "",
        "",
        "",
        "",
        membersData?.member_id ?? membersData?.id,
        "",
        ""
      );
      return updateNewProfileImage.mutate(templateMemberImageUploader.member_image_profile());
    }
  };

  const handleUpdate = async (data) => {
    if (saving) return;
    try {
      setSaving(true);
      const dateOfBirth = toDateInputValue(data?.date_of_birth);
      const flags = calculateAgeFlags(dateOfBirth);
      const payload = {
        member_id: membersData?.member_id ?? membersData?.id,
        first_name: data?.first_name,
        last_name: data?.last_name,
        email: data?.email,
        phone: data?.phone,
        address: `${data?.street}, ${data?.city}, ${data?.state}, ${data?.zip}`,
        address_street: data?.street,
        address_city: data?.city,
        address_state: data?.state,
        address_zip: data?.zip,
        image_url: newImageUploaded ? newImageUploaded : membersData?.image_url,
        grade: data?.grade,
        homeroom: data?.homeroom,
        date_of_birth: dateOfBirth,
        // Only derive the flags when there's actually a birthdate to derive
        // them from. Sending minor: 0 off an empty field is how a 15-year-old
        // silently became an adult — which then hid the guardian editor and
        // dropped the consent requirement.
        ...(dateOfBirth
          ? { minor: flags.minor, under_13: flags.under_13 }
          : {}),
      };
      await updateMemberInfoMutation.mutateAsync(payload);
    } catch (error) {
      setErrors([`Failed to update student: ${error?.message || String(error)}`]);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveImageProfileMember = async () => {
    const payload = {
      member_id: membersData?.member_id ?? membersData?.id,
      first_name: watch("first_name"),
      last_name: watch("last_name"),
      email: watch("email"),
      phone: watch("phone"),
      address: `${watch("street")}, ${watch("city")}, ${watch("state")}, ${watch("zip")}`,
      address_street: watch("street"),
      address_city: watch("city"),
      address_state: watch("state"),
      address_zip: watch("zip"),
      image_url: null,
    };
    return await updateMemberInfoMutation.mutate(payload);
  };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <Avatar
            size={"large"}
            src={membersData?.image_url}
            style={{ width: "15rem", height: "15rem", aspectRatio: "1/1" }}
          >
            <span style={{ fontSize: 24, fontWeight: "bold" }}>
              {membersData?.first_name?.[0]}
              {membersData?.last_name?.[0]}
            </span>
          </Avatar>
          <DangerButtonComponent
            title={"Remove"}
            func={handleRemoveImageProfileMember}
            styles={{ width: "15rem" }}
            loadingState={updateMemberInfoMutation.status === "loading"}
          />
        </div>
        <div style={{ display: "grid", gap: 4, alignContent: "start" }}>
          <div style={{ width: "100%" }}>
            <ImageUploaderUX setImageUploadedValue={setNewImageProfileURL} />
          </div>
          <BlueButtonComponent
            title="Update image"
            func={handleImageProfile}
            loadingState={updateNewProfileImage.status === "loading"}
            disabled={!newImageProfileURL}
          />
        </div>
      </div>

      <form
        onSubmit={handleSubmit(handleUpdate)}
        style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}
      >
        {contextHolder}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <InputLabel style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ width: "100%", textAlign: "left" }}>First name</span>
            <Input {...register("first_name")} />
          </InputLabel>
          <InputLabel style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ width: "100%", textAlign: "left" }}>Last name</span>
            <Input {...register("last_name")} />
          </InputLabel>
          <InputLabel style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ width: "100%", textAlign: "left" }}>Email</span>
            <Input {...register("email")} type="email" />
          </InputLabel>
          <InputLabel style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ width: "100%", textAlign: "left" }}>Phone</span>
            <Input {...register("phone")} />
          </InputLabel>
          <InputLabel style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ width: "100%", textAlign: "left" }}>Street</span>
            <Input {...register("street")} />
          </InputLabel>
          <InputLabel style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ width: "100%", textAlign: "left" }}>City</span>
            <Input {...register("city")} />
          </InputLabel>
          <InputLabel style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ width: "100%", textAlign: "left" }}>State</span>
            <Input {...register("state")} />
          </InputLabel>
          <InputLabel style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ width: "100%", textAlign: "left" }}>Zip</span>
            <Input {...register("zip")} />
          </InputLabel>
          {industryFields.grade && (
            <InputLabel style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ width: "100%", textAlign: "left" }}>Grade</span>
              <Input {...register("grade")} />
            </InputLabel>
          )}
          {industryFields.homeroom && (
            <InputLabel style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ width: "100%", textAlign: "left" }}>Homeroom</span>
              <Input {...register("homeroom")} />
            </InputLabel>
          )}
        </div>
        {industryFields.minor && (
          <InputLabel style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: "1 / -1" }}>
            <span style={{ width: "100%", textAlign: "left" }}>Date of birth</span>
            <Input
              {...register("date_of_birth")}
              type="date"
              onChange={(e) => {
                setValue("date_of_birth", e.target.value, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                });
                setAgeFlags(calculateAgeFlags(e.target.value));
              }}
            />
            {ageFlags.minor && (
              <span style={{ color: "#d48806", fontSize: 12, marginTop: 4 }}>
                This student is {ageFlags.under_13 ? "under 13" : "a minor"}. Save this
                section, then set up guardian information below.
              </span>
            )}
          </InputLabel>
        )}

        {errors.length ? (
          <div style={{ color: "crimson" }}>
            {errors.map((e, i) => (
              <div key={i}>{e}</div>
            ))}
          </div>
        ) : null}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <BlueButtonComponent
            title="Save student info"
            loadingState={saving}
            disabled={saving}
            buttonType="submit"
          />
        </div>
      </form>
    </>
  );
};

export default StudentInfoSection;
