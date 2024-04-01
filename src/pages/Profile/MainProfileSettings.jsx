import { Grid, Typography } from "@mui/material";
import { Divider } from "antd";
import { useSelector } from "react-redux";
import { NavLink, Outlet, useLocation } from "react-router-dom";

const MainProfileSettings = () => {
  const { user } = useSelector((state) => state.admin)
  const location = useLocation();
  const tabOptions = [
    {
      label: "My details",
      route: "my_details",
      permission: ['Administrator', 'Editor', 'Approver']
    }, {
      label: "Password",
      route: "password",
      permission: ['Administrator', 'Approver', 'Editor']
    }, 
    {
      label: "Billing",
      route: "billing",
      permission: ["Administrator"]
    },
    {
      label: "Notifications",
      route: "notifications",
      permission: ["Administrator"]
    }, {
      label: "Staff activity",
      route: "staff-activity",
      permission: ['Administrator']
    }
  ]
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
            {
              tabOptions.map(option => {
                if (option.permission.some(element => element === user.role)) {
                  return (
                    <NavLink key={option.label} to={`${option.route}`} style={({ isActive }) => {
                      return {
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "1px 4px 11px",
                        gap: "8px",
                        borderBottom: isActive ?
                          "1px solid #004EEB" : "rgba(0, 0, 0, 0.88)",
                      };
                    }}>
                      <Typography
                        color={`${location.pathname === `/profile/${option.route}`
                          ? "#004EEB"
                          : "#667085"
                          }`}
                        fontFamily={"Inter"}
                        fontSize={"14px"}
                        fontWeight={600}
                        lineHeight={"20px"}
                      >
                        {option.label}
                      </Typography>
                    </NavLink>
                  )
                }
              })
            }
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
    </Grid>
  );
};

export default MainProfileSettings;
