import { FormControlLabel, InputLabel } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Avatar, Divider, notification } from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import ImageUploaderFormat from "../../../../../classes/imageCloudinaryFormat";
import { convertToBase64 } from "../../../../../components/utils/convertToBase64";
import ImageUploaderUX from "../../../../../components/utils/UX/ImageUploaderUX";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../../../components/UX/buttons/DangerButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import Input from "../../../../../components/UX/inputs/Input";
import { dicIcons } from "./utils/dicIcons";
import CheckboxReusableComponent from "../../../../../components/UX/checkbox/CheckboxReusableComponent";

const UpdateMemberInformation = () => {
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const { user } = useSelector((state) => state.admin);
  const { memberInfo } = useSelector(state => state.member)
  const location = useLocation();
  const navigate = useNavigate()
  const [newImageProfileURL, setNewImageProfileURL] = useState(null);
  const [newImageUploaded, setNewImageUploaded] = useState(null);
  const slug = location.pathname.split("/").filter(Boolean)?.at(-2);
  const [membersData, setMembersData] = useState(null);
  const memberInfoRetrieveQuery = useQuery({
    queryKey: ["memberInfoRetrieveQuery"],
    queryFn: () =>
      devitrakApi.post("/db_member/consulting-member", {
        member_id: Number(slug),
        company_id: user?.sqlInfo?.company_id,
      }),
    enabled: !!slug,
  });
  const updateMemberInfoMutation = useMutation({
    mutationKey: ["updateMemberInformationData"],
    mutationFn: async (data) =>
      await devitrakApi.patch("/db_member/update-member-info", {
        company_id: user?.sqlInfo?.company_id,
        ...data,
      }),
    onSuccess: () => {
      openNotificationWithIcon(
        "success",
        "Member information updated successfully",
        "The member information has been updated successfully."
      );
      memberInfoRetrieveQuery.refetch();
    },
    onError: (error) => {
      setErrors([
        `Failed to update member: ${error?.message || String(error)}`,
      ]);
    },
  });

  const updateNewProfileImage = useMutation({
    mutationKey: ["uploadNewProfileImageMember"],
    mutationFn: async (data) =>
      await devitrakApi.post("cloudinary/upload-image", data),
    onSuccess: (res) => {
      memberInfoRetrieveQuery.refetch();
      openNotificationWithIcon(
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
        address: `${watch("street")}, ${watch("city")}, ${watch(
          "state"
        )}, ${watch("zip")}`,
        address_street: watch("street"),
        address_city: watch("city"),
        address_state: watch("state"),
        address_zip: watch("zip"),
        image_url: res.data.imageUploaded.secure_url,
      };
      updateMemberInfoMutation.mutate(payload);
      return setNewImageProfileURL(null);
    },
    onError: (error) => {
      setErrors([
        `Failed to update member: ${error?.message || String(error)}`,
      ]);
    },
  });

  useEffect(() => {
    if (memberInfoRetrieveQuery?.data?.data?.members) {
      setMembersData(memberInfoRetrieveQuery?.data?.data?.members?.at(-1));
    }
  }, [memberInfoRetrieveQuery.data]);
  const { register, handleSubmit, setValue, watch } = useForm();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, msg, dscpt) => {
    api.open({
      description: (
        <div
          style={{
            width: "100%",
            display: "grid",
            gridTemplateRows: "1fr, 1fr",
            gap: 1,
          }}
        >
          <span>
            {dicIcons[type]}&nbsp;{msg}
          </span>
          <span>{dscpt}</span>
        </div>
      ),
    });
  };

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
      setValue("minor", membersData?.minor === 1);
      setValue("parent_guardian_first_name", membersData?.parent_guardian_first_name);
      setValue("parent_guardian_last_name", membersData?.parent_guardian_last_name);
      setValue("parent_guardian_email", membersData?.parent_guardian_email);
      setValue("parent_guardian_phone_number", membersData?.parent_guardian_phone_number);
    }
  }, [membersData, memberInfoRetrieveQuery.data]);

  const handleImageProfile = async () => {
    if (
      newImageProfileURL?.length > 0 &&
      newImageProfileURL[0]?.size > 1048576
    ) {
      return alert(
        "Image is bigger than 5mb. Please resize the image or select a new one."
      );
    } else if (newImageProfileURL?.length > 0) {
      const fileBase64 = await convertToBase64(newImageProfileURL[0]);
      const templateMemberImageUploader = new ImageUploaderFormat(
        fileBase64,
        user.sqlInfo.company_id,
        "",
        "",
        "",
        "",
        slug,
        "",
        ""
      );
      return updateNewProfileImage.mutate(
        templateMemberImageUploader.member_image_profile()
      );
    }
  };
  const handleUpdate = async (data) => {
    if (saving) return;
    try {
      setSaving(true);
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
        image_url: newImageUploaded ? newImageUploaded : memberInfo.image_url,
        minor: data?.minor,
        parent_guardian_first_name: data?.parent_guardian_first_name,
        parent_guardian_last_name: data?.parent_guardian_last_name,
        parent_guardian_email: data?.parent_guardian_email,
        parent_guardian_phone_number: data?.parent_guardian_phone_number,
      };
      return updateMemberInfoMutation.mutate(payload);
    } catch (error) {
      setErrors([
        `Failed to update member: ${error?.message || String(error)}`,
      ]);
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
      address: `${watch("street")}, ${watch("city")}, ${watch(
        "state"
      )}, ${watch("zip")}`,
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
        <div style={{ display: "grid", gap: 4 }}>
          <Avatar
            size={"large"}
            src={membersData?.image_url}
            style={{
              width: "15rem",
              height: "15rem",
              aspectRatio: "1/1",
              // objectFit: "cover",
              // objectPosition: "center",
              // borderRadius: "50%",
            }}
          >
            <span style={{ fontSize: 24, fontWeight: "bold" }}>
              {membersData?.first_name[0]}
              {membersData?.last_name[0]}
            </span>
          </Avatar>
          <DangerButtonComponent
            title={"Remove"}
            func={handleRemoveImageProfileMember}
            styles={{ width: "15rem" }}
            loadingState={updateMemberInfoMutation.status === "loading"}
          />
        </div>
        <div style={{ display: "grid", gap: 4 }}>
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
      <Divider />
      <form
        onSubmit={handleSubmit(handleUpdate)}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        {contextHolder}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <InputLabel
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
          >
            <span style={{ width: "100%", textAlign: "left" }}>First name</span>
            <Input

              {...register("first_name")}
            />
          </InputLabel>
          <InputLabel
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
          >
            <span style={{ width: "100%", textAlign: "left" }}>Last name</span>
            <Input

              {...register("last_name")}
            />
          </InputLabel>
          <InputLabel
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
          >
            <span style={{ width: "100%", textAlign: "left" }}>Email</span>
            <Input

              {...register("email")}
              type="email"
            />
          </InputLabel>
          <InputLabel
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
          >
            <span style={{ width: "100%", textAlign: "left" }}>Phone</span>
            <Input {...register("phone")} />
          </InputLabel>
          <InputLabel
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
          >
            <span style={{ width: "100%", textAlign: "left" }}>Street</span>
            <Input {...register("street")} />
          </InputLabel>
          <InputLabel
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
          >
            <span style={{ width: "100%", textAlign: "left" }}>City</span>
            <Input {...register("city")} />
          </InputLabel>
          <InputLabel
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
          >
            <span style={{ width: "100%", textAlign: "left" }}>State</span>
            <Input {...register("state")} />
          </InputLabel>
          <InputLabel
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
          >
            <span style={{ width: "100%", textAlign: "left" }}>Zip</span>
            <Input {...register("zip")} />
          </InputLabel>
        </div>
        <FormControlLabel
          control={<CheckboxReusableComponent name="minor" checked={watch("minor")} onChange={(e) => setValue("minor", e.target.checked)} />}
          label="Is the member a minor?"
        />
        {watch("minor") && (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <InputLabel
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            >
              <span style={{ width: "100%", textAlign: "left" }}>
                Guardian First name
              </span>
              <Input

                {...register("parent_guardian_first_name")}
              />
            </InputLabel>
            <InputLabel
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            >
              <span style={{ width: "100%", textAlign: "left" }}>
                Guardian Last name
              </span>
              <Input

                {...register("parent_guardian_last_name")}
              />
            </InputLabel>
            <InputLabel
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            >
              <span style={{ width: "100%", textAlign: "left" }}>
                Guardian Email
              </span>
              <Input

                {...register("parent_guardian_email")}
                type="email"
              />
            </InputLabel>
            <InputLabel
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            >
              <span style={{ width: "100%", textAlign: "left" }}>
                Guardian Phone
              </span>
              <Input
                {...register("parent_guardian_phone_number")}
              />
            </InputLabel>
          </div>
        )}

        {errors.length ? (
          <div style={{ color: "crimson" }}>
            {errors.map((e, i) => (
              <div key={i}>{e}</div>
            ))}
          </div>
        ) : null}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <GrayButtonComponent title="Cancel" func={() => navigate(`/member/${memberInfo?.member_id}/main`)} />
          <BlueButtonComponent
            title="Update"
            loadingState={saving}
            disabled={saving}
            buttonType="submit"
          />
        </div>
      </form>
    </>
  );
};

export default UpdateMemberInformation;
