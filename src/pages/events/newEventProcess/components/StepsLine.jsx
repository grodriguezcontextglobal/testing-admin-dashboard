import { Box, Typography } from "@mui/material";
import { Button, Steps } from "antd";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Subtitle } from "../../../../styles/global/Subtitle";
import { useSelector } from "react-redux";

const StepsLine = () => {
  const { eventInfoDetail, staff } = useSelector((state) => state.event)
  const pathCheck = useLocation()
  const [current, setCurrent] = useState(0)
  const navigate = useNavigate()
  const prev = () => {
    setCurrent(current - 1);
    navigate(`${step[current].previous}`)
  };
  const step = [
    {
      title: "Event details",
      description: "Name, location, and details about the event",
      previous: null,
      current: "create-event-page/event-detail",
    },
    {
      title: "Staff details",
      description: "Your representatives at the event",
      previous: '/create-event-page/event-detail',
      current: "create-event-page/staff-detail",
    },
    {
      title: "Devices details",
      description: "The devices you will track at the event",
      previous: '/create-event-page/staff-detail',
      current: "create-event-page/device-detail",
    },
    {
      title: "Review",
      description: "Final review to create the event",
      previous: '/create-event-page/device-detail',
      current: "create-event-page/review-submit",
    },
  ];

  const items = step.map((item) => ({
    key: item.title,
    title: item.title,
    description: item.description,
  }));
  const progression = () => {
    const ref = {
      "/create-event-page/event-detail": 25,
      "/create-event-page/staff-detail": 50,
      "/create-event-page/device-detail": 75,
      "/create-event-page/event-edit-detail": 25,
      "/create-event-page/staff-edit-detail": 50,
      "/create-event-page/device-edit-detail": 75,
      "/create-event-page/review-submit": 100
    }
    return ref[pathCheck.pathname]
  };
  const currentPath = useMemo(() => {
    const ref = {
      "/create-event-page/event-detail": 0,
      "/create-event-page/staff-detail": 1,
      "/create-event-page/device-detail": 2,
      "/create-event-page/review-submit": 3
    }
    setCurrent(ref[pathCheck.pathname])
    return ref[pathCheck.pathname]
  }, [pathCheck.pathname])

  const onChange = (value) => {
    setCurrent(value);
    if (value === 3) {
      if (eventInfoDetail.eventName && staff.adminUser.length > 0) return navigate(`/${step[value].current}`)
      return null;
    }
    return navigate(`/${step[value].current}`)
  };

  return (
    <Box>
      <Steps
        direction="vertical"
        percent={progression()}
        current={currentPath}
        onChange={onChange}
        items={items}
      />
      {current > 0 && (
        <Button
          onClick={() => prev()}
          style={{
            display: "flex",
            padding: "8px 14px",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
            alignSelf: "stretch",
            borderRadius: "8px",
            border: "1px solid var(--gray-300, #D0D5DD)",
            background: "var(--base-white, #FFF)",
            boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
            width: "fit-content",
            maxHeight: "4dvh",
          }}
        >

          <Typography
            textTransform={"none"}
            style={{ ...Subtitle, fontWeight: 600 }}
          >
            Previous step
          </Typography>
        </Button>
      )}
    </Box>
  );
};

export default StepsLine;
