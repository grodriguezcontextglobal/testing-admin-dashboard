import { useDispatch, useSelector } from "react-redux";
import { onAddEventStaff } from "../../../../../store/slices/eventSlice";
import { useEffect } from "react";

const AddingEventCreated = () => {
  const { staff } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const headsetAttendeesStaff = staff.headsetAttendees ?? [];

  const handleEventInfo = () => {
    const newMemberProfile = {
      firstName: user.name,
      lastName: user.lastName,
      email: user.email,
      role: "Administrator",
    };
    const format = {
      adminUser: [newMemberProfile],
      headsetAttendees: headsetAttendeesStaff,
    };
    dispatch(onAddEventStaff(format));
  };

  useEffect(() => {
    handleEventInfo();
  }, []);

  return null;
};

export default AddingEventCreated;
