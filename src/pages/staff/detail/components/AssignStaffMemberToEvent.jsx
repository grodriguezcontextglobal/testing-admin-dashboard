import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import ReusableCardWithHeaderAndFooter from "../../../../components/UX/cards/ReusableCardWithHeaderAndFooter";
import { AntSelectorStyle } from "../../../../styles/global/AntSelectorStyle";
import clearCacheMemory from "../../../../utils/actions/clearCacheMemory";

const AssignStaffMemberToEvent = () => {
  const { user } = useSelector((state) => state.admin);
  const { profile } = useSelector((state) => state.staffDetail);
  const [listOfEventsToRender, setListOfEventsToRender] = useState([]);
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();

  const eventsPerCompanyQuery = useQuery({
    queryKey: ["eventsPerCompanyList"],
    queryFn: () =>
      devitrakApi.post("/event/event-list", {
        company: user.company,
        type: "event",
        active: true,
      }),
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    eventsPerCompanyQuery.refetch();
    return () => { controller.abort(); };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (eventsPerCompanyQuery?.data) {
      setListOfEventsToRender(eventsPerCompanyQuery.data.data.list);
    }
    return () => { controller.abort(); };
  }, [eventsPerCompanyQuery.data]);

  const handleEventInfo = async (data) => {
    const dicRole = {
      adminUser: "Administrator",
      headsetAttendees: "headsetAttendees",
    };
    const parsedEvent = JSON.parse(data.event);
    if (!parsedEvent.staff[data.role].some((el) => el.email === profile.user)) {
      const newStaff = (parsedEvent.staff[data.role] = [
        ...parsedEvent.staff[data.role],
        {
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.user,
          role: dicRole[data.role],
        },
      ]);
      const resp = await devitrakApi.patch(
        `/event/edit-staff-event/${parsedEvent.id}`,
        { [`staff.${data.role}`]: newStaff },
      );
      if (resp.data) {
        alert(`Staff member has been assigned to ${parsedEvent.eventInfoDetail.eventName}`);
        await clearCacheMemory(`event_staff_info=${parsedEvent.id}`);
        navigate(`/staff/${profile.adminUserInfo.id}/main`);
      }
    } else {
      alert("Staff member is already assigned to this event.");
    }
  };

  return (
    <ReusableCardWithHeaderAndFooter
      actions={[
        <div
          key="footer-actions-buttons"
          style={{ display: "flex", gap: "12px", padding: "0 24px", margin: "3dvh 0" }}
        >
          <GrayButtonComponent
            func={() => navigate(`/staff/${profile.adminUserInfo.id}/main`)}
            title="Go back"
            buttonType="button"
          />
          <BlueButtonComponent
            buttonType="submit"
            title="Assign to event"
            form="assign-to-event-form"
          />
        </div>,
      ]}
    >
      <form
        id="assign-to-event-form"
        style={{ width: "100%", textAlign: "left" }}
        onSubmit={handleSubmit(handleEventInfo)}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            borderRadius: "8px",
            border: "1px solid var(--gray-300, #D0D5DD)",
            background: "var(--gray-100, #F2F4F7)",
            padding: "24px",
          }}
        >
          {/* Event selector */}
          <div>
            <InputLabel style={{ marginBottom: "6px" }}>Event</InputLabel>
            <FormControl fullWidth>
              <Select
                className="custom-autocomplete"
                style={{ ...AntSelectorStyle, background: "#fff" }}
                {...register("event")}
              >
                <MenuItem disabled defaultValue="">
                  Select event
                </MenuItem>
                {listOfEventsToRender.map((item) => (
                  <MenuItem
                    key={item.eventInfoDetail.eventName}
                    value={JSON.stringify(item)}
                  >
                    {item.eventInfoDetail.eventName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          {/* Role selector */}
          <div>
            <InputLabel style={{ marginBottom: "6px" }}>Role</InputLabel>
            <FormControl fullWidth>
              <Select
                className="custom-autocomplete"
                style={{ ...AntSelectorStyle, background: "#fff" }}
                {...register("role")}
              >
                <MenuItem disabled defaultValue="">
                  Select role
                </MenuItem>
                <MenuItem value="adminUser">Administrator</MenuItem>
                <MenuItem value="headsetAttendees">Assistant</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>
      </form>
    </ReusableCardWithHeaderAndFooter>
  );
};

export default AssignStaffMemberToEvent;
