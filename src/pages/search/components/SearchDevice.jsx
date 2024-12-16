import { Grid, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { groupBy } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import { checkArray } from "../../../components/utils/checkArray";
import { onAddCustomerInfo } from "../../../store/slices/customerSlice";
import { onAddDeviceToDisplayInQuickGlance } from "../../../store/slices/devicesHandleSlice";
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
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";
import CardDeviceFound from "../utils/CardDeviceFound";
import NoDataFound from "../utils/NoDataFound";
const SearchDevice = () => {
  const location = useLocation();
  const ref = useRef(location.search);
  const [foundDeviceData, setFoundDeviceData] = useState([]);
  const { user } = useSelector((state) => state.admin);
  const { eventsPerAdmin } = useSelector((state) => state.event);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingSearchingResult, setLoadingSearchingResult] = useState(false);
  const searchingQuery = useQuery({
    queryKey: [`${location.search.split("?search=")[1]}`],
    queryFn: () =>
      devitrakApi.get(
        `/db_company/search-inventory?company_id=${
          user.sqlInfo.company_id
        }&searchValue=${location.search.split("?search=")[1]}`
      ),
    refetchOnMount: false,
  });
  const imageDeviceQuery = useQuery({
    queryKey: [
      "imageDeviceList",
      `image-${location.search.split("?search=")[1]}`,
    ],
    queryFn: () =>
      devitrakApi.post("/image/images", {
        company: user.company,
      }),
    refetchOnMount: false,
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchActiveAssignedDevicesPerEvent = useCallback(async () => {
    setLoadingSearchingResult(true);
    const rowEventsData = [...eventsPerAdmin.active];
    const result = new Map();
    const eventsName = [
      ...rowEventsData.map((item) => item.eventInfoDetail.eventName),
    ];
    const fetchingDataPerEvent = await devitrakApi.post(
      "/receiver/receiver-assigned-users-list",
      {
        company: user.companyData.id,
        "device.serialNumber": {
          $regex: location.search.split("?search=")[1],
          $options: "i",
        },
        "device.status": true,
        eventSelected: { $in: eventsName },
      }
    );
    const responseData = fetchingDataPerEvent.data.listOfReceivers;
    if (Array.isArray(responseData) && responseData.length > 0) {
      for (let item of responseData) {
        if (!result.has(checkArray(responseData).id)) {
          result.set(checkArray(responseData).id, {
            ...responseData.at(-1),
            eventInfo: checkArray(
              rowEventsData.find(
                (ele) => ele.eventInfoDetail.eventName === item.eventSelected[0]
              )
            ),
          });
        }
      }
    }
    const finalResult = new Set();
    for (let [, value] of result) {
      finalResult.add(value);
    }
    setLoadingSearchingResult(false);
    return setFoundDeviceData(Array.from(finalResult));
  }, []);

  const checkingIfItemInWarehouseOrNot = () => {
    if (searchingQuery.data) {
      const result = searchingQuery?.data?.data?.result;
      if (result.some((item) => item.warehouse < 1)) {
        return fetchActiveAssignedDevicesPerEvent();
      }
      return setFoundDeviceData([]);
    }
  };
  useEffect(() => {
    const controller = new AbortController();
    checkingIfItemInWarehouseOrNot();
    return () => {
      controller.abort();
    };
  }, [ref.current !== location.key]); //

  const sortAndRenderFoundData = () => {
    if (searchingQuery.data) {
      const foundData = [...foundDeviceData];
      const result = foundData?.filter((element) =>
        JSON.stringify(element)
          .toLowerCase()
          .includes(`${location.search.split("?search=")[1]}`.toLowerCase())
      );
      return result;
    }
    return foundDeviceData;
  };

  const imagesDeviceFoundData = () => {
    if (imageDeviceQuery.data) {
      const foundData = imageDeviceQuery?.data?.data?.item;
      const grouping = groupBy(foundData, "item_group");
      return grouping;
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    sortAndRenderFoundData();
    imagesDeviceFoundData();
    return () => {
      controller.abort();
    };
  }, [location.key]);

  const afterActionTakenCollectStoreAndNavigate = async (props) => {
    const {
      paymentIntentDetailSelectedProfile,
      eventInfo,
      eventInfoSqlDB,
      record,
      eventInventoryQuery,
    } = props;
    const formatDeviceSection = {
      activity: record.data.device.status,
      company: [record.type, record.data.eventSelected[0]],
      entireData: {
        ...eventInventoryQuery.data.receiversInventory[0],
      },
      serialNumber: record.serialNumber,
      status: eventInventoryQuery.data.receiversInventory[0].status,
    };
    dispatch(
      onAddPaymentIntentDetailSelected(paymentIntentDetailSelectedProfile)
    );
    dispatch(
      onAddEventData({
        ...checkArray(eventInfo),
        sql: eventInfoSqlDB,
      })
    );
    dispatch(onSelectEvent(record.event));
    dispatch(onSelectCompany(record.data.provider[0]));
    dispatch(onAddCustomer(paymentIntentDetailSelectedProfile.consumerInfo));
    dispatch(
      onAddCustomerInfo(paymentIntentDetailSelectedProfile.consumerInfo)
    );
    dispatch(onAddPaymentIntentSelected(record.data.paymentIntent));
    dispatch(onAddDeviceToDisplayInQuickGlance(formatDeviceSection));
    return navigate("/device-quick-glance");
  };

  const handleDeviceSearch = async (record) => {
    const respTransaction = await devitrakApi.get(
      `/transaction/transaction?paymentIntent=${record.data.paymentIntent}`
    );
    if (respTransaction.data.ok) {
      const eventInventoryQuery = await devitrakApi.post(
        "/receiver/receiver-pool-list",
        {
          company: user.companyData.id,
          device: location.search.split("?search=")[1],
          activity: true,
        }
      );

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
        afterActionTakenCollectStoreAndNavigate({
          paymentIntentDetailSelectedProfile,
          eventInfo: eventInfo.data.list,
          eventInfoSqlDB: eventInfoSqlDB.data.events.at(-1),
          record,
          eventInventoryQuery,
        });
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
          queryClient.invalidateQueries({
            queryKey: ["assignedDeviceListQuery"],
            exact: true,
          });

          const freshDeviceDevicePool = await devitrakApi.patch(
            `/receiver/receivers-pool-update/${
              deviceInPoolListQuery.data.receiversInventory.at(-1).id
            }`,
            {
              activity: false,
            }
          );

          const respTransaction = await devitrakApi.post(
            "/transaction/transaction",
            {
              paymentIntent: record.data.paymentIntent,
            }
          );

          const eventInfoSqlDB = await devitrakApi.post(
            "/db_event/events_information",
            {
              event_name: record.event,
              company_assigned_event_id: user.sqlInfo.company_id,
            }
          );
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
          setLoadingStatus(false);
          await afterActionTakenCollectStoreAndNavigate({
            paymentIntentDetailSelectedProfile,
            eventInfo: record.data.eventInfo,
            eventInfoSqlDB,
            record: {
              ...record,
              data: {
                ...record.data,
                device: {
                  ...record.data.device,
                  status: false,
                },
              },
            },
            eventInventoryQuery: {
              ...freshDeviceDevicePool,
              data: {
                ...freshDeviceDevicePool.data,
                receiversInventory: [
                  JSON.parse(freshDeviceDevicePool.data.receiverUpdated),
                ],
              },
            },
          });
        }
      }
    } catch (error) {
      return setLoadingStatus(false);
    }
  };

  const ternaryRender = (props) => {
    if (props) {
      return <Loading />;
    }
    return <NoDataFound />;
  };

  return (
    <Grid
      container
      style={{
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
      }}
      key={`${location.search.split("?search=")[1]}-${location.key}`}
      id={location.key}
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
          {sortAndRenderFoundData()?.length > 0
            ? sortAndRenderFoundData()?.map((item) => (
                <Grid key={item.id} item xs={12} sm={12} md={4} lg={4}>
                  <CardDeviceFound
                    key={item.id}
                    props={{
                      serialNumber: item?.device?.serialNumber,
                      type: item?.device?.deviceType,
                      event: item?.eventSelected ?? item?.eventSelected[0],
                      image: imagesDeviceFoundData()
                        ? imagesDeviceFoundData()[item?.device?.deviceType]?.at(
                            -1
                          )?.source
                        : false,
                      data: item ?? [],
                    }}
                    fn={handleDeviceSearch}
                    returnFn={returningDevice}
                    loadingStatus={loadingStatus}
                  />
                </Grid>
              ))
            : ternaryRender(loadingSearchingResult)}
        </Grid>
      </Grid>
    </Grid>
  );
};
export default SearchDevice;
