import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
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
    // enabled: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    eventsPerCompanyQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (eventsPerCompanyQuery?.data) {
      return setListOfEventsToRender(eventsPerCompanyQuery?.data?.data?.list);
    }
    return () => {
      controller.abort();
    };
  }, [eventsPerCompanyQuery.data]);

  const handleEventInfo = async (data) => {
    const dicRole = {
      adminUser: "Administrator",
      headsetAttendees: "headsetAttendees",
    };
    if (
      !JSON.parse(data.event).staff[data.role].some(
        (element) => element.email === profile.user,
      )
    ) {
      const newStaff = (JSON.parse(data.event).staff[data.role] = [
        ...JSON.parse(data.event).staff[data.role],
        {
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.user,
          role: dicRole[data.role],
        },
      ]);
      const keyParameter = `staff.${data.role}`;
      const respAddingStaffMember = await devitrakApi.patch(
        `/event/edit-staff-event/${JSON.parse(data.event).id}`,
        {
          [keyParameter]: newStaff,
        },
      );
      if (respAddingStaffMember.data) {
        alert(
          `Staff member has been assigned to ${
            JSON.parse(data.event).eventInfoDetail.eventName
          }`,
        );
        await clearCacheMemory(`event_staff_info=${JSON.parse(data.event).id}`);
        return navigate(`/staff/${profile.adminUserInfo.id}/main`);
      }
    } else {
      alert("staff member is already assigned to event.");
    }
    return null;
  };
  return (
    <ReusableCardWithHeaderAndFooter
      actions={[
        <Grid
          key="footer-actions-buttons"
          container
          spacing={2}
          style={{
            justifyContent: "flex-start",
            gap:"24px",
            padding: "0px 24px",
            margin: "3dvh 0",
          }}
        >
            <GrayButtonComponent
              func={() => navigate(`/staff/${profile.adminUserInfo.id}/main`)}
              title="Go back"
            />
            <BlueButtonComponent
              buttonType="submit"
              title="Assign staff member to event."
            />
        </Grid>,
      ]}
    >
      <form
        style={{
          width: "100%",
          justifyContent: "flex-start",
          alignItems: "center",
          textAlign: "left",
        }}
        onSubmit={handleSubmit(handleEventInfo)}
        // className="form"
      >
        <Grid
          display={"flex"}
          flexDirection={"column"}
          alignItems={"flex-start"}
          alignSelf={"stretch"}
          gap={"24px"}
          style={{
            borderRadius: "8px",
            border: "1px solid var(--gray-300, #D0D5DD)",
            background: "var(--gray-100, #F2F4F7)",
            padding: "24px",
          }}
          item
          xs={12}
        >
          <Grid
            display={"flex"}
            justifyContent={"center"}
            alignItems={"flex-start"}
            alignSelf={"stretch"}
            gap={"24px"}
            item
            xs={12}
          >
            <Grid item xs={12}>
              <InputLabel>Event</InputLabel>
              <FormControl fullWidth>
                <Select
                  className="custom-autocomplete"
                  style={{ ...AntSelectorStyle, background: "#fff" }}
                  {...register("event")}
                >
                  <MenuItem
                    key={"select-role"}
                    defaultChecked
                    defaultValue={"Select role"}
                    disabled
                  >
                    <Typography>Select role</Typography>
                  </MenuItem>
                  {listOfEventsToRender.map((item) => {
                    return (
                      <MenuItem
                        style={{ width: "fit-content" }}
                        key={item.eventInfoDetail.evenName}
                        value={JSON.stringify(item)}
                      >
                        <Typography>
                          {item.eventInfoDetail.eventName}
                        </Typography>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"center"}
            alignItems={"flex-start"}
            alignSelf={"stretch"}
            gap={"24px"}
            item
            xs={12}
          >
            <Grid item xs={12}>
              <InputLabel>Role</InputLabel>
              <FormControl fullWidth>
                <Select
                  className="custom-autocomplete"
                  style={{ ...AntSelectorStyle, background: "#fff" }}
                  {...register("role")}
                >
                  <MenuItem
                    defaultChecked
                    defaultValue={"Select role"}
                    disabled
                  >
                    <Typography>Select role</Typography>
                  </MenuItem>
                  <MenuItem value={"adminUser"}>
                    <Typography>Administrator</Typography>
                  </MenuItem>
                  <MenuItem value={"headsetAttendees"}>
                    <Typography>Assistant</Typography>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Grid>
      </form>
    </ReusableCardWithHeaderAndFooter>
  );
};

export default AssignStaffMemberToEvent;
