import { useDispatch, useSelector } from "react-redux";
import { onAddEventStaff } from "../../../../../store/slices/eventSlice";
import { useEffect, useRef } from "react";

const AddingEventCreated = () => {
  const { staff } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  // Adds the signed-in person as the event's admin staff, once. The dispatch
  // changes `staff`, so without the guard it would run again.
  const added = useRef(false);
  useEffect(() => {
    if (added.current) return;
    added.current = true;
    const headsetAttendeesStaff = staff.headsetAttendees ?? [];
    const adminStaffMembers = user.adminUser ?? [];
    const checkingExistingStaffMemberAddedToEventStaffing =
      adminStaffMembers?.find(
        (staffMember) => staffMember?.email === user?.email
      );
    if (checkingExistingStaffMemberAddedToEventStaffing) return;
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
  }, [staff, user, dispatch]);

  return null;
};

export default AddingEventCreated;
