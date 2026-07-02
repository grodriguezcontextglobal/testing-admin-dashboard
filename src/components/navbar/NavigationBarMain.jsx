import {
  Badge,
  Box,
  Divider,
  Drawer,
  Grid,
  List,
  ListItem,
  ListItemButton
} from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import pkg from "prop-types";
import { forwardRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import { clearSessionStorage } from "../../api/sessionHeaders";
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
import { hasPermission, resolveRoleType } from "../../config/roles";
import Input from "../UX/inputs/Input";
import { CircleDeleteIcon } from "../icons/CircleDeleteIcon";
import MenuIcon from "../icons/MenuIcon";
import MagnifyIcon from "../icons/search-lg.svg";
import Profile from "../icons/user-03.svg";
import ConditionalButton from "./component/ConditionalButton";
import "./style/style.css";
const { PropTypes } = pkg;
const drawerWidth = 240;
const navItems = [
  { title: "home", route: "/", permission: "nav:home", mobile: true, desktop: true },
  { title: "inventory", route: "/inventory", permission: "nav:inventory", mobile: true, desktop: true },
  { title: "events", route: "/events", permission: "nav:events", mobile: true, desktop: true },
  { title: "consumers", route: "/consumers", permission: "nav:consumers", mobile: true, desktop: true },
  { title: "Posts", route: "/posts", permission: "nav:posts", mobile: true, desktop: true },
  { title: "staff", route: "/staff", permission: "nav:staff", mobile: true, desktop: true },
  { title: 0, route: 0, permission: "nav:dynamic_section", mobile: false, desktop: true },
  { title: "profile", route: "/profile/my_details", permission: "nav:profile", mobile: true, desktop: false },
];

const getHomeRoute = (roleType) => {
  if (roleType === "inventory_manager") return "/inventory";
  if (roleType === "event_manager" || roleType === "assistant") return "/events";
  return "/";
};

const NavigationBarMain = forwardRef(function NavigationBarMain(props, ref) {
  // eslint-disable-next-line no-unused-vars
  // const [{ x, y }, scrollTo] = useWindowScroll();
  // const { register, handleSubmit, watch } = useForm()
  const { window } = props;
  const [mobileOpen, setMobileOpen] = useState(false);
  // const [showSearch, setShowSearch] = useState(false);
  const location = useLocation();
  const { user } = useSelector((state) => state.admin);
  const [searchValue, setSearchValue] = useState("");
  // const [rowId, setRowId] = useState(null);
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
    clearSessionStorage();
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

  // const toggleSearch = () => {
  //   if (showSearch) {
  //     setSearchValue("");
  //     dispatch(onResetResult());
  //   }
  //   setShowSearch((prev) => !prev);
  // };

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
    "only screen and (min-width : 769px) and (max-width : 992px)",
  );
  const isLargeDevice = useMediaQuery(
    "only screen and (min-width : 993px) and (max-width : 1200px)",
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
        {navItems.map((item) => {
          if (!hasPermission(item.permission, resolveRoleType(user)) || !item.mobile) return null;
          if (item.route === 0) {
            return <ConditionalButton key={item.title} user={user} />;
          } else {
            return (
              <ListItem key={item.title} disablePadding>
                <ListItemButton
                  component={NavLink}
                  to={item.route}
                  sx={{
                    textAlign: "center",
                    backgroundColor: "var(--blue700)",
                  }}
                >
                  <div className="content-main-navbar-updated">
                    <article className={"nav-item-base-main-navbar-updated"}>
                      <div className="content-2-main-navbar-updated">
                        <div className="text-1-main-navbar-updated text-mdsemibold">
                          <p style={{ textTransform: "capitalize" }}>
                            {item.title}
                          </p>
                        </div>
                      </div>
                    </article>
                  </div>
                </ListItemButton>
              </ListItem>
            );
          }
        })}
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
    if (isMediumDevice) return "99.5vw";
    if (isLargeDevice) return "99.5vw";
    return "1400px";
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
      <div
        id="grid-container-inside"
        style={{
          ...CenteringGrid,
          justifyContent: "space-between",
          backgroundColor: "var(--blue700)",
          width: isSmallDevice ? "100vw" : renderOtherWidth(),
        }}
      >
        <Grid
          sx={{
            padding: {
              xs: "0 20px",
              sm: "0 20px",
              md: 0,
              lg: 0,
            },
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
          item
          xs={12}
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
            <MenuIcon stroke="#fff" />
          </Badge>
          <Box
            sx={{
              display: { xs: "none", sm: "none", md: "flex", lg: "flex" },
              justifyContent: "flex-start",
              alignItems: "center",
              padding: 0,
            }}
          >
            <NavLink
              key={"devitrakName"}
              to={getHomeRoute(resolveRoleType(user))}
              style={{ margin: "0 16px 0 0", width: "fit-content", padding: 0 }}
            >
              <DevitrakLogo />
              <DevitrakName />{" "}
            </NavLink>

            {navItems.map((item) => {
              if (hasPermission(item.permission, resolveRoleType(user)) && item.desktop) {
                if (item.route === 0) {
                  return (
                    <ConditionalButton
                      key={item.title}
                      item={item}
                      user={user}
                    />
                  );
                } else {
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
          }}
        >
          {/* {showSearch && ( */}
          <form
            style={{
              margin: "0 5px 0 0",
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            onSubmit={handleSearch}
            method="get"
            action="/search-result-page?search="
            id="search-form"
          >
            <Input
              placeholder="Search"
              required
              style={{ ...OutlinedInputStyle, boxSizing: "border-box" }}
              onChange={(e) => onChange(e)}
              name={"searchValue"}
              value={searchValue}
              fullWidth
              autoFocus
            // endAdornment={
            //   <div>
            //     <button style={{
            //       outline: "none",
            //       border: "transparent",
            //       margin: 0,
            //       padding: "4.5px",
            //       backgroundColor: "#0040C1", display: showSearch && searchValue?.length > 0 ? "flex" : "none",
            //       borderRadius: "25%",
            //       width: "25px",
            //       height: "25px",
            //     }} type="submit"
            //       form="search-form">
            //       {/* <SendIcon size="15" stroke="#fff" strokeWidth="2.5" /> */}
            //       <img src={MagnifyIcon} alt="search-icon" />
            //     </button>
            //     <button style={{
            //       outline: "none",
            //       border: "transparent",
            //       margin: 0,
            //       padding: "4.5px",
            //       backgroundColor: "#0040C1", display: showSearch && searchValue?.length > 0 ? "flex" : "none",
            //       borderRadius: "25%",
            //       width: "25px",
            //       height: "25px",
            //     }} type="button" onClick={() => handleResetSearchValue()}>
            //       {/* <SendIcon size="15" stroke="#fff" strokeWidth="2.5" /> */}
            //       <CircleDeleteIcon width="20" height="20" />
            //     </button>
            //   </div>
            // }
            />
          </form>
          {/* )} */}
          {searchValue?.length > 0 && (
            <button
              style={{
                outline: "none",
                border: "transparent",
                margin: 0,
                padding: 0,
                backgroundColor: "transparent",
                display: "flex",
              }}
              onClick={() => handleResetSearchValue()}
            >
              <div className="content-main-navbar-updated">
                <article className={"nav-item-base-1-main-navbar-updated"}>
                  <div className="content-2-main-navbar-updated">
                    <div className="text-1-main-navbar-updated text-mdsemibold">
                      <p style={{ textTransform: "capitalize", fontSize: "25px" }}>
                        <CircleDeleteIcon width="20" height="20" />
                      </p>
                    </div>
                  </div>
                </article>
              </div>
            </button>
          )}
          <button
            style={{
              outline: "none",
              border: "transparent",
              margin: 0,
              padding: 0,
              backgroundColor: "transparent",
              display: "flex",
            }}
            type="submit"
            form="search-form"
          >
            <div className="content-main-navbar-updated">
              <article
                className={"nav-item-base-main-navbar-updated"}
              >
                <div className="content-2-main-navbar-updated">
                  <div className="text-1-main-navbar-updated text-mdsemibold">
                    <p style={{ textTransform: "capitalize", fontSize: "25px" }}>
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
                    <p style={{ textTransform: "capitalize", fontSize: "25px" }}>
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
      <nav style={{ width: "100%" }}>
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
              padding: {
                sx: "0 20px",
                sm: "0 20px",
              },
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
