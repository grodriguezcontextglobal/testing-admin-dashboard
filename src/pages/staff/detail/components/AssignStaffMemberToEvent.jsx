import {
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Divider } from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import { AntSelectorStyle } from "../../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { GrayButton } from "../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../styles/global/GrayButtonText";
import { useNavigate } from "react-router-dom";

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
      headsetAttendees: "Assistant",
    };
    if (
      !JSON.parse(data.event).staff[data.role].some(
        (element) => element.email === profile.user
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
        }
      );
      if (respAddingStaffMember.data) {
        alert(
          `Staff member has been assigned to ${
            JSON.parse(data.event).eventInfoDetail.eventName
          }`
        );
        return navigate(`/staff/${profile.adminUserInfo.id}/main`);
      }
    } else {
      alert("staff member is already assigned to event.");
    }
    return null;
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
        <form
          style={{
            width: "100%",
            justifyContent: "flex-start",
            alignItems: "center",
            textAlign: "left",
          }}
          onSubmit={handleSubmit(handleEventInfo)}
          className="form"
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "20px",
              alignSelf: "stretch",
              borderRadius: "8px",
              width: "100%",
              margin: "3dvh 0",
            }}
          >
            <Button
              onClick={() =>
                navigate(`/staff/${profile.adminUserInfo.id}/main`)
              }
              style={{
                ...GrayButton,
                padding: "12px 20px",
                gap: "8px",
                alignSelf: "stretch",
                borderRadius: "8px",
                width: "50%",
              }}
            >
              <Typography textTransform={"none"} style={GrayButtonText}>
                Go back
              </Typography>
            </Button>
            <Button
              type="submit"
              style={{
                ...BlueButton,
                padding: "12px 20px",
                gap: "8px",
                alignSelf: "stretch",
                borderRadius: "8px",
                width: "50%",
              }}
            >
              <Typography textTransform={"none"} style={BlueButtonText}>
                Assign staff member to event.
              </Typography>
            </Button>
          </div>
        </form>
        <Divider
          style={{
            margin: "0.1rem auto",
          }}
        />{" "}
      </Grid>
    </Grid>
  );
};

export default AssignStaffMemberToEvent;
