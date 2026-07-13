import {
  Badge,
  Box,
  Drawer,
  Grid,
  List
} from "@mui/material";
import { useMediaQuery } from "@uidotdev/usehooks";
import {
  Calendar,
  Home as HomeLine,
  Newspaper,
  Package,
  User,
  UserCog,
  Users,
} from "lucide-react";
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
// import { ProfileIcon } from "../icons/ProfileIcon";
import { hasPermission, resolveRoleType } from "../../config/roles";
import Input from "../UX/inputs/Input";
import { CircleDeleteIcon } from "../icons/CircleDeleteIcon";
import MenuIcon from "../icons/MenuIcon";
import { SendIcon } from "../icons/SendIcon";
import { Icon } from "@iconify/react";
import MagnifyIcon from "../icons/search-lg.svg";
import colorMark from "../../assets/maskable_icon_white_background.png";
import DevitrakWordmark from "../icons/DevitrakWordmark";
import Profile from "../icons/user-03.svg";
import ConditionalButton from "./component/ConditionalButton";
import MobileSidebarNav from "./component/MobileSidebarNav";
import "./style/style.css";
const { PropTypes } = pkg;
// Same icons as the command menu navigation group (tabler set)
const NAV_ICONS = {
  home: "tabler:home",
  inventory: "tabler:box",
  events: "tabler:calendar-event",
  consumers: "tabler:users",
  posts: "tabler:news",
  staff: "tabler:id-badge-2",
  profile: "tabler:user-circle",
};

const navItems = [
  { title: "home", route: "/", permission: "nav:home", mobile: true, desktop: true, icon: HomeLine },
  { title: "inventory", route: "/inventory", permission: "nav:inventory", mobile: true, desktop: true, icon: Package },
  { title: "events", route: "/events", permission: "nav:events", mobile: true, desktop: true, icon: Calendar },
  { title: "consumers", route: "/consumers", permission: "nav:consumers", mobile: true, desktop: true, icon: Users },
  { title: "Posts", route: "/posts", permission: "nav:posts", mobile: true, desktop: true, icon: Newspaper },
  { title: "staff", route: "/staff", permission: "nav:staff", mobile: true, desktop: true, icon: UserCog },
  { title: 0, route: 0, permission: "nav:dynamic_section", mobile: false, desktop: true, icon: Users },
  { title: "profile", route: "/profile/my_details", permission: "nav:profile", mobile: true, desktop: false, icon: User },
];

const getHomeRoute = (roleType) => {
  if (roleType === "inventory_manager") return "/inventory";
  if (roleType === "event_manager" || roleType === "assistant") return "/events";
  return "/";
};

// million-ignore — Million's block compiler broke event handlers in this
// component (search button onClick silently dead); keep it un-optimized.
const NavigationBarMain = forwardRef(function NavigationBarMain(props, ref) {
  // eslint-disable-next-line no-unused-vars
  // const [{ x, y }, scrollTo] = useWindowScroll();
  // const { register, handleSubmit, watch } = useForm()
  const { window } = props;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSearch] = useState(false); // inline search retired — magnifier opens the ⌘K palette
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

  const toggleSearch = () => {
    // Global search now lives in the command menu (⌘K) — Untitled UI pattern.
    window.dispatchEvent(new CustomEvent("devitrak:open-cmdk"));
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
    "only screen and (min-width : 769px) and (max-width : 992px)",
  );
  const isLargeDevice = useMediaQuery(
    "only screen and (min-width : 993px) and (max-width : 1200px)",
  );
  // Untitled UI mobile navigation: white sheet, icon rows, active state,
  // account section at the bottom. Tapping anywhere closes via Box onClick.
  const drawerItemStyle = (isActive) => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    fontFamily: "Inter, sans-serif",
    fontSize: "16px",
    lineHeight: "24px",
    fontWeight: 600,
    textTransform: "capitalize",
    textDecoration: "none",
    color: isActive ? "var(--gray-900, #171d1a)" : "var(--gray-700, #484d47)",
    backgroundColor: isActive ? "var(--gray-50, #f7f7f4)" : "transparent",
  });

  const drawer = (
    <Box
      onClick={handleDrawerToggle}
      sx={{ textAlign: "left", padding: "16px", height: "100%" }}
    >
      {/* header: colored logo + close */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 4px 16px",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <img src={colorMark} alt="Devitrak" width={36} height={36} style={{ margin: "-6px" }} />
          <DevitrakWordmark height={18} />
        </span>
        <button
          aria-label="Close menu"
          style={{
            border: "none",
            background: "transparent",
            padding: "8px",
            cursor: "pointer",
            display: "flex",
          }}
        >
          <Icon icon="tabler:x" width={22} color="var(--gray-500, #777b73)" />
        </button>
      </div>
      <List sx={{ display: "flex", flexDirection: "column", gap: "2px", padding: 0 }}>
        {navItems.map((item) => {
          if (item.route === 0) {
            return <ConditionalButton key={item.title} user={user} />;
          }
          if (!hasPermission(item.permission, resolveRoleType(user)) || !item.mobile) {
            return null;
          }
          const active = location.pathname === `${item.route}`;
          return (
            <NavLink key={item.title} to={item.route} style={drawerItemStyle(active)}>
              {NAV_ICONS[String(item.title).toLowerCase()] && (
                <Icon
                  icon={NAV_ICONS[String(item.title).toLowerCase()]}
                  width={20}
                  color={active ? "var(--gray-900, #171d1a)" : "var(--gray-500, #777b73)"}
                />
              )}
              {item.title}
            </NavLink>
          );
        })}
      </List>
      <div
        style={{
          borderTop: "1px solid var(--gray-200, #ddded6)",
          margin: "12px 0",
        }}
      />
      <NavLink
        to="/login"
        onClick={() => logout()}
        style={{
          ...drawerItemStyle(false),
          color: "var(--error-600, #bc4b2f)",
        }}
      >
        <Icon icon="tabler:logout" width={20} color="var(--error-600, #bc4b2f)" />
        Log out
      </NavLink>
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
          xs={2}
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
                              <p
                                style={{
                                  textTransform: "capitalize",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                {NAV_ICONS[String(item.title).toLowerCase()] && (
                                  <Icon
                                    icon={NAV_ICONS[String(item.title).toLowerCase()]}
                                    width={18}
                                    height={18}
                                  />
                                )}
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
          xs={10}
          sm={10}
          md={4}
          lg={4}
          sx={{
            // search stays visible on every breakpoint; on phones it shares
            // the row with the hamburger (left grid) and must not overflow
            display: { xs: "flex", sm: "flex", md: "flex", lg: "flex" },
            justifyContent: "flex-end",
            alignItems: "center",
            margin: 0,
            minWidth: 0,
            paddingRight: { xs: "12px", sm: "12px", md: 0 },
          }}
        >
          {/* {showSearch && ( */}
          <form
            style={{
              margin: "0 5px 0 0",
              width: "100%",
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            onSubmit={handleSearch}
            method="get"
            action="/search-result-page?search="
            id="search-form"
          >
            {/* Read-only trigger: clicking (or Enter/Space) opens the ⌘K
                command palette instead of editing text, so the navbar input
                and the magnifier button share one unified global-search UX. */}
            <Input
              placeholder="Search"
              readOnly
              data-open-cmdk="true"
              role="button"
              tabIndex={0}
              onMouseDown={(e) => e.preventDefault()}
              onClick={toggleSearch}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleSearch();
                }
              }}
              style={{
                ...OutlinedInputStyle,
                boxSizing: "border-box",
                cursor: "pointer",
              }}
              name={"searchValue"}
              value={searchValue}
              fullWidth
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
            data-open-cmdk="true"
            onClick={toggleSearch}
            aria-label="Open search"
            style={{
              outline: "none",
              border: "transparent",
              margin: 0,
              padding: 0,
              backgroundColor: "transparent",
              display: "flex",
              cursor: "pointer",
            }}
            type="button"
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
              boxSizing: "border-box",
              width: "min(320px, 86vw)",
              backgroundColor: "var(--base-white, #fff)",
              borderRight: "1px solid var(--gray-200, #ddded6)",
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
