import { Grid } from "@mui/material";
import { message } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import CenteringGrid from "../../styles/global/CenteringGrid";
import { rolesWith } from "../../config/roleCapabilities";
import { Title } from "../../styles/global/Title";
import { Subtitle } from "../../styles/global/Subtitle";
const ErrorLandingPage = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const key = "updatable";
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const openMessage = () => {
    setTimeout(async () => {
      await messageApi.open({
        key,
        type: "loading",
        content: "processing information...",
        duration: 2,
      });
      await messageApi.open({
        key,
        type: "success",
        content: "Keep using Devitrak App!",
        duration: 1,
      });
    }, 1000);
  };
  openMessage();
  const options = [
    {
      title: "home",
      route: "/",
      permission: rolesWith("nav.home"),
    },
    {
      title: "events",
      route: "/events",
      permission: rolesWith("nav.events"),
    },
    {
      title: "inventory",
      route: "/inventory",
      permission: rolesWith("nav.inventory"),
    },
    {
      title: "customers",
      route: "/customers",
      permission: rolesWith("nav.consumers"),
    },
    {
      title: "staff",
      route: "/staff",
      permission: rolesWith("nav.staff"),
    },
  ];
  return (
    <>
      {contextHolder}
      <Grid
        container
        style={{
          ...CenteringGrid,
          backgroundColor: "var(--blue700)",
          borderRadius: "8px",
          width:"30vw"
        }}
      >
        <div style={{ ...CenteringGrid, flexDirection: "column",}}>
          <div style={{ ...CenteringGrid }}>
            <h1
              style={{
                ...Title,
                color: "var(--basewhite)",
                borderRadius: "5px",
              }}
            >
              404 page not found.
            </h1>
          </div>
          <div
            style={{
              ...Title,
              display: "flex",
              flexDirection: "column",
              color: "var(--basewhite)",
              borderRadius: "5px",
            }}
          >
            <p style={{ ...Subtitle, color: "var(--basewhite)" }}>
              Let me show you a few options that can help you to find the route
              you want to go.
            </p>
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: "5px",
              }}
            >
              {options.map((item) => {
                if (
                  item.permission.some(
                    (element) => element === Number(user.role)
                  )
                ) {
                  return (
                    <button
                      key={item.title}
                      onClick={() => navigate(item.route)}
                      style={{
                        width: "fit-content",
                        outline: "none",
                        margin: 0,
                        padding: 0,
                        backgroundColor: "transparent",
                      }}
                    >
                      <p
                        style={{
                          ...Subtitle,
                          color: "var(--basewhite)",
                          textTransform: "capitalize",
                          textDecoration:"underline"
                        }}
                      >
                        {item.title}
                      </p>
                    </button>
                  );
                }
              })}
            </div>
          </div>
        </div>
      </Grid>
    </>
  );
};

export default ErrorLandingPage;
