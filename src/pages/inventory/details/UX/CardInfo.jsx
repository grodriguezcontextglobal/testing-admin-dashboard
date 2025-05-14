import { Grid } from "@mui/material"
import TotalInventoryCard from "./TotalInventoryCard"
import TotalValueDevicesLocation from "./TotalValueDevices"
import TotalAvailableItem from "../../utils/TotalAvailableItem"

const CardInfo = ({referenceData}) => {
  return (
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          container
        >
          <Grid item xs={12} sm={12} md={3} lg={4}>
            <TotalInventoryCard props={referenceData.totalDevices} />
          </Grid>
          <Grid item xs={12} sm={12} md={3} lg={4}>
            <TotalAvailableItem props={referenceData.totalAvailable} />
          </Grid>
          <Grid item xs={12} sm={12} md={3} lg={4}>
            <TotalValueDevicesLocation props={referenceData.totalValue} />
          </Grid>
        </Grid>
  )
}

export default CardInfo