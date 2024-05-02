import { Grid, Typography } from "@mui/material";
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { useEffect } from "react";
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
import CardDeviceFound from "../utils/CardDeviceFound";
import NoDataFound from "../utils/NoDataFound";
const SearchDevice = ({ searchParams }) => {
  const { user } = useSelector((state) => state.admin)
  const staffMembersQuery = useQuery({
    queryKey: ["listOfAssignedReceivers"],
    queryFn: () => devitrakApi.post("/receiver/receiver-assigned-users-list", {
      company: user.company,
      'device.serialNumber': searchParams,
      'device.status': true
    }),
    enabled: false,
    refetchOnMount: false,
  });
  const imageDeviceQuery = useQuery({
    queryKey: ["imageDeviceList"],
    queryFn: () => devitrakApi.post("/image/images", {
      company: user.company,
    }),
    enabled: false,
    refetchOnMount: false,
  });

  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    const controller = new AbortController()
    staffMembersQuery.refetch()
    imageDeviceQuery.refetch()

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
  const imagesDeviceFoundData = () => {
    if (imageDeviceQuery.data) {
      const foundData = imageDeviceQuery?.data?.data?.item
      const grouping = _.groupBy(foundData, 'item_group')
      return grouping
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    sortAndRenderFoundData()
    return () => {
      controller.abort()
    }
  }, [searchParams, staffMembersQuery.data])

  const handleDeviceSearch = async (record) => {
    const respTransaction = await devitrakApi.post('/transaction/transaction', {
      paymentIntent: record.data.paymentIntent
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
      dispatch(onSelectEvent(record.event));
      dispatch(onSelectCompany(record.data.provider[0]));
      dispatch(onAddCustomer(paymentIntentDetailSelectedProfile.consumerInfo));
      dispatch(onAddCustomerInfo(paymentIntentDetailSelectedProfile.consumerInfo));
      dispatch(onAddPaymentIntentSelected(record.data.paymentIntent));
      return navigate(`/events/event-attendees/${userProfile.uid}/transactions-details`);
    }
  }
  if (staffMembersQuery.isLoading) return <div style={CenteringGrid}><Loading /></div>
  if (staffMembersQuery.data) {
    return (
      <Grid container style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
        <Grid style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "center",alignSelf:"flex-start" }} item xs={12} sm={12} md={4} lg={4}>
          
          <Typography style={{ ...TextFontSize30LineHeight38, fontSize: "36px", lineHeight: "44px", fontWeight: 600, width: "100%", textAlign: "left" }}>Search Device </Typography><br />
          <Typography style={{ ...TextFontSize20LineHeight30, width: "100%", textAlign: "left" }}>
            All devices matching the search keywords.
          </Typography>
        </Grid>

        <Grid item xs={12} sm={12} md={8} lg={8}>
          <Grid container gap={1}>
            {sortAndRenderFoundData()?.length > 0 ?
              sortAndRenderFoundData()?.map(item => <Grid key={item.id} item xs={12} sm={12} md={3} lg={3}> <CardDeviceFound props={{ serialNumber: item?.device?.serialNumber, type: item?.device?.deviceType, event: item?.eventSelected[0], image: imagesDeviceFoundData()[item?.device?.deviceType]?.at(-1)?.source, data: item ?? [] }} fn={handleDeviceSearch} /></Grid>)
              : <NoDataFound />}
          </Grid>
        </Grid>
      </Grid>
    )
  }
}
export default SearchDevice