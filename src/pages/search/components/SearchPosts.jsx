import { Grid, Typography } from "@mui/material";
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from "react";
import { useSelector } from 'react-redux';
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import CenteringGrid from "../../../styles/global/CenteringGrid";
// import CardSearchFound from "../utils/CardSearchFound";
import NoDataFound from "../utils/NoDataFound";
import { Subtitle } from "../../../styles/global/Subtitle";

const SearchPosts = ({ searchParams, }) => {
  const { user } = useSelector((state) => state.admin)
  const staffMembersQuery = useQuery({
    queryKey: ["listOfStaffMembers"],
    queryFn: () => devitrakApi.post("/company/search-company", {
      company: user.company
    }),
    enabled: false,
    refetchOnMount: false,
  });
  const counting = useRef()
  useEffect(() => {
    const controller = new AbortController()
    staffMembersQuery.refetch()
    return () => {
      controller.abort()
    }
  }, [searchParams])

  const sortAndRenderFoundData = () => {
    if (staffMembersQuery.data) {
      const foundData = staffMembersQuery.data.data.company.at(-1).employees
      const result = foundData?.filter(element => JSON.stringify(element).toLowerCase().includes(`${searchParams}`.toLowerCase()))
      counting.current = result.length ?? 0
      return result
    }
  }
  useEffect(() => {
    const controller = new AbortController()
    sortAndRenderFoundData()
    return () => {
        controller.abort()
    }
}, [searchParams])

  if (staffMembersQuery.isLoading) return <div style={CenteringGrid}><Loading /></div>
  if (staffMembersQuery.data) {

    return (
      <Grid container style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
        <Grid style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "center" }} item xs={12} sm={12} md={4} lg={4}>
          <Typography style={{ width: "100%", textAlign: "left" }}>Search posts </Typography><br />
          <Typography style={{ ...Subtitle, width: "100%", textAlign: "left" }}>
            All posts matching the search keywords.
          </Typography>
        </Grid>

        <Grid item xs={12} sm={12} md={8} lg={8}>
          <Grid key={'search-post-box'} container gap={1}>
            {/* {sortAndRenderFoundData()?.length > 0 ?
              sortAndRenderFoundData()?.map(item => <Grid key={item.id} item xs={12} sm={12} md={4} lg={4}> <CardSearchFound props={{ name: item.firstName, lastName: item.lastName, email: item.user, phoneNumber: "" }} /></Grid>)
              :  */}
            <NoDataFound />
            {/* } */}
          </Grid>
        </Grid>
      </Grid>
    )
  }

}

export default SearchPosts