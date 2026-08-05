import { message, Pagination } from "antd";
import SearchSection from "./SearchSection";
import {
  cardGrid,
  SECTION_NOTE,
  sectionFooter,
  SUBSECTION_LABEL,
} from "../utils/sectionLayout";
import CardAssignmentFound from "../utils/CardAssignmentFound";
import { onAddMemberInfo } from "../../../store/slices/memberSlice";

const PAGE_SIZE = 10;
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import DevitrakLoading from "../../../components/animation/DevitrakLoading";
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
const ASSIGNMENT_PAGE_SIZE = 12;

const SearchDeviceRef = ({
  searchParams,
  data,
  assignments = null,
  title = "Devices",
  audience = null,
  checkoutsTotal = null,
  checkoutsHasMore = false,
}) => {
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

  // Open member/student assignments — the other way a unit ends up in someone's
  // hands, for companies that don't run the event-checkout flow.
  const assignmentRows = assignments?.assignments ?? [];
  const assignmentTotal = Number(assignments?.total ?? assignmentRows.length);
  const overdueCount = Number(assignments?.overdue ?? 0);
  const [assignmentPage, setAssignmentPage] = useState(1);
  useEffect(() => {
    setAssignmentPage(1);
  }, [searchParams, assignments]);
  const pageAssignments = assignmentRows.slice(
    (assignmentPage - 1) * ASSIGNMENT_PAGE_SIZE,
    assignmentPage * ASSIGNMENT_PAGE_SIZE
  );

  // the detail page refetches by the :id in the URL, so a deep link is enough
  const handleAssignmentDetail = (record) => {
    dispatch(onAddMemberInfo(record));
    return navigate(`/member/${record.member_id}/main`);
  };

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
      return <DevitrakLoading />;
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
        device: eventInventoryQuery.device?.serialNumber,
        type: eventInventoryQuery.device?.deviceType,
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
      <SearchSection
        title={title}
        subtitle={
          overdueCount > 0
            ? `Units currently in someone's hands — ${overdueCount} past its due date.`
            : "Units currently in someone's hands."
        }
      >
        {foundDeviceData.length > 0 && (
          <div style={{ width: "100%" }}>
            {assignmentTotal > 0 && (
              <p style={SUBSECTION_LABEL}>Event checkouts</p>
            )}
            <div style={cardGrid(280)} id={location.key}>
              {pageDevices.map((item) => (
                <CardDeviceFound
                  key={item.data?.id}
                  props={item}
                  fn={handleDeviceSearch}
                  returnFn={returningDevice}
                  loadingStatus={loadingStatus}
                  returnLoading={returnLoading}
                />
              ))}
            </div>
            {foundDeviceData.length > PAGE_SIZE && (
              <div style={sectionFooter}>
                <Pagination
                  current={currentPage}
                  pageSize={PAGE_SIZE}
                  total={foundDeviceData.length}
                  onChange={setCurrentPage}
                  showSizeChanger={false}
                  showTotal={(total, range) =>
                    `${range[0]}–${range[1]} of ${total}`
                  }
                />
              </div>
            )}
            {checkoutsHasMore && checkoutsTotal > foundDeviceData.length && (
              <p style={{ ...SECTION_NOTE, marginTop: "12px" }}>
                Showing the first {foundDeviceData.length} of {checkoutsTotal}{" "}
                event checkouts.
              </p>
            )}
          </div>
        )}

        {pageAssignments.length > 0 && (
          <div style={{ width: "100%" }}>
            {foundDeviceData.length > 0 && (
              <p style={SUBSECTION_LABEL}>
                {audience ? `Assigned to ${audience}` : "Assigned"}
              </p>
            )}
            <div style={cardGrid(280)}>
              {pageAssignments.map((row) => (
                <CardAssignmentFound
                  key={row.lease_id}
                  props={row}
                  fn={handleAssignmentDetail}
                />
              ))}
            </div>
            {assignmentRows.length > ASSIGNMENT_PAGE_SIZE && (
              <div style={sectionFooter}>
                <Pagination
                  current={assignmentPage}
                  pageSize={ASSIGNMENT_PAGE_SIZE}
                  total={assignmentRows.length}
                  onChange={setAssignmentPage}
                  showSizeChanger={false}
                  showTotal={(total, range) =>
                    `${range[0]}–${range[1]} of ${total}`
                  }
                />
              </div>
            )}
            {assignments?.hasMore && (
              <p style={{ ...SECTION_NOTE, marginTop: "12px" }}>
                Showing the first {assignmentRows.length} of {assignmentTotal}{" "}
                assignments, soonest due first.
              </p>
            )}
          </div>
        )}

        {foundDeviceData.length === 0 &&
          assignmentRows.length === 0 &&
          ternaryRender(loadingSearchingResult)}
      </SearchSection>

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
