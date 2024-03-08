import { Grid, InputLabel, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Select } from "antd";
import { useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import _ from 'lodash'
import Body from "./Body";
import { devitrakApi } from "../../../../api/devitrakApi";
import { onAddStaffActivityData } from "../../../../store/slices/staffActivitySlice";

const Header = () => {
  const { user } = useSelector((state) => state.admin);
  const { eventsPerAdmin } = useSelector((state) => state.event);
  const userSelectionRef = useRef("All");
  const eventsSelectionRef = useRef("All");
  const actionsSelectionRef = useRef("All");
  const dispatch = useDispatch();
  const activityLogQuery = useQuery({
    queryKey: ["activity"],
    queryFn: () => devitrakApi.get("/event-log/activity"),
  });
  const staffQuery = useQuery({
    queryKey: ["staff"],
    queryFn: () => devitrakApi.get("/staff/admin-users"),
  });

  const sortData = useCallback(() => {
    if (activityLogQuery.data) {
      const groupingCompany = _.groupBy(
        activityLogQuery.data.data.activity,
        "company"
      );
      if (
        userSelectionRef.current === "All" &&
        eventsSelectionRef.current === "All" &&
        actionsSelectionRef.current === "All"
      ) {
        dispatch(onAddStaffActivityData(groupingCompany[user.company]));
        return groupingCompany[user.company];
      } else {
        const filter = new Set();
        for (let data of groupingCompany[user.company]) {
          if (data.user === userSelectionRef.current) {
            filter.add(data);
          }
        }
        dispatch(onAddStaffActivityData(Array.from(filter)));
        return Array.from(filter);
      }
    }
  }, [
    activityLogQuery.data,
    dispatch,
    user.company,
    _,
    userSelectionRef.current,
    eventsSelectionRef.current,
    actionsSelectionRef.current,
  ]);
  sortData();
  const eventsFilterOptions = () => {
    const options = new Set();
    options.add("All");
    if (eventsPerAdmin["active"]) {
      for (let data of eventsPerAdmin["active"]) {
        options.add(data.eventInfoDetail.eventName);
      }
    }
    if (eventsPerAdmin["completed"]) {
      for (let data of eventsPerAdmin["completed"]) {
        options.add(data.eventInfoDetail.eventName);
      }
    }

    return Array.from(options);
  };

  const userFilterOptions = () => {
    const options = new Set();
    options.add({ name: "All", email: "All" });
    if (staffQuery.data) {
      const groupingCompany = _.groupBy(
        staffQuery.data.data.adminUsers,
        "company"
      );
      for (let data of groupingCompany[user.company]) {
        options.add({
          name: `${data.name} ${data.lastName}`,
          email: data.email,
        });
      }
    }
    return Array.from(options);
  };
  userFilterOptions();

  const onChangeUser = (value) => {
    userSelectionRef.current = value;
  };
  const onSearchUser = (value) => {
    console.log("search:", value);
  };

  const onChangeEvents = (value) => {
    eventsSelectionRef.current = value;
  };
  const onSearchEvents = (value) => {
    console.log("search:", value);
  };
  const onChangeActions = (value) => {
    actionsSelectionRef.current = value;
  };
  const onSearchActions = (value) => {
    console.log("search:", value);
  };
  // Filter `option.label` match the user type `input`
  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());
  return (
    <>
      <Grid
        style={{
          padding: "5px",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
        container
      >
        <Grid
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          container
        >
          <Grid
            display={"flex"}
            flexDirection={"column"}
            alignSelf={"stretch"}
            marginY={0}
            item
            xs={5}
            sm={5}
            md={6}
          >
            <Typography
              textTransform={"none"}
              style={{
                color: "var(--gray-900, #101828)",
                lineHeight: "38px",
              }}
              textAlign={"left"}
              fontWeight={600}
              fontFamily={"Inter"}
              fontSize={"18px"}
              lineHeight={"28px"}
            >
              View staff activity
            </Typography>
            <Typography
              textTransform={"none"}
              style={{
                color: "#475467",
                lineHeight: "38px",
              }}
              textAlign={"left"}
              fontWeight={400}
              fontFamily={"Inter"}
              fontSize={"14x"}
              lineHeight={"20px"}
            >
              View all the activity of all your events’ staff and consumers.
            </Typography>
          </Grid>
          <Grid
            display={"flex"}
            justifyContent={"flex-end"}
            alignItems={"center"}
            marginY={0}
            gap={2}
            item
            xs={5}
            sm={5}
            md={6}
          >
            <Grid
              item
              xs={4}
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              flexDirection={"column"}
            >
              <InputLabel style={{ width: "100%" }}>
                <Typography
                  textTransform={"none"}
                  color={"#475467"}
                  textAlign={"left"}
                  fontWeight={500}
                  fontFamily={"Inter"}
                  fontSize={"14x"}
                  lineHeight={"20px"}
                >
                  Users
                </Typography>
              </InputLabel>
              <Select
                showSearch
                placeholder="All"
                optionFilterProp="children"
                onChange={onChangeUser}
                onSearch={onSearchUser}
                filterOption={filterOption}
                style={{
                  width: "100%",
                }}
                options={userFilterOptions().map((option) => {
                  return {
                    label: option.name,
                    value: option.email,
                  };
                })}
              />
            </Grid>
            <Grid
              item
              xs={4}
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              flexDirection={"column"}
            >
              <InputLabel style={{ width: "100%" }}>
                <Typography
                  textTransform={"none"}
                  color={"#475467"}
                  textAlign={"left"}
                  fontWeight={500}
                  fontFamily={"Inter"}
                  fontSize={"14x"}
                  lineHeight={"20px"}
                >
                  Events
                </Typography>
              </InputLabel>
              <Select
                showSearch
                placeholder="All"
                optionFilterProp="children"
                onChange={onChangeEvents}
                onSearch={onSearchEvents}
                filterOption={filterOption}
                style={{
                  width: "100%",
                }}
                options={eventsFilterOptions().map((option) => {
                  return {
                    label: option,
                    value: option,
                  };
                })}
              />
            </Grid>
            <Grid
              item
              xs={4}
              display={"flex"}
              justifyContent={"flex-start"}
              alignItems={"center"}
              flexDirection={"column"}
            >
              <InputLabel style={{ width: "100%" }}>
                <Typography
                  textTransform={"none"}
                  color={"#475467"}
                  textAlign={"left"}
                  fontWeight={500}
                  fontFamily={"Inter"}
                  fontSize={"14x"}
                  lineHeight={"20px"}
                >
                  Action
                </Typography>
              </InputLabel>
              <Select
                showSearch
                placeholder="All"
                optionFilterProp="children"
                onChange={onChangeActions}
                onSearch={onSearchActions}
                filterOption={filterOption}
                style={{
                  width: "100%",
                }}
                options={[]}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <div style={{ display: "none" }}>
        <Body sortData={sortData()} />
      </div>
    </>
  );
};

export default Header;
