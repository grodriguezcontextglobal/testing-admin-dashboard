import { Grid, Typography } from "@mui/material"
import { Card } from "antd"

const CardSelection = ({props}) => {

    return (
        <Card style={{ cursor: "pointer" }}>
            <Grid display={'flex'} flexDirection={'column'} padding={'12px 20px'} container >
                <Grid item xs sm md lg>
                    <Typography>{props}</Typography>
                </Grid>
            </Grid>
        </Card>
    )
}

export default CardSelection