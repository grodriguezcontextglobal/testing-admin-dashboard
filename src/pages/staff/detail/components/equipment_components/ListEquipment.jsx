import { Spin, Table } from "antd";
import { groupBy } from "lodash";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import Loading from "../../../../../components/animation/Loading";
import DownDoubleArrowIcon from "../../../../../components/icons/DownDoubleArrowIcon.jsx";
import UpDoubleArrow from "../../../../../components/icons/UpDoubleArrow.jsx";
import RefreshButton from "../../../../../components/utils/UX/RefreshButton.jsx";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import ModalReturnDeviceFromStaff from "./ModalReturnDeviceFromStaff";
import { useStaffEquipmentData } from "./useStaffEquipmentData";

const VerificationDetailsTable = ({
  verificationId,
  user,
  profile,
  navigate,
  record,
  queryResult,
  assignedEquipmentList,
}) => {
  if (queryResult?.isLoading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <Spin tip="Loading verification documents..." />
      </div>
    );
  }

  if (queryResult?.isError) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "red" }}>
        Error loading documents.
      </div>
    );
  }

  const docs = queryResult?.data?.docs || [];

  const groupByVerificationId = groupBy(
    assignedEquipmentList,
    "verification_id",
  );
  const itemIdsParam =
    groupByVerificationId[verificationId] &&
    groupByVerificationId[verificationId].length > 0
      ? groupByVerificationId[verificationId]
          .map((id) => encodeURIComponent(id.device_id))
          .join(",")
      : "";

  const renderStatusBadge = (isSigned) => (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "12px",
        fontSize: "12px",
        lineHeight: 1.6,
        fontWeight: 600,
        color: isSigned ? "#155724" : "#8a2a2a",
        background: isSigned ? "#d4edda" : "#f8d7da",
        border: `1px solid ${isSigned ? "#c3e6cb" : "#f5c6cb"}`,
      }}
    >
      {isSigned ? "Signed" : "Pending"}
    </span>
  );

  const canSeeSignedColumns =
    (user?.id ?? user?.uid) === profile?.adminUserInfo?.id;
  const role = user.companyData.employees.find(
    (el) => el.user === user.email,
  )?.role;
  const canSeeSignedColumnsBasedOnRole = [0, 1].includes(Number(role));

  const innerColumns = [
    { title: "Document Name", dataIndex: "title", key: "title" },
    {
      title: "Signed",
      dataIndex: "signed",
      key: "signed",
      render: (signed) => renderStatusBadge(!!signed),
    },
    {
      title: "Date/Time",
      dataIndex: "date",
      key: "date",
      render: (date) => (date ? new Date(date).toLocaleString() : "No sign"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, rowDoc) => {
        const href = `/display-contracts?company_id=${encodeURIComponent(
          user.companyData.id,
        )}&contract_url=${encodeURIComponent(
          rowDoc.url,
        )}&staff_member_id=${encodeURIComponent(
          profile.adminUserInfo.id,
        )}&date_reference=${encodeURIComponent(
          record.subscription_initial_date,
        )}&ver_id=${encodeURIComponent(
          verificationId,
        )}&item_ids=${encodeURIComponent(itemIdsParam)}`;

        const handleView = () => {
          return navigate(
            `/staff/${profile.adminUserInfo.id}/view_actions_staff_taken`,
            {
              state: {
                contract_url: rowDoc.url,
                verificationId: verificationId,
                item_ids: record.device_id,
                company_id: user.companyData.id,
              },
            },
          );
        };
        return (
          <>
            {canSeeSignedColumns ? (
              <BlueButtonComponent
                title={rowDoc.signed ? "View" : "View & Sign"}
                func={() => navigate(href)}
              />
            ) : (
              canSeeSignedColumnsBasedOnRole &&
              rowDoc.signed && (
                <BlueButtonComponent title={"View"} func={() => handleView()} />
              )
            )}
          </>
        );
      },
    },
  ];

  return (
    <Table
      columns={innerColumns}
      dataSource={docs}
      pagination={false}
      style={{ width: "100%" }}
      className="table-ant-customized"
    />
  );
};

function ListEquipment() {
  const [openReturnDeviceStaffModal, setOpenReturnDeviceStaffModal] =
    useState(false);
  const [expandedRowKey, setExpandedRowKey] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState({});
  const { profile } = useSelector((state) => state.staffDetail);
  const { user } = useSelector((state) => state.admin);
  const location = useLocation();
  const navigate = useNavigate();

  // Use the new custom hook
  const {
    staffMemberQuery,
    listImagePerItemQuery,
    itemsInInventoryQuery,
    leaseQuery,
    verificationQueries,
  } = useStaffEquipmentData(profile, user);

  // Use data from leaseQuery instead of local state
  const assignedEquipmentList = leaseQuery.data || [];

  // Create a map for easy lookup of verification details
  const verificationMap = useMemo(() => {
    const map = {};
    if (assignedEquipmentList.length > 0 && verificationQueries.length > 0) {
      assignedEquipmentList.forEach((item, index) => {
        // verificationQueries order matches assignedEquipmentList
        if (verificationQueries[index]) {
          map[item.verification_id] = verificationQueries[index];
        }
      });
    }
    return map;
  }, [assignedEquipmentList, verificationQueries]);

  const [canSeeSignedColumns, setCanSeeSignedColumns] = useState(false);
  const [canSeeSignedColumnsBasedOnRole, setCanSeeSignedColumnsBasedOnRole] =
    useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const role = user.companyData.employees.find(
      (el) => el.user === user.email,
    )?.role;
    const isSameUser = (user?.id ?? user?.uid) === profile?.adminUserInfo?.id;
    setCanSeeSignedColumns(isSameUser);
    setCanSeeSignedColumnsBasedOnRole([0, 1].includes(Number(role)));
    return () => {
      controller.abort();
    };
  }, []);

  // Memoize groupingImage
  const groupingImage = useMemo(
    () => groupBy(listImagePerItemQuery?.data?.data?.item, "item_group"),
    [listImagePerItemQuery?.data?.data?.item],
  );

  // Memoize groupSerialNumber
  const groupSerialNumber = useMemo(
    () => groupBy(itemsInInventoryQuery?.data?.data?.items, "item_id"),
    [itemsInInventoryQuery?.data?.data?.items],
  );

  const dataSpecificItemInAssignedDevicePerStaffMember = (props) => {
    return {
      devicePhoto:
        groupingImage[groupSerialNumber[props]?.at(-1)?.item_group]?.at(-1)
          .source,
      item_id_info: groupSerialNumber[props]?.at(-1),
    };
  };

  const renderStatusBadge = (isSigned) => (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "12px",
        fontSize: "12px",
        lineHeight: 1.6,
        fontWeight: 600,
        color: isSigned ? "#155724" : "#8a2a2a",
        background: isSigned ? "#d4edda" : "#f8d7da",
        border: `1px solid ${isSigned ? "#c3e6cb" : "#f5c6cb"}`,
      }}
    >
      {isSigned ? "Signed" : "Pending"}
    </span>
  );

  const columns = [
    {
      title: "Device name",
      dataIndex: "device_id",
      key: "device_id",
      render: (device_id) => (
        <span style={Subtitle}>
          {
            dataSpecificItemInAssignedDevicePerStaffMember(device_id)
              ?.item_id_info?.item_group
          }
        </span>
      ),
    },
    {
      title: "Date and Time Assigned",
      dataIndex: "subscription_initial_date",
      key: "subscription_initial_date",
      render: (subscription_initial_date) => (
        <span style={Subtitle}>
          {new Date(subscription_initial_date).toUTCString()}
        </span>
      ),
    },
    {
      title: "Serial Number",
      dataIndex: "address",
      key: "address",
      render: (_, record) => (
        <span style={Subtitle}>
          {
            dataSpecificItemInAssignedDevicePerStaffMember(record.device_id)
              ?.item_id_info?.serial_number
          }
        </span>
      ),
    },
    {
      title: "Value",
      dataIndex: "address",
      key: "address",
      render: (_, record) => (
        <span style={Subtitle}>
          {" "}
          $
          {
            dataSpecificItemInAssignedDevicePerStaffMember(record.device_id)
              ?.item_id_info?.cost
          }
        </span>
      ),
    },
    ...(canSeeSignedColumnsBasedOnRole || canSeeSignedColumns
      ? [
          {
            title: "Contract Status",
            key: "contract_status",
            render: (_, record) => {
              const verificationId = record.verification_id;
              const queryResult = verificationMap[verificationId];
              const allSigned = queryResult?.data?.allSigned;

              if (queryResult?.isLoading) return <Spin size="small" />;
              return renderStatusBadge(!!allSigned);
            },
          },
        ]
      : []),
    ...(canSeeSignedColumnsBasedOnRole
      ? [
          {
            title: "",
            dataIndex: "address",
            key: "address",
            render: (_, record) => (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: "20px",
                }}
              >
                <BlueButtonComponent
                  title={"Mark as returned"}
                  func={() => {
                    setDeviceInfo({
                      ...record,
                      ...dataSpecificItemInAssignedDevicePerStaffMember(
                        record.device_id,
                      ),
                    });
                    setOpenReturnDeviceStaffModal(true);
                  }}
                  buttonType="button"
                  titleStyles={{
                    textTransform: "none",
                    with: "100%",
                    gap: "2px",
                  }}
                  disabled={record.active === 0}
                />
                {/* <GrayButtonComponent
                  title={"Mark as lost"}
                  func={() => null}
                  disabled={true}
                /> */}
              </div>
            ),
          },
        ]
      : []),
  ];

  // Single expanded row control
  const getRowKey = (record) =>
    `${record.device_id}-${record.subscription_initial_date}`;

  // New: Expanded row with document links and per-document status
  const expandedRowRender = (record) => {
    const verificationId = record.verification_id;
    const queryResult = verificationMap[verificationId];

    return (
      <VerificationDetailsTable
        verificationId={verificationId}
        user={user}
        profile={profile}
        navigate={navigate}
        record={record}
        queryResult={queryResult}
        assignedEquipmentList={assignedEquipmentList}
      />
    );
  };

  if (
    itemsInInventoryQuery.isLoading ||
    listImagePerItemQuery.isLoading ||
    staffMemberQuery.isLoading
  )
    return (
      <div style={CenteringGrid}>
        <Loading />
      </div>
    );
  if (
    itemsInInventoryQuery.data &&
    listImagePerItemQuery.data &&
    staffMemberQuery.data
  ) {
    const handleRefresh = () => {
      itemsInInventoryQuery.refetch();
      listImagePerItemQuery.refetch();
      staffMemberQuery.refetch();
      leaseQuery.refetch();
      // verificationQueries are dependent on leaseQuery, so they will auto-update or use their own staleTime
    };
    return (
      <div style={{ width: "100%" }} key={location.key}>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <RefreshButton propsFn={handleRefresh} />{" "}
        </div>
        <Table
          style={{ width: "100%" }}
          columns={columns}
          dataSource={assignedEquipmentList}
          className="table-ant-customized"
          rowKey={getRowKey}
          expandable={{
            expandedRowRender,
            expandedRowKeys: expandedRowKey ? [expandedRowKey] : [],
            onExpand: (expanded, record) => {
              const key = getRowKey(record);
              setExpandedRowKey(expanded ? key : null);
            },
            expandIcon: ({ expanded, onExpand, record }) =>
              (canSeeSignedColumns || canSeeSignedColumnsBasedOnRole) && (
                <span
                  onClick={(e) => onExpand(record, e)}
                  role="button"
                  aria-label={expanded ? "Collapse row" : "Expand row"}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  {expanded ? <UpDoubleArrow /> : <DownDoubleArrowIcon />}
                </span>
              ),
          }}
        />
        {openReturnDeviceStaffModal && (
          <ModalReturnDeviceFromStaff
            openReturnDeviceStaffModal={openReturnDeviceStaffModal}
            setOpenReturnDeviceStaffModal={setOpenReturnDeviceStaffModal}
            deviceInfo={deviceInfo}
          />
        )}
      </div>
    );
  }
}

export default ListEquipment;
