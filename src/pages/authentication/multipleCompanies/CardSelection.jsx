import { Grid, Typography } from "@mui/material"
import { Card } from "antd"

const CardSelection = ({props}) => {
console.log("🚀 ~ CardSelection ~ props:", props)

    return (
        <Card onClick={() => ""} style={{ cursor: "pointer" }}>
            <Grid display={'flex'} flexDirection={'column'} padding={'12px 20px'} container >
                <Grid item xs sm md lg>
                    <Typography>{props}</Typography>
                </Grid>
            </Grid>
        </Card>
    )
}

export default CardSelection