import { Icon } from "@iconify/react";
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  OutlinedInput,
  Toolbar,
  Typography,
} from "@mui/material";
import { useMediaQuery, useWindowScroll } from "@uidotdev/usehooks";
import { Dropdown } from "antd";
import pkg from "prop-types";
import { useState } from "react";
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
import {
  DevitrakLogo,
  DevitrakName,
  LogoutIcon,
  MagnifyIcon,
  ProfileIcon,
} from "../icons/Icons";
import "./style/style.css";
const { PropTypes } = pkg;
const drawerWidth = 240;
const navItems = [
  { title: "home", route: "/", permission: [0, 1, 2, 3] },
  { title: "inventory", route: "/inventory", permission: [0, 1] },
  { title: "events", route: "/events", permission: [0, 1, 2, 3, 4] },
  { title: "consumers", route: "/consumers", permission: [0, 1] },
  { title: "staff", route: "/staff", permission: [0, 1, 2, 3] },
];

const NavigationBarMain = (props) => {
  // eslint-disable-next-line no-unused-vars
  const [{ x, y }, scrollTo] = useWindowScroll();
  // const { register, handleSubmit, watch } = useForm()
  const { window } = props;
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, status } = useSelector((state) => state.admin);
  const [searchValue, setSearchValue] = useState("");
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
    return;
  };

  const items = [
    // {
    //   key: "1",
    //   label: (
    //     <NavLink to={"/profile/my_details"}>
    //       <Typography>Profile</Typography>
    //     </NavLink>
    //   ),
    // },
    // {
    //   key: "2",
    //   label: (
    //     <Typography onClick={() => dispatch(onSwitchingCompany(true))}>
    //       Switch company
    //     </Typography>
    //   ),
    // },
    {
      key: "3",
      label: (
        <Typography
          onClick={() => {
            logout();
          }}
        >
          Logout
        </Typography>
      ),
      danger: true,
    },
  ];

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
    return navigate(`/search-result-page?search=${searchValue}`);
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
        {navItems.map((item) => (
          <ListItem key={`${item.title}-${item.route}`} disablePadding>
            <ListItemButton sx={{ textAlign: "center" }}>
              <NavLink key={item.title} to={`${item.route}`}>
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
            </ListItemButton>
          </ListItem>
        ))}
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
      container
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--blue700)",
        margin: "auto",
      }}
    >
      <AppBar
        style={{
          top: "2.9dvh",
          backgroundColor: "var(--blue700)",
          width: "100%",
        }}
        component="nav"
      >
        <Toolbar>
          <div
            id="grid-container-inside"
            style={{
              ...CenteringGrid,
              justifyContent: "space-between",
              backgroundColor: "var(--blue700)",
              width: `${isSmallDevice ? "100vw" : renderOtherWidth()}`,
            }}
          >
            <Grid item sm={9} md={6} lg={6}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{
                  mr: 2,
                  display: { sm: "flex", md: "none", lg: "none" },
                  backgroundColor: "var(--blue700)",
                  borderBottom: "solid 1px var(--blue-dark--600)",
                }}
              >
                <Icon icon="material-symbols:menu" />
              </IconButton>

              <Box
                sx={{
                  display: { xs: "none", sm: "none", md: "flex", lg: "flex" },
                  justifyContent: "flex-start",
                  alignItems: "center",
                }}
              >
                <NavLink
                  key={"devitrakName"}
                  to={`/`}
                  style={{ margin: "0 3px 0 0", width: "fit-content" }}
                >
                  <DevitrakLogo />
                  <DevitrakName />

                  {/* {user.companyData.company_logo.length > 0 ? (
                    <div style={{  display: "flex" }}>
                      <img
                        width={"40px"}
                        // height={"auto"}
                        style={{
                          verticalAlign: "middle",
                          objectPosition: "50% 50%",
                          objectFit: "scale-down",
                          borderRadius: "50px",
                        }}
                        src={`${user.companyData.company_logo}`}
                        alt={`${user.companyData.company_logo}`}
                      />
                      &nbsp;
                      <div className="content-main-navbar-updated">
                        <article
                          className={"nav-item-base-main-navbar-updated"}
                          style={{border:"transparent"}}
                        >
                          <div className="content-2-main-navbar-updated">
                            <div className="text-1-main-navbar-updated text-mdsemibold">
                              <p
                                style={{
                                  ...TextFontSize14LineHeight20,
                                  color: "var(--basewhite)",
                                }}
                              >
                                {user.companyData.company_name}
                              </p>
                            </div>
                          </div>
                        </article>
                      </div>
                    </div>
                  ) : (
                    <>
                      <DevitrakLogo />
                      <DevitrakName />
                    </>
                  )} */}
                </NavLink>

                {navItems.map((item) => {
                  if (
                    item.permission.some(
                      (element) => element === Number(user.role)
                    )
                  ) {
                    return (
                      <NavLink key={item.title} to={`${item.route}`}>
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
              sm={6}
              md={6}
              lg={6}
              sx={{
                display: { xs: "none", sm: "flex", md: "flex", lg: "flex" },
                justifyContent: "flex-end",
                alignItems: "center",
                margin: 0,
                // gap: "5px",
              }}
            >
              <form style={{ margin: "0 5px 0 0" }} onSubmit={handleSearch}>
                <OutlinedInput
                  placeholder="Search"
                  required
                  sx={OutlinedInputStyle}
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
                          <MagnifyIcon />
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
                          <ProfileIcon />
                        </p>
                      </div>
                    </div>
                  </article>
                </div>
              </NavLink>
              {status === "authenticated" && (
                <NavLink>
                  <Dropdown
                    menu={{
                      items,
                    }}
                    trigger={["click"]}
                    autoAdjustOverflow
                    placement="bottom"
                  >
                    <button
                      style={{
                        outline: "none",
                        border: "transparent",
                        margin: 0,
                        padding: 0,
                        backgroundColor: "transparent",
                      }}
                      key={"authenticated"}
                      onClick={() =>
                        scrollTo({
                          left: 0,
                          top: 0,
                          behavior: "smooth",
                        })
                      }
                    >
                      <div className="content-main-navbar-updated">
                        <article className="nav-item-base-1-main-navbar-updated">
                          <div className="content-2-main-navbar-updated">
                            <div
                              className="text-1-main-navbar-updated text-mdsemibold"
                              style={{ display: "flex" }}
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
                            </div>
                          </div>
                        </article>
                      </div>
                    </button>
                  </Dropdown>
                </NavLink>
              )}
            </Grid>
          </div>
        </Toolbar>
      </AppBar>
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
            },
          }}
        >
          {drawer}
        </Drawer>
      </nav>
    </Grid>
  );
};

export default NavigationBarMain;

NavigationBarMain.propTypes = {
  window: PropTypes.func,
};
