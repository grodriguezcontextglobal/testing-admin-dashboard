import { Grid, Typography } from "@mui/material";
import { message } from "antd";
import { useEffect, useState } from "react";
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
import ReleaseDeposit from "./ReleaseDeposit";
import clearCacheMemory from "../../../utils/actions/clearCacheMemory";
const SearchDeviceRef = ({ searchParams, data }) => {
  const location = useLocation();
  const [foundDeviceData, setFoundDeviceData] = useState(() =>
    (data.pool ?? []).filter((d) => d?.activity === true),
  );
  const { user } = useSelector((state) => state.admin);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingSearchingResult, setLoadingSearchingResult] = useState(true);
  const [returnLoading, setReturnLoading] = useState(false);
  const [openReleaseDepositModal, setOpenReleaseDepositModal] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  useEffect(() => {
    const controller = new AbortController();
    const addingResult = new Set();
    if (data.pool) {
      for (let item of data.pool.filter(
        (i) => i?.activity === true && i.contract_type === "event",
      )) {
        addingResult.add({
          serialNumber: item.device,
          type: item.type,
          event: item.eventSelected,
          image: false,
          data: item,
          active: item.activity,
        });
      }
      setLoadingSearchingResult(false);
      setFoundDeviceData(Array.from(addingResult));
    }
    return () => controller.abort();
  }, [searchParams, data.pool, location?.search]);

  const returningDevice = async (record) => {
    try {
      const transactionFound = checkArray(
        data.device.deviceTransaction.filter(
          (item) =>
            item.eventSelected[0] === record.event && item.device.status,
        ),
      );
      setReturnLoading(true);
      const respTransaction = await devitrakApi.get(
        `/transaction/transaction?paymentIntent=${transactionFound.paymentIntent}`,
      );
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
          "eventInfoDetail.eventName": record.event ?? record.eventSelected,
        });

        const eventInfoSqlDB = await devitrakApi.post(
          "/db_event/events_information",
          {
            event_name: record.event ?? record.eventSelected,
            company_assigned_event_id: user.sqlInfo.company_id,
          },
        );
        await devitrakApi.patch(
          `/receiver/receiver-update/${transactionFound.id}`,
          {
            id: transactionFound.id,
            device: {
              ...transactionFound.device,
              status: false,
            },
          },
        );
        await devitrakApi.patch(
          `/receiver/receivers-pool-update/${record.data.id}`,
          {
            activity: false,
          },
        );
        if (eventInfo.data && eventInfoSqlDB.data) {
          await clearCacheMemory(
            `eventSelected=${record.event ?? record.eventSelected}&company=${
              user.companyData.id
            }`,
          );
          setReturnLoading(false);
          message.success("Device returned successfully");
          setTimeout(() => {
            return afterActionTakenCollectStoreAndNavigate({
              paymentIntentDetailSelectedProfile,
              eventInfo: eventInfo.data.list,
              eventInfoSqlDB: eventInfoSqlDB.data.events.at(-1),
              eventInventoryQuery: { ...record.data, activity: false },
              record,
            });
          }, 2000);
        }
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setReturnLoading(false);
    }
  };

  const ternaryRender = (props) => {
    if (props) {
      return <Loading />;
    }
    return <NoDataFound />;
  };

  const handleDeviceSearch = async (record) => {
    try {
      setReturnLoading(true);
      const eventInfo = await devitrakApi.post("/event/event-list", {
        company: user.company,
        "eventInfoDetail.eventName": record.event,
      });

      const eventInfoSqlDB = await devitrakApi.post(
        "/db_event/events_information",
        {
          event_name: record.event,
          company_assigned_event_id: user.sqlInfo.company_id,
        },
      );
      if (data.device.deviceTransaction.length > 0) {
        const transactionFound = checkArray(
          data.device.deviceTransaction.filter(
            (item) => item.eventSelected[0] === record.event,
          ),
        );

        const respTransaction = await devitrakApi.get(
          `/transaction/transaction?paymentIntent=${transactionFound.paymentIntent}`,
        );

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
          if (eventInfo.data && eventInfoSqlDB.data) {
            setReturnLoading(false);
            await clearCacheMemory(
              `eventSelected=${record.event}&company=${user.companyData.id}`,
            );
            await clearCacheMemory(
              `eventSelected=${record.event}&company=${user.companyData.id}`,
            );
            afterActionTakenCollectStoreAndNavigate({
              paymentIntentDetailSelectedProfile,
              eventInfo: eventInfo.data.list,
              eventInfoSqlDB: eventInfoSqlDB.data.events.at(-1),
              record,
              eventInventoryQuery: record.data,
            });
          }
        }
      } else {
        await clearCacheMemory(
          `eventSelected=${record.event}&company=${user.companyData.id}`,
        );
        await clearCacheMemory(
          `eventSelected=${record.event}&company=${user.companyData.id}`,
        );
        setReturnLoading(false);
        return afterActionTakenCollectStoreAndNavigate({
          paymentIntentDetailSelectedProfile: {
            consumerInfo: null,
            paymentIntent: null,
          },
          eventInfo: eventInfo.data.list,
          eventInfoSqlDB: eventInfoSqlDB.data.events.at(-1),
          record,
          eventInventoryQuery: record.data,
        });
      }
    } catch (error) {
      message.error(error.message);
      setReturnLoading(false);
    }
  };

  const afterActionTakenCollectStoreAndNavigate = async (props) => {
    const {
      paymentIntentDetailSelectedProfile,
      eventInfo,
      eventInfoSqlDB,
      eventInventoryQuery,
      record,
    } = props;
    const formatDeviceSection = {
      activity: record.data.activity,
      company: [record.type, record.data.eventSelected],
      entireData: {
        ...eventInventoryQuery,
      },
      serialNumber: record.serialNumber,
      status: eventInventoryQuery.activity,
    };
    dispatch(
      onAddPaymentIntentDetailSelected(paymentIntentDetailSelectedProfile),
    );
    dispatch(
      onAddEventData({
        ...checkArray(eventInfo),
        sql: eventInfoSqlDB,
      }),
    );
    dispatch(onSelectEvent(record.event ?? record.eventSelected));
    dispatch(onSelectCompany(record.data.provider[0] ?? record.provider));
    dispatch(onAddCustomer(paymentIntentDetailSelectedProfile.consumerInfo));
    dispatch(
      onAddCustomerInfo(paymentIntentDetailSelectedProfile.consumerInfo),
    );
    dispatch(
      onAddPaymentIntentSelected(
        paymentIntentDetailSelectedProfile.paymentIntent,
      ),
    );
    dispatch(onAddDeviceToDisplayInQuickGlance(formatDeviceSection));
    setLoadingStatus(false);
    return navigate("/device-quick-glance");
  };

  return (
    <>
      <Grid
        container
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
        key={`${location.key}`}
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
          <Grid
            style={{ display: "flex", justifyContent: "flex-end" }}
            container
            gap={"0.5px"}
          >
            {data.pool && foundDeviceData.length > 0
              ? foundDeviceData?.map((item) => (
                  <Grid key={item.id} item xs={12} sm={12} md={4} lg={4}>
                    <CardDeviceFound
                      key={item.id}
                      props={item}
                      fn={handleDeviceSearch}
                      returnFn={returningDevice}
                      loadingStatus={loadingStatus}
                      returnLoading={returnLoading}
                    />
                  </Grid>
                ))
              : ternaryRender(loadingSearchingResult)}
          </Grid>
        </Grid>
      </Grid>

      {openReleaseDepositModal && (
        <ReleaseDeposit
          openCancelingDepositModal={openReleaseDepositModal}
          setOpenCancelingDepositModal={setOpenReleaseDepositModal}
          refetchingTransactionFn={null}
        />
      )}
    </>
  );
};
export default SearchDeviceRef;
