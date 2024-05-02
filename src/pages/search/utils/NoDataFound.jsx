import { Grid, Typography } from "@mui/material"
import NoComment from '../../../assets/annotation-x.svg'
import { useLocation } from "react-router-dom"

const NoDataFound = () => {
  const location = useLocation()
  return (
    <Grid container alignSelf={'flex-start'}>
      <Grid style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }} item xs={12} sm={12} md={12} lg={12}>
        <div>
          <img src={NoComment} alt="no-comment" />
        </div>
        <div style={{ width: "100%", padding: "0 0 0 32px " }}>
          <Typography style={{
            textAlign: "left",
            color: 'var(--Gray900, #101828)',
            /* Text md/Semibold */
            fontFamily: 'Inter',
            fontSize: '16px',
            fontStyle: 'normal',
            fontWeight: '600',
            lineHeight: '24px', /* 150% */
          }}>
            Nothing found
          </Typography>
          <Typography style={{
            textAlign: "left",
            color: 'var(--Gray600, #475467)',
            /* Text md/Semibold */
            fontFamily: 'Inter',
            fontSize: '14px',
            fontStyle: 'normal',
            fontWeight: '400',
            lineHeight: '20px', /* 150% */
          }}>
            Your search {location.search.slice(8, -1)} did not match anything in the database. Please try a different keyword.
          </Typography>
        </div>
      </Grid>
    </Grid >
  )
}

export default NoDataFound