import { Grid, Typography } from "@mui/material"
import { Outlet } from "react-router-dom"
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38"
import StepsLine from "./components/StepsLine"

const MainPage = () => {
    return (
        <Grid
            container
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
            key={"settingUp-deviceList-event"}
        >
            <Grid
                display={"flex"}
                flexDirection={"column"}
                justifyContent={"flex-start"}
                alignItems={"center"}
                alignSelf={"center"}
                margin={"5px auto"}
                item
                xs={12}
                sm={12}
                md={12}
                lg={12}
            >
                <Typography
                    width={"100%"}
                    textTransform={"none"}
                    style={{ ...TextFontSize30LineHeight38, margin: 0, textAlign:"left" }}
                >
                    Create a new event
                </Typography>

                <Typography
                    width={"100%"}
                    textTransform={"none"}
                    textAlign={"left"}
                    fontFamily={"Inter"}
                    fontSize={"20px"}
                    fontStyle={"normal"}
                    fontWeight={400}
                    lineHeight={"30px"}
                    color={"var(--gray-600, #475467)"}
                >
                    Fill out the details below to create a new event.
                </Typography>
            </Grid>
            <Grid
                display={"flex"}
                justifyContent={"space-between"}
                alignSelf={"flex-start"}
                margin={"3rem 0"}
                item
                xs={12}
                sm={12}
                md={12}
                lg={12}
            >
                <Grid
                    display={"flex"}
                    flexDirection={"column"}
                    alignSelf={"flex-start"}
                    item
                    xs={4}
                    sm={4}
                    md={4}
                    lg={4}
                >
                    <Grid
                        display={"flex"}
                        justifyContent={"flex-start"}
                        alignItems={"center"}
                        item
                        xs={12}
                        sm={12}
                        md={12}
                        lg={12}
                    >
                        <StepsLine props={2} />
                    </Grid>
                </Grid>
                <Grid
                    display={"flex"}
                    flexDirection={"column"}
                    alignSelf={"flex-end"}
                    item
                    xs={8}
                    sm={8}
                    md={8}
                    lg={8}
                >
                    <Outlet />
                </Grid>
            </Grid>
        </Grid>
    )
}

export default MainPage