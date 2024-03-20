import { Icon } from '@iconify/react';
import { AppBar, Box, Divider, Drawer, Grid, IconButton, InputAdornment, List, ListItem, ListItemButton, OutlinedInput, Toolbar, Typography } from '@mui/material';
import { useRef, useState } from 'react';
// import { PropTypes } from 'prop-types'
import { useMediaQuery } from '@uidotdev/usehooks';
import { Dropdown } from 'antd';
import pkg from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { devitrakApi } from '../../api/devitrakApi';
import { persistor } from '../../store/Store';
import { onLogout } from '../../store/slices/adminSlice';
import { onResetArticleEdited } from '../../store/slices/articleSlide';
import { onResetCustomer } from '../../store/slices/customerSlice';
import { onResetDeviceInQuickGlance, onResetDevicesHandle } from '../../store/slices/devicesHandleSlice';
import { onResetEventInfo } from '../../store/slices/eventSlice';
import { onResetHelpers, onSwitchingCompany } from '../../store/slices/helperSlice';
import { onResetResult } from '../../store/slices/searchBarResultSlice';
import { onResetStaffProfile } from '../../store/slices/staffDetailSlide';
import { onResetStripesInfo } from '../../store/slices/stripeSlice';
import { onResetSubscriptionInfo } from '../../store/slices/subscriptionSlice';
import CenteringGrid from '../../styles/global/CenteringGrid';
import { OutlinedInputStyle } from '../../styles/global/OutlinedInputStyle';
import { DevitrakLogo, DevitrakName, SettingIcon } from '../icons/Icons';
import './style/style.css';
import { useForm } from 'react-hook-form';
const { PropTypes } = pkg;
//{ title: 'posts', route: '/posts' }
const drawerWidth = 240;
const navItems = [{ title: 'home', route: '/', permission: ['Administrator', 'Editor', 'Approver'] }, { title: 'inventory', route: '/inventory', permission: ['Administrator'] }, { title: 'events', route: '/events', permission: ['Administrator', 'Editor', 'Approver'] }, { title: 'consumers', route: '/consumers', permission: ['Administrator'] }, { title: 'staff', route: '/staff', permission: ['Administrator', 'Approver', 'Editor'] }];

const NavigationBarMain = (props) => {
    const { register, handleSubmit } = useForm()
    const { window } = props;
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation()
    const { user, status } = useSelector((state) => state.admin)
    const [searchValue, setSearchValue] = useState("");
    const ref = useRef();
    const dispatch = useDispatch();
    const navigate = useNavigate()
    const logout = async () => {
        await devitrakApi.patch(`/staff/edit-admin/${user.uid}`, {
            online: false
        })
        persistor.purge();
        dispatch(onResetArticleEdited());
        dispatch(onResetCustomer());
        dispatch(onResetDevicesHandle());
        dispatch(onResetDeviceInQuickGlance());
        dispatch(onResetEventInfo());
        dispatch(onResetStaffProfile());
        dispatch(onResetHelpers());
        dispatch(onResetStripesInfo())
        dispatch(onResetSubscriptionInfo())
        localStorage.setItem('admin-token', '')
        dispatch(onLogout());
        return window.location.reload()
    };

    const items = [
        {
            key: "1",
            label: (
                <NavLink to={"/profile/my_details"}>
                    <Typography>Profile</Typography>
                </NavLink>
            ),
        },
        {
            key: "2",
            label: <Typography onClick={() => dispatch(onSwitchingCompany(true))}>Switch company</Typography>,
        },
        {
            key: "3",
            label: <Typography onClick={() => {
                logout();
            }}>Logout</Typography>,
            danger: true,
        }

    ];

    const handleDrawerToggle = () => {
        setMobileOpen((prevState) => !prevState);
    };
    const handleSearch = (data) => {
        navigate(`/search-result-page?search=${data.searchValue}`);
    };
    const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
    const isMediumDevice = useMediaQuery(
        "only screen and (min-width : 769px) and (max-width : 992px)"
    );
    const isLargeDevice = useMediaQuery(
        "only screen and (min-width : 993px) and (max-width : 1200px)"
    );

    const drawer = (
        <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
            <Divider />
            <List>
                {navItems.map((item) => (
                    <ListItem key={item} disablePadding>
                        <ListItemButton sx={{ textAlign: 'center' }}>
                            <NavLink
                                key={item.title}
                                to={`${item.route}`}

                            >
                                <div className="content-main-navbar-updated">
                                    <article
                                        className={location.pathname === `${item.route}` ?
                                            "nav-item-base-main-navbar-updated" :
                                            "nav-item-base-1-main-navbar-updated"
                                        }
                                    >
                                        <div className="content-2-main-navbar-updated">
                                            <div className="text-1-main-navbar-updated text-mdsemibold">
                                                <p style={{ textTransform: "capitalize" }}>{item.title}</p>
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

    const container = window !== undefined ? () => window().document.body : undefined;

    return (
        <Grid container sx={{ display: 'flex', alignItems: "center", justifyContent: "center", backgroundColor: "var(--blue700)", margin: 'auto' }}>
            <AppBar style={{ top: '2.5dvh', backgroundColor: "var(--blue700)" }} component="nav">
                <Toolbar>
                    <Grid id='grid-container-inside' style={{ ...CenteringGrid, justifyContent: "space-between", backgroundColor: "var(--blue700)" }} item sm={11} md={11} lg={11}>
                        <Grid item sm={9} md={7} lg={8}>
                            <IconButton
                                color="inherit"
                                aria-label="open drawer"
                                edge="start"
                                onClick={handleDrawerToggle}
                                sx={{
                                    mr: 2, display: { sm: 'flex', md: 'none', lg: 'none' },
                                    backgroundColor: "var(--blue700)",
                                    borderBottom: "solid 1px var(--blue-dark--600)",
                                }}
                            >
                                <Icon icon="material-symbols:menu" />
                            </IconButton>

                            <Box sx={{ display: { xs: 'none', sm: 'none', md: 'flex', lg: 'flex' }, justifyContent: "flex-start", alignItems: "center" }}>
                                <NavLink
                                    key={'devitrakName'}
                                    to={`/`}
                                    style={{ margin: "0 3px 0 0" }}
                                >
                                    <DevitrakLogo /><DevitrakName />
                                </NavLink>

                                {navItems.map((item) => {
                                    console.log(`${item.title}`, item.permission.some(element => element === user.role))
                                    if (item.permission.some(element => element === user.role)) {
                                        return <NavLink
                                            key={item.title}
                                            to={`${item.route}`}

                                        >
                                            <div className="content-main-navbar-updated">
                                                <article
                                                    className={location.pathname === `${item.route}` ?
                                                        "nav-item-base-main-navbar-updated" :
                                                        "nav-item-base-1-main-navbar-updated"
                                                    }
                                                >
                                                    <div className="content-2-main-navbar-updated">
                                                        <div className="text-1-main-navbar-updated text-mdsemibold">
                                                            <p style={{ textTransform: "capitalize" }}>{item.title}</p>
                                                        </div>
                                                    </div>
                                                </article>
                                            </div>
                                        </NavLink>
                                    }
                                })}

                            </Box>
                        </Grid>

                        <Grid item sm={8} md={5} lg={4} sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: "space-between", alignItems: 'center', margin: 0 }}>
                            <Grid item sm={9} md={10} lg={10} style={{ ...CenteringGrid, justifyContent: "flex-end" }}>
                                <form onSubmit={handleSubmit(handleSearch)}>
                                    <OutlinedInput placeholder="Search"
                                        sx={OutlinedInputStyle}
                                        {...register('searchValue')}
                                        endAdornment={
                                            <>
                                                <InputAdornment position="end">
                                                    <Icon
                                                        cursor={"pointer"}
                                                        icon="ic:baseline-delete-forever"
                                                        color="#1e73be"
                                                        width="25"
                                                        height="25"
                                                        opacity={`${searchValue?.length > 0 ? 1 : 0}`}
                                                        display={`${searchValue?.length > 0 ? "auto" : "none"
                                                            }`}
                                                        onClick={() => {
                                                            setSearchValue("");
                                                            dispatch(onResetResult());
                                                            ref.current = undefined;
                                                        }}
                                                    />
                                                </InputAdornment>
                                                <InputAdornment position="end">
                                                    {" "}
                                                    <Icon
                                                        icon="entypo:magnifying-glass"
                                                        rotate={1}
                                                        width="25"
                                                        cursor={"pointer"}
                                                        style={{
                                                            display: "flex",
                                                            justifyContent: "center",
                                                            alignItems: "center",
                                                        }}
                                                        opacity={1}
                                                        type='submit'
                                                    />
                                                </InputAdornment>
                                            </>
                                        }
                                        fullWidth
                                    />
                                </form>
                            </Grid>
                            <Grid item sm={2} md={2} lg={2} style={{ ...CenteringGrid, justifyContent: "flex-end", margin: 0 }}>
                                {status === "authenticated" && (
                                    <NavLink
                                    // style={{
                                    //     padding: "0 0 0 15px",
                                    // }}
                                    >
                                        <Dropdown
                                            menu={{
                                                items,
                                            }}
                                            trigger={["click"]}
                                            autoAdjustOverflow
                                            placement='bottom'
                                            overlayStyle={{
                                                position: 'absolute',
                                                top: `${isSmallDevice ? '13dvh' : isMediumDevice ? '13.5dvh' : isLargeDevice ? '14dvh' : '12dvh'}`

                                            }}
                                        >
                                            <div className="content-main-navbar-updated">
                                                <article
                                                    className="nav-item-base-1-main-navbar-updated"
                                                >
                                                    <div className="content-2-main-navbar-updated">
                                                        <div className="text-1-main-navbar-updated text-mdsemibold">
                                                            <p style={{ textTransform: "capitalize", fontSize: "25px" }}><SettingIcon /></p>
                                                        </div>
                                                    </div>
                                                </article>
                                            </div>

                                            {/* {user.data.imageProfile ? (
                                            <Avatar
                                                src={
                                                    <img
                                                        src={user.data.imageProfile}
                                                        alt="profile"
                                                    />
                                                }
                                            />
                                        ) : (
                                            <Avatar>
                                                {user.name[0]}
                                                {user.lastName[0]}
                                            </Avatar>
                                        )} */}
                                        </Dropdown>
                                    </NavLink>
                                )}
                            </Grid>

                        </Grid>
                    </Grid>
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
                        display: { xs: 'block', sm: 'block' },
                        '& .MuiDrawer-paper': {
                            GridSizing: 'border-box', width: drawerWidth
                        },
                    }}
                >
                    {drawer}
                </Drawer>
            </nav>
        </Grid>
    );
}

export default NavigationBarMain

NavigationBarMain.propTypes = {
    window: PropTypes.func,
};