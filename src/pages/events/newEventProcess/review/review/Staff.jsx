import { Grid, InputLabel } from "@mui/material";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { onAddContactInfo } from "../../../../../store/slices/eventSlice";
import { dicStaff } from "../../staff/components/dictionary";

const Staff = () => {
  const { staff, contactInfo } = useSelector((state) => state.event);
  const dispatch = useDispatch();
  // Fills the event contact from the first admin staff member, once. The
  // dispatch changes contactInfo, so without the guard it would run again.
  const contactInfoFilled = useRef(false);
  useEffect(() => {
    if (contactInfoFilled.current) return;
    contactInfoFilled.current = true;
    const admin = staff?.adminUser?.[0];
    if (!admin) return;
    dispatch(
      onAddContactInfo({
        ...contactInfo,
        name: `${admin.firstName} ${admin.lastName}`,
        email: admin.email,
      })
    );
  }, [staff, contactInfo, dispatch]);

  const styleTitle = {
    textTransform: "none",
    textAlign: "left",
    fontFamily: "Inter",
    fontSize: "20px",
    fontStyle: "normal",
    fontWeight: 600,
    lineHeight: "30px",
    color: "var(--gray-600, #475467)",
    alignSelf: "stretch",
  };

  const inputValueStyle = {
    textTransform: "none",
    textAlign: "left",
    fontFamily: "Inter",
    fontSize: "16px",
    fontStyle: "normal",
    fontWeight: 400,
    lineHeight: "24px",
    color: "var(--gray-600, #475467)",
  };

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
          <h1 style={styleTitle}>Staff for the event</h1>
        </InputLabel>
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          {staff.adminUser &&
            staff?.adminUser?.map((item) => {
              return (
                <h4 style={{ ...inputValueStyle, margin:"0.5rem 0"}} key={item.email}>
                  {item.firstName} {item.lastName}
                  <br />
                  {item.email}
                  <br />
                  {dicStaff[item.role]}
                </h4>
              );
            })}
        </InputLabel>
        <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
          {staff.headsetAttendees &&
            staff?.headsetAttendees?.map((item) => {
              return (
                <h4 style={{ ...inputValueStyle, margin:"0.5rem 0"}}
                  key={item.email}
                >
                  {item.firstName} {item.lastName}
                  <br />
                  {item.email}
                  <br />
                  {dicStaff[item.role]}
                </h4>
              );
            })}
        </InputLabel>
      </Grid>
    </Grid>
  );
};

export default Staff;
