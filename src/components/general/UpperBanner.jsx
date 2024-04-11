import { Grid, Typography, AppBar, Toolbar } from "@mui/material"
import { useSelector } from "react-redux"
import CenteringGrid from "../../styles/global/CenteringGrid"

const UpperBanner = () => {
    const { user } = useSelector((state) => state.admin)
    return (
        <Grid container>
            <Grid item sx={{...CenteringGrid, margin: '0 auto'}}>
                <AppBar style={{
                    ...CenteringGrid, padding: '0', backgroundColor: "var(--blue-dark--800)",
                    height: '3dvh'
                }} component="nav">
                    <Toolbar>
                        <Typography
                            textTransform={'capitalize'}
                            textAlign={'center'}
                            color={"var(--gray300)"}
                            padding={'0.8rem auto'}
                            >
                            {user.company}
                        </Typography>
                    </Toolbar>
                </AppBar>
            </Grid>
        </Grid>
    )
}

export default UpperBanner