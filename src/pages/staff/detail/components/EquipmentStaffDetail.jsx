import { Grid, Typography } from "@mui/material";
import { NavLink, Outlet } from "react-router-dom";
import "../../../../styles/global/ant-select.css";
import { useSelector } from "react-redux";
const EquipmentStafDetail = () => {
    const { user } = useSelector((state) => state.admin)
    const tabOptions = [
        {
            label: "List assigned device",
            route: "list-equipment",
            permission: ['Administrator']
        }, {
            label: "Assignment",
            route: "assignment",
            permission: ['Administrator']
        },
    ]
    return (
        <Grid container>
            <Grid
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
                marginTop={1}
                container
            >
                <Grid marginY={0} style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }} item xs={12} sm={12} md={6}>
                    <nav style={{ display: "flex", }}>
                        {
                            tabOptions.map(option => {
                                // if (user.role === "Administrator") {
                                    if (Number(user.role) < 2) {
                                    return (
                                        <NavLink key={option.label} to={`${option.route}`} style={({ isActive }) => {
                                            return {
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                padding: "1px 4px 3px",
                                                gap: "8px",
                                                borderBottom: isActive ?
                                                    "none" : "solid 0.1px var(--gray300)",
                                                borderTop: isActive ?
                                                    "solid 0.1px var(--gray300)" : "none",
                                                borderRight: isActive ?
                                                    "solid 0.1px var(--gray300)" : "none",
                                                borderLeft: isActive ?
                                                    "solid 0.1px var(--gray300)" : "none",
                                                borderRadius: "8px 8px 0 0"
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
            <Outlet />
        </Grid>
    )
};

export default EquipmentStafDetail;
