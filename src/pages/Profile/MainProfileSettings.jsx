import { Grid, Typography } from "@mui/material";
import { Divider } from "antd";
import { Link, Outlet, useLocation } from "react-router-dom";

const MainProfileSettings = () => {
  const location = useLocation();
  return (
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
      {/* <Grid item  xs={12} sm={12} md={12} lg={11} > */}
        <Grid
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          marginTop={5}
          container
        >
          <Grid margin={"0 0 3rem"} item xs={12} sm={12} md={12}>
            <Typography
              textTransform={"none"}
              style={{
                color: "var(--gray-900, #101828)",
                lineHeight: "38px",
              }}
              textAlign={"left"}
              fontWeight={600}
              fontFamily={"Inter"}
              fontSize={"30px"}
            >
              Settings
            </Typography>
          </Grid>
        </Grid>
        <Grid
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          marginTop={1}
          container
        >
          <Grid marginY={0} item xs={12} sm={12} md={6}>
            <nav style={{ display: "flex" }}>
              <Link
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "1px 4px 11px",
                  gap: "8px",
                  borderBottom: `${
                    location.pathname === "/profile/my_details" ?
                    "1px solid #004EEB" : "rgba(0, 0, 0, 0.88)"
                  }`,
                }}
                to={"my_details"}
              >
                <Typography
                  color={`${
                    location.pathname === "/profile/my_details"
                      ? "#004EEB"
                      : "#667085"
                  }`}
                  fontFamily={"Inter"}
                  fontSize={"14px"}
                  fontWeight={600}
                  lineHeight={"20px"}
                >
                  My details
                </Typography>
              </Link>
              <Link
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "1px 4px 11px",
                  gap: "8px",
                  borderBottom: `${
                    location.pathname === "/profile/password" ?
                    "1px solid #004EEB" : "rgba(0, 0, 0, 0.88)"
                  }`,
                }}
                to={"password"}
              >
                <Typography
                  color={`${
                    location.pathname === "/profile/password"
                      ? "#004EEB"
                      : "#667085"
                  }`}
                  fontFamily={"Inter"}
                  fontSize={"14px"}
                  fontWeight={600}
                  lineHeight={"20px"}
                >
                  Password
                </Typography>
              </Link>
              <Link
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "1px 4px 11px",
                  gap: "8px",
                  borderBottom: `${
                    location.pathname === "/profile/billing" ?
                    "1px solid #004EEB" : "rgba(0, 0, 0, 0.88)"
                  }`,
                }}
                to={"billing"}
              >
                <Typography
                  color={`${
                    location.pathname === "/profile/billing"
                      ? "#004EEB"
                      : "#667085"
                  }`}
                  fontFamily={"Inter"}
                  fontSize={"14px"}
                  fontWeight={600}
                  lineHeight={"20px"}
                >
                  Billing
                </Typography>
              </Link>
              <Link
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "1px 4px 11px",
                  gap: "8px",
                  borderBottom: `${
                    location.pathname === "/profile/notifications" ?
                    "1px solid #004EEB" : "rgba(0, 0, 0, 0.88)"
                  }`,
                }}
                to={"notifications"}
              >
                <Typography
                  color={`${
                    location.pathname === "/profile/notifications"
                      ? "#004EEB"
                      : "#667085"
                  }`}
                  fontFamily={"Inter"}
                  fontSize={"14px"}
                  fontWeight={600}
                  lineHeight={"20px"}
                >
                  Notifications
                </Typography>
              </Link>
              {/* <Link
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "1px 4px 11px",
                  gap: "8px",
                  borderBottom: `${
                    location.pathname === "/profile/integration" ?
                    "1px solid #004EEB" : "rgba(0, 0, 0, 0.88)"
                  }`,
                }}
                to={"integration"}
              >
                <Typography
                  color={`${
                    location.pathname === "/profile/integration"
                      ? "#004EEB"
                      : "#667085"
                  }`}
                  fontFamily={"Inter"}
                  fontSize={"14px"}
                  fontWeight={600}
                  lineHeight={"20px"}
                >
                  Integration
                </Typography>
              </Link> */}
              <Link
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "1px 4px 11px",
                  gap: "8px",
                  borderBottom: `${
                    location.pathname === "/profile/staff-activity" ?
                    "1px solid #004EEB" : "rgba(0, 0, 0, 0.88)"
                  }`,
                }}
                to={"staff-activity"}
              >
                <Typography
                  color={`${
                    location.pathname === "/profile/staff-activity"
                      ? "#004EEB"
                      : "#667085"
                  }`}
                  fontFamily={"Inter"}
                  fontSize={"14px"}
                  fontWeight={600}
                  lineHeight={"20px"}
                >
                  Staff activity
                </Typography>
              </Link>
            </nav>
          </Grid>
        </Grid>
        <Divider
          style={{
            margin: 0,
          }}
        />
        <Grid container>
          <Grid
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
            item
            xs={12}
          >
            <Outlet />
          </Grid>
        </Grid>
      {/* </Grid> */}
    </Grid>
  );
};

export default MainProfileSettings;
