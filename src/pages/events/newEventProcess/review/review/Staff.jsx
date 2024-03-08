import {
  Grid,
  InputLabel,
  Typography
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { onAddContactInfo } from "../../../../../store/slices/eventSlice";
import { useCallback, useEffect } from "react";

const Staff = () => {
  const { staff, contactInfo } = useSelector((state) => state.event);
  const dispatch = useDispatch()
  const settingContactInfo = useCallback(() => {
    if (staff.adminUser) {
      dispatch(onAddContactInfo({
        ...contactInfo,
        name: `${staff.adminUser[0].firstName} ${staff.adminUser[0].lastName}`,
        email: staff.adminUser[0].email
      }))
    }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    settingContactInfo()
    return () => {
      controller.abort()
    }
  }, [])

  return (
    <Grid
      display={"flex"}
      justifyContent={"flex-start"}
      alignItems={"center"}
      container
    >
      <Grid
        display={"flex"}
        flexDirection={"column"}
        justifyContent={"space-around"}
        alignItems={"center"}
        item
        xs={10}
      >
        <InputLabel
          id="eventName"
          style={{ marginBottom: "0.2rem", width: "100%" }}
        >
          <Typography
            textTransform={"none"}
            textAlign={"left"}
            fontFamily={"Inter"}
            fontSize={"20px"}
            fontStyle={"normal"}
            fontWeight={600}
            lineHeight={"30px"}
            color={"var(--gray-600, #475467)"}
            alignSelf={"stretch"}
          >
            Staff for the event
          </Typography>
        </InputLabel>
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          {staff.adminUser &&
            staff?.adminUser?.map((item) => {
              return (
                <Typography
                  key={item.email}
                  textTransform={"none"}
                  textAlign={"left"}
                  fontFamily={"Inter"}
                  fontSize={"16px"}
                  fontStyle={"normal"}
                  fontWeight={400}
                  lineHeight={"24px"}
                  color={"var(--gray-600, #475467)"}
                  margin={"0.5rem 0"}
                >
                  {item.firstName} {item.lastName}
                  <br />
                  {item.email}
                  <br />
                  {item.role}
                </Typography>
              );
            })}
        </InputLabel>
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          {staff.headsetAttendees &&
            staff?.headsetAttendees?.map((item) => {
              return (
                <Typography
                  key={item.email}
                  textTransform={"none"}
                  textAlign={"left"}
                  fontFamily={"Inter"}
                  fontSize={"16px"}
                  fontStyle={"normal"}
                  fontWeight={400}
                  lineHeight={"24px"}
                  color={"var(--gray-600, #475467)"}
                  margin={"0.5rem 0"}
                >
                  {item.firstName} {item.lastName}
                  <br />
                  {item.email}
                  <br />
                  {item.role}
                </Typography>
              );
            })}
        </InputLabel>
      </Grid>
    </Grid>
  );
};

export default Staff;
