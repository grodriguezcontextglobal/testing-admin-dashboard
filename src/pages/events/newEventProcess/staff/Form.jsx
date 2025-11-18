import { yupResolver } from "@hookform/resolvers/yup";
import { Grid } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import { onAddEventStaff } from "../../../../store/slices/eventSlice";
import "../../../../styles/global/ant-select.css";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import FormFields from "./components/FormFields";
import AddingEventCreated from "./components/AddingEventCreated";
const schema = yup.object().shape({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  email: yup
    .string()
    .email("Email format is not valid")
    .required("Email is required"),
  role: yup.string().required("Role is required"),
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

  // Helper function to get all assigned staff emails
  const getAllAssignedEmails = () => {
    const adminEmails = adminStaff.map((staff) => staff.email);
    const assistantEmails = headsetAttendeesStaff.map((staff) => staff.email);
    return [...adminEmails, ...assistantEmails];
  };

  // Helper function to check if employee is already assigned
  const isEmployeeAlreadyAssigned = (employee) => {
    const assignedEmails = getAllAssignedEmails();
    return assignedEmails.includes(employee.user);
  };

  // Helper function to validate form data before adding
  const validateMemberData = (memberData) => {
    return (
      memberData.firstName?.trim() &&
      memberData.lastName?.trim() &&
      memberData.email?.trim() &&
      memberData.role?.trim()
    );
  };

  // Auto-fill form fields when selecting an employee
  useEffect(() => {
    if (selectedEmployee && !isAddingNewMember) {
      setValue("firstName", selectedEmployee.firstName ?? "");
      setValue("lastName", selectedEmployee.lastName ?? "");
      setValue("email", selectedEmployee.user ?? ""); // 'user' holds email in schema
      // Keep role manual unless you want to map company role codes
    }
  }, [selectedEmployee, isAddingNewMember]);

  useEffect(() => {
    <AddingEventCreated />;
  }, [adminStaff.length]);

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
            role: watch("role") || "HeadsetAttendees" || "headsetAttendees",
          }
        : {
            firstName: watch("firstName"),
            lastName: watch("lastName"),
            email: watch("email"),
            role: watch("role"),
          };
    // Validate that all fields are filled
    if (!validateMemberData(newMemberProfile)) {
      alert(
        `Please fill in all required fields before adding a staff member. 
        Missing field: ${
          newMemberProfile.firstName.length === 0
            ? "First Name"
            : newMemberProfile.lastName.length === 0
            ? "Last Name"
            : newMemberProfile.email.length === 0
            ? "Email"
            : "Role"
        }`
      );
      return;
    }

    // Check if email is already assigned
    const assignedEmails = getAllAssignedEmails();
    if (assignedEmails.includes(newMemberProfile.email)) {
      alert("This staff member is already assigned to the event.");
      return;
    }

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
    let newHeadsetAttendeesList = [...headsetAttendeesStaff, newMemberProfile];
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

    // If no data in form, just proceed with existing staff
    if (!data.firstName && !data.lastName && !data.email && !data.role) {
      const format = {
        adminUser: adminStaff,
        headsetAttendees: headsetAttendeesStaff,
      };
      dispatch(onAddEventStaff(format));
      return navigate("/create-event-page/document-detail");
    }

    // Validate that all fields are filled if any data is provided
    if (!validateMemberData(newMemberProfile)) {
      alert("Please fill in all required fields before proceeding.");
      return;
    }

    // Check if email is already assigned
    const assignedEmails = getAllAssignedEmails();
    if (assignedEmails.includes(newMemberProfile.email)) {
      alert("This staff member is already assigned to the event.");
      return;
    }

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
  };

  const continueButton = async () => {
    const format = {
      adminUser: adminStaff,
      headsetAttendees: headsetAttendeesStaff,
    };
    dispatch(onAddEventStaff(format));
    return navigate("/create-event-page/document-detail");
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
          isEmployeeAlreadyAssigned={isEmployeeAlreadyAssigned}
          currentRole={watch("role")} // NEW: bind current role to child
          navigate={navigate}
          continueButton={continueButton}
        />
      </Grid>
    </Grid>
  );
};

export default Form;
