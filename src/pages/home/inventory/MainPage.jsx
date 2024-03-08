import { Grid } from "@mui/material"
import CategoryInventory from "../components/CategoriesInventory"
import Graphic from "../components/Graphic"
import TotalConsumer from "../components/TotalConsumer"
import TotalDevice from "../components/TotalDeviceValue"
const MainPage = () => {
    return (
        <Grid textAlign={"right"}
            display={'flex'}
            justifyContent={"space-between"}
            alignItems={"center"}
            gap={1}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
        >
            <Grid item
                xs={12}
                sm={12}
                md={4}
                lg={4}
            >
                <Graphic />
            </Grid>
            <Grid alignSelf={'stretch'} style={{ margin: '-10px 0 0 0', padding: 0 }} item
                xs={12}
                sm={12}
                md={4}
                lg={4}
            >
                <TotalConsumer />
                <TotalDevice />
            </Grid>
            <Grid alignSelf={'stretch'} style={{ margin: '-10px 0 0 0', padding: 0 }} item
                xs={12}
                sm={12}
                md={4}
                lg={4}
            >
                <CategoryInventory />
            </Grid>
        </Grid>
    )
}

export default MainPage