import { Grid, Typography } from "@mui/material";
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import { onAddCustomerInfo } from "../../../store/slices/customerSlice";
import { onOpenDeviceAssignmentModalFromSearchPage } from "../../../store/slices/devicesHandleSlice";
import { onSelectCompany, onSelectEvent } from "../../../store/slices/eventSlice";
import { onAddCustomer, onAddPaymentIntentDetailSelected, onAddPaymentIntentSelected } from "../../../store/slices/stripeSlice";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import NoDataFound from "../utils/NoDataFound";
const SearchTransaction = ({ searchParams }) => {
  const [loading, setLoading] = useState(false)
  const { user } = useSelector((state) => state.admin)
  const staffMembersQuery = useQuery({
    queryKey: ["listOfPaymentIntent"],
    queryFn: () => devitrakApi.post("/receiver/receiver-assigned-users-list", {
      company: user.company,
      paymentIntent: searchParams
    }),
    enabled: false,
    refetchOnMount: false,
  });
  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    const controller = new AbortController()
    staffMembersQuery.refetch()
    return () => {
      controller.abort()
    }
  }, [searchParams])

  const sortAndRenderFoundData = () => {
    if (staffMembersQuery.data) {
      const foundData = staffMembersQuery.data.data.listOfReceivers
      const result = foundData?.filter(element => JSON.stringify(element).toLowerCase().includes(`${searchParams}`.toLowerCase()))
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

  const handleTransactionSearch = useCallback(async () => {
    setLoading(true)
    const respTransaction = await devitrakApi.post('/transaction/transaction', {
      paymentIntent: searchParams
    })
    if (respTransaction.data.ok) {
      let userProfile = {
        ...respTransaction.data.list[0].consumerInfo,
        uid: respTransaction.data.list[0].consumerInfo.uid ?? respTransaction.data.list[0].consumerInfo.id,
      };
      const paymentIntentDetailSelectedProfile = {
        ...respTransaction.data.list[0],
        user: userProfile,
        device: respTransaction.data.list[0].device[0].deviceNeeded
      };

      dispatch(
        onOpenDeviceAssignmentModalFromSearchPage(true)
      );
      dispatch(
        onAddPaymentIntentDetailSelected(paymentIntentDetailSelectedProfile)
      );
      dispatch(onSelectEvent(paymentIntentDetailSelectedProfile.eventSelected));
      dispatch(onSelectCompany(paymentIntentDetailSelectedProfile.provider));
      dispatch(onAddCustomer(paymentIntentDetailSelectedProfile.consumerInfo));
      dispatch(onAddCustomerInfo(paymentIntentDetailSelectedProfile.consumerInfo));
      dispatch(onAddPaymentIntentSelected(paymentIntentDetailSelectedProfile.paymentIntent));
      setLoading(false)
      return navigate(`/events/event-attendees/${userProfile.uid}/transactions-details`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  if (staffMembersQuery.isLoading || loading) return <div style={CenteringGrid}><Loading /></div>
  if (staffMembersQuery.data) {
    if (String(searchParams).length >= 15 && String(searchParams).startsWith('pi_')) return handleTransactionSearch()
    return (
      <Grid key={'searching-staff-container'} container style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", alignSelf:"flex-start" }}>
        <Grid style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "center", alignSelf:"flex-start"  }} item xs={12} sm={12} md={4} lg={4}>
          <Typography style={{ ...TextFontSize30LineHeight38, fontSize: "36px", lineHeight: "44px", fontWeight: 600, width: "100%", textAlign: "left" }}>Search transaction </Typography><br />
          <Typography style={{ ...TextFontSize20LineHeight30, width: "100%", textAlign: "left" }}>
            All transaction matching the search keywords.
          </Typography>
        </Grid>

        <Grid item xs={12} sm={12} md={8} lg={8}>
          <Grid key={'searching-staff-page'} container gap={1}>
            <NoDataFound />
          </Grid>
        </Grid>
      </Grid>

    )
  }

}

export default SearchTransaction