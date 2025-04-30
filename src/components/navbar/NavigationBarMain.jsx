import { Icon } from "@iconify/react";
import {
  Badge,
  Box,
  Divider,
  Drawer,
  Grid,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  OutlinedInput,
} from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import pkg from "prop-types";
import { forwardRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import { persistor } from "../../store/Store";
import { onLogout } from "../../store/slices/adminSlice";
import { onResetArticleEdited } from "../../store/slices/articleSlide";
import { onResetCustomer } from "../../store/slices/customerSlice";
import {
  onResetDeviceInQuickGlance,
  onResetDevicesHandle,
} from "../../store/slices/devicesHandleSlice";
import { onResetEventInfo } from "../../store/slices/eventSlice";
import { onResetHelpers } from "../../store/slices/helperSlice";
import { onResetResult } from "../../store/slices/searchBarResultSlice";
import { onResetStaffProfile } from "../../store/slices/staffDetailSlide";
import { onResetStripesInfo } from "../../store/slices/stripeSlice";
import { onResetSubscriptionInfo } from "../../store/slices/subscriptionSlice";
import CenteringGrid from "../../styles/global/CenteringGrid";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
// import { TextFontSize14LineHeight20 } from "../../styles/global/TextFontSize14LineHeight20";
import { DevitrakLogo } from "../icons/DevitrakLogo";
import { DevitrakName } from "../icons/DevitrakName";
import { LogoutIcon } from "../icons/LogoutIcon";
// import { ProfileIcon } from "../icons/ProfileIcon";
import UpperBanner from "../general/UpperBanner";
import MagnifyIcon from "../icons/search-lg.svg";
import Profile from "../icons/user-03.svg";
import "./style/style.css";
const { PropTypes } = pkg;
const drawerWidth = 240;
const navItems = [
  {
    title: "home",
    route: "/",
    permission: [0, 1, 2, 3],
    mobile: true,
    desktop: true,
  },
  {
    title: "inventory",
    route: "/inventory",
    permission: [0, 1],
    mobile: true,
    desktop: true,
  },
  {
    title: "events",
    route: "/events",
    permission: [0, 1, 2, 3, 4],
    mobile: true,
    desktop: true,
  },
  {
    title: "consumers",
    route: "/consumers",
    permission: [0, 1],
    mobile: true,
    desktop: true,
  },
  {
    title: "Posts",
    route: "/posts",
    permission: [0, 1, 2, 3],
    mobile: true,
    desktop: true,
  },
  {
    title: "staff",
    route: "/staff",
    permission: [0, 1, 2, 3],
    mobile: true,
    desktop: true,
  },
  {
    title: "profile",
    route: "/profile/my_details",
    permission: [0, 1, 2, 3, 4],
    mobile: true,
    desktop: false,
  },
];

const NavigationBarMain = forwardRef(function NavigationBarMain(props, ref) {
  // eslint-disable-next-line no-unused-vars
  // const [{ x, y }, scrollTo] = useWindowScroll();
  // const { register, handleSubmit, watch } = useForm()
  const { window } = props;
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useSelector((state) => state.admin);
  const [searchValue, setSearchValue] = useState("");
  const [rowId, setRowId] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const logout = async () => {
    await devitrakApi.patch(`/staff/edit-admin/${user.uid}`, {
      online: false,
    });
    persistor.purge();
    dispatch(onResetArticleEdited());
    dispatch(onResetCustomer());
    dispatch(onResetDevicesHandle());
    dispatch(onResetDeviceInQuickGlance());
    dispatch(onResetEventInfo());
    dispatch(onResetStaffProfile());
    dispatch(onResetHelpers());
    dispatch(onResetStripesInfo());
    dispatch(onResetSubscriptionInfo());
    localStorage.removeItem("admin-token", "");
    dispatch(onLogout());
    return navigate("/login");
  };

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };

  const onChange = (e) => {
    return setSearchValue(e.target.value);
  };
  const handleResetSearchValue = () => {
    setSearchValue("");
    return dispatch(onResetResult());
  };

  const handleSearch = (e) => {
    e.preventDefault();
    return navigate(`/search-result-page?search=${searchValue}`, {
      state: { search: searchValue, count: 0 },
      flushSync: true,
      replace: true,
      relative: false,
      window: true,
    });
  };
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  const isLargeDevice = useMediaQuery(
    "only screen and (min-width : 993px) and (max-width : 1200px)"
  );

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: "center" }}>
      <Divider />
      <List>
        <NavLink
          to={"/"}
          style={{
            margin: "0 3px 0 0",
            width: "100%",
            height: "100%",
            backgroundColor: "var(--blue700)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "12px 0",
          }}
        >
          <DevitrakLogo />
          <DevitrakName />{" "}
        </NavLink>
        {navItems.map((item) => (
          <ListItem key={`${item.title}-${item.route}`} disablePadding>
            <ListItemButton
              onMouseEnter={() => setRowId(item.route)}
              onMouseLeave={() => setRowId(null)}
              sx={{
                textAlign: "center",
                backgroundColor:
                  location.pathname === `${item.route}`
                    ? "transparent"
                    : "var(--blue700)",
              }}
            >
              <NavLink
                key={item.title}
                to={`${item.route}`}
                style={{
                  margin: "0 3px 0 0",
                  width: "100%",
                }}
              >
                <div className="content-main-navbar-updated">
                  <article
                    style={{
                      backgroundColor:
                        rowId === item.route
                          ? "var(--whitebase)"
                          : "var(--blue700)",
                    }}
                    className={
                      location.pathname === `${item.route}`
                        ? "nav-item-base-main-navbar-updated"
                        : "nav-item-base-1-main-navbar-updated"
                    }
                  >
                    <div className="content-2-main-navbar-updated">
                      <div className="text-1-main-navbar-updated text-mdsemibold">
                        <p
                          style={{
                            textTransform: "capitalize",
                            color:
                              rowId === item.route
                                ? "var(--blue700)"
                                : "var(--whitebase)",
                          }}
                        >
                          {item.title}
                        </p>
                      </div>
                    </div>
                  </article>
                </div>
              </NavLink>
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem key={`log-out`} disablePadding>
          <ListItemButton
            onClick={() => logout()}
            sx={{
              textAlign: "center",
              backgroundColor: "var(--blue700)",
            }}
          >
            <NavLink
              to={"/login"}
              style={{ margin: "0 3px 0 0", width: "100%" }}
            >
              <div className="content-main-navbar-updated">
                <article className={"nav-item-base-main-navbar-updated"}>
                  <div className="content-2-main-navbar-updated">
                    <div className="text-1-main-navbar-updated text-mdsemibold">
                      <p style={{ textTransform: "capitalize" }}>
                        <LogoutIcon />
                        &nbsp;Log out
                      </p>
                    </div>
                  </div>
                </article>
              </div>
            </NavLink>
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  const container =
    window !== undefined ? () => window().document.body : undefined;

  const renderOtherWidth = () => {
    if (isMediumDevice) return "100vw";
    if (isLargeDevice) return "100vw";
    return "1228px";
  };

  return (
    <Grid
      ref={ref}
      container
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--blue700)",
        margin: "auto",
      }}
    >
      <UpperBanner />
      {/* <AppBar
        style={{
          backgroundColor: "var(--blue700)",
          width: "100%",
          zIndex: 30,
        }}
        component="nav"
      >
        <Toolbar> */}
      <div
        id="grid-container-inside"
        style={{
          ...CenteringGrid,
          justifyContent: "space-between",
          backgroundColor: "var(--blue700)",
          width: `${isSmallDevice ? "100vw" : renderOtherWidth()}`,
        }}
      >
        <Grid
          sx={{
            padding: {
              xs: "0 20px",
              sm: "0 20px",
              md:0,
              lg:0,
            },
          }}
          item
          sm={2}
          md={8}
          lg={8}
        >
          <Badge
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              display: { sm: "flex", md: "none", lg: "none" },
              backgroundColor: "var(--blue700)",
              borderBottom: "solid 1px var(--blue-dark--600)",
              padding: "0 24px 0 0",
              borderRadius: "50%",
            }}
          >
            <Icon icon="material-symbols:menu" width={30} height={30} color="#fff" />
          </Badge>
          <Box
            sx={{
              display: { xs: "none", sm: "none", md: "flex", lg: "flex" },
              justifyContent: "flex-start",
              alignItems: "center",
              padding:0,
            }}
          >
            <NavLink
              key={"devitrakName"}
              to={`${Number(user.role) === 4 ? "/events" : "/"}`}
              style={{ margin: "0 16px 0 0", width: "fit-content", padding:0 }}
            >
              <DevitrakLogo />
              <DevitrakName />{" "}
            </NavLink>

            {navItems.map((item) => {
              if (
                item.permission.some(
                  (element) => element === Number(user.role) && item.desktop
                )
              ) {
                return (
                  <NavLink
                    key={item.title}
                    to={`${item.route}`}
                    preventScrollReset
                  >
                    <div className="content-main-navbar-updated">
                      <article
                        className={
                          location.pathname === `${item.route}`
                            ? "nav-item-base-main-navbar-updated"
                            : "nav-item-base-1-main-navbar-updated"
                        }
                      >
                        <div className="content-2-main-navbar-updated">
                          <div className="text-1-main-navbar-updated text-mdsemibold">
                            <p style={{ textTransform: "capitalize" }}>
                              {item.title}
                            </p>
                          </div>
                        </div>
                      </article>
                    </div>
                  </NavLink>
                );
              }
            })}
          </Box>
        </Grid>

        <Grid
          item
          sm={10}
          md={4}
          lg={4}
          sx={{
            display: { xs: "none", sm: "flex", md: "flex", lg: "flex" },
            justifyContent: "flex-end",
            alignItems: "center",
            margin: 0,
            // gap: "5px",
          }}
        >
          <form
            style={{ margin: "0 5px 0 0", width: "100%" }}
            onSubmit={handleSearch}
            method="get"
            action="/search-result-page?search="
          >
            <OutlinedInput
              placeholder="Search"
              required
              style={{ ...OutlinedInputStyle, boxSizing: "border-box" }}
              onChange={(e) => onChange(e)}
              name={"searchValue"}
              value={searchValue}
              endAdornment={
                <InputAdornment position="end">
                  <Icon
                    cursor={"pointer"}
                    icon="ic:baseline-delete-forever"
                    color="#1e73be"
                    width="25"
                    height="25"
                    opacity={`${String(searchValue)?.length > 0 ? 1 : 0}`}
                    display={`${
                      String(searchValue)?.length > 0 ? "auto" : "none"
                    }`}
                    onClick={() => handleResetSearchValue()}
                  />
                </InputAdornment>
              }
              fullWidth
            />
          </form>
          <button
            style={{
              outline: "none",
              border: "transparent",
              margin: 0,
              padding: 0,
              backgroundColor: "transparent",
            }}
            key={"item.title"}
            onClick={(e) => handleSearch(e)}
          >
            <div className="content-main-navbar-updated">
              <article className={"nav-item-base-1-main-navbar-updated"}>
                <div className="content-2-main-navbar-updated">
                  <div className="text-1-main-navbar-updated text-mdsemibold">
                    <p
                      style={{
                        textTransform: "capitalize",
                        fontSize: "25px",
                      }}
                    >
                      <img src={MagnifyIcon} alt="search-icon" />
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </button>
          <NavLink key={"/profile/my_details"} to={`/profile/my_details`}>
            <div className="content-main-navbar-updated">
              <article
                className={
                  location.pathname === `/profile/my_details`
                    ? "nav-item-base-main-navbar-updated"
                    : "nav-item-base-1-main-navbar-updated"
                }
              >
                <div className="content-2-main-navbar-updated">
                  <div className="text-1-main-navbar-updated text-mdsemibold">
                    <p
                      style={{
                        textTransform: "capitalize",
                        fontSize: "25px",
                      }}
                    >
                      <img src={Profile} alt="Logo" />
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </NavLink>
        </Grid>
      </div>
      {/* </Toolbar>
      </AppBar> */}
      <nav>
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "block" },
            "& .MuiDrawer-paper": {
              GridSizing: "border-box",
              width: drawerWidth,
              padding:{
                sx:"0 20px",
                sm:"0 20px",
              }
            },
          }}
        >
          {drawer}
        </Drawer>
      </nav>
    </Grid>
  );
});

export default NavigationBarMain;

NavigationBarMain.propTypes = {
  window: PropTypes.func,
};

{
  /* {status === "authenticated" && (
                <NavLink>
                  <div className="content-main-navbar-updated">
                    <article
                      className="nav-item-base-1-main-navbar-updated"
                      style={{ backgroundColor: "var(--danger-action)" }}
                    >
                      <div className="content-2-main-navbar-updated">
                        <div
                          className="text-1-main-navbar-updated text-mdsemibold"
                          style={{
                            display: "flex",
                            backgroundColor: "var(--danger-action)",
                            borderRadius: "50%",
                          }}
                        >
                          {" "}
                          <button
                            style={{
                              outline: "none",
                              border: "transparent",
                              margin: 0,
                              padding: 0,
                              backgroundColor: "transparent",
                            }}
                            key={"authenticated"}
                            onClick={() => logout()}
                          >
                            <p
                              style={{
                                textTransform: "capitalize",
                                fontSize: "25px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <LogoutIcon />
                            </p>
                          </button>
                        </div>
                      </div>
                    </article>
                  </div>
                </NavLink>
              )} */
}
