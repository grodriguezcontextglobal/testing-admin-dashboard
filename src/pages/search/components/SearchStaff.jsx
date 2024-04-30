import { Grid, Typography } from "@mui/material";
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import { onAddStaffProfile } from "../../../store/slices/staffDetailSlide";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { Subtitle } from "../../../styles/global/Subtitle";
import CardSearchStaffFound from "../utils/CardSearchStaffFound";
import NoDataFound from "../utils/NoDataFound";
const SearchStaff = ({ searchParams }) => {
  const { user } = useSelector((state) => state.admin)
  const staffMembersQuery = useQuery({
    queryKey: ["listOfStaffMembers"],
    queryFn: () => devitrakApi.post("/company/search-company", {
      company: user.company
    }),
    enabled: false,
    refetchOnMount: false,
  });
  const staffMembersInfoQuery = useQuery({
    queryKey: ["listOfStaffMembersInfo"],
    queryFn: () => devitrakApi.post("/staff/admin-users", {
      company: user.company
    }),
    enabled: false,
    refetchOnMount: false,
  });
  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    const controller = new AbortController()
    staffMembersQuery.refetch()
    staffMembersInfoQuery.refetch()
    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const sortAndRenderFoundData = () => {
    if (staffMembersQuery.data) {
      const foundData = staffMembersQuery.data.data.company.at(-1).employees
      const result = foundData?.filter(element => JSON.stringify(element).toLowerCase().includes(`${searchParams}`.toLowerCase()))
      return result
    }
    return []
  }

  const checkStaffInfo = () => {
    if (staffMembersInfoQuery.data) {
      const foundData = staffMembersInfoQuery.data.data.adminUsers
      const result = foundData?.filter(element => JSON.stringify(element).toLowerCase().includes(`${searchParams}`.toLowerCase()))
      const grouping = _.groupBy(result, 'email')
      return grouping
    }
    return []
  }
  useEffect(() => {
    const controller = new AbortController()
    sortAndRenderFoundData()
    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // const resultLength = useCallback(() => {
  //   let result = []
  //   if (sortAndRenderFoundData().length > 0) {
  //     result = [...countingResult, ...sortAndRenderFoundData()]
  //     return setCountingResult(result)
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [String(searchParams).length])
  // resultLength()

  const handleDetailStaff = async (record) => {
    const template = { ...record.data, adminUserInfo: record.other, companyData: staffMembersQuery.data.data.company.at(-1) }
    dispatch(onAddStaffProfile(template));
    return navigate(`/staff/${record._id}`)
  };

  if (staffMembersQuery.isLoading) return <div style={CenteringGrid}><Loading /></div>
  if (staffMembersQuery.data) {
    return (
      <Grid key={'searching-staff-container'} container style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
        <Grid style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "center" }} item xs={12} sm={12} md={4} lg={4}>
          <Typography style={{ width: "100%", textAlign: "left" }}>Search staff </Typography><br />
          <Typography style={{ ...Subtitle, width: "100%", textAlign: "left" }}>
            All staff matching the search keywords.
          </Typography>
        </Grid>

        <Grid item xs={12} sm={12} md={8} lg={8}>
          <Grid key={'searching-staff-page'} container gap={1}>
            {sortAndRenderFoundData()?.length > 0 && staffMembersInfoQuery.data ?
              sortAndRenderFoundData()?.map(item => <Grid key={item.id} item xs={12} sm={12} md={3} lg={3}> <CardSearchStaffFound props={{ name: item.firstName, lastName: item.lastName, email: item.user, phoneNumber: "", data: item, other: checkStaffInfo()[`${item?.user}`]}} fn={handleDetailStaff} /></Grid>)
              : <NoDataFound />}
          </Grid>
        </Grid>
      </Grid>
    )
  }

}

export default SearchStaff