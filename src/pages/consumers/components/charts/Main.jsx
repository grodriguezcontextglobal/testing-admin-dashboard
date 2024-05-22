import { Grid } from "@mui/material"
import GeneralActivity from "./GeneralActivity"
import ConsumerOrigin from "./ConsumerOrigin"

const Main = () => {
    return (
        <Grid display={'flex'} justifyContent={'flex-start'} alignItems={'center'} gap={1} container>
            <GeneralActivity />
            <ConsumerOrigin />
        </Grid>
    )
}

export default Main