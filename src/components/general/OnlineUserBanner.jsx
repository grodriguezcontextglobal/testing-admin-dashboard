import { AppBar, Grid, Typography } from "@mui/material"
import { PointFilled } from "../icons/Icons"

const OnlineUserBanner = () => {
    return (
            <Grid id="container-online" container sx={{ display: "flex", alignItems: "flex-end", top: '15dvh', backgroundColor: "transparent" }}>
                <Grid display={'flex'} alignItems={'center'} justifyContent={'flex-end'} item xs={12} sm={12} md={12} lg={12}>
                    <Typography style={{
                    color: "var(--success700)",
                    borderRadius: "12px",
                    padding: "0 3px",
                    display: 'flex',
                    alignItems: "center",
                    justifyContent: "center"
                }} >
                    <PointFilled />online</Typography>
                </Grid >
            </Grid>
    )
}

export default OnlineUserBanner