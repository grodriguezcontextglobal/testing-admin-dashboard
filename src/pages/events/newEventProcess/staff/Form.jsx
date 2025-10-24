import { yupResolver } from "@hookform/resolvers/yup";
import {
  Grid
} from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import { onAddEventStaff } from "../../../../store/slices/eventSlice";
import "../../../../styles/global/ant-select.css";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import FormFields from "./components/FormFields";
const schema = yup.object().shape({
  firstName: yup.string(),
  lastName: yup.string(),
  email: yup.string().email("Email format is not valid"),
  role: yup.string(),
});

const Form = () => {
  const { staff } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
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

  // Pull employees from redux based on provided schema
  const companyEmployees = user?.companyData?.employees ?? [];
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isAddingNewMember, setIsAddingNewMember] = useState(false);

  // Auto-fill form fields when selecting an employee
  useEffect(() => {
    if (selectedEmployee && !isAddingNewMember) {
      setValue("firstName", selectedEmployee.firstName ?? "");
      setValue("lastName", selectedEmployee.lastName ?? "");
      setValue("email", selectedEmployee.user ?? ""); // 'user' holds email in schema
      // Keep role manual unless you want to map company role codes
    }
  }, [selectedEmployee, isAddingNewMember]);

  const onSelectEmployee = (idOrNew) => {
    if (idOrNew === "__new__") {
      setSelectedEmployee(null);
      setIsAddingNewMember(true);
      setValue("firstName", "");
      setValue("lastName", "");
      setValue("email", "");
      setValue("role", "");
      return;
    }
    const emp = companyEmployees.find((e) => e?._id === idOrNew);
    setSelectedEmployee(emp || null);
    setIsAddingNewMember(false);
  };

  const addNewMember = (e) => {
    e.preventDefault();
    const newMemberProfile =
      selectedEmployee && !isAddingNewMember
        ? {
            firstName: selectedEmployee.firstName,
            lastName: selectedEmployee.lastName,
            email: selectedEmployee.user || "", // schema email
            role: watch("role") || "HeadsetAttendees",
          }
        : {
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
      setSelectedEmployee(null);
      setIsAddingNewMember(false);
      setValue("role", "");
      return;
    }
    let newHeadsetAttendeesList = [
      ...headsetAttendeesStaff,
      newMemberProfile,
    ];
    setHeadsetAttendeesStaff(newHeadsetAttendeesList);
    setValue("firstName", "");
    setValue("lastName", "");
    setValue("email", "");
    setSelectedEmployee(null);
    setIsAddingNewMember(false);
    setValue("role", "");
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
      (_, index) => index !== props
    );
    return setAdminStaff(updateAdminMemberList);
  };
  const handleHeadsetAttendeeDeleteMember = (props) => {
    const updateHeadsetMemberList = headsetAttendeesStaff?.filter(
      (_, index) => index !== props
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
      return navigate("/create-event-page/document-detail");
    } else {
      if (newMemberProfile.role === "Administrator") {
        const format = {
          adminUser: [...adminStaff, newMemberProfile],
          headsetAttendees: headsetAttendeesStaff,
        };
        setAdminStaff([...adminStaff, newMemberProfile]);
        dispatch(onAddEventStaff(format));
        return navigate("/create-event-page/document-detail");
      } else {
        const format = {
          adminUser: adminStaff,
          headsetAttendees: [...headsetAttendeesStaff, newMemberProfile],
        };
        setHeadsetAttendeesStaff([...headsetAttendeesStaff, newMemberProfile]);
        dispatch(onAddEventStaff(format));
        return navigate("/create-event-page/document-detail");
      }
    }
  };

  const tagStyles = {
    ...CenteringGrid,
    borderRadius: "8px",
    border: "1px solid var(--gray-300, #D0D5DD)",
    background: "var(--gray-100, #F2F4F7)",
    color: "var(--danger-action)",
    padding: "4px 8px",
    width: "fit-content",
  };

  const cardBackgroundStyles = {
    borderRadius: "8px",
    border: "1px solid var(--gray-300, #D0D5DD)",
    background: "var(--gray-100, #F2F4F7)",
    padding: "24px",
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
        <FormFields
          handleSubmit={handleSubmit}
          handleEventInfo={handleEventInfo}
          register={register}
          adminStaff={adminStaff}
          headsetAttendeesStaff={headsetAttendeesStaff}
          checkAdminSpots={checkAdminSpots}
          checkAssistantsSpots={checkAssistantsSpots}
          cardBackgroundStyles={cardBackgroundStyles}
          tagStyles={tagStyles}
          subscription={subscription}
          staff={staff}
          addNewMember={addNewMember}
          handleDeleteMember={handleDeleteMember}
          handleHeadsetAttendeeDeleteMember={handleHeadsetAttendeeDeleteMember}
          companyEmployees={companyEmployees}
          selectedEmployee={selectedEmployee}
          isAddingNewMember={isAddingNewMember}
          onSelectEmployee={onSelectEmployee}
        />
      </Grid>
    </Grid>
  );
};

export default Form;
