import { message, notification } from "antd";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import ImageUploaderFormat from "../../../../classes/imageCloudinaryFormat";
import dicRole from "../../../../components/general/dicRole";
import { onLogin, onLogout } from "../../../../store/slices/adminSlice";
import BodyRendering from "./BodyRendering";
import "./Body.css";
const Body = () => {
  const { eventsPerAdmin } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const [loading, setLoading] = useState(false);
  const [imageUploadedValue, setImageUploadedValue] = useState(null);
  const roleDefinition = dicRole[Number(user.role)];
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? "000-000-0000",
      role: roleDefinition,
    },
  });
  const dispatch = useDispatch();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (msg, dur) => {
    api.open({
      message: msg,
      duration: dur,
    });
  };

  const originalDataRef = useRef({
    name: user.name,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? "000-000-0000",
    role: roleDefinition,
  });

  const checkIfOriginalDataHasChange = (props) => {
    if (
      originalDataRef.current[props] !== "" &&
      originalDataRef.current[props] !== watch(`${props}`)
    ) {
      api.destroy();
      return openNotificationWithIcon(
        "Please save updates before leave this tab.",
        0
      );
    }
  };

  const updatedStaffInEvent = async (props) => {
    const eventsToUpdateStaffInfo = [...listOfEvents()];
    for (let data of eventsToUpdateStaffInfo) {
      const adminStaff = data.staff.adminUser ?? [];
      const headsetStaff = data.staff.headsetAttendees ?? [];
      let staff = [...adminStaff, ...headsetStaff];
      const indexStaff = staff.findIndex(
        (element) => element.email === originalDataRef.current.email
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
            adminUser: staff.filter(
              (element) => element.role === "Administrator"
            ),
            headsetAttendees: staff.filter(
              (element) => element.role === "HeadsetAttendees"
            ),
          },
        });
      }
    }
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

  const handleUpdatePersonalInfo = async (data) => {
    setLoading(true);
    try {
      let base64;
      if (imageUploadedValue.length > 0 && imageUploadedValue[0].size > 1048576) {
        return alert(
          "Image is bigger than 1mb. Please resize the image or select a new one."
        );
      } else if (imageUploadedValue.length > 0) {
        base64 = await convertToBase64(imageUploadedValue[0]);
        const fileBase64 = await convertToBase64(imageUploadedValue[0]);
        const templateStaffImageUploader = new ImageUploaderFormat(
          fileBase64,
          "",
          "",
          "",
          "",
          "",
          user.uid,
          "",
          ""
        );
        const staffMemberProfileImage = await devitrakApi.post(
          "cloudinary/upload-image",
          templateStaffImageUploader.staff_uploader()
        );
        if (staffMemberProfileImage.data) {
          base64 = staffMemberProfileImage.data.imageUploaded.secure_url;
        }

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
          await updatedStaffInEvent(data);
          openNotificationWithIcon({ "Information updated": 3 });
          openNotificationWithIcon({ "Information updated": 3 });
          dispatch(onLogout());
          return window.location.reload(true);
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
          await updatedStaffInEvent(data);
          openNotificationWithIcon({ "Information updated": 3 });
          openNotificationWithIcon({ "Information updated": 3 });
          dispatch(onLogout());
          return window.location.reload(true);
        }
      }
    } catch (error) {
      setLoading(false);
      throw new Error(error);
    }
  };

  const removeUploadedProfileImage = async () => {
    try {
      await devitrakApi.patch(`/admin/admin-user/${user.uid}`, {
        imageProfile: null,
      });
      dispatch(onLogin({
        ...user,
        imageProfile: null,
        data:{
          ...user.data,
          imageProfile: null,
        }
      }));
      setValue("photo", null);
      return message.success("Image removed");
    } catch (error) {
      return message.error("Error removing image. Please try again.");
    }
  }
  return (
    <>
      {contextHolder}
      <BodyRendering
        checkIfOriginalDataHasChange={checkIfOriginalDataHasChange}
        handleSubmit={handleSubmit}
        handleUpdatePersonalInfo={handleUpdatePersonalInfo}
        listOfEvents={listOfEvents}
        loading={loading}
        register={register}
        setImageUploadedValue={setImageUploadedValue}
        user={user}
        removeUploadedProfileImage={removeUploadedProfileImage}
      />
    </>
  );
};

export default Body;
