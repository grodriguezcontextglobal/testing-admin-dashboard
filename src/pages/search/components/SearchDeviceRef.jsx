import { Grid } from "@mui/material";
import { message, Pagination } from "antd";

const PAGE_SIZE = 10;
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
import CardDeviceFound from "../utils/CardDeviceFound";
import NoDataFound from "../utils/NoDataFound";
import ReleaseDeposit from "./ReleaseDeposit";
import clearCacheMemory from "../../../utils/actions/clearCacheMemory";
const SearchDeviceRef = ({ searchParams, data }) => {
  const location = useLocation();
  const [foundDeviceData, setFoundDeviceData] = useState(() =>
    (data.device ?? []).map((item) => ({
      serialNumber: item.device.serialNumber,
      type: item.device.deviceType,
      event: item.eventSelected[0],
      image: false,
      data: item,
      active: item.active,
    }))
  );
  const { user } = useSelector((state) => state.admin);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingSearchingResult, setLoadingSearchingResult] = useState(true);
  const [returnLoading, setReturnLoading] = useState(false);
  const [openReleaseDepositModal, setOpenReleaseDepositModal] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  useEffect(() => {
    const controller = new AbortController();
    if (data.device) {
      const mapped = data.device.map((item) => ({
        serialNumber: item.device.serialNumber,
        type: item.device.deviceType,
        event: item.eventSelected[0],
        image: false,
        data: item,
        active: item.active,
      }));
      setFoundDeviceData(mapped);
    }
    setLoadingSearchingResult(false);
    setCurrentPage(1);
    return () => controller.abort();
  }, [searchParams, data.device, location?.search]);

  const pageDevices = foundDeviceData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const returningDevice = async (record) => {
    try {
      const transactionFound = checkArray(
        (data.device ?? []).filter(
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
      if ((data.device ?? []).length > 0) {
        const transactionFound = checkArray(
          (data.device ?? []).filter(
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
          style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", alignSelf: "flex-start", gap: "4px" }}
          item
          xs={12}
          sm={12}
          md={4}
          lg={4}
        >
          <p style={{ fontFamily: "Inter", fontSize: "18px", fontWeight: 600, lineHeight: "28px", color: "var(--gray-900, #101828)", margin: 0 }}>
            Devices
          </p>
          <p style={{ fontFamily: "Inter", fontSize: "14px", fontWeight: 400, lineHeight: "20px", color: "var(--gray-600, #475467)", margin: 0 }}>
            Active event transactions matching your search.
          </p>
        </Grid>
        <Grid item xs={12} sm={12} md={8} lg={8}>
          <Grid
            style={{ display: "flex", justifyContent: "flex-end" }}
            container
            gap={1}
          >
            {data.device && foundDeviceData.length > 0
              ? pageDevices.map((item) => (
                  <Grid key={item.data?.id} item xs={12} sm={12} md={4} lg={4}>
                    <CardDeviceFound
                      key={item.data?.id}
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
          {foundDeviceData.length > PAGE_SIZE && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <Pagination
                current={currentPage}
                pageSize={PAGE_SIZE}
                total={foundDeviceData.length}
                onChange={setCurrentPage}
                showSizeChanger={false}
                showTotal={(total, range) => `${range[0]}–${range[1]} of ${total}`}
              />
            </div>
          )}
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
