import { Grid } from "@mui/material"
import { Outlet } from "react-router-dom"
import OnlineUserBanner from "../components/general/OnlineUserBanner"
import { useRef } from "react"
// import OnlineUserBanner from "../components/general/OnlineUserBanner"

const ParentRenderingChildrenPage = () => {
    const bannerRef = useRef()
    return (
        <Grid display={'flex'} justifyContent={'center'} alignItems={'center'} container>
            <Grid alignSelf={'flex-start'} style={{minHeight:"80dvh"}} margin={'12.5dvh 0 1dvh'} item xs={11} sm={11} md={11} lg={11} >
                <span style={{position:'relative',top:"0.5dvh"}} ref={bannerRef}><OnlineUserBanner /></span>
                <Outlet />
            </Grid>
        </Grid>
    )
}

export default ParentRenderingChildrenPage