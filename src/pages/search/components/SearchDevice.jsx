import { Grid, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import _ from "lodash";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import { checkArray } from "../../../components/utils/checkArray";
import { onAddCustomerInfo } from "../../../store/slices/customerSlice";
import { onOpenDeviceAssignmentModalFromSearchPage } from "../../../store/slices/devicesHandleSlice";
import {
  onAddEventData,
  onSelectCompany,
  onSelectEvent,
} from "../../../store/slices/eventSlice";
import {
  onAddCustomer,
  onAddPaymentIntentDetailSelected,
  onAddPaymentIntentSelected,
} from "../../../store/slices/stripeSlice";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import CardDeviceFound from "../utils/CardDeviceFound";
import NoDataFound from "../utils/NoDataFound";
import EmailStructureUpdateItem from "../../../classes/emailStructureUpdateItem";
const SearchDevice = ({ searchParams }) => {
  const [foundDeviceData, setFoundDeviceData] = useState([]);
  const { user } = useSelector((state) => state.admin);
  const { eventsPerAdmin } = useSelector((state) => state.event);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const eventInventoryQuery = useQuery({
    queryKey: ["eventInventoryQuery"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-pool-list", {
        company: user.companyData.id,
        device: searchParams,
      }),
    refetchOnMount: false,
  });

  const staffMembersQuery = useQuery({
    queryKey: ["listOfAssignedReceivers"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-assigned-users-list", {
        company: user.companyData.id,
        "device.serialNumber": searchParams,
        "device.status": true,
      }),
    refetchOnMount: false,
  });
  const deviceInUseStaffMemberQuery = useQuery({
    queryKey: ["deviceInUseStaffMember"],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
        warehouse: 1,
        serial_number: searchParams,
      }),
    refetchOnMount: false,
  });

  const imageDeviceQuery = useQuery({
    queryKey: ["imageDeviceList"],
    queryFn: () =>
      devitrakApi.post("/image/images", {
        company: user.company,
      }),
    refetchOnMount: false,
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fetchActiveAssignedDevicesPerEvent = async () => {
    const rowEventsData = [...eventsPerAdmin.active];
    const result = new Map();
    for (let data of rowEventsData) {
      const fetchingDataPerEvent = await devitrakApi.post(
        "/receiver/receiver-assigned-users-list",
        {
          company: user.companyData.id,
          "device.serialNumber": searchParams,
          "device.status": true,
          eventSelected: data.eventInfoDetail.eventName,
        }
      );
      const responseData = fetchingDataPerEvent.data.listOfReceivers;
      if (Array.isArray(responseData) && responseData.length > 0) {
        if (!result.has(checkArray(responseData).id)) {
          result.set(checkArray(responseData).id, {
            ...responseData.at(-1),
            eventInfo: data,
          });
        }
        // result.add({
        //   ...responseData.at(-1),
        //   eventInfo: data,
        // });
      }
    }
    const finalResult = new Set();
    for (let [, value] of result) {
      finalResult.add(value);
    }
    return setFoundDeviceData(Array.from(finalResult));
  };
  useEffect(() => {
    const controller = new AbortController();
    staffMembersQuery.refetch();
    imageDeviceQuery.refetch();
    eventInventoryQuery.refetch();
    deviceInUseStaffMemberQuery.refetch();
    fetchActiveAssignedDevicesPerEvent();
    return () => {
      controller.abort();
    };
  }, [searchParams]);
  const sortAndRenderFoundData = () => {
    if (staffMembersQuery.data && deviceInUseStaffMemberQuery.data) {
      const foundData = [...foundDeviceData];
      const result = foundData?.filter((element) =>
        JSON.stringify(element)
          .toLowerCase()
          .includes(`${searchParams}`.toLowerCase())
      );
      return result;
    }
    return foundDeviceData;
  };
  const imagesDeviceFoundData = () => {
    if (imageDeviceQuery.data) {
      const foundData = imageDeviceQuery?.data?.data?.item;
      const grouping = _.groupBy(foundData, "item_group");
      return grouping;
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    sortAndRenderFoundData();
    return () => {
      controller.abort();
    };
  }, [searchParams, staffMembersQuery.data]);

  const handleDeviceSearch = async (record) => {
    const respTransaction = await devitrakApi.post("/transaction/transaction", {
      paymentIntent: record.data.paymentIntent,
    });
    if (respTransaction.data.ok) {
      let userProfile = {
        ...respTransaction.data.list[0].consumerInfo,
        uid:
          respTransaction.data.list[0].consumerInfo.uid ??
          respTransaction.data.list[0].consumerInfo.id,
      };
      const paymentIntentDetailSelectedProfile = {
        ...respTransaction.data.list[0],
        user: userProfile,
        device: respTransaction.data.list[0].device[0].deviceNeeded,
      };
      const eventInfo = await devitrakApi.post("/event/event-list", {
        company: user.company,
        "eventInfoDetail.eventName": record.event,
      });

      const eventInfoSqlDB = await devitrakApi.post(
        "/db_event/events_information",
        {
          event_name: record.event,
          company_assigned_event_id: user.sqlInfo.company_id,
        }
      );
      if (eventInfo.data && eventInfoSqlDB.data) {
        dispatch(onOpenDeviceAssignmentModalFromSearchPage(true));
        dispatch(
          onAddPaymentIntentDetailSelected(paymentIntentDetailSelectedProfile)
        );
        dispatch(
          onAddEventData({
            ...checkArray(eventInfo.data.list),
            sql: eventInfoSqlDB.data.events.at(-1),
          })
        );

        dispatch(onSelectEvent(record.event));
        dispatch(onSelectCompany(record.data.provider[0]));
        dispatch(
          onAddCustomer(paymentIntentDetailSelectedProfile.consumerInfo)
        );
        dispatch(
          onAddCustomerInfo(paymentIntentDetailSelectedProfile.consumerInfo)
        );
        dispatch(onAddPaymentIntentSelected(record.data.paymentIntent));
        return navigate(
          `/events/event-attendees/${userProfile.uid}/transactions-details`
        );
      }
    }
  };
  const returningDevice = async (record) => {
    try {
      setLoadingStatus(true);
      const assignedDeviceListQuery = await devitrakApi.post(
        "/receiver/receiver-assigned-list",
        {
          eventSelected: record.eventSelected,
          provider: record.provider,
          "device.serialNumber": record.serialNumber,
          "device.deviceType": record.type,
          "device.status": true,
        }
      );
      const deviceInPoolListQuery = await devitrakApi.post(
        "/receiver/receiver-pool-list",
        {
          eventSelected: record.eventSelected,
          provider: record.provider,
          device: record.serialNumber,
          type: record.type,
          activity: true,
        }
      );
      if (assignedDeviceListQuery.data && deviceInPoolListQuery.data) {
        const respUpdate = await devitrakApi.patch(
          `/receiver/receiver-update/${
            assignedDeviceListQuery.data.listOfReceivers.at(-1).id
          }`,
          {
            id: assignedDeviceListQuery.data.listOfReceivers.at(-1).id,
            device: {
              ...assignedDeviceListQuery.data.listOfReceivers.at(-1).device,
              status: false,
            },
          }
        );
        if (respUpdate.data) {
          const dateString = new Date().toString();
          const dateRef = dateString.split(" ");
          queryClient.invalidateQueries({
            queryKey: ["assignedDeviceListQuery"],
            exact: true,
          });
          await devitrakApi.patch(
            `/receiver/receivers-pool-update/${
              deviceInPoolListQuery.data.receiversInventory.at(-1).id
            }`,
            {
              activity: false,
            }
          );
          const linkStructure = `https://app.devitrak.net/authentication/${record.data.eventInfo.id}/${user.companyData.id}/${record.data.userInfo.id}`;
          const emailStructure = new EmailStructureUpdateItem(
            record.data.userInfo.name,
            record.data.userInfo.lastName,
            record.data.userInfo.email,
            record.data.device.serialNumber,
            record.data.device.deviceType,
            record.data.eventSelected[0],
            record.data.provider[0],
            record.data.paymentIntent,
            String(dateRef.slice(0, 4)).replaceAll(",", " "),
            dateRef[4],
            linkStructure
          );
          await devitrakApi.post(
            "/nodemailer/confirm-returned-device-notification", emailStructure.render()
            // {
            //   consumer: {
            //     name: `${record.data.userInfo.name} ${record.data.userInfo.lastName}`,
            //     email: record.data.userInfo.email,
            //   },
            //   device: {
            //     serialNumber: record.data.device.serialNumber,
            //     deviceType: record.data.device.deviceType,
            //   },
            //   event: record.data.eventSelected[0],
            //   company: record.data.provider[0],
            //   transaction: record.data.paymentIntent,
            //   date: String(dateRef.slice(0, 4)).replaceAll(",", " "),
            //   time: dateRef[4],
            //   link: `https://app.devitrak.net/authentication/${record.data.eventInfo.id}/${user.companyData.id}/${record.data.userInfo.id}`,
            // }
          );
          setLoadingStatus(false);
          await handleDeviceSearch(record);
        }
      }
    } catch (error) {
      console.log(
        "🚀 ~ file: StripeTransactionHistoryByUser.jsx:277 ~ handleReturnSingleDevice ~ error:",
        error
      );
      setLoadingStatus(false);
    }
  };
  if (
    staffMembersQuery.isLoading &&
    imageDeviceQuery.isLoading &&
    deviceInUseStaffMemberQuery.isLoading
  )
    return (
      <div style={CenteringGrid}>
        <Loading />
      </div>
    );
  if (
    staffMembersQuery.data &&
    imageDeviceQuery.data &&
    deviceInUseStaffMemberQuery.data
  ) {
    return (
      <Grid
        container
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <Grid
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            alignSelf: "flex-start",
          }}
          item
          xs={12}
          sm={12}
          md={4}
          lg={4}
        >
          <Typography
            style={{
              ...TextFontSize30LineHeight38,
              fontSize: "36px",
              lineHeight: "44px",
              fontWeight: 600,
              width: "100%",
              textAlign: "left",
            }}
          >
            Search Device{" "}
          </Typography>
          <br />
          <Typography
            style={{
              ...TextFontSize20LineHeight30,
              width: "100%",
              textAlign: "left",
            }}
          >
            All devices matching the search keywords.
          </Typography>
        </Grid>
        <Grid item xs={12} sm={12} md={8} lg={8}>
          <Grid container gap={1}>
            {sortAndRenderFoundData()?.length > 0 ? (
              sortAndRenderFoundData()?.map((item) => (
                <Grid key={item.id} item xs={12} sm={12} md={4} lg={4}>
                  {" "}
                  <CardDeviceFound
                    key={item.id}
                    props={{
                      serialNumber: item?.device?.serialNumber,
                      type: item?.device?.deviceType,
                      event: item?.eventSelected[0],
                      image:
                        imagesDeviceFoundData()[item?.device?.deviceType]?.at(
                          -1
                        )?.source,
                      data: item ?? [],
                    }}
                    fn={handleDeviceSearch}
                    returnFn={returningDevice}
                    loadingStatus={loadingStatus}
                  />
                </Grid>
              ))
            ) : (
              <NoDataFound />
            )}
          </Grid>
        </Grid>
      </Grid>
    );
  }
};
export default SearchDevice;
// await axios.patch(
//   "https://api.garssoftwaresolutions.link/devitrak/admin-dashboard/event/inventory-pool/update-device-pool",
//   {
//     ref: {
//       device: checkArray(
//         deviceInPoolListQuery.data.receiversInventory
//       ).device,
//       type: checkArray(deviceInPoolListQuery.data.receiversInventory)
//         .type,
//       activity: true,
//       company: user.companyData.id,
//     },
//     newInfo: {
//       activity: false,
//     },
//     collection: "receiverspools",
//   }
// );

// await axios.post(
//   "https://9dsiqsqjtk.execute-api.us-east-1.amazonaws.com/prod/devitrak/notifications/return_item",
//   {
//     consumer: {
//       name: `${record.data.userInfo.name} ${record.data.userInfo.lastName}`,
//       email: record.data.userInfo.email,
//     },
//     device: {
//       serialNumber: record.data.device.serialNumber,
//       deviceType: record.data.device.deviceType,
//     },
//     event: record.data.eventSelected[0],
//     company: record.data.provider[0],
//     transaction: record.data.paymentIntent,
//     date: String(dateRef.slice(0, 4)).replaceAll(",", " "),
//     time: dateRef[4],
//     link: `https://app.devitrak.net/authentication/${record.data.eventInfo.id}/${user.companyData.id}/${record.data.userInfo.id}`,
//   }
// );
